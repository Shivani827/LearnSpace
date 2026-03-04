require("dotenv").config();
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./db/connection');
const auth = require("./middleware/auth");
const jwt = require('jsonwebtoken');


const { Booking, User, Room, Block, Timetable, EventBooking, DailyAllocation } = require('./db/register');
const { sendAdminNotification, sendUserStatusUpdate } = require('./utils/emailService');

const fs = require('fs');
if (!fs.existsSync('./public/uploads')) {
    fs.mkdirSync('./public/uploads', { recursive: true });
}

// Route Imports
const adminRouter = require('./routes/admin');
const studentRouter = require('./routes/student');
const organiserRouter = require('./routes/organiser');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Make io available in routes
app.set('io', io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3008; // Final port change to 3008 to bypass all stale processes

// Connect to MongoDB
connectDB();
// const password = "123456";
// const pass =  bcrypt.hash(password, 10).then(pass=>{
//     console.log(pass)
// });
// console.log(pass)

// Middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(cookieParser());

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mount Routers (Moved here to ensure they match before lower routes)
app.use('/admin', adminRouter);
app.use('/student', studentRouter);
app.use('/organiser', organiserRouter);

// ============== HELPERS ==============
const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    // Handle both "HH:mm" and "HH:mm-HH:mm" formats
    const actualTime = timeStr.includes('-') ? timeStr.split('-')[0] : timeStr;
    const [hours, minutes] = actualTime.split(':').map(Number);
    return hours * 60 + (minutes || 0);
};

const getSlotEnd = (timeStr) => {
    if (!timeStr || !timeStr.includes('-')) return parseTime(timeStr) + 60; // Default 1hr if no end
    return parseTime(timeStr.split('-')[1]);
};

const isOverlap = (start1, end1, start2, end2) => {
    return parseTime(start1) < parseTime(end2) && parseTime(end1) > parseTime(start2);
};

// ============== ROUTES ==============

// Diagnostic route
app.get('/ping', (req, res) => {
    res.send('pong - ' + new Date().toISOString());
});

// Home/Landing page
app.get('/', (req, res) => {
    res.render('index');
});

// Login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Login POST handler - WITH AUTHENTICATION
app.post('/login', async (req, res) => {
    try {
        const { userId, password, returnTo } = req.body;

        console.log('🔐 Login attempt for user:', userId);

        // Validate input
        if (!userId || !password) {
            return res.status(400).send('User ID and Password are required');
        }

        // Find user in database
        const user = await User.findOne({ userId: userId.trim(), isActive: true });

        // Check if user exists
        if (!user) {
            console.log('❌ User not found:', userId);
            return res.status(401).send('Invalid User ID or Password');
        }

        // Compare password
        const ismatch = await bcrypt.compare(password, user.password);

        if (!ismatch) {
            console.log('❌ Invalid password');
            return res.status(401).send('Invalid User ID or Password');
        }

        // Generate token
        const token = await user.generateAuthToken();

        // Set cookie
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            httpOnly: true,
            secure: false // Set to true if using HTTPS
        });

        console.log('✅ Login successful:', user.name, '-', user.role);

        // Redirect based on role
        if (returnTo && returnTo.trim() !== "") {
            console.log('🔃 Redirecting to returnTo:', returnTo);
            return res.redirect(returnTo);
        }

        if (user.userId === "admin") {
            return res.redirect('/admin');
        } else {
            const roleRoute = user.role.toLowerCase();
            return res.redirect(`/${roleRoute}`);
        }

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).send('Login error: ' + error.message);
    }
});

// ============== LOGOUT ROUTE ==============
app.get('/logout', auth, async (req, res) => {
    try {
        // Clear the JWT cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: false, // or true if using HTTPS
            path: "/"
        });
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.cookies.jwt; // Remove the current token
        });
        await req.user.save();
        res.redirect("/login");
    } catch (error) {
        console.error("Error during logout:", error);
    }
});
// ============== TEACHER ROUTES ==============

app.get('/teacher', auth, (req, res) => {
    res.render('teacher-dashboard');
});

app.get('/teacher/quick-booking', auth, (req, res) => {
    const { roomNo, block, date, timeSlot } = req.query;
    res.render('teacher-quick-booking', {
        user: req.user,
        roomNo: roomNo || '',
        block: block || '',
        date: date || '',
        timeSlot: timeSlot || ''
    });
});

app.get('/teacher/requests', auth, async (req, res) => {
    try {
        console.log('📥 Fetching bookings from database...');
        const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
        console.log(`✅ Found ${bookings.length} bookings`);
        res.render('teacher-requests', { bookings });
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.render('teacher-requests', { bookings: [] });
    }
});

app.get('/teacher/rooms', auth, async (req, res) => {
    try {
        const { date, start_time, end_time } = req.query;

        // Step 1 - Ask for Time Slot BEFORE showing rooms
        if (!date || !start_time || !end_time) {
            return res.render('teacher-rooms', {
                roomsByBlock: null,
                showForm: true,
                query: { date: date || '', start_time: start_time || '', end_time: end_time || '' }
            });
        }

        console.log(`📥 Fetching rooms availability for ${date} from ${start_time} to ${end_time}...`);

        // Fetch all active rooms
        const rooms = await Room.find({ isActive: true })
            .sort({ block: 1, roomNo: 1 })
            .lean();

        // Get bookings for the selected date
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
        const roomsByBlock = {
            Dharithri: roomsWithStatus.filter(r => r.block === 'Dharithri'),
            Main: roomsWithStatus.filter(r => r.block === 'Main'),
            Medha: roomsWithStatus.filter(r => r.block === 'Medha')
        };

        res.render('teacher-rooms', {
            roomsByBlock,
            showForm: false,
            query: { date, start_time, end_time }
        });
    } catch (error) {
        console.error('❌ Error fetching rooms:', error);
        res.render('teacher-rooms', {
            roomsByBlock: { Dharithri: [], Main: [], Medha: [] },
            showForm: true,
            query: { date: req.query.date || '', start_time: req.query.start_time || '', end_time: req.query.end_time || '' }
        });
    }
});

app.post('/teacher/quick-booking', auth, async (req, res) => {
    try {
        const { facultyName, facultyId, block, roomNo, date, timeSlot, purpose, email } = req.body;

        console.log('📝 Creating new booking...');

        // Validate required fields including block
        if (!facultyName || !facultyId || !block || !roomNo || !date || !timeSlot || !purpose) {
            return res.status(400).send('All fields are required');
        }

        // Check for existing booking conflicts using the helper function
        const dayBookings = await Booking.find({
            roomNo: roomNo.toUpperCase(),
            date: new Date(date),
            status: 'approved'
        });

        const dayEvents = await EventBooking.find({
            hallNo: roomNo.toUpperCase(),
            eventDate: new Date(date),
            status: 'approved'
        });

        const reqStart = timeSlot.split('-')[0];
        const reqEnd = timeSlot.split('-')[1];

        const overlappingBooking = dayBookings.find(b =>
            isOverlap(reqStart, reqEnd, b.timeSlot.split('-')[0], b.timeSlot.split('-')[1])
        );

        const overlappingEvent = dayEvents.find(e =>
            isOverlap(reqStart, reqEnd, e.startTime, e.endTime)
        );

        const existingConflict = overlappingBooking || overlappingEvent;

        if (existingConflict) {
            return res.render('teacher-quick-booking', {
                user: req.user,
                error: 'This room is already confirmed/approved for the selected time slot. Please choose a different room or time.',
                roomNo: req.body.roomNo,
                block: req.body.block,
                date: req.body.date,
                timeSlot: req.body.timeSlot
            });
        }

        // Create new booking with block
        const newBooking = new Booking({
            facultyName,
            facultyId,
            block,
            roomNo: roomNo.toUpperCase(),
            date: new Date(date),
            timeSlot,
            purpose,
            email,
            status: 'pending'
        });

        await newBooking.save();
        console.log('✅ Booking created successfully');

        // Trigger Admin Notification (Non-blocking)
        sendAdminNotification({
            name: facultyName,
            id: facultyId,
            email: email,
            room: roomNo.toUpperCase(),
            block: block,
            date: date,
            timeSlot: timeSlot,
            purpose: purpose
        }).catch(err => console.error('❌ Failed to send admin alert:', err));

        res.redirect('/teacher/requests');
    } catch (error) {
        console.error('❌ Error creating booking:', error);
        res.status(500).send('Error creating booking: ' + error.message);
    }
});

app.post('/teacher/cancel-booking/:id', auth, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        if (booking.status === 'approved') {
            return res.status(400).send('Cannot cancel approved bookings');
        }

        booking.status = 'cancelled';
        await booking.save();
        console.log('✅ Booking cancelled');
        res.redirect('/teacher/requests');
    } catch (error) {
        console.error('❌ Error cancelling booking:', error);
        res.status(500).send('Error cancelling booking');
    }
});

// ============== ADMIN ROUTES ==============

// Admin Dashboard
app.get('/admin', auth, async (req, res) => {
    try {
        console.log('📊 Fetching admin statistics...');

        // 1. DATA NORMALIZATION (Ensuring status consistency)
        // Normalize "Approved", "Pending", "Rejected" casing
        await Booking.updateMany({ status: "Approved" }, { status: "approved" });
        await Booking.updateMany({ status: "Pending" }, { status: "pending" });
        await Booking.updateMany({ status: "Rejected" }, { status: "rejected" });
        await Booking.updateMany({ status: "cancelled" }, { status: "rejected" });

        await EventBooking.updateMany({ status: "Approved" }, { status: "approved" });
        await EventBooking.updateMany({ status: "Pending" }, { status: "pending" });
        await EventBooking.updateMany({ status: "Rejected" }, { status: "rejected" });
        await EventBooking.updateMany({ status: "cancelled" }, { status: "rejected" });

        // 2. CALCULATE STATISTICS (Aggregate both models)
        const approvedB = await Booking.countDocuments({ status: 'approved' });
        const pendingB = await Booking.countDocuments({ status: 'pending' });
        const rejectedB = await Booking.countDocuments({ status: 'rejected' });

        const approvedE = await EventBooking.countDocuments({ status: 'approved' });
        const pendingE = await EventBooking.countDocuments({ status: 'pending' });
        const rejectedE = await EventBooking.countDocuments({ status: 'rejected' });

        const approvedBookings = approvedB + approvedE;
        const pendingRequests = pendingB + pendingE;
        const rejectedRequests = rejectedB + rejectedE;

        // Ensure Total = sum of parts
        const totalRequests = approvedBookings + pendingRequests + rejectedRequests;

        const stats = {
            totalRequests,
            approvedBookings,
            pendingRequests,
            rejectedRequests
        };

        console.log('✅ Statistics (Normalized):', stats);
        res.render('admin-dashboard', { stats });
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.render('admin-dashboard', {
            stats: {
                totalRequests: 0,
                approvedBookings: 0,
                pendingRequests: 0,
                rejectedRequests: 0
            }
        });
    }
});

// Aliased route for pending requests
app.get('/admin/pending-requests', auth, (req, res) => res.redirect('/admin/pending'));

// Pending Requests
app.get('/admin/pending', auth, async (req, res) => {
    try {
        const pendingB = await Booking.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
        const pendingE = await EventBooking.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();

        // Map EventBooking to match Booking structure for the view
        const mappedE = pendingE.map(e => ({
            ...e,
            facultyName: e.organiserName,
            facultyId: e.organiserId,
            roomNo: e.hallNo,
            date: e.eventDate,
            timeSlot: `${e.startTime}-${e.endTime}`,
            purpose: e.eventName,
            isEventBooking: true // Flag to distinguish
        }));

        const allPending = [...pendingB, ...mappedE].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log(`✅ Found ${allPending.length} total pending requests`);
        res.render('admin-pending', { bookings: allPending });
    } catch (error) {
        console.error('❌ Error fetching pending requests:', error);
        res.render('admin-pending', { bookings: [] });
    }
});

// Detail view alias (Deep Link) - Redirects to pending page with anchor
app.get('/admin/requests/:id', auth, async (req, res) => {
    try {
        // Just verify it exists in either collection
        const exists = await Booking.findById(req.params.id) || await EventBooking.findById(req.params.id);
        if (!exists) return res.status(404).send('Request not found');

        // Redirect to pending page with anchor scroll
        res.redirect(`/admin/pending#${req.params.id}`);
    } catch (error) {
        res.redirect('/admin/pending');
    }
});


// --- Admin Booking Routes Moved to routes/admin.js ---

// Approved Requests
app.get('/admin/approved', auth, async (req, res) => {
    try {
        const approvedB = await Booking.find({ status: 'approved' }).sort({ approvalDate: -1 }).lean();
        const approvedE = await EventBooking.find({ status: 'approved' }).sort({ approvalDate: -1 }).lean();

        const mappedE = approvedE.map(e => ({
            ...e,
            facultyName: e.organiserName,
            facultyId: e.organiserId,
            roomNo: e.hallNo,
            date: e.eventDate,
            timeSlot: `${e.startTime}-${e.endTime}`,
            purpose: e.eventName,
            isEventBooking: true
        }));

        const allApproved = [...approvedB, ...mappedE].sort((a, b) => new Date(b.approvalDate) - new Date(a.approvalDate));

        console.log(`✅ Found ${allApproved.length} total approved requests`);
        res.render('admin-approved', {
            bookings: allApproved,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error('❌ Error fetching approved requests:', error);
        res.render('admin-approved', {
            bookings: [],
            success: null,
            error: 'Failed to fetch approved requests'
        });
    }
});

// Rejected Requests
app.get('/admin/rejected', auth, async (req, res) => {
    try {
        const rejectedB = await Booking.find({ status: 'rejected' }).sort({ updatedAt: -1 }).lean();
        const rejectedE = await EventBooking.find({ status: 'rejected' }).sort({ updatedAt: -1 }).lean();

        const mappedE = rejectedE.map(e => ({
            ...e,
            facultyName: e.organiserName,
            facultyId: e.organiserId,
            roomNo: e.hallNo,
            date: e.eventDate,
            timeSlot: `${e.startTime}-${e.endTime}`,
            purpose: e.eventName,
            isEventBooking: true
        }));

        const allRejected = [...rejectedB, ...mappedE].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        console.log(`✅ Found ${allRejected.length} total rejected requests`);
        res.render('admin-rejected', { bookings: allRejected });
    } catch (error) {
        console.error('❌ Error fetching rejected requests:', error);
        res.render('admin-rejected', { bookings: [] });
    }
});

// Manage Users
app.get('/admin/users', auth, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        console.log(`✅ Found ${users.length} users`);
        res.render('admin-users', { users });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.render('admin-users', { users: [] });
    }
});

// Create User
app.post('/admin/create-user', auth, async (req, res) => {
    try {
        const { name, role, userId, password } = req.body;

        if (!name || !role || !userId || !password) {
            return res.status(400).send('All fields are required');
        }

        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            return res.status(400).send('User ID already exists');
        }

        const newUser = new User({ name, role, userId, password });
        await newUser.save();

        console.log('✅ User created');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).send('Error creating user: ' + error.message);
    }
});

// Delete User
app.post('/admin/delete-user/:id', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        console.log('✅ User deleted');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});


// --- Organiser Routes Moved to routes/organiser.js ---

// End of routers mounting (moved higher)

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.stack);
    res.status(500).send('Server Error: ' + err.message);
});


// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
