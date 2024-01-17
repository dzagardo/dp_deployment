import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Link } from 'react-router-dom';

interface Tab {
    label: string;
    route: string;
}

interface DashboardTabsProps {
    tabs: Tab[];
}

function DashboardTabs({ tabs }: DashboardTabsProps): JSX.Element { // Added return type annotation
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="Dashboard Tabs"
            sx={{
                marginLeft: 'auto',
                '.MuiTab-root': { // Style for the default (non-selected) tabs
                    color: 'dodgerblue', // Text color for the default tabs
                    borderBottom: '3px solid white',
                    borderTop: '2px solid white',
                    borderLeft: '1px solid white',
                    borderRight: '1px solid white',
                    marginRight: '10px',
                    '.MuiTabs-indicator': { // Hides the indicator
                        display: 'none',
                    },
                    borderRadius: '10px',
                    backgroundColor: 'white', // Background color for the default tabs
                    '&:hover': {
                        // backgroundColor: 'pink', // Optional: Change background on hover
                    },
                    '&.Mui-selected': { // Style for the selected tab
                        color: 'black', // Text color for the selected tab
                        backgroundColor: 'white', // Background color for the selected tab
                        indicatorColor: 'none',
                    },
                }
            }}
        >
            {tabs.map((tab, index) => (
                <Tab key={index} label={tab.label} component={Link} to={tab.route} />
            ))}
        </Tabs>
    );
}

export default DashboardTabs;