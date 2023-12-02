import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { getChecklistListItems } from "~/models/checklist.server"; // Updated import
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const checklistListItems = await getChecklistListItems({ userId }); // Updated function call
  return json({ checklistListItems });
};

export default function ChecklistsPage() { // Renamed function
  const data = useLoaderData<typeof loader>();
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to="/">Home</Link> {/* Updated Link */}
        </h1>
        <h1 className="text-3xl font-bold">
          <Link to="/notes">Notes</Link> {/* Updated Link */}
        </h1>
        <h1 className="text-3xl font-bold">
          <Link to=".">Checklists</Link>
        </h1>
        <p>{user.email}</p>
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
            + New Checklist
          </Link>

          <hr />

          {data.checklistListItems.length === 0 ? ( // Updated reference
            <p className="p-4">No checklists yet</p> // Updated text
          ) : (
            <ol>
              {data.checklistListItems.map((checklist) => ( // Updated loop
                <li key={checklist.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={checklist.id}
                  >
                    📋 {checklist.title} // Updated icon and reference
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
