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
        // Add scopes as needed for your application's functionality
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/compute',
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/cloud-billing',
            'https://www.googleapis.com/auth/cloud-billing.readonly'
        ].join(' '),  // Join the array of scopes into a single string
        access_type: 'offline',
        prompt: 'consent',
        state: userId   
    });
    
    return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${queryParams}`);
};
