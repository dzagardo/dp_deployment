import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { createDataset } from "~/models/dataset.server";
import { requireUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const fileName = formData.get("filename"); // Ensure this matches the expected field name
  const fileType = formData.get("fileType") || "csv"; // Default to "csv" if not provided

  if (typeof fileName !== "string" || fileName.length === 0) {
    return json(
      { errors: { fileName: "Filename is required", fileType: null } },
      { status: 400 },
    );
  }

  // Add filePath and privacyBudget here with appropriate values
  const filePath = "/path/to/file"; // Replace with actual path or get from formData
  const privacyBudget = 1.0; // Replace with actual value or get from formData

  const dataset = await createDataset({
    fileName,
    fileType: typeof fileType === "string" ? fileType : "csv",
    filePath,
    privacyBudget,
    userId,
  });

  return redirect(`/datasets/${dataset.id}`);
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
