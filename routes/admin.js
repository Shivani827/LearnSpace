const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Timetable, Room, Booking, User, EventBooking, DailyAllocation } = require('../db/register');
const { sendUserStatusUpdate } = require('../utils/emailService');
const auth = require('../middleware/auth');
const isAuth = auth;
const db = require('../db/connection');

// Helper to check overlap
const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const actualTime = timeStr.includes('-') ? timeStr.split('-')[0] : timeStr;
    const [hours, minutes] = actualTime.split(':').map(Number);
    return hours * 60 + (minutes || 0);
};

const isOverlap = (start1, end1, start2, end2) => {
    return parseTime(start1) < parseTime(end2) && parseTime(end1) > parseTime(start2);
};

// Step 5: Temporary test route
router.get('/test', (req, res) => {
    res.send('Admin routes are working!');
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Admin restriction middleware (Optional check if user is admin)
const isAdmin = (req, res, next) => {
    if (req.user && req.user.userId === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden: Admin access only');
    }
};

// GET /admin/timetable - List all uploaded timetables
router.get('/timetable', auth, isAdmin, async (req, res) => {
    try {
        // Find unique combinations of year, branch, and section
        const timetables = await Timetable.aggregate([
            {
                $group: {
                    _id: {
                        year: "$year",
                        branch: "$branch",
                        section: "$section"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    branch: "$_id.branch",
                    section: "$_id.section"
                }
            },
            {
                $sort: { year: 1, branch: 1, section: 1 }
            }
        ]);

        res.render('admin-timetable', {
            timetables,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).send('Server Error');
    }
});

// Helper to convert Excel numeric time (0.3645) to "HH:mm" string
const excelTimeToString = (val) => {
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'number') {
        const totalMinutes = Math.round(val * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    return '';
};

// POST /admin/upload-timetable - Handle Excel file upload
router.post('/upload-timetable', auth, isAdmin, upload.single('timetable'), async (req, res) => {
    try {
        const { year, branch, section } = req.body;
        const filePath = req.file.path;

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use raw:true to get actual values including time decimals
        const rawData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            raw: true,
            defval: ''
        });

        console.log('=== EXCEL DEBUG ===');
        console.log('Header row:', rawData[0]);
        console.log('First data row:', rawData[1]);

        if (!rawData || rawData.length < 2) {
            fs.unlinkSync(req.file.path);
            return res.send('Excel file is empty');
        }

        // Helper function to convert Excel time decimal to HH:MM string
        function excelTimeToString(val) {
            if (typeof val === 'number' && val < 1) {
                const totalMinutes = Math.round(val * 24 * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
            }
            return String(val || '').trim();
        }

        // Since A1 has merged headers, actual column positions are:
        // Column 0 (A) = day
        // Column 1 (B) = slot
        // Column 2 (C) = subject
        // Column 3 (D) = start_time
        // Column 4 (E) = end_time

        // Delete existing timetable for this year/branch/section
        await Timetable.deleteMany({ year, branch, section });

        const timetableEntries = [];
        let insertCount = 0;

        // Start from row index 1 (skip header row)
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];

            const day = String(row[0] || '').trim().toUpperCase();
            const slot = parseInt(String(row[1] || '').trim());
            const subject = String(row[2] || '').trim();
            const start_time = excelTimeToString(row[3]);
            const end_time = excelTimeToString(row[4]);

            console.log(`Row ${i}:`, { day, slot, subject, start_time, end_time });

            if (!day || isNaN(slot)) {
                // Only log if the row isn't completely empty
                if (row.some(cell => String(cell).trim() !== '')) {
                    console.log(`Skipping row ${i} - invalid day or slot:`, row);
                }
                continue;
            }

            timetableEntries.push({
                year,
                branch,
                section,
                day,
                slot,
                subject,
                start_time,
                end_time
            });
            insertCount++;
        }

        if (timetableEntries.length > 0) {
            await Timetable.insertMany(timetableEntries);
        }

        fs.unlinkSync(req.file.path);
        console.log('Total inserted:', insertCount);

        if (insertCount === 0) {
            return res.send('No rows inserted. Check terminal.');
        }

        res.redirect('/admin/timetable?success=Timetable uploaded successfully - ' + insertCount + ' slots added');

    } catch (err) {
        console.error('Upload error:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).send('Error: ' + err.message);
    }
});

// POST /admin/delete-timetable - Delete a specific timetable group
router.post('/delete-timetable', auth, isAdmin, async (req, res) => {
    try {
        const { year, branch, section } = req.body;
        await Timetable.deleteMany({ year, branch, section });
        res.redirect('/admin/timetable');
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).send('Server Error');
    }
});

// --- Room Management Routes ---

router.get('/rooms', isAuth, async (req, res) => {
    try {
        const rooms = await Room.find().sort({ block: 1, roomNo: 1 });
        res.render('admin-rooms', {
            rooms,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        console.error('Admin rooms error:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

router.post('/rooms/add', isAuth, async (req, res) => {
    try {
        const { roomNo, block, type, capacity, floor, facilities } = req.body;
        const facilitiesArray = facilities
            ? facilities.split(',').map(f => f.trim()).filter(f => f)
            : [];
        const newRoom = new Room({
            roomNo,
            block,
            type,
            capacity: parseInt(capacity),
            floor: parseInt(floor) || 0,
            facilities: facilitiesArray,
            isActive: true
        });
        await newRoom.save();
        res.redirect('/admin/rooms?success=Room added successfully');
    } catch (err) {
        console.error('Add room error:', err);
        res.redirect('/admin/rooms?error=Failed to add room - ' + err.message);
    }
});

router.get('/rooms/edit/:id', isAuth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.redirect('/admin/rooms?error=Room not found');
        res.render('admin-room-edit', { room });
    } catch (err) {
        console.error('Edit room error:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

router.post('/rooms/edit/:id', isAuth, async (req, res) => {
    try {
        const { roomNo, block, type, capacity, floor, facilities, isActive } = req.body;
        const facilitiesArray = facilities
            ? facilities.split(',').map(f => f.trim()).filter(f => f)
            : [];
        await Room.findByIdAndUpdate(req.params.id, {
            roomNo,
            block,
            type,
            capacity: parseInt(capacity),
            floor: parseInt(floor) || 0,
            facilities: facilitiesArray,
            isActive: isActive === 'true'
        });
        res.redirect('/admin/rooms?success=Room updated successfully');
    } catch (err) {
        console.error('Update room error:', err);
        res.redirect('/admin/rooms?error=Failed to update room');
    }
});

router.post('/rooms/toggle/:id', isAuth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.redirect('/admin/rooms?error=Room not found');
        room.isActive = !room.isActive;
        await room.save();
        res.redirect('/admin/rooms?success=Room status updated');
    } catch (err) {
        console.error('Toggle room error:', err);
        res.redirect('/admin/rooms?error=Failed to update status');
    }
});

router.post('/rooms/delete/:id', isAuth, async (req, res) => {
    try {
        await Room.findByIdAndDelete(req.params.id);
        res.redirect('/admin/rooms?success=Room deleted successfully');
    } catch (err) {
        console.error('Delete room error:', err);
        res.redirect('/admin/rooms?error=Failed to delete room');
    }
});

// --- Booking Approval & Auto-Rejection ---

// Approve Booking
router.post('/approve-booking/:id', isAuth, isAdmin, async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);
        let isEvent = false;

        if (!booking) {
            booking = await EventBooking.findById(req.params.id);
            isEvent = true;
        }

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        // Approve this booking
        booking.status = 'approved';
        booking.approvedBy = 'Admin';
        booking.approvalDate = new Date();
        await booking.save();

        console.log(`✅ ${isEvent ? 'Event' : 'Faculty'} Booking approved: ${req.params.id}`);

        const io = req.app.get('io');
        if (io) {
            io.emit('roomStatusUpdated', {
                roomId: isEvent ? booking.hallNo : booking.roomNo,
                date: isEvent ? booking.eventDate : booking.date,
                startTime: isEvent ? booking.startTime : booking.timeSlot.split('-')[0],
                endTime: isEvent ? booking.endTime : booking.timeSlot.split('-')[1],
                status: 'occupied'
            });
            console.log('Emitted roomStatusUpdated event');
        }

        // --- AUTO REJECTION LOGIC ---
        try {
            const bookingDate = isEvent ? booking.eventDate : booking.date;
            const roomNo = isEvent ? booking.hallNo : booking.roomNo;
            const bStart = isEvent ? booking.startTime : booking.timeSlot.split('-')[0];
            const bEnd = isEvent ? booking.endTime : booking.timeSlot.split('-')[1];

            // Target BOTH models for potential conflicts
            const models = [Booking, EventBooking];

            for (const Model of models) {
                const isConflictEvent = Model.modelName === 'EventBooking';
                const query = {
                    _id: { $ne: booking._id },
                    status: 'pending',
                    [isConflictEvent ? 'eventDate' : 'date']: bookingDate,
                    [isConflictEvent ? 'hallNo' : 'roomNo']: roomNo
                };

                const potentialConflicts = await Model.find(query);
                console.log(`Checking ${potentialConflicts.length} potential conflicts in ${Model.modelName}...`);

                for (const conflict of potentialConflicts) {
                    const cStart = isConflictEvent ? conflict.startTime : conflict.timeSlot.split('-')[0];
                    const cEnd = isConflictEvent ? conflict.endTime : conflict.timeSlot.split('-')[1];

                    if (isOverlap(bStart, bEnd, cStart, cEnd)) {
                        conflict.status = 'rejected';
                        conflict.rejectionReason = 'This time slot has already been allocated to another user.';
                        await conflict.save();

                        console.log(`❌ Auto-rejected overlapping ${isConflictEvent ? 'Event' : 'Faculty'} booking: ${conflict._id}`);

                        // Send rejection email
                        if (conflict.email) {
                            sendUserStatusUpdate({
                                name: isConflictEvent ? conflict.organiserName : conflict.facultyName,
                                email: conflict.email,
                                room: isConflictEvent ? conflict.hallNo : conflict.roomNo,
                                date: isConflictEvent ? conflict.eventDate : conflict.date,
                                timeSlot: isConflictEvent ? `${conflict.startTime}-${conflict.endTime}` : conflict.timeSlot,
                                status: 'rejected',
                                reason: conflict.rejectionReason
                            }).catch(err => console.error('❌ Failed to send auto-rejection email:', err.message));
                        }
                    }
                }
            }
        } catch (autoRejectErr) {
            console.error('❌ Auto-rejection logic failed, but approval succeeded:', autoRejectErr);
        }

        // Send approval email for the main booking
        if (booking.email) {
            sendUserStatusUpdate({
                name: isEvent ? booking.organiserName : booking.facultyName,
                email: booking.email,
                room: isEvent ? booking.hallNo : booking.roomNo,
                date: isEvent ? booking.eventDate : booking.date,
                timeSlot: isEvent ? `${booking.startTime}-${booking.endTime}` : booking.timeSlot,
                status: 'approved'
            }).catch(err => console.error('❌ Failed to send approval email:', err.message));
        }

        res.redirect('/admin/pending');
    } catch (error) {
        console.error('❌ Error approving booking:', error);
        res.status(500).send('Error approving booking: ' + error.message);
    }
});

// Reject Booking
router.post('/reject-booking/:id', isAuth, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        let booking = await Booking.findById(req.params.id);
        let isEvent = false;

        if (!booking) {
            booking = await EventBooking.findById(req.params.id);
            isEvent = true;
        }

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        booking.status = 'rejected';
        booking.rejectionReason = reason || 'No reason provided';
        await booking.save();

        console.log(`✅ ${isEvent ? 'Event' : 'Faculty'} Booking rejected: ${req.params.id}`);

        const io = req.app.get('io');
        if (io) {
            io.emit('bookingRejected', {
                bookingId: req.params.id
            });
        }

        if (booking.email) {
            sendUserStatusUpdate({
                name: isEvent ? booking.organiserName : booking.facultyName,
                email: booking.email,
                room: isEvent ? booking.hallNo : booking.roomNo,
                date: isEvent ? booking.eventDate : booking.date,
                timeSlot: isEvent ? `${booking.startTime}-${booking.endTime}` : booking.timeSlot,
                status: 'rejected',
                reason: booking.rejectionReason
            }).catch(err => console.error('❌ Failed to send rejection email:', err.message));
        }

        res.redirect('/admin/pending');
    } catch (error) {
        console.error('❌ Error rejecting booking:', error);
        res.status(500).send('Error rejecting booking');
    }
});

// Cancel an approved booking
router.post('/bookings/cancel/:id', isAuth, isAdmin, async (req, res) => {
    try {
        const { cancelReason } = req.body;

        let booking = await Booking.findById(req.params.id);
        let isEvent = false;

        if (!booking) {
            booking = await EventBooking.findById(req.params.id);
            isEvent = true;
        }

        if (!booking) {
            return res.redirect('/admin/approved?error=Booking not found');
        }

        if (booking.status !== 'approved') {
            return res.redirect('/admin/approved?error=Only approved bookings can be cancelled');
        }

        // Change status to rejected
        booking.status = 'rejected';
        booking.rejectionReason = cancelReason || 'Booking cancelled by admin.';
        await booking.save();

        console.log(`✅ ${isEvent ? 'Event' : 'Faculty'} Booking successfully cancelled: ${req.params.id}`);

        // Emit socket event so room status updates in real time
        try {
            const io = req.app.get('io');
            if (io) {
                io.emit('roomStatusUpdated', {
                    roomId: isEvent ? booking.hallNo : booking.roomNo,
                    date: isEvent ? booking.eventDate : booking.date,
                    status: 'free'
                });
            }
        } catch (socketErr) {
            console.error('Socket emit failed:', socketErr.message);
        }

        // Send email notification to the user
        if (booking.email) {
            sendUserStatusUpdate({
                name: isEvent ? booking.organiserName : booking.facultyName,
                email: booking.email,
                room: isEvent ? booking.hallNo : booking.roomNo,
                date: isEvent ? booking.eventDate : booking.date,
                timeSlot: isEvent ? `${booking.startTime}-${booking.endTime}` : booking.timeSlot,
                status: 'rejected',
                reason: booking.rejectionReason
            }).catch(err => console.error('❌ Failed to send cancellation email:', err.message));
        }

        res.redirect('/admin/approved?success=Booking+cancelled+and+user+notified+by+email');

    } catch (err) {
        console.error('Cancel booking error:', err);
        res.redirect(`/admin/approved?error=Failed+to+cancel+booking`);
    }
});

// View daily allocation page
router.get('/daily-allocation', isAuth, async (req, res) => {
    try {
        const allDates = await DailyAllocation.distinct('date');
        let selectedDate = req.query.date;

        if (!selectedDate) {
            if (allDates.length > 0) {
                selectedDate = allDates.sort().reverse()[0]; // Default to most recent upload
            } else {
                selectedDate = new Date().toISOString().split('T')[0];
            }
        }

        const allocations = await DailyAllocation.find({ date: selectedDate }).sort({ period: 1 });

        const byRoom = {};
        allocations.forEach(a => {
            if (!byRoom[a.roomNo]) byRoom[a.roomNo] = [];
            byRoom[a.roomNo].push(a);
        });

        res.render('admin-daily-allocation', {
            allocations,
            byRoom,
            allDates: allDates.sort().reverse(),
            selectedDate: selectedDate,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// Upload daily allocation Excel
router.post('/upload-daily-allocation', isAuth, upload.single('allocation'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

        console.log('Daily allocation headers:', rawData[0]);

        const periodTimes = {
            1: { start: '08:45', end: '09:35' },
            2: { start: '09:35', end: '10:25' },
            3: { start: '10:50', end: '11:40' },
            4: { start: '11:40', end: '12:30' },
            5: { start: '12:30', end: '13:30' },
            6: { start: '14:20', end: '15:10' },
            7: { start: '15:10', end: '16:00' }
        };

        if (!rawData || rawData.length < 2) {
            fs.unlinkSync(req.file.path);
            return res.redirect('/admin/daily-allocation?error=File is empty');
        }

        const headers = rawData[0].map(h => String(h).trim().toLowerCase());
        const dateIdx = headers.indexOf('date');
        const periodIdx = headers.indexOf('period');
        const classIdx = headers.indexOf('class');
        const roomIdx = headers.indexOf('room');

        console.log('Indexes:', { dateIdx, periodIdx, classIdx, roomIdx });

        if (dateIdx === -1 || periodIdx === -1 || classIdx === -1 || roomIdx === -1) {
            fs.unlinkSync(req.file.path);
            return res.redirect('/admin/daily-allocation?error=Invalid headers. Required: date, period, class, room');
        }

        let insertCount = 0;
        const datesToDelete = new Set();

        // Collect all dates in file
        for (let i = 1; i < rawData.length; i++) {
            const date = String(rawData[i][dateIdx] || '').trim();
            if (date) datesToDelete.add(date);
        }

        // Delete existing allocations for those dates
        for (const date of datesToDelete) {
            await DailyAllocation.deleteMany({ date });
            console.log('Deleted existing allocations for:', date);
        }

        // Insert new allocations
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            const date = String(row[dateIdx] || '').trim();
            const period = parseInt(String(row[periodIdx] || '').trim());
            const className = String(row[classIdx] || '').trim();
            const roomNo = String(row[roomIdx] || '').trim().toUpperCase();

            if (!date || isNaN(period) || !className || !roomNo) {
                console.log(`Skipping row ${i}:`, { date, period, className, roomNo });
                continue;
            }

            const times = periodTimes[period] || { start: '', end: '' };

            await DailyAllocation.create({
                date,
                period,
                className,
                roomNo,
                startTime: times.start,
                endTime: times.end
            });

            insertCount++;
        }

        fs.unlinkSync(req.file.path);
        console.log('Daily allocation inserted:', insertCount);

        res.redirect('/admin/daily-allocation?success=Uploaded successfully - ' + insertCount + ' allocations added');

    } catch (err) {
        console.error('Upload error:', err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.redirect('/admin/daily-allocation?error=Upload failed: ' + err.message);
    }
});

// Delete all allocations for a date
router.post('/delete-daily-allocation', isAuth, async (req, res) => {
    try {
        const { date } = req.body;
        await DailyAllocation.deleteMany({ date });
        res.redirect('/admin/daily-allocation?success=Allocations deleted for ' + date);
    } catch (err) {
        res.redirect('/admin/daily-allocation?error=Delete failed');
    }
});

// Get edit form for single entry
router.get('/daily-allocation/edit/:id', isAuth, async (req, res) => {
    try {
        const entry = await DailyAllocation.findById(req.params.id);
        if (!entry) return res.redirect('/admin/daily-allocation?error=Entry not found');
        res.render('admin-daily-allocation-edit', { entry });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// Update single allocation entry
router.post('/daily-allocation/edit/:id', isAuth, async (req, res) => {
    try {
        const { date, period, className, roomNo } = req.body;

        const periodTimes = {
            1: { start: '08:45', end: '09:35' },
            2: { start: '09:35', end: '10:25' },
            3: { start: '10:50', end: '11:40' },
            4: { start: '11:40', end: '12:30' },
            5: { start: '12:30', end: '13:30' },
            6: { start: '14:20', end: '15:10' },
            7: { start: '15:10', end: '16:00' }
        };

        const times = periodTimes[parseInt(period)] || { start: '', end: '' };

        await DailyAllocation.findByIdAndUpdate(req.params.id, {
            date,
            period: parseInt(period),
            className,
            roomNo: roomNo.toUpperCase(),
            startTime: times.start,
            endTime: times.end
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('roomStatusUpdated', { message: 'Allocation updated' });
        }

        res.redirect('/admin/daily-allocation?success=Entry updated - ' + roomNo.toUpperCase() + ' is now free for old class');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/daily-allocation?error=Failed to update entry');
    }
});

// Delete single allocation entry
router.post('/daily-allocation/delete-entry/:id', isAuth, async (req, res) => {
    try {
        await DailyAllocation.findByIdAndDelete(req.params.id);

        const io = req.app.get('io');
        if (io) {
            io.emit('roomStatusUpdated', { message: 'Allocation deleted' });
        }

        res.redirect('/admin/daily-allocation?success=Allocation entry deleted successfully');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/daily-allocation?error=Failed to delete entry');
    }
});

module.exports = router;
