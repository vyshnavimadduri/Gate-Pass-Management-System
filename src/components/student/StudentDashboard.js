import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// Gatepass Request Form Component
function GatepassRequestForm({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    facultyId: '',
    purpose: '',
    outTime: new Date(),
    inTime: new Date()
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/auth/faculty`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setFacultyList(response.data);
      } catch (error) {
        console.error('Error fetching faculty:', error);
        setError('Failed to load faculty list');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchFaculty();
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/gatepass/request`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create gatepass request');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Gatepass Request</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="faculty-select-label">Select Faculty</InputLabel>
            <Select
              labelId="faculty-select-label"
              id="facultyId"
              value={formData.facultyId}
              onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
              label="Select Faculty"
              disabled={loading}
            >
              {loading ? (
                <MenuItem disabled>Loading faculty...</MenuItem>
              ) : facultyList.length === 0 ? (
                <MenuItem disabled>No faculty available</MenuItem>
              ) : (
                facultyList.map((faculty) => (
                  <MenuItem key={faculty._id} value={faculty._id}>
                    {faculty.name} ({faculty.department})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            margin="normal"
            required
            multiline
            rows={3}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mt: 2, mb: 2 }}>
              <DateTimePicker
                label="Out Time"
                value={formData.outTime}
                onChange={(newValue) => setFormData({ ...formData, outTime: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <DateTimePicker
                label="In Time"
                value={formData.inTime}
                onChange={(newValue) => setFormData({ ...formData, inTime: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={formData.outTime}
              />
            </Box>
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !formData.facultyId}
        >
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Gatepass List Component
function GatepassList() {
  const [gatepasses, setGatepasses] = useState([]);
  const [openForm, setOpenForm] = useState(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">My Gatepass Requests</Typography>
        <Button variant="contained" onClick={() => setOpenForm(true)}>
          New Request
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Purpose</TableCell>
              <TableCell>Out Time</TableCell>
              <TableCell>In Time</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Security Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gatepasses.map((gatepass) => (
              <TableRow key={gatepass._id}>
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
                  {gatepass.status === 'approved' && gatepass.securityCode}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <GatepassRequestForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSuccess={fetchGatepasses}
      />
    </Box>
  );
}

function StudentDashboard() {
  return (
    <Routes>
      <Route path="gatepasses" element={<GatepassList />} />
      <Route path="*" element={<Navigate to="gatepasses" />} />
    </Routes>
  );
}

export default StudentDashboard; 