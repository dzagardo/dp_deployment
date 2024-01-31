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
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

export async function fetchComputeResources(accessToken: string, projectId: string, zone: string) {
    const url = `https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/instances`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorDetails = await response.json(); // Assuming the error details are in JSON format
        console.error("Failed to fetch compute resources:", errorDetails);
        throw new Error(`Failed to fetch compute resources: ${response.status} ${response.statusText} - ${errorDetails.message}`);
    }

    const data = await response.json();
    // Check for the 'items' field in the response
    if (!data.items) {
        console.log('No compute instances found.');
        return []; // Return an empty array if no instances are found
    }

    // Filter instances to find those with GPUs
    const gpuResources = data.items.filter((instance: { guestAccelerators: string | any[]; }) => 
        instance.guestAccelerators && instance.guestAccelerators.length > 0
    ).map((instance: { id: any; name: any; machineType: any; guestAccelerators: any[]; }) => {
        // Map to a simplified object structure, if needed
        return {
            id: instance.id,
            name: instance.name,
            machineType: instance.machineType,
            gpus: instance.guestAccelerators.map((gpu: { acceleratorType: any; acceleratorCount: any; }) => ({
                type: gpu.acceleratorType,
                count: gpu.acceleratorCount
            }))
        };
    });

    console.log(gpuResources);
    return gpuResources; // Return the filtered and mapped resources
}

export async function fetchMachineTypes(accessToken: string, projectId: string, zone: string) {
    const url = `https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/machineTypes`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errorDetails = await response.json();
        console.error("Failed to fetch machine types:", errorDetails);
        throw new Error(`Failed to fetch machine types: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const machineTypes = data.items || [];

    // Example of adding additional properties for each machine type
    // Note: Replace this with actual logic to calculate usage or retrieve pricing
    const enhancedMachineTypes = machineTypes.map((type: { guestCpus: string; memoryMb: string; }) => {
        // Simplified logic to estimate cost based on the type's specifications
        // Assuming $0.02 per hour per CPU and $0.004 per GB of memory as an example
        const cpus = parseInt(type.guestCpus);
        const memoryMb = parseInt(type.memoryMb);
        const memoryGb = memoryMb / 1024;
        const estimatedCostPerHour = (cpus * 0.02) + (memoryGb * 0.004);
        
        return {
            ...type,
            estimatedUsagePerHour: `$${estimatedCostPerHour.toFixed(2)} per hour` // Example format
        };
    });
    

    return enhancedMachineTypes;
}

// Helper function to fetch all Compute Engine SKUs from the Cloud Billing API
async function fetchComputeEngineSkus(accessToken: string): Promise<any[]> {
    const serviceId = '6F81-5844-456A'; // Ensure this is the correct service ID for Compute Engine
    const apiKey = process.env.GOOGLE_CLOUD_BILLING_API_KEY; // Ensure your API key is securely stored and accessed
    const url = `https://cloudbilling.googleapis.com/v1/services/${serviceId}/skus?key=${apiKey}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorDetails = await response.json();
        console.error("Failed to fetch SKUs:", errorDetails);
        throw new Error(`Failed to fetch SKUs: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.skus;
}

// Function to enhance GPU types with dynamically fetched pricing information
async function enhanceGpuTypesWithPricing(accessToken: string, acceleratorTypes: any[], projectId: string, zone: string): Promise<any[]> {
    const computeSkus = await fetchComputeEngineSkus(accessToken);

    // Filter for GPU-related SKUs
    const gpuSkus = computeSkus.filter(sku => sku.category.resourceFamily === 'GPU');

    return Promise.all(acceleratorTypes.map(async gpuType => {
        const matchingSku = gpuSkus.find(sku => sku.description.includes(gpuType.name));

        // If a matching SKU is found, format and include pricing information
        const pricePerHour = matchingSku ? formatPricingInfo(matchingSku.pricingInfo) : 'Pricing unavailable';

        return {
            ...gpuType,
            estimatedUsagePerHour: pricePerHour,
        };
    }));
}

// Utility function to format pricing information
function formatPricingInfo(pricingInfo: any): string {
    const pricingExpression = pricingInfo[0].pricingExpression;
    const tieredRate = pricingExpression.tieredRates[0].unitPrice;
    return `$${tieredRate.amount} ${tieredRate.currencyCode} per hour`;
}

// Main function to fetch accelerator types and enhance them with pricing information
export async function fetchAcceleratorTypes(accessToken: string, projectId: string, zone: string): Promise<any[]> {
    const url = `https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/acceleratorTypes`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorDetails = await response.json();
        console.error("Failed to fetch accelerator types:", errorDetails);
        throw new Error(`Failed to fetch accelerator types: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const acceleratorTypes = data.items || [];

    // Enhance accelerator types with dynamic pricing information
    return enhanceGpuTypesWithPricing(accessToken, acceleratorTypes, projectId, zone);
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
    // Ensure environment variables are strings. Use fallbacks or throw an error if they are not set.
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    // Optionally, you could throw an error if either value is missing
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set in the environment variables.");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId, // Use the asserted or fallback value
            client_secret: clientSecret, // Use the asserted or fallback value
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text(); // or response.json() if the error is in JSON format
        console.error(`Failed to refresh access token: ${response.statusText}`, errorBody);
        throw new Error(`Failed to refresh access token: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function updateUserToken(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = encryptToken(refreshToken);

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { 
                encryptedToken: encryptedAccessToken,
                encryptedRefreshToken: encryptedRefreshToken,
            },
        });
        console.log("Tokens updated successfully.");
    } catch (error) {
        console.error("Failed to update tokens:", error);
        throw new Error("Failed to update tokens");
    }
}

export async function saveUserTokens(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = encryptToken(refreshToken);

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { encryptedToken: encryptedAccessToken, encryptedRefreshToken: encryptedRefreshToken },
        });
        console.log("Tokens updated successfully.");
    } catch (error) {
        console.error("Failed to update tokens:", error);
        throw new Error("Failed to update tokens");
    }
}
