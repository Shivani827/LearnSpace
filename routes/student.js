const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const { Booking, Room, Timetable, DailyAllocation } = require('../db/register');

// Helper to check overlap (copied from main app logic if needed, or imported)
const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const actualTime = timeStr.includes('-') ? timeStr.split('-')[0] : timeStr;
    const [hours, minutes] = actualTime.split(':').map(Number);
    return hours * 60 + (minutes || 0);
};

const isOverlap = (start1, end1, start2, end2) => {
    return parseTime(start1) < parseTime(end2) && parseTime(end1) > parseTime(start2);
};

// Overview
router.get('/', auth, (req, res) => {
    res.render('student-dashboard', { user: req.user });
});

// TIMETABLE ROUTE
router.get('/timetable', auth, async (req, res) => {
    try {
        // Read query params
        const year = req.query.year ? req.query.year.trim() : null;
        const branch = req.query.branch ? req.query.branch.trim() : null;
        const section = req.query.section ? req.query.section.trim() : null;

        // Debug - check what's coming in
        console.log('=== TIMETABLE DEBUG ===');
        console.log('year:', year);
        console.log('branch:', branch);
        console.log('section:', section);

        if (!year || !branch || !section) {
            return res.render('student-timetable', {
                user: req.user,
                timetable: [],
                year,
                branch,
                section
            });
        }

        // Fetch from Mongoose
        const timetable = await Timetable.find({
            year,
            branch,
            section
        }).lean();

        // Debug logs
        console.log('Timetable rows found:', timetable.length);
        if (timetable.length > 0) {
            console.log('First row sample:', timetable[0]);
        }

        // Custom sort by day order (MON, TUE, WED, THU, FRI, SAT) and slot
        const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        timetable.sort((a, b) => {
            const dayOrderA = dayOrder.indexOf(String(a.day).trim().toUpperCase());
            const dayOrderB = dayOrder.indexOf(String(b.day).trim().toUpperCase());
            const dayDiff = dayOrderA - dayOrderB;
            if (dayDiff !== 0) return dayDiff;
            return (a.slot || 0) - (b.slot || 0);
        });

        res.render('student-timetable', {
            user: req.user,
            timetable: timetable,
            year: year,
            branch: branch,
            section: section
        });

    } catch (err) {
        console.error('❌ Timetable error:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// Student View Rooms
router.get('/rooms', auth, async (req, res) => {
    try {
        const { date, start_time, end_time } = req.query;

        if (!date || !start_time || !end_time) {
            return res.render('student-rooms', {
                user: req.user,
                roomsByBlock: {},
                showForm: true,
                selectedDate: null,
                selectedStart: null,
                selectedEnd: null,
                query: req.query
            });
        }

        // Fetch all active rooms
        const rooms = await Room.find({ isActive: true })
            .sort({ block: 1, roomNo: 1 })
            .lean();

        console.log('Total rooms found:', rooms.length);

        // Get bookings for the selected date (exactly like teacher route)
        const selectedDate = new Date(date);
        const nextDay = new Date(selectedDate);
        nextDay.setDate(selectedDate.getDate() + 1);

        const dayBookings = await Booking.find({
            date: { $gte: selectedDate, $lt: nextDay },
            status: { $in: ['approved', 'pending'] }
        }).lean();

        const dayAllocations = await DailyAllocation.find({ date: date }).lean();

        // Step 2 - Dynamic Status Calculation
        const roomsWithStatus = rooms.map(room => {
            const overlappingBookings = dayBookings.filter(b =>
                b.roomNo === room.roomNo &&
                isOverlap(start_time, end_time, b.timeSlot.split('-')[0], b.timeSlot.split('-')[1])
            );

            const classAllocation = dayAllocations.find(a =>
                a.roomNo === room.roomNo &&
                isOverlap(start_time, end_time, a.startTime, a.endTime)
            );

            let status = 'free';
            let className = null;
            let period = null;
            let pendingCount = 0;

            if (overlappingBookings.some(b => b.status === 'approved')) {
                status = 'occupied';
            } else if (classAllocation) {
                status = 'occupied';
                className = classAllocation.className;
                period = classAllocation.period;
            } else if (overlappingBookings.length > 0) {
                status = 'reserved';
                pendingCount = overlappingBookings.filter(b => b.status === 'pending').length;
            }

            return { ...room, status, className, period, pendingCount };
        });

        // Group rooms by block
        const roomsByBlock = {};
        roomsWithStatus.forEach(room => {
            if (!roomsByBlock[room.block]) roomsByBlock[room.block] = [];
            roomsByBlock[room.block].push(room);
        });

        res.render('student-rooms', {
            user: req.user,
            roomsByBlock,
            showForm: false,
            selectedDate: date,
            selectedStart: start_time,
            selectedEnd: end_time,
            query: req.query
        });

    } catch (err) {
        console.error('Student rooms error:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

module.exports = router;
