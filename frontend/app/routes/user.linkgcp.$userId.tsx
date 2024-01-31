import { LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = async ({ params }) => {
    const userId = params.userId;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;  // Use an environment variable

    if (!clientId || !userId || !redirectUri) {
        // Handle the error appropriately
        throw new Error("Client ID, User ID, or Redirect URI is missing");
    }

    const queryParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/compute',
        access_type: 'offline',
        prompt: 'consent',
        state: userId
    });
    
    return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${queryParams}`);
};
