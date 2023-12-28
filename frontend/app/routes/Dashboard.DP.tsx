import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Outlet } from '@remix-run/react';
// ... other necessary imports ...

function DashboardDP() {
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);

  // Define the routes corresponding to each tab
  const tabRoutes = [
    '/dashboard/dp/tabulardata',
    '/dashboard/dp/imagedata',
    '/dashboard/dp/syntheticdatasets',
    '/dashboard/dp/statistics',
    '/dashboard/dp/datasets/lookup',
    // ... add more routes as needed
  ];

  useEffect(() => {
    // Set the active tab based on the current route
    const currentTabIndex = tabRoutes.findIndex(route => location.pathname.startsWith(route));

    if (currentTabIndex !== -1 && currentTabIndex !== tabValue) {
      setTabValue(currentTabIndex);
    } else if (currentTabIndex === -1 && tabValue !== -1) {
      setTabValue(-1); // Set to -1 to indicate no tab is selected
    }
    // Ensuring that tabValue is not in the dependency array to avoid a loop
  }, [location, tabRoutes]);

  return (
    <Box component="main" sx={{ /* styles */ }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Render the content of the current route */}
        <Outlet />
      </Container>
    </Box>
  );
}

export default DashboardDP;
