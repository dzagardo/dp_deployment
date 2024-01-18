// ImageGridDisplay.tsx
import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

interface ImageRow {
  id: number;
  image?: string; // base64 encoded image for image type
  label?: number; // number for label type
}

interface ImageGridDisplayProps {
  data: ImageRow[];
  type: 'image' | 'label';
}

const ImageGridDisplay: React.FC<ImageGridDisplayProps> = ({ data, type }) => {
  // Limit the data to the first 50 items
  const limitedData = data.slice(0, 50);

  return (
    <Grid container spacing={2} wrap="nowrap" style={{ overflowX: 'auto' }}>
      {limitedData.map((item, index) => {
        return (
          <Grid item key={item.id || index}>
            <Card>
              {type === 'image' && item.image ? (
                <img
                  src={`data:image/png;base64,${item.image}`}
                  alt={`Image ${item.id}`}
                  style={{ height: '140px', width: 'auto' }}
                />
              ) : (
                <CardContent>
                  <Typography variant="body2" component="p">
                    {type === 'label' ? item.label : 'No label'} {/* Handle no label case */}
                  </Typography>
                </CardContent>
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ImageGridDisplay;
