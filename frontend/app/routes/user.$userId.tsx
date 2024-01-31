import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { decryptToken } from "~/models/gcpauth.server";
import { getUserById, deleteUserByEmail, updateUserRole } from "~/models/user.server";
import { fetchComputeResources } from "~/models/gcpauth.server";
import { useUser } from "~/utils";
import { refreshAccessToken, updateUserToken, fetchAllMachineTypesWithDetails, fetchAcceleratorTypes } from "~/models/gcpauth.server";

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
};

export const loader: LoaderFunction = async ({ params }) => {
    let loaderData: LoaderData = {
        isAuthenticated: false,
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

        // Decrypt the access token
        let accessToken = await decryptToken(currentUser.encryptedToken);

        // Define project and zone, ensuring they are not undefined
        let project = process.env.GCP_PROJECT_ID || 'default-project';
        let zone = process.env.GCP_DEFAULT_ZONE || 'us-west1-a';

        // Fetch machine types and accelerator types (GPUs)
        const machineTypes = await fetchAllMachineTypesWithDetails(accessToken, project, zone);
        const acceleratorTypes = await fetchAcceleratorTypes(accessToken, project, zone);

        // Update loaderData with fetched resources
        loaderData.isAuthenticated = true;
        loaderData.user = {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role || 'No role assigned',
            encryptedToken: currentUser.encryptedToken,
        };
        loaderData.machineTypes = machineTypes;
        loaderData.acceleratorTypes = acceleratorTypes;

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

    const { computeResources } = loaderData;

    // Check if user is defined before accessing its properties
    if (!currentUser) {
        return <div>Error: User data is not available.</div>;
    }

    // Adjusted to use the correct `user` object from loaderData
    const handleLinkGCPAccount = async () => {
        // Ensure that you're using the correct URL and handling for initiating the OAuth flow
        window.location.href = `/user/linkgcp/${currentUser.id}`;
    };

    return (
        <div className="flex h-full min-h-screen flex-col">
            <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
                <h1 className="text-3xl font-bold">
                    <Link to="/">Home</Link>
                </h1>
                <h1 className="text-3xl font-bold">
                    <Link to="/datasets">Datasets</Link>
                </h1>
                <h1 className="text-3xl font-bold">
                    <Link to="/notes">Notes</Link>
                </h1>
                <h1 className="text-3xl font-bold">
                    <Link to={`/user/${currentUser.id}`} className="text-white hover:text-blue-200">Profile</Link>
                </h1>
                <p>{currentUser.email} ({currentUser.role})</p>
                <Form action="/logout" method="post">
                    <button
                        type="submit"
                        className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
                    >
                        Logout
                    </button>
                </Form>
            </header>

            <main className="flex-1 bg-white p-6">
                <h1 className="text-2xl font-bold mb-4">{currentUser.email}'s Profile</h1>
                <div className="bg-gray-100 p-4 rounded">
                    <p>Email: {currentUser.email}</p>
                    <p>Role: {currentUser.role}</p>
                    <p>OAuth2 Authenticated: {currentUser.encryptedToken ? "Yes" : "No"}</p>
                </div>

                {/* Update Role Form */}
                <div className="mt-4">
                    <Form method="post" className="bg-white p-4 rounded shadow">
                        <label htmlFor="newRole" className="block text-sm font-medium text-gray-700">New Role:</label>
                        <select id="newRole" name="newRole" required className="mt-1 block w-full border-2 p-2 rounded">
                            <option value="">Select new role</option>
                            <option value="DATA_ADMINISTRATOR">Data Administrator</option>
                            <option value="DATA_SCIENTIST">Data Scientist</option>
                            <option value="DATA_OWNER">Data Owner</option>
                        </select>
                        <button type="submit" name="_action" value="updateRole" className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
                            Update Role
                        </button>
                    </Form>
                </div>

                {/* Machine Types Selection Form */}
                {loaderData.machineTypes && (
                    <Form method="post" action="/path/to/your/backend/function">
                        <div className="mt-4">
                            <label htmlFor="machineType" className="block text-sm font-medium text-gray-700">Select Machine Type:</label>
                            <select id="machineType" name="machineType" required className="mt-1 block w-full border-2 p-2 rounded">
                                <option value="">Select a machine type</option>
                                {loaderData.machineTypes.map((type) => (
                                    <option key={type.id} value={type.name}>
                                        {type.name} - Description: {type.description}, Estimated Usage: {type.estimatedUsagePerHour}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
                            Run Code
                        </button>
                    </Form>
                )}


                {/* Simplified GPUs Display */}
                {loaderData.acceleratorTypes && (
                    <div>
                        <h2>Available GPUs:</h2>
                        {/* Consider using a table or a grid component here for better data presentation */}
                        <ul>
                            {loaderData.acceleratorTypes.map((gpu) => (
                                <li key={gpu.id}>
                                    {gpu.name} - Description: {gpu.description}, Estimated Usage: {gpu.estimatedUsagePerHour}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Delete Account Form */}
                <div className="mt-4">
                    <Form method="post" className="bg-white p-4 rounded shadow">
                        <button type="submit" name="_action" value="delete" className="bg-red-500 text-white px-4 py-2 rounded">
                            Delete Account
                        </button>
                    </Form>
                </div>

                {/* Button to Link GCP Account */}
                <div className="mt-4">
                    <button
                        onClick={handleLinkGCPAccount}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Link GCP Account
                    </button>
                </div>
            </main>
        </div>
    );
}