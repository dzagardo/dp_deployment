import React from 'react';
import { Link } from '@remix-run/react';
import { Box, Typography, Container, List, ListItem } from '@mui/material';

// PrivacyBudgets component with MUI
const PrivacyBudgets = () => {
  return (
    <Container sx={{
      bgcolor: '#f3f4f6',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <Typography variant="h4" component="h1" color="#2c3e50" textAlign="center">
        Understanding Privacy Budgets in Differential Privacy
      </Typography>
      <Typography paragraph color="#34495e">
        A privacy budget in the context of Differential Privacy (DP) is a numerical limit that quantifies the amount of privacy loss a dataset can incur over its lifetime. It's often denoted by ε (epsilon), a non-negative parameter. The smaller the ε, the stronger the privacy guarantee. In DP, each query on a dataset consumes a portion of this budget, reflecting the incremental increase in privacy risk. Once the privacy budget is depleted, no further queries are allowed, ensuring the dataset's overall privacy remains intact.
      </Typography>
      <Typography paragraph color="#34495e">
        To check the status of a privacy budget for a dataset, you can navigate to the "Dataset Lookup" page. This page will typically provide details about the current privacy budget, the initial budget, and the history of queries and their respective budget consumption.
      </Typography>
      <Typography paragraph color="#34495e">
        It's important to understand that each differentially private query made on a dataset updates the remaining privacy budget. The system calculates the cost of a query based on its sensitivity and subtracts this cost from the remaining budget. As a result, users must carefully plan their queries to ensure they utilize the privacy budget effectively, maintaining a balance between data utility and privacy.
      </Typography>
      {/* ... other paragraphs ... */}

      <Box component="nav" sx={{ marginTop: '20px' }}>
        <List sx={{ display: 'flex', justifyContent: 'center', padding: 0 }}>
          {/* Add more links to other sub-routes as needed */}
        </List>
      </Box>
    </Container>
  );
};

export default PrivacyBudgets;
