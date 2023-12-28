// dashboard.dp.createdataset.tsx

import React from 'react';
import { json, ActionFunction } from '@remix-run/node';
import { useActionData, Form } from '@remix-run/react';
import { requireUserId } from '~/session.server';
import { createDataset } from '~/models/dataset.server';

type ActionData = {
    dataset?: {
        id: string;
        // ... other properties of dataset
    };
    error?: string;
};

export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const body = await request.json();

    try {
        // Create a new dataset with the provided information
        const dataset = await createDataset({
            fileName: body.fileName,
            fileType: body.fileType || 'text/csv',  // Default to 'text/csv' if not provided
            filePath: body.filePath,
            privacyBudget: body.privacyBudget,
            userId,
        });

        // Return the newly created dataset
        return json({ dataset });
    } catch (error) {
        console.error('Failed to create dataset:', error);
        return json({ error: 'Failed to create dataset.' }, { status: 500 });
    }
};

function Createdataset() {
    const actionData = useActionData<ActionData>();

    return (
        <div>
            <h1>Create New Dataset</h1>
            <Form method="post">
                <label htmlFor="fileName">File Name:</label>
                <input type="text" id="fileName" name="fileName" required />

                <label htmlFor="fileType">File Type:</label>
                <input type="text" id="fileType" name="fileType" />

                <label htmlFor="filePath">File Path:</label>
                <input type="text" id="filePath" name="filePath" required />

                <label htmlFor="privacyBudget">Privacy Budget:</label>
                <input type="number" id="privacyBudget" name="privacyBudget" required />

                <button type="submit">Create Dataset</button>
            </Form>
            {actionData?.dataset && <p>New dataset created with ID: {actionData.dataset.id}</p>}
            {actionData?.error && <p>Error: {actionData.error}</p>}
        </div>
    );
}

export default Createdataset;
