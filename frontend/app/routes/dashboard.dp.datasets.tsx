import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { getDatasetListItems } from "~/models/dataset.server"; // Adjust this import to your actual function
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const userId = await requireUserId(request);
    const datasetListItems = await getDatasetListItems({ userId });
    return json({ datasetListItems });
};

export default function DatasetView() {
    const data = useLoaderData<typeof loader>();
    const user = useUser();

    return (
        <div className="flex h-full min-h-screen flex-col">
            <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
                <h1 className="text-3xl font-bold">
                    <Link to="/">Home</Link>
                </h1>
                <h1 className="text-3xl font-bold">
                    <Link to="/dashboard/datasets">Datasets</Link>
                </h1>
                <h1 className="text-3xl font-bold">
                    <Link to="/notes">Notes</Link>
                </h1>
                <h1 className="text-3xl font-bold">
                    <Link to={`/user/${user.id}`} className="text-white hover:text-blue-200">Profile</Link>
                </h1>

                <p>{user.email} ({user.role})</p>
                <Form action="/logout" method="post">
                    <button
                        type="submit"
                        className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
                    >
                        Logout
                    </button>
                </Form>
            </header>

            <main className="flex h-full bg-white">
                <div className="h-full w-80 border-r bg-gray-50">
                    <Link to="new" className="block p-4 text-xl text-blue-500">
                        + New Dataset
                    </Link>

                    <hr />

                    {data.datasetListItems.length === 0 ? (
                        <p className="p-4">No datasets yet</p>
                    ) : (
                        <ol>
                            {data.datasetListItems.map((dataset) => (
                                <li key={dataset.id}>
                                    <NavLink
                                        className={({ isActive }) =>
                                            `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                                        }
                                        to={dataset.id}
                                    >
                                        📊 {dataset.fileName}
                                    </NavLink>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                <div className="flex-1 p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
