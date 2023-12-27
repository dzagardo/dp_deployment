import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { getDatasetListItems } from "~/models/dataset.server"; // Adjust this import to your actual function
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { Button, List, ListItem, ListItemText, Divider, Box, Container, Typography } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import { Link as RouterLink } from 'react-router-dom';


export const loader = async ({ request }: LoaderFunctionArgs) => {
    const userId = await requireUserId(request);
    // Get dataset list items with user information
    const datasetListItems = await getDatasetListItems({ userId });
    return json({ datasetListItems });
};

export default function DatasetView() {
    const { datasetListItems } = useLoaderData<typeof loader>();
    const user = useUser();

    return (
        <div className="flex h-full min-h-screen flex-col">
            <main className="flex h-full bg-white overflow-auto">
                {/* Dataset List - Removed fixed width */}
                <div className="flex-auto border-r bg-gray-50">
                    <Link to="new" className="block p-4 text-xl text-blue-500">
                        + New Dataset
                    </Link>

                    <hr />

                    {datasetListItems.length === 0 ? (
                        <p className="p-4">No datasets yet</p>
                    ) : (
                        <ol>
                            {datasetListItems.map((item) => (
                                <li key={item.id} className="border-b">
                                    <NavLink
                                        to={item.id}
                                        className={({ isActive }) =>
                                            `flex justify-between p-4 text-xl ${isActive ? "bg-white" : ""}`
                                        }
                                    >
                                        <span>📊 {item.fileName}</span>
                                        <span>{item.user?.id}</span> {/* Display the associated user's name */}
                                    </NavLink>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* Main Content Area - Allowed to grow and take remaining space */}
                <div className="flex-1 p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
