const express = require('express');
const router = express.Router();
const { Room, Booking, EventBooking, DailyAllocation } = require('../db/register');
const auth = require('../middleware/auth');
const isAuth = auth;

// Help check overlap
const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const actualTime = timeStr.includes('-') ? timeStr.split('-')[0] : timeStr;
    const [hours, minutes] = actualTime.split(':').map(Number);
    return hours * 60 + (minutes || 0);
};

const isOverlap = (start1, end1, start2, end2) => {
    return parseTime(start1) < parseTime(end2) && parseTime(end1) > parseTime(start2);
};

// Organiser Dashboard (Overview)
router.get('/', isAuth, async (req, res) => {
    try {
        const totalEvents = await EventBooking.countDocuments();
        const pendingEvents = await EventBooking.countDocuments({ status: 'pending' });
        const approvedEvents = await EventBooking.countDocuments({ status: 'approved' });
        const upcomingEvents = await EventBooking.countDocuments({
            status: 'approved',
            eventDate: { $gte: new Date() }
        });

        const stats = {
            totalEvents,
            pendingEvents,
            approvedEvents,
            upcomingEvents
        };

        res.render('organiser-dashboard', { stats });
    } catch (error) {
        console.error('❌ Error fetching organiser stats:', error);
        res.render('organiser-dashboard', {
            stats: { totalEvents: 0, pendingEvents: 0, approvedEvents: 0, upcomingEvents: 0 }
        });
    }
});

// Organiser Hall Status
router.get('/halls', isAuth, async (req, res) => {
    try {
        const { date, start_time, end_time } = req.query;

        if (!date || !start_time || !end_time) {
            return res.render('organiser-halls', {
                roomsByBlock: {},
                showForm: true,
                selectedDate: null,
                selectedStart: null,
                selectedEnd: null,
                query: req.query
            });
        }

        // Fetch all active labs, seminar halls and auditoriums
        const rooms = await Room.find({
            isActive: true,
            type: { $in: ['lab', 'seminar-hall', 'auditorium'] }
        }).sort({ block: 1, roomNo: 1 });

        // Get EventBookings and regular Bookings for the selected date
        const selectedDateObj = new Date(date);
        const nextDay = new Date(selectedDateObj);
        nextDay.setDate(selectedDateObj.getDate() + 1);

        const dayBookings = await Booking.find({
            date: { $gte: selectedDateObj, $lt: nextDay },
            status: { $in: ['approved', 'pending'] }
        }).lean();

        const dayEvents = await EventBooking.find({
            eventDate: { $gte: selectedDateObj, $lt: nextDay },
            status: { $in: ['approved', 'pending'] }
        }).lean();

        const dayAllocations = await DailyAllocation.find({ date: date }).lean();

        // Calculate status for each room
        const roomsWithStatus = rooms.map(room => {
            const overlapB = dayBookings.filter(b =>
                b.roomNo === room.roomNo &&
                isOverlap(start_time, end_time, b.timeSlot.split('-')[0], b.timeSlot.split('-')[1])
            );

            const overlapE = dayEvents.filter(e =>
                e.hallNo === room.roomNo &&
                isOverlap(start_time, end_time, e.startTime, e.endTime)
            );

            const allOverlaps = [...overlapB, ...overlapE];

            const classAllocation = dayAllocations.find(a =>
                a.roomNo === room.roomNo &&
                isOverlap(start_time, end_time, a.startTime, a.endTime)
            );

            let status = 'free';
            let className = null;
            let period = null;
            let pendingCount = 0;

            if (allOverlaps.some(o => o.status === 'approved')) {
                status = 'occupied';
            } else if (classAllocation) {
                status = 'occupied';
                className = classAllocation.className;
                period = classAllocation.period;
            } else if (allOverlaps.length > 0) {
                status = 'reserved';
                pendingCount = allOverlaps.filter(o => o.status === 'pending').length;
            }

            return { ...(room.toObject ? room.toObject() : room), status, className, period, pendingCount };
        });

        // Group rooms by block
        const roomsByBlock = {};
        roomsWithStatus.forEach(room => {
            if (!roomsByBlock[room.block]) roomsByBlock[room.block] = [];
            roomsByBlock[room.block].push(room);
        });

        res.render('organiser-halls', {
            roomsByBlock,
            showForm: false,
            selectedDate: date,
            selectedStart: start_time,
            selectedEnd: end_time,
            query: req.query
        });

    } catch (err) {
        console.error('Halls error:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// Event Requests
router.get('/events', isAuth, async (req, res) => {
    try {
        const events = await EventBooking.find({
            $or: [
                { organiserId: req.user.userId },
                { email: req.user.email }
            ]
        }).sort({ createdAt: -1 }).lean();

        res.render('organiser-events', { events, bookings: events });
    } catch (error) {
        console.error('❌ Error fetching events:', error);
        res.render('organiser-events', { events: [] });
    }
});

// Hall Booking Form (GET)
router.get('/create-booking', isAuth, (req, res) => {
    const { hallNo, block, date, timeSlot } = req.query;
    res.render('organiser-create-booking', {
        user: req.user,
        hallNo: hallNo || '',
        block: block || '',
        date: date || '',
        timeSlot: timeSlot || ''
    });
});

// Hall Booking Form (POST)
router.post('/create-booking', isAuth, async (req, res) => {
    try {
        const { eventName, organiserName, organiserId, block, hallNo, date, timeSlot, email } = req.body;

        let startTime = '09:00';
        let endTime = '11:00';
        if (timeSlot && timeSlot.includes('-')) {
            const parts = timeSlot.split('-');
            startTime = parts[0];
            endTime = parts[1];
        }

        // Check for existing booking conflicts using the helper function
        const targetRoomNo = (hallNo || '').toUpperCase();
        const targetDate = new Date(date);

        const dayBookings = await Booking.find({
            roomNo: targetRoomNo,
            date: targetDate,
            status: 'approved'
        });

        const dayEvents = await EventBooking.find({
            hallNo: targetRoomNo,
            eventDate: targetDate,
            status: 'approved'
        });

        const overlappingBooking = dayBookings.find(b =>
            isOverlap(startTime, endTime, b.timeSlot.split('-')[0], b.timeSlot.split('-')[1])
        );

        const overlappingEvent = dayEvents.find(e =>
            isOverlap(startTime, endTime, e.startTime, e.endTime)
        );

        const existingConflict = overlappingBooking || overlappingEvent;

        if (existingConflict) {
            return res.render('organiser-create-booking', {
                user: req.user,
                error: 'This hall is already confirmed/approved for the selected time slot. Please choose a different room or time.',
                hallNo: targetRoomNo,
                block: block || '',
                date: req.body.date,
                timeSlot: req.body.timeSlot
            });
        }

        const newEvent = new EventBooking({
            eventName,
            organiserName: organiserName || req.user.name,
            organiserId: organiserId || req.user.userId,
            hallNo: (hallNo || '').toUpperCase(),
            eventDate: new Date(date),
            startTime,
            endTime,
            expectedAttendees: 50,
            eventType: 'seminar',
            description: `Event in ${block || 'N/A'} block: ${eventName}`,
            email: email || req.user.email,
            status: 'pending',
            role: 'organiser'
        });

        await newEvent.save();
        res.redirect('/organiser/events');
    } catch (error) {
        console.error('❌ Error creating event booking:', error);
        res.status(500).send('Error creating booking.');
    }
});

module.exports = router;
