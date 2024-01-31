import { json } from "@remix-run/node";
import { decryptToken } from "~/models/gcpauth.server";

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const hash = formData.get("hash");

  // Check if hash is a string
  if (typeof hash !== 'string' || !hash) {
    return json({ error: "Hash is required and must be a string" }, { status: 400 });
  }

  try {
    const decryptedToken = decryptToken(hash);
    return json({ decryptedToken });
  } catch (error) {
    return json({ error: "Decryption failed" }, { status: 500 });
  }
};
