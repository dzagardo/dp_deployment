import { json } from "@remix-run/node";
import { fetchAllMachineTypesWithDetails } from "~/models/gcpauth.server";

export const loader = async ({ request }: { request: Request }) => {
  // Extract the access token from the Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Access token is required" }, { status: 400 });
  }

  // Extract the access token from the header
  const accessToken = authHeader.substring(7); // Remove "Bearer " prefix

  // Extract projectId and zone from the URL search params
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") || "privacytoolbox";
  const zone = url.searchParams.get("zone") || "us-west1-a";

  try {
    const machineTypes = await fetchAllMachineTypesWithDetails(accessToken, projectId, zone);
    return json({ machineTypes });
  } catch (error) {
    console.error("Error fetching machine types:", error);
    return json({ error: "Failed to fetch machine types" }, { status: 500 });
  }
};
