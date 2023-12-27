import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { deleteDataset, getDataset } from "~/models/dataset.server"; // Adjust this import to your actual function
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.datasetId, "datasetId not found");

  const dataset = await getDataset({ id: params.datasetId, userId });
  if (!dataset) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ dataset });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.datasetId, "datasetId not found");

  await deleteDataset({ id: params.datasetId, userId });

  return redirect("/dashboard/dp/datasets/edit");
};

export default function DatasetDetailsPage() {
  const { dataset } = useLoaderData<typeof loader>();

  return (
    <div>
      <h3 className="text-2xl font-bold">{dataset.fileName}</h3>
      <p className="py-2">File Type: {dataset.fileType}</p>
      <p className="py-2">Privacy Budget: {dataset.privacyBudget}</p>
      <p className="py-2">File Path: {dataset.filePath}</p>
      {/* Add this line to display the data owner */}
      <p className="py-2">Data Owner: {dataset.user?.id || 'Unknown'}</p>
      <hr className="my-4" />

      {/* Container for the buttons */}
      <div className="flex gap-4">

        {/* Edit Button */}
        <Link
          to={`/dashboard/dp/datasets/edit/${dataset.id}`}
          className="inline-block rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:bg-green-400"
        >
          Edit
        </Link>

        {/* Delete Button */}
        <Link
          to={`/dashboard/dp/datasets/delete/${dataset.id}`}
          className="inline-block ml-2 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:bg-red-400"
        >
          Delete
        </Link>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <div>An unexpected error occurred: {error.message}</div>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div>Dataset not found</div>;
  }

  return <div>An unexpected error occurred: {error.statusText}</div>;
}
