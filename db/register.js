const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bookingSchema = new mongoose.Schema({
    facultyName: {
        type: String,
        required: [true, 'Faculty name is required'],
        trim: true
    },
    facultyId: {
        type: String,
        required: [true, 'Faculty ID is required'],
        trim: true
    },
    block: {
        type: String,
        required: [true, 'Block is required'],
        enum: ['Dharithri', 'Main', 'Medha'],
        trim: true
    },
    roomNo: {
        type: String,
        required: [true, 'Room number is required'],
        trim: true,
        uppercase: true
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    timeSlot: {
        type: String,
        required: [true, 'Time slot is required'],
        trim: true
    },
    purpose: {
        type: String,
        required: [true, 'Purpose is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: String,
        trim: true
    },
    approvalDate: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for block
bookingSchema.index({ block: 1 });
bookingSchema.index({ roomNo: 1, date: 1, timeSlot: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ facultyId: 1 });
bookingSchema.index({ createdAt: -1 });

// Booking indexes
bookingSchema.index({ room: 1, date: 1, status: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ date: 1, startTime: 1, endTime: 1 });

bookingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});


// ============== USER SCHEMA ==============
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['Student', 'Teacher', 'Admin', 'Organiser'],
        trim: true
    },
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
        // Made optional - not required
    },
    department: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    tokens: [
        {
            token: { type: String, required: true }
        }
    ]

});

userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// ============== ROOM SCHEMA ==============
const roomSchema = new mongoose.Schema({
    roomNo: {
        type: String,
        required: [true, 'Room number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    block: {
        type: String,
        required: [true, 'Block is required'],
        enum: ['Dharithri', 'Main', 'Medha'],
        trim: true
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1']
    },
    type: {
        type: String,
        enum: ['classroom', 'lab', 'seminar-hall', 'auditorium'],
        default: 'classroom'
    },
    facilities: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    floor: {
        type: Number
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Room indexes  
roomSchema.index({ block: 1, type: 1 });
roomSchema.index({ isActive: 1 });

roomSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// ============== BLOCK SCHEMA ==============
const blockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Block name is required'],
        unique: true,
        trim: true,
        enum: ['Dharithri', 'Main', 'Medha']
    },
    description: {
        type: String,
        trim: true
    },
    totalRooms: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

blockSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// ============== TIMETABLE SCHEMA ==============
const timetableSchema = new mongoose.Schema({
    year: {
        type: String,
        trim: true
    },
    branch: {
        type: String,
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    day: {
        type: String,
        trim: true
        // MON, TUE, WED, THU, FRI, SAT
    },
    slot: {
        type: Number
        // 1-7
    },
    timeSlot: {
        type: String,
        trim: true
        // e.g., "08:00-09:00" (Legacy or display)
    },
    subject: {
        type: String,
        trim: true
    },
    roomNo: {
        type: String,
        trim: true,
        uppercase: true
    },
    faculty: {
        type: String,
        trim: true
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    start_time: {
        type: String,
        trim: true
    },
    end_time: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    semester: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
    }
});

// Timetable indexes
timetableSchema.index({ year: 1, branch: 1, section: 1 });
timetableSchema.index({ day: 1, slot: 1 });

// ============== EVENT BOOKING SCHEMA ==============
const eventBookingSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true
    },
    organiserName: {
        type: String,
        required: [true, 'Organiser name is required'],
        trim: true
    },
    organiserId: {
        type: String,
        required: [true, 'Organiser ID is required'],
        trim: true
    },
    hallNo: {
        type: String,
        required: [true, 'Hall number is required'],
        trim: true,
        uppercase: true
    },
    eventDate: {
        type: Date,
        required: [true, 'Event date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        trim: true
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
        trim: true
    },
    expectedAttendees: {
        type: Number,
        required: [true, 'Expected attendees is required'],
        min: [1, 'At least 1 attendee required']
    },
    eventType: {
        type: String,
        enum: ['seminar', 'workshop', 'conference', 'cultural', 'sports', 'other'],
        required: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        default: 'organiser'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: String,
        trim: true
    },
    approvalDate: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

eventBookingSchema.index({ hallNo: 1, eventDate: 1 });
eventBookingSchema.index({ status: 1 });
eventBookingSchema.index({ organiserId: 1 });

eventBookingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Add this BEFORE the export section, after userSchema.pre('save')
userSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign(
            { _id: this._id.toString(), userId: this.userId, role: this.role },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Save token to user document (optional - for logout functionality)
        this.tokens = this.tokens || [];
        this.tokens.push({ token });
        await this.save();

        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw error;
    }
};
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    this.updatedAt = Date.now();
    next();
});

// ============== EXPORT MODELS ==============
// ============== DAILY ALLOCATION SCHEMA ==============
const dailyAllocationSchema = new mongoose.Schema({
    date: { type: String, required: true },
    period: { type: Number, required: true },
    className: { type: String, required: true },
    roomNo: { type: String, required: true, uppercase: true },
    startTime: { type: String },
    endTime: { type: String },
    uploadedAt: { type: Date, default: Date.now }
});

// DailyAllocation indexes
dailyAllocationSchema.index({ date: 1, roomNo: 1 });
dailyAllocationSchema.index({ date: 1, period: 1 });

const DailyAllocation = mongoose.model('DailyAllocation', dailyAllocationSchema);

// ============== EXPORT MODELS ==============
const Booking = mongoose.model('Booking', bookingSchema);
const User = mongoose.model('User', userSchema);
const Room = mongoose.model('Room', roomSchema);
const Block = mongoose.model('Block', blockSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);
const EventBooking = mongoose.model('EventBooking', eventBookingSchema);

module.exports = {
    Booking,
    User,
    Room,
    Block,
    Timetable,
    EventBooking,
    DailyAllocation
};
