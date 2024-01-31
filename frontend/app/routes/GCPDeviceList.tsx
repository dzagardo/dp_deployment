import React, { useEffect, useState } from 'react';
import { useUser } from '~/utils';
import { decryptToken, fetchAllMachineTypesWithDetails, fetchAcceleratorTypes } from '~/models/gcpauth.server';
import { Select, MenuItem } from '@mui/material';

type MachineType = {
    id: string;
    name: string;
    // ... other properties
};

type AcceleratorType = {
    id: string;
    name: string;
    // ... other properties
};

const GCPDeviceList = () => {
    const currentUser = useUser();
    const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
    const [acceleratorTypes, setAcceleratorTypes] = useState<AcceleratorType[]>([]);
    const [selectedMachineType, setSelectedMachineType] = useState('');
    const [loading, setLoading] = useState(true);  

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser && currentUser.encryptedToken) {
                try {
                    const accessToken = await decryptToken(currentUser.encryptedToken);
                    const project = process.env.GCP_PROJECT_ID || 'default-project';
                    const zone = process.env.GCP_DEFAULT_ZONE || 'us-west1-a';

                    const machineTypesData = await fetchAllMachineTypesWithDetails(accessToken, project, zone);
                    const acceleratorTypesData = await fetchAcceleratorTypes(accessToken, project, zone);

                    setMachineTypes(machineTypesData);
                    setAcceleratorTypes(acceleratorTypesData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [currentUser]);

    const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setSelectedMachineType(event.target.value);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Select value={selectedMachineType} onChange={handleChange} displayEmpty>
            <MenuItem value=""><em>None</em></MenuItem>
            {machineTypes.map((type) => (
                <MenuItem key={type.id} value={type.name}>{type.name}</MenuItem>
            ))}
        </Select>
    );
};

export default GCPDeviceList;
