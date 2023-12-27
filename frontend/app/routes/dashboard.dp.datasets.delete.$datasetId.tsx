// File: datasets.delete.$datasetId.tsx

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getDataset, deleteDataset } from "~/models/dataset.server"; // Adjust this import to your actual function
import { requireUserId } from "~/session.server";

// Loader to fetch the current dataset details
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    const userId = await requireUserId(request);
    invariant(params.datasetId, "datasetId not found");

    const dataset = await getDataset({ id: params.datasetId, userId });
    if (!dataset) {
        throw new Response("Not Found", { status: 404 });
    }
    return json({ dataset });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
    const userId = await requireUserId(request);
    invariant(params.datasetId, "datasetId not found");

    const dataset = await getDataset({ id: params.datasetId, userId });

    if (!dataset) {
        return json({ error: "Dataset not found" }, { status: 404 });
    }

    try {
        const response = await fetch(`http://localhost:5000/delete_file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ original_file_path: dataset.filePath, original_file_name: dataset.fileName }),
        });

        if (!response.ok) {
            const errorDetail = await response.text();
            throw new Error(`Error deleting file on the backend: ${errorDetail}`);
        }

        await deleteDataset({ id: params.datasetId, userId });
        return redirect(`/dashboard/dp/datasets/${dataset.id}`);
    } catch (error) {
        return json({ error: 'Error deleting dataset' }, { status: 500 });
    }
};

export default function DeleteDatasetPage() {
    const { dataset } = useLoaderData<typeof loader>();

    return (
        <div>
            <h3 className="text-2xl font-bold">Delete Dataset</h3>
            <p>Are you sure you want to delete this dataset? This action cannot be undone.</p>
            <div className="mt-4">
                <strong>Dataset:</strong> {dataset.fileName}
            </div>
            <Form method="post" className="space-y-6 mt-4">
                <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                    Delete Dataset
                </button>
            </Form>
        </div>
    );
}
