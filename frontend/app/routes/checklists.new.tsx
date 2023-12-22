// import type { ActionFunctionArgs } from "@remix-run/node";
// import { json, redirect } from "@remix-run/node";
// import { Form, useActionData } from "@remix-run/react";
// import { useEffect, useRef } from "react";

// import { createChecklist } from "~/models/checklist.server";
// import { requireUserId } from "~/session.server";

// export const action = async ({ request }: ActionFunctionArgs) => {
//     const userId = await requireUserId(request);

//     const formData = await request.formData();
//     const title = formData.get("title");
//     const description = formData.get("description"); // Retrieve description from form data
//     const descriptionValue = description !== null ? description.toString() : undefined;
//     const items = formData.get("items");

//     if (typeof title !== "string" || title.length === 0) {
//         return json(
//             { errors: { items: null, title: "Title is required" } },
//             { status: 400 },
//         );
//     }

//     if (typeof items !== "string" || items.length === 0) {
//         return json(
//             { errors: { items: "Items are required", title: null } },
//             { status: 400 },
//         );
//     }

//     const checklist = await createChecklist({
//         items: items as string,
//         title: title as string,
//         description: descriptionValue,
//         userId
//       });
      
//     return redirect(`/checklists/${checklist.id}`);
// };

// export default function NewChecklistPage() {
//     const actionData = useActionData<typeof action>();
//     const titleRef = useRef<HTMLInputElement>(null);
//     const descriptionRef = useRef<HTMLTextAreaElement>(null); // Ref for description
//     const itemsRef = useRef<HTMLTextAreaElement>(null);

//     useEffect(() => {
//         if (actionData?.errors?.title) {
//             titleRef.current?.focus();
//         } else if (actionData?.errors?.items) {
//             itemsRef.current?.focus();
//         }
//     }, [actionData]);

//     return (
//         <Form
//             method="post"
//             style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: 8,
//                 width: "100%",
//             }}
//         >
//             <div>
//                 <label className="flex w-full flex-col gap-1">
//                     <span>Title: </span>
//                     <input
//                         ref={titleRef}
//                         name="title"
//                         className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
//                         aria-invalid={actionData?.errors?.title ? true : undefined}
//                         aria-errormessage={
//                             actionData?.errors?.title ? "title-error" : undefined
//                         }
//                     />
//                 </label>
//                 {actionData?.errors?.title ? (
//                     <div className="pt-1 text-red-700" id="title-error">
//                         {actionData.errors.title}
//                     </div>
//                 ) : null}
//             </div>

//             {/* Description input field */}
//             <div>
//                 <label className="flex w-full flex-col gap-1">
//                     <span>Description: </span>
//                     <textarea
//                         ref={descriptionRef}
//                         name="description"
//                         rows={4}
//                         className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
//                         aria-invalid={actionData?.errors?.description ? true : undefined}
//                         aria-errormessage={
//                             actionData?.errors?.description ? "description-error" : undefined
//                         }
//                     />
//                 </label>
//                 {actionData?.errors?.description ? (
//                     <div className="pt-1 text-red-700" id="description-error">
//                         {actionData.errors.description}
//                     </div>
//                 ) : null}
//             </div>

//             <div>
//                 <label className="flex w-full flex-col gap-1">
//                     <span>Items: </span> {/* Changed from Body to Items */}
//                     <textarea
//                         ref={itemsRef}
//                         name="items" // Name changed to items
//                         rows={8}
//                         className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
//                         aria-invalid={actionData?.errors?.items ? true : undefined}
//                         aria-errormessage={
//                             actionData?.errors?.items ? "items-error" : undefined
//                         }
//                     />
//                 </label>
//                 {actionData?.errors?.items ? (
//                     <div className="pt-1 text-red-700" id="items-error">
//                         {actionData.errors.items}
//                     </div>
//                 ) : null}
//             </div>

//             <div className="text-right">
//                 <button
//                     type="submit"
//                     className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
//                 >
//                     Save
//                 </button>
//             </div>
//         </Form>
//     );
// }
