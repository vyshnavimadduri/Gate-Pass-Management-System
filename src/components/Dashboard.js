import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleSpecificContent = () => {
    switch (user.role) {
      case 'student':
        return {
          title: 'Student Dashboard',
          description: 'Manage your gatepass requests and track their status.',
          action: {
            text: 'View My Gatepasses',
            path: '/student/gatepasses'
          }
        };
      case 'faculty':
        return {
          title: 'Faculty Dashboard',
          description: 'Review and manage student gatepass requests.',
          action: {
            text: 'View Pending Requests',
            path: '/faculty/requests'
          }
        };
      case 'security':
        return {
          title: 'Security Dashboard',
          description: 'Verify student gatepasses using security codes.',
          action: {
            text: 'Verify Gatepasses',
            path: '/security/verify'
          }
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to the Gatepass Management System.',
          action: null
        };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {content.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {content.description}
        </Typography>
        {content.action && (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(content.action.path)}
          >
            {content.action.text}
          </Button>
        )}
      </Paper>
    </Box>
  );
}

export default Dashboard; 