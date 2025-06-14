import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import axios from 'axios';

// Gatepass Approval Dialog Component
function ApprovalDialog({ open, onClose, gatepass, onSuccess }) {
  const [status, setStatus] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/gatepass/approve/${gatepass._id}`,
        {
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update gatepass status');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {status === 'approved' ? 'Approve' : 'Reject'} Gatepass Request
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Student: {gatepass.student.name}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Purpose: {gatepass.purpose}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Out Time: {new Date(gatepass.outTime).toLocaleString()}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            In Time: {new Date(gatepass.inTime).toLocaleString()}
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant={status === 'approved' ? 'contained' : 'outlined'}
              onClick={() => setStatus('approved')}
              sx={{ mr: 1 }}
            >
              Approve
            </Button>
            <Button
              variant={status === 'rejected' ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setStatus('rejected')}
            >
              Reject
            </Button>
          </Box>

          {status === 'rejected' && (
            <TextField
              fullWidth
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              margin="normal"
              required
              multiline
              rows={3}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={status === 'approved' ? 'primary' : 'error'}
          disabled={status === 'rejected' && !rejectionReason}
        >
          {status === 'approved' ? 'Approve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Pending Requests List Component
function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/gatepass/requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRequests(response.data);
    } catch (error) {
      setError('Failed to fetch gatepass requests');
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'verified': return 'info';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pending Gatepass Requests
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Out Time</TableCell>
              <TableCell>In Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request._id}>
                <TableCell>{request.student.name}</TableCell>
                <TableCell>{request.student.studentId}</TableCell>
                <TableCell>{request.purpose}</TableCell>
                <TableCell>{new Date(request.outTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(request.inTime).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setSelectedRequest(request)}
                    >
                      Review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedRequest && (
        <ApprovalDialog
          open={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          gatepass={selectedRequest}
          onSuccess={fetchRequests}
        />
      )}
    </Box>
  );
}

function FacultyDashboard() {
  return (
    <Routes>
      <Route path="requests" element={<PendingRequests />} />
      <Route path="*" element={<Navigate to="requests" />} />
    </Routes>
  );
}

export default FacultyDashboard; 