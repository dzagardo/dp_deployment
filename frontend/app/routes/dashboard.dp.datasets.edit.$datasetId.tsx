// File: datasets.edit.$datasetId.tsx

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getDataset, updateDataset } from "~/models/dataset.server"; // Adjust this import to your actual function
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
    const formData = await request.formData();
    const fileName = formData.get("fileName");
    const privacyBudget = formData.get("privacyBudget");
    const filePath = formData.get("filePath");

    if (typeof filePath !== "string" || filePath.length === 0) {
        return json({ error: "File path is required" }, { status: 400 });
    }

    if (typeof fileName !== "string" || fileName.length === 0) {
        return json({ error: "Filename is required" }, { status: 400 });
    }
    if (typeof privacyBudget !== "string" || privacyBudget.length === 0) {
        return json({ error: "Privacy Budget is required" }, { status: 400 });
    }

    const privacyBudgetValue = parseFloat(privacyBudget);
    if (isNaN(privacyBudgetValue)) {
        return json({ error: "Privacy Budget must be a number" }, { status: 400 });
    }

    // Update the dataset
    const updatedDataset = await updateDataset({
        id: params.datasetId,
        userId,
        data: {
            fileName,
            privacyBudget: privacyBudgetValue,
            filePath,
        },
    });

    return redirect(`/dashboard/datasets/${updatedDataset.id}`);
};

export default function EditDatasetPage() {
    const { dataset } = useLoaderData<typeof loader>();

    return (
        <div>
            <h3 className="text-2xl font-bold">Edit Dataset</h3>
            <Form method="post" className="space-y-6">
                <div>
                    <label htmlFor="filename" className="block text-sm font-medium text-gray-700">
                        Filename
                    </label>
                    <input
                        type="text"
                        name="filename"
                        id="filename"
                        defaultValue={dataset.fileName}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="privacyBudget" className="block text-sm font-medium text-gray-700">
                        Privacy Budget
                    </label>
                    <input
                        type="number"
                        step="any"
                        name="privacyBudget"
                        id="privacyBudget"
                        defaultValue={dataset.privacyBudget}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="filePath" className="block text-sm font-medium text-gray-700">
                        File Path
                    </label>
                    <input
                        type="text"
                        name="filePath"
                        id="filePath"
                        defaultValue={dataset.filePath} // Add the defaultValue if the filePath is available in the dataset
                        placeholder="Enter the file path"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Update Dataset
                    </button>
                </div>
            </Form>
        </div>
    );
}
