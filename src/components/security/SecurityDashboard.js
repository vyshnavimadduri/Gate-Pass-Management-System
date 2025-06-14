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

// Gatepass Verification Dialog Component
function VerificationDialog({ open, onClose, gatepass, onSuccess }) {
  const [securityCode, setSecurityCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/gatepass/verify/${gatepass._id}`,
        { securityCode },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify gatepass');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Verify Gatepass</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Student: {gatepass.student.name}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Student ID: {gatepass.student.studentId}
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
          <Typography variant="subtitle1" gutterBottom>
            Faculty: {gatepass.faculty.name}
          </Typography>

          <TextField
            fullWidth
            label="Security Code"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.toUpperCase())}
            margin="normal"
            required
            inputProps={{ maxLength: 6 }}
            helperText="Enter the 6-character security code provided to the student"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!securityCode}
        >
          Verify
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Approved Gatepasses List Component
function ApprovedGatepasses() {
  const [gatepasses, setGatepasses] = useState([]);
  const [selectedGatepass, setSelectedGatepass] = useState(null);
  const [error, setError] = useState('');

  const fetchGatepasses = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/gatepass/requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGatepasses(response.data);
    } catch (error) {
      setError('Failed to fetch gatepass requests');
      console.error('Error fetching gatepasses:', error);
    }
  };

  useEffect(() => {
    fetchGatepasses();
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
        Approved Gatepasses
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
              <TableCell>Faculty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gatepasses.map((gatepass) => (
              <TableRow key={gatepass._id}>
                <TableCell>{gatepass.student.name}</TableCell>
                <TableCell>{gatepass.student.studentId}</TableCell>
                <TableCell>{gatepass.purpose}</TableCell>
                <TableCell>{new Date(gatepass.outTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(gatepass.inTime).toLocaleString()}</TableCell>
                <TableCell>{gatepass.faculty.name}</TableCell>
                <TableCell>
                  <Chip
                    label={gatepass.status.charAt(0).toUpperCase() + gatepass.status.slice(1)}
                    color={getStatusColor(gatepass.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {gatepass.status === 'approved' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setSelectedGatepass(gatepass)}
                    >
                      Verify
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedGatepass && (
        <VerificationDialog
          open={Boolean(selectedGatepass)}
          onClose={() => setSelectedGatepass(null)}
          gatepass={selectedGatepass}
          onSuccess={fetchGatepasses}
        />
      )}
    </Box>
  );
}

function SecurityDashboard() {
  return (
    <Routes>
      <Route path="verify" element={<ApprovedGatepasses />} />
      <Route path="*" element={<Navigate to="verify" />} />
    </Routes>
  );
}

export default SecurityDashboard; 