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
    console.log('Action called for dataset edit.');
    const userId = await requireUserId(request);
    console.log(`User ID: ${userId}`);

    invariant(params.datasetId, "datasetId not found");
    console.log(`Dataset ID: ${params.datasetId}`);

    const formData = await request.formData();
    console.log('Form Data:', Object.fromEntries(formData.entries()));

    const newFileName = formData.get("fileName") as string;
    const privacyBudget = formData.get("privacyBudget") as string;
    let originalFilePath = formData.get("filePath") as string;
    const newFilePath = `./data/${newFileName}`; // Updated to define newFilePath

    console.log(`Original File Path: ${originalFilePath}`);
    console.log(`New File Name: ${newFileName}`);
    console.log(`Privacy Budget: ${privacyBudget}`);

    if (!originalFilePath) {
        console.error('Original file path is missing.');
        return json({ error: "Original file path is required" }, { status: 400 });
    }

    if (!newFileName) {
        console.error('New file name is missing.');
        return json({ error: "New filename is required" }, { status: 400 });
    }

    const privacyBudgetValue = parseFloat(privacyBudget);
    console.log(`Parsed Privacy Budget: ${privacyBudgetValue}`);

    if (isNaN(privacyBudgetValue)) {
        console.error('Privacy budget is not a number.');
        return json({ error: "Privacy Budget must be a number" }, { status: 400 });
    }

    const originalDataset = await getDataset({ id: params.datasetId, userId });
    console.log(`Original Dataset:`, originalDataset);

    if (originalDataset.fileName !== newFileName) {
        try {
            const response = await fetch(`http://localhost:5000/rename_file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_file_path: originalFilePath, // Changed from originalFilePath
                    new_file_name: newFileName,         // Changed from newFileName
                }),
            });

            // Add detailed logging
            if (!response.ok) {
                const errorDetail = await response.text(); // assuming the error detail is in text format
                console.error(`Backend file rename failed with status ${response.status}: ${errorDetail}`);
                console.log(newFileName);
                console.log(newFilePath);
                throw new Error(`Error renaming file on the backend: ${errorDetail}`);
            }

            const renameResult = await response.json();
            originalFilePath = renameResult.newFilePath;
        } catch (error) {
            console.error(`Error occurred during file rename: ${error}`);
            return json({ error: 'Error renaming file' }, { status: 500 });
        }
    } else {
        console.log('Filename has not changed, no need to rename on the backend.');
    }

    console.log(originalFilePath);
    console.log(newFilePath);
    console.log('Updating dataset with new information.');
    const updatedDataset = await updateDataset({
        id: params.datasetId,
        userId,
        data: {
            fileName: newFileName,
            privacyBudget: privacyBudgetValue,
            filePath: newFilePath,
        },
    });
    console.log('Dataset updated:', updatedDataset);

    return redirect(`/dashboard/dp/datasets/${updatedDataset.id}`);
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
                        name="fileName"
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
