import React from 'react';
import { Outlet } from '@remix-run/react';

const DashboardIndex = () => {
  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <p>Select a category from the navigation to get started.</p>

      {/* The Outlet component is where the nested routes will be rendered */}
      <Outlet />
    </div>
  );
};

export default DashboardIndex;
