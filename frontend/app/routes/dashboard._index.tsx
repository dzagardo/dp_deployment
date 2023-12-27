import React from 'react';
import { Link } from '@remix-run/react';

const DashboardIndex = () => {
  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <p>Select a category from the navigation to get started.</p>
      
      <nav>
        <ul>
          <li><Link to="dp/tabulardata">Tabular Data</Link></li>
          <li><Link to="dp/imagedata">Image Data</Link></li>
          <li><Link to="dp/syntheticdatasets">Synthetic Datasets</Link></li>
          {/* Add more links to other sub-routes as needed */}
        </ul>
      </nav>
      
      {/* If you have nested routes under dashboard/index you want to render, keep the Outlet here */}
      {/* Otherwise, it can be removed if this is the end point */}
      {/* <Outlet /> */}
    </div>
  );
};

export default DashboardIndex;
