import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { getUserById, deleteUserByEmail, updateUserRole } from "~/models/user.server";
import { useUser } from "~/utils";

type LoaderData = {
    user: {
        id: string;
        email: string;
        role: string;
        // Add other user properties as needed
    };
};

export const loader: LoaderFunction = async ({ params }) => {
    const userId = params.userId;
    if (!userId) throw new Error("User ID is not provided.");

    const user = await getUserById(userId);
    if (!user) throw new Error("User not found.");

    return json({ user });
};

export const action: ActionFunction = async ({ request, params }) => {
    console.log("Params:", params); // Log the params to see if userId is present
    const formData = await request.formData();
    console.log("Form Data:", Object.fromEntries(formData));
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

    // Handle other actions here
};

export default function UserProfile() {
    const { user } = useLoaderData<LoaderData>();
    const currentUser = useUser();

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
                <h1 className="text-2xl font-bold mb-4">{user.email}'s Profile</h1>
                <div className="bg-gray-100 p-4 rounded">
                    <p>Email: {user.email}</p>
                    <p>Role: {user.role}</p>
                    {/* ... other details ... */}
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

                {/* Delete Account Form */}
                <div className="mt-4">
                    <Form method="post" className="bg-white p-4 rounded shadow">
                        <button type="submit" name="_action" value="delete" className="bg-red-500 text-white px-4 py-2 rounded">
                            Delete Account
                        </button>
                    </Form>
                </div>
            </main>
        </div>
    );
}