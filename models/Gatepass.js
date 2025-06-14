const mongoose = require('mongoose');

const gatepassSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    purpose: {
        type: String,
        required: true,
        trim: true
    },
    outTime: {
        type: Date,
        required: true
    },
    inTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'verified', 'expired'],
        default: 'pending'
    },
    securityCode: {
        type: String,
        unique: true,
        sparse: true
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate security code when gatepass is approved
gatepassSchema.methods.generateSecurityCode = function() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.securityCode = code;
    return code;
};

// Check if gatepass is expired
gatepassSchema.methods.isExpired = function() {
    return new Date() > this.inTime;
};

// Update status to expired if inTime has passed
gatepassSchema.pre('save', function(next) {
    if (this.isExpired() && this.status === 'approved') {
        this.status = 'expired';
    }
    next();
});

const Gatepass = mongoose.model('Gatepass', gatepassSchema);

module.exports = Gatepass; 