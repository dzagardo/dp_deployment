import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { createDataset } from "~/models/dataset.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const userId = await requireUserId(request);

    const formData = await request.formData();
    const fileName = formData.get("filename");
    const fileType = formData.get("fileType") || "csv"; // Default to "csv" if not provided

    // Validate fileName
    if (typeof fileName !== "string" || fileName.length === 0) {
        return json(
            { errors: { fileName: "Filename is required", fileType: null } },
            { status: 400 },
        );
    }

    // Construct filePath using the provided fileName or use a default filePath from formData
    const providedFilePath = formData.get("filePath");
    const filePath = typeof providedFilePath === "string" && providedFilePath.length > 0
        ? providedFilePath
        : `./data/${fileName}`; // Default to './data/' + fileName if no filePath is provided

    const privacyBudget = 1.0; // Replace with actual value or get from formData

    const dataset = await createDataset({
        fileName,
        fileType: typeof fileType === "string" ? fileType : "csv",
        filePath,
        privacyBudget,
        userId,
    });

    return redirect(`/dashboard/dp/datasets/${dataset.id}`);
};


export default function NewDatasetPage() {
    const actionData = useActionData<typeof action>();
    const filenameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (actionData?.errors?.fileName) {
            filenameRef.current?.focus();
        }
    }, [actionData]);

    return (
        <Form
            method="post"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: "100%",
            }}
        >
            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>Filename: </span>
                    <input
                        ref={filenameRef}
                        name="filename"
                        className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                        aria-invalid={actionData?.errors?.fileName ? true : undefined}
                        aria-errormessage={
                            actionData?.errors?.fileName ? "filename-error" : undefined
                        }
                    />
                </label>
                {actionData?.errors?.fileName ? (
                    <div className="pt-1 text-red-700" id="filename-error">
                        {actionData.errors.fileName}
                    </div>
                ) : null}
            </div>
            
            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>File Path (optional): </span>
                    <input
                        name="filePath"
                        placeholder="./data/yourfile.txt" // Provide a placeholder
                        className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                    />
                </label>
            </div>

            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>Privacy Budget: </span>
                    <input
                        name="privacyBudget"
                        placeholder="1.0" // Provide a placeholder or default value
                        className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                        type="number" // Ensure that input is treated as a numerical value
                        step="0.01" // Allow decimal values
                    />
                </label>
            </div>
            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>File Type (optional): </span>
                    <input
                        name="fileType"
                        defaultValue="csv" // Default value set here for clarity
                        className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
                    />
                </label>
            </div>

            <div className="text-right">
                <button
                    type="submit"
                    className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
                >
                    Save
                </button>
            </div>
        </Form>
    );
}
