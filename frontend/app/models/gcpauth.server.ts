import { prisma } from "~/db.server";
import crypto, { BinaryLike, CipherKey } from "crypto";
import fetch from 'node-fetch';
import invariant from 'tiny-invariant';

const algorithm = 'aes-256-ctr';
const ivLength = 16; // Initialization Vector length

const secretKeyBuffer = crypto.randomBytes(32);

const secretKey = process.env.ENCRYPTION_SECRET_KEY || 'default_secret_key';


// The Buffer's length property will give you the size in bytes
if (secretKeyBuffer.length !== 32) {
  throw new Error('Secret key must be 32 bytes long for aes-256-ctr.');
}

// Function to encrypt the token
export const encryptToken = (token: BinaryLike) => {
    const iv = crypto.randomBytes(ivLength);
    // Convert the hex string key back to a Buffer before using it
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Function to decrypt the token
export const decryptToken = (hash: string) => {
    const parts = hash.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    // Convert the hex string key back to a Buffer before using it
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
};

// Function to save the encrypted token in the database
export const saveEncryptedToken = async (userId: string, encryptedToken: string) => {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { encryptedToken },
        });
    } catch (error) {
        console.error("Error saving encrypted token: ", error);
        throw new Error("Unable to save encrypted token");
    }
};

// Function to retrieve and decrypt the token from the database
export const getDecryptedToken = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { encryptedToken: true },
        });

        if (!user || !user.encryptedToken) {
            throw new Error("User or encrypted token not found");
        }

        return decryptToken(user.encryptedToken);
    } catch (error) {
        console.error("Error retrieving or decrypting token: ", error);
        throw new Error("Unable to retrieve or decrypt token");
    }
};

export async function exchangeCodeForTokens(code: string) {
    invariant(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID is not set.');
    invariant(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET is not set.');
    invariant(process.env.GOOGLE_REDIRECT_URI, 'GOOGLE_REDIRECT_URI is not set.');

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({
            code: code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        }),
    });

    const responseBody = await response.text();

    if (!response.ok) {
        console.error("Failed to exchange code for tokens:", responseBody);
        throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    const data = JSON.parse(responseBody);
    return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function getUserInfo(accessToken: any) {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const responseBody = await response.text();

    if (!response.ok) {
        console.error("Failed to fetch user info:", responseBody);
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    try {
        const userInfo = JSON.parse(responseBody);
        return userInfo;
    } catch (error) {
        console.error("Error parsing user info JSON:", error);
        throw error;
    }
}
