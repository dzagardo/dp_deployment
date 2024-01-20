import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Outlet } from '@remix-run/react';
import DashboardAssistantDisplay from './dashboard.assistant._index';
// ... other necessary imports ...

function VirtualAssistant() {

  return (
    <Box component="main" sx={{ /* styles */ }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Render the content of the current route */}
        <Outlet />
      </Container>
    </Box>
  );
}

export default VirtualAssistant;
