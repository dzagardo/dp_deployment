import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteChecklist, getChecklist } from "~/models/checklist.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.checklistId, "checklistId not found");

  const checklist = await getChecklist({ id: params.checklistId, userId });
  if (!checklist) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ checklist });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.checklistId, "checklistId not found");

  await deleteChecklist({ id: params.checklistId, userId });

  return redirect("/checklists");
};

export default function ChecklistDetailsPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h3 className="text-2xl font-bold">{data.checklist.title}</h3>
      <p className="py-6">{/* Render checklist items here */}</p>
      <hr className="my-4" />
      <Form method="post">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}
