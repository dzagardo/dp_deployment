import { LoaderFunction, redirect } from "@remix-run/node";
import { exchangeCodeForTokens, getUserInfo } from "~/models/gcpauth.server";
import { getUserByEmail, updateOauthToken } from "~/models/user.server";
import { createUserSession } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");


    if (!code) {
        console.error("No authorization code found in the request");
        return redirect("/error-page");
    }

    try {
        const { accessToken, refreshToken } = await exchangeCodeForTokens(code);

        const userInfo = await getUserInfo(accessToken);

        const user = await getUserByEmail(userInfo.email);
        if (!user) {
            console.error("User not found with the email:", userInfo.email);
            return redirect("/user-not-found");
        }

        const userId = user.id;

        await updateOauthToken(userId, accessToken, refreshToken);

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
