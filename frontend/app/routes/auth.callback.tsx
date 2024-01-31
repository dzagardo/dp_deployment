import { LoaderFunction, redirect } from "@remix-run/node";
import { exchangeCodeForTokens, getUserInfo, updateUserToken } from "~/models/gcpauth.server";
import { getUserByEmail } from "~/models/user.server";
import { createUserSession } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    console.log("OAuth Callback URL:", url.toString());
    console.log("Authorization code:", code);

    if (!code) {
        console.error("No authorization code found in the request");
        return redirect("/error-page");
    }

    try {
        const { accessToken, refreshToken } = await exchangeCodeForTokens(code);
        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);

        const userInfo = await getUserInfo(accessToken);
        console.log("User Info:", userInfo);

        const user = await getUserByEmail(userInfo.email);
        if (!user) {
            console.error("User not found with the email:", userInfo.email);
            return redirect("/user-not-found");
        }

        console.log("User found in database:", user);
        const userId = user.id;
        console.log("User ID for token update:", userId);

        await updateUserToken(userId, accessToken, refreshToken);

        // Redirect user to the home page after successful login and token update
        return createUserSession({
            request,
            userId,
            remember: false,
            redirectTo: "/",
        });
    } catch (error) {
        console.error("Error during Google OAuth callback:", error);
        return redirect("/error-page");
    }
};
