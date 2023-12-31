// File: dashboard.dp.statistics.mean.$datasetId.tsx

import React, { useState } from "react";
import { json, LoaderFunctionArgs, ActionFunctionArgs, LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getDataset, updateDataset } from "~/models/dataset.server"; // Adjust this import as necessary
import { requireUserId } from "~/session.server";


export const loader: LoaderFunction = async ({ params, request }) => {
    const userId = await requireUserId(request);
    invariant(params.datasetId, "datasetId not found");

    const datasetId = params.datasetId;
    if (typeof datasetId !== 'string') {
        throw new Response("Not Found", { status: 404 });
    }

    const dataset = await getDataset({ id: datasetId, userId });
    if (!dataset) {
        throw new Response("Not Found", { status: 404 });
    }

    // Fetch column names for the dataset
    let columnNames = [];
    try {
        const colResponse = await fetch(`http://localhost:5000/get_column_names/${dataset.fileName}`);
        if (colResponse.ok) {
            columnNames = await colResponse.json();
        } else {
            console.error(`Failed to fetch column names, status: ${colResponse.status}`);
        }
    } catch (error) {
        console.error('Failed to fetch column names:', error);
    }

    // Capture action return data
    const url = new URL(request.url);
    const result = url.searchParams.get("result");
    const updatedPrivacyBudget = url.searchParams.get("updatedPrivacyBudget");

    console.log(result, updatedPrivacyBudget);
    return json({ dataset, columnNames, result, updatedPrivacyBudget });
};

// Define the action function for handling statistics calculations
export const action = async ({ request, params }: ActionFunctionArgs) => {
    const userId = await requireUserId(request);
    invariant(params.datasetId, "datasetId not found");

    const formData = await request.formData();
    const operation = formData.get("operation") as string;
    const selectedColumn = formData.get("selectedColumn") as string; // Make sure to send this from the client side

    // Assuming the dataset object is retrieved in the loader function and available here
    const dataset = await getDataset({ id: params.datasetId, userId });
    // Function to handle statistics calculations and interact with the backend
    const handleCalculateStatistics = async (userId: string, operation: string, selectedColumn: string, dataset: any) => {
        if (!selectedColumn || !dataset) {
            console.error('Selected column or dataset is not defined');
            return null;
        }

        const url = `http://localhost:5000/get_noisy/${operation}`;

        const data = {
            privacyBudget: dataset.privacyBudget,
            fileName: dataset.fileName,
            columnName: selectedColumn,
            totalQueries: dataset.totalQueries,
        };

        console.log(data);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {

                const result = await response.json();
                console.log(result);

                const updatedPrivacyBudget = result.updatedPrivacyBudget;

                // Update the privacy budget and increment the totalQueries in the dataset
                const updatedDataset = await updateDataset({
                    id: dataset.id,
                    userId,
                    data: {
                        fileName: dataset.fileName, // Keep existing fileName
                        privacyBudget: result.updatedPrivacyBudget, // Update the privacy budget
                        totalQueries: dataset.totalQueries + 1, // Increment the totalQueries
                    },
                    resetQueries: false // Indicate not to reset the totalQueries
                });

                console.log(`Updated Privacy Budget: ${updatedPrivacyBudget}`);
                // Return both values here
                return { statisticValue: result.statisticValue, updatedPrivacyBudget };
            } else {
                console.error(`Failed to fetch statistic, status: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error('Failed to perform operation:', error);
            return null;
        }
    };

    const { statisticValue, updatedPrivacyBudget } = await handleCalculateStatistics(userId, operation, selectedColumn, dataset) || {};

    // Return the result or an appropriate message back to the client
    return redirect(`/dashboard/dp/statistics/${params.datasetId}/calculate?result=${statisticValue}&updatedPrivacyBudget=${updatedPrivacyBudget}`);
};

export default function StatisticsPage() {
    const { dataset, columnNames, result, message } = useLoaderData<typeof loader>();
    const [calculationResult, setCalculationResult] = useState(null);
    const [selectedColumn, setSelectedColumn] = useState('');
    const operations = ["mean", "median", "mode", "min", "max"];
    const [selectedOperation, setSelectedOperation] = useState(operations[0]);

    // Function to handle the selection of an operation
    const handleSelectOperation = (operation: string) => {
        setSelectedOperation(operation);
    };
    // Function to handle form submission
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        console.log("handleSubmit");
        // This function is now simplified as Remix handles the form submission
        // event.preventDefault(); // Prevent default to manage form submission manually if needed
    };

    // Correctly typed event handler for an HTML select element
    const handleColumnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedColumn(event.target.value);
    };

    return (
        <div>
            <hr className="my-4" />
            <Form method="post" onSubmit={handleSubmit} className="space-y-6">
                {/* Input for selecting operation */}
                <div>
                    <label htmlFor="operation" className="block text-sm font-medium text-gray-700">
                        Operation
                    </label>
                    <select
                        name="operation" // The name attribute is important as it's used in the action function to retrieve the value
                        id="operation"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        {/* Define options for operations here */}
                        <option value="mean">Mean</option>
                        <option value="median">Median</option>
                        <option value="mode">Mode</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                    </select>
                </div>

                {/* Input for selecting column */}
                <div>
                    <label htmlFor="column-select" className="block text-sm font-medium text-gray-700">
                        Column
                    </label>
                    <select
                        name="selectedColumn" // Make sure this matches the key expected in action
                        id="column-select"
                        value={selectedColumn}
                        onChange={handleColumnChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        style={{ width: '100%', padding: '8px', marginBottom: '20px' }} // Adjust the styling as needed
                    >
                        <option value="">Select a column</option>
                        {columnNames.map((columnName: string) => (
                            <option key={columnName} value={columnName}>
                                {columnName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Submit button */}
                <div>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Calculate
                    </button>
                </div>
            </Form>

            {/* Display calculated statistic and updated privacy budget */}
            {result && (
                <p>
                    <strong>Calculated Statistic:</strong> {result}
                </p>
            )}
            {message && (
                <p>
                    <strong>Message:</strong> {message}
                </p>
            )}
        </div>
    );
}