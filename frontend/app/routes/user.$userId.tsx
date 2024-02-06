import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { decryptToken } from "~/models/gcpauth.server";
import { getUserById, deleteUserByEmail, updateUserRole } from "~/models/user.server";
import { fetchComputeResources } from "~/models/gcpauth.server";
import { useUser } from "~/utils";
import { refreshAccessToken, updateUserToken, fetchAllMachineTypesWithDetails, fetchAcceleratorTypes } from "~/models/gcpauth.server";
import { updateHuggingFaceToken } from "~/models/user.server";
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Link as RouterLink } from '@remix-run/react';

export const action: ActionFunction = async ({ request, params }) => {
    const formData = await request.formData();
    const actionType = formData.get("_action");

    if (actionType === "delete") {
        const userId = params.userId;
        if (!userId) throw new Error("User ID is not provided.");

        await deleteUserByEmail(userId); // Make sure this function exists and is properly implemented

        return redirect("/users"); // Redirect to the user list or home page after deletion
    }

    if (actionType === "updateRole") {
        const newRole = formData.get("newRole");
        const userId = params.userId;
        if (!userId || typeof newRole !== 'string') throw new Error("Missing parameters for role update.");

        await updateUserRole(userId, newRole); // Ensure this function exists in your user.server.ts

        return redirect(`/user/${userId}`); // Redirect back to the user profile
    }

    // Inside your action function
    if (actionType === "saveHuggingFaceToken") {
        const huggingFaceToken = formData.get("huggingFaceToken");
        const userId = params.userId;
        if (!userId || typeof huggingFaceToken !== 'string') throw new Error("Missing parameters for Hugging Face token update.");

        await updateHuggingFaceToken(userId, huggingFaceToken);

        return redirect(`/user/${userId}`); // Redirect back to the user profile
    }
};

type ComputeResource = {
    id: string;
    name: string;
    machineType: string;
};

type MachineType = {
    id: string;
    name: string;
    description?: string;
    estimatedUsagePerHour?: string;
};

type AcceleratorType = {
    id: string;
    name: string;
    description?: string;
    estimatedUsagePerHour?: string;
};

type LoaderData = {
    isAuthenticated: boolean;
    user?: {
        id: string;
        email: string;
        role: string;
        encryptedToken: string | null;
    };
    computeResources?: ComputeResource[];
    machineTypes?: MachineType[];
    acceleratorTypes?: AcceleratorType[];
    errorMessage?: string;
    hasHuggingFaceToken: boolean;
};

export const loader: LoaderFunction = async ({ params }) => {
    let loaderData: LoaderData = {
        isAuthenticated: false,
        hasHuggingFaceToken: false
    };

    try {
        const userId = params.userId;
        if (!userId) {
            loaderData.errorMessage = "User ID is not provided.";
            return json(loaderData);
        }

        const currentUser = await getUserById(userId);

        if (!currentUser) {
            loaderData.errorMessage = "User not found.";
            return json(loaderData);
        }

        if (!currentUser.encryptedToken) {
            loaderData.errorMessage = "Access token expired. User needs to re-authenticate.";
            return json(loaderData);
        }

        // Inside your loader function, after fetching the user:
        const hasHuggingFaceToken = Boolean(currentUser.encryptedHFAccessToken);
        loaderData.hasHuggingFaceToken = hasHuggingFaceToken;

        // Update loaderData with fetched resources
        loaderData.isAuthenticated = true;
        loaderData.user = {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role || 'No role assigned',
            encryptedToken: currentUser.encryptedToken,
        };

        return json(loaderData);
    } catch (error) {
        console.error("Error loading user profile:", error);
        loaderData.errorMessage = "Failed to load user profile.";
        return json(loaderData, { status: 500 });
    }
};

export default function UserProfile() {
    const currentUser = useUser();
    const loaderData = useLoaderData<LoaderData>();

    // Adjusted to use the correct `user` object from loaderData
    const handleLinkGCPAccount = async () => {
        window.location.href = `/user/linkgcp/${currentUser.id}`;
    };

    if (!currentUser) {
        return <Typography variant="h6" color="error">Error: User data is not available.</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        <Button color="inherit" component={RouterLink} to="/">Home</Button>
                    </Typography>
                    <Button color="inherit" component={RouterLink} to="/datasets">Datasets</Button>
                    <Button color="inherit" component={RouterLink} to="/notes">Notes</Button>
                    <Button color="inherit" component={RouterLink} to={`/user/${currentUser.id}`}>Profile</Button>
                    <Typography>{currentUser.email} ({currentUser.role})</Typography>
                    <Form action="/logout" method="post">
                        <Button type="submit" color="inherit">Logout</Button>
                    </Form>
                </Toolbar>
            </AppBar>

            <main className="flex-1 bg-white p-6">
                <Typography variant="h4" gutterBottom>
                    {currentUser.email}'s Profile
                </Typography>
                <Paper elevation={1} sx={{ padding: 2, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body1">Email: {currentUser.email}</Typography>
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body1">Role: {currentUser.role}</Typography>
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body1">OAuth2 Authenticated: {currentUser.encryptedToken ? "Yes" : "No"}</Typography>
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="body1">Hugging Face Token Stored: {loaderData.hasHuggingFaceToken ? "Yes" : "No"}</Typography>
                    </Box>
                </Paper>

                {/* Update Role Form */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Form method="post">
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="role-select-label">New Role</InputLabel>
                            <Select
                                labelId="role-select-label"
                                id="newRole"
                                name="newRole"
                                label="New Role"
                                required
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                <MenuItem value="DATA_ADMINISTRATOR">Data Administrator</MenuItem>
                                <MenuItem value="DATA_SCIENTIST">Data Scientist</MenuItem>
                                <MenuItem value="DATA_OWNER">Data Owner</MenuItem>
                            </Select>
                        </FormControl>
                        <Button type="submit" name="_action" value="updateRole" variant="contained" color="primary" sx={{ mt: 2 }}>
                            Update Role
                        </Button>
                    </Form>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>

                    {/* Button to Link GCP Account */}
                    <Button onClick={handleLinkGCPAccount} variant="contained" color="success" sx={{ mt: 2 }}>
                        Link GCP Account
                    </Button>

                    {/* Delete Account Form */}
                    <Form method="post">
                        <Button type="submit" name="_action" value="delete" variant="contained" color="error" sx={{ mt: 2 }}>
                            Delete Account
                        </Button>
                    </Form>
                </Paper>



                {/* Form to submit Hugging Face Access token */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Form method="post">
                        <TextField
                            id="huggingFaceToken"
                            name="huggingFaceToken"
                            label="Hugging Face Access Token"
                            type="text"
                            required
                            fullWidth
                            margin="normal"
                        />
                        <Button type="submit" name="_action" value="saveHuggingFaceToken" variant="contained" color="primary" sx={{ mt: 2 }}>
                            Save Token
                        </Button>
                    </Form>
                </Paper>
            </main>
        </Box>
    );
}