// DataGridDisplay.tsx
import React from 'react';
import { DataGrid } from '@mui/x-data-grid';

// Define the shape of a data row
interface DataRow {
  id: number;
  [key: string]: any;
}

// Define the types for the props
interface DataGridDisplayProps {
  data: DataRow[];
}

export default function DataGridDisplay({ data }: DataGridDisplayProps) {
  // Generate columns from data keys
  const columns = data.length > 0
    ? Object.keys(data[0]).map((key) => ({
        field: key,
        headerName: key.charAt(0).toUpperCase() + key.slice(1),
        width: 150,
        editable: true,
      }))
    : [];

  // If your rows already have an 'id' property, you can directly use them as rows for the DataGrid.
  // If not, and you want to create an 'id' based on the index, you can do the following:
  const rows = data.map((row, index) => ({
    ...row,
    id: row.id || index,  // This will use row.id if it exists, otherwise it will use the index.
  }));

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} checkboxSelection />
    </div>
  );
}
