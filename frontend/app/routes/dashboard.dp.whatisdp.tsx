import React from 'react';
import { Link as RouterLink } from '@remix-run/react';
import { Typography, List, Paper, styled, Box } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledLink = styled(RouterLink)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.secondary.main,
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const WhatIsDP = () => {
  return (
    <StyledPaper elevation={3}>
      <StyledTypography variant="h4">
        What is Differential Privacy?
      </StyledTypography>
      <Typography variant="body1" paragraph>
        Start here! Check out the video tutorial below.
      </Typography>

      {/* YouTube Video Embed */}
      <Box
        sx={{
          position: 'relative',
          width: '100%', // Width is 100% of the parent container
          paddingTop: '56.25%', // This provides a 16:9 aspect ratio
        }}
      >
        <iframe
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          src="https://www.youtube.com/embed/rixvwGREKkY"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </Box>

    </StyledPaper>
  );
};

export default WhatIsDP;