const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, checkRole } = require('../middleware/auth');
const Gatepass = require('../models/Gatepass');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Create new gatepass request (Student only)
router.post('/request', [
    auth,
    checkRole(['student']),
    body('facultyId').isMongoId().withMessage('Valid faculty ID is required'),
    body('purpose').trim().notEmpty().withMessage('Purpose is required'),
    body('outTime').isISO8601().withMessage('Valid out time is required'),
    body('inTime').isISO8601().withMessage('Valid in time is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { facultyId, purpose, outTime, inTime } = req.body;

        // Verify faculty exists
        const faculty = await User.findOne({ _id: facultyId, role: 'faculty' });
        if (!faculty) {
            return res.status(400).json({ message: 'Faculty not found' });
        }

        // Create gatepass request
        const gatepass = new Gatepass({
            student: req.user._id,
            faculty: facultyId,
            purpose,
            outTime,
            inTime
        });

        await gatepass.save();

        res.status(201).json(gatepass);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get gatepass requests (filtered by role)
router.get('/requests', auth, async (req, res) => {
    try {
        let query = {};
        
        // Filter requests based on user role
        switch (req.user.role) {
            case 'student':
                query.student = req.user._id;
                break;
            case 'faculty':
                query.faculty = req.user._id;
                break;
            case 'security':
                query.status = 'approved';
                break;
        }

        const requests = await Gatepass.find(query)
            .populate('student', 'name email studentId')
            .populate('faculty', 'name email department')
            .sort('-createdAt');

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve/reject gatepass request (Faculty only)
router.put('/approve/:id', [
    auth,
    checkRole(['faculty']),
    body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
    body('rejectionReason').if(body('status').equals('rejected')).notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status, rejectionReason } = req.body;
        const gatepass = await Gatepass.findOne({
            _id: req.params.id,
            faculty: req.user._id,
            status: 'pending'
        }).populate('student', 'name email');

        if (!gatepass) {
            return res.status(404).json({ message: 'Gatepass request not found' });
        }

        gatepass.status = status;
        if (status === 'rejected') {
            gatepass.rejectionReason = rejectionReason;
        } else {
            // Generate security code for approved requests
            gatepass.generateSecurityCode();
        }

        await gatepass.save();

        // Send email notification
        try {
            const emailData = {
                studentName: gatepass.student.name,
                gatepassDetails: {
                    purpose: gatepass.purpose,
                    fromDate: gatepass.outTime,
                    toDate: gatepass.inTime
                },
                reason: status === 'rejected' ? rejectionReason : undefined
            };

            await sendEmail(
                gatepass.student.email,
                status === 'approved' ? 'gatepassApproved' : 'gatepassRejected',
                emailData
            );
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Don't fail the request if email fails
        }

        res.json(gatepass);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify gatepass (Security only)
router.put('/verify/:id', [
    auth,
    checkRole(['security']),
    body('securityCode').notEmpty().withMessage('Security code is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { securityCode } = req.body;
        const gatepass = await Gatepass.findOne({
            _id: req.params.id,
            status: 'approved',
            securityCode
        });

        if (!gatepass) {
            return res.status(404).json({ message: 'Invalid gatepass or security code' });
        }

        if (gatepass.isExpired()) {
            gatepass.status = 'expired';
            await gatepass.save();
            return res.status(400).json({ message: 'Gatepass has expired' });
        }

        gatepass.status = 'verified';
        gatepass.verifiedBy = req.user._id;
        gatepass.verifiedAt = new Date();
        await gatepass.save();

        res.json(gatepass);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 