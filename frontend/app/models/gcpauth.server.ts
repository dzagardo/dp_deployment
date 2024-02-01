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

    return gpuResources;
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

// Assuming fetchComputeEngineSkus and formatPricingInfo functions are defined elsewhere

export async function fetchMachineTypesWithPricing(accessToken: string, projectId: string, zone: string) {
    const machineTypes = await fetchMachineTypes(accessToken, projectId, zone);
    const computeSkus = await fetchComputeEngineSkus(accessToken); // Fetch all SKUs, not just GPUs

    const enhancedMachineTypes = machineTypes.map((type: { guestCpus: any; memoryMb: any; }) => {
        // Attempt to match machine type to a SKU for pricing
        const matchingSku = computeSkus.find((sku: { description: string | string[]; }) => {
            // Implement a more detailed matching logic here
            // For example, match based on CPU and memory specifications
            return sku.description.includes(type.guestCpus) && sku.description.includes(`${type.memoryMb} MB`);
        });

        const pricePerHour = matchingSku ? formatPricingInfo(matchingSku.pricingInfo) : 'Pricing unavailable';

        return {
            ...type,
            estimatedUsagePerHour: pricePerHour,
        };
    });

    return enhancedMachineTypes;
}

export async function fetchAllMachineTypesWithDetails(accessToken: string, projectId: string, zone: string) {
    const allMachineTypes = await fetchMachineTypes(accessToken, projectId, zone);

    // Filter for g2-standard machines and prepare them for the DataGrid
    const g2StandardMachinesData = allMachineTypes
        .map((machine: { id: any; name: any; description: any; guestCpus: any; memoryMb: any; maximumPersistentDisks: any; maximumPersistentDisksSizeGb: any; estimatedUsagePerHour: any; }) => ({
            id: machine.id, // DataGrid expects a unique id for each row
            name: machine.name,
            description: machine.description,
            guestCpus: machine.guestCpus,
            memoryMb: machine.memoryMb,
            maximumPersistentDisks: machine.maximumPersistentDisks,
            maximumPersistentDisksSizeGb: machine.maximumPersistentDisksSizeGb,
            estimatedUsagePerHour: machine.estimatedUsagePerHour
        }));

    return g2StandardMachinesData;
}

export async function fetchAndProcessG2StandardMachines(accessToken: string, projectId: string, zone: string) {
    const allMachineTypes = await fetchMachineTypes(accessToken, projectId, zone);

    // Filter for g2-standard machines and prepare them for the DataGrid
    const g2StandardMachinesData = allMachineTypes
        .filter((machine: { name: string; }) => machine.name.startsWith('g2-standard'))
        .map((machine: { id: any; name: any; description: any; guestCpus: any; memoryMb: any; maximumPersistentDisks: any; maximumPersistentDisksSizeGb: any; estimatedUsagePerHour: any; }) => ({
            id: machine.id, // DataGrid expects a unique id for each row
            name: machine.name,
            description: machine.description,
            guestCpus: machine.guestCpus,
            memoryMb: machine.memoryMb,
            maximumPersistentDisks: machine.maximumPersistentDisks,
            maximumPersistentDisksSizeGb: machine.maximumPersistentDisksSizeGb,
            estimatedUsagePerHour: machine.estimatedUsagePerHour
        }));

    return g2StandardMachinesData;
}

// Helper function to fetch all Compute Engine SKUs from the Cloud Billing API
async function fetchComputeEngineSkus(accessToken: string): Promise<any[]> {
    const serviceId = '6F81-5844-456A';
    const apiKey = process.env.GOOGLE_CLOUD_BILLING_API_KEY;
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

async function enhanceGpuTypesWithPricing(accessToken: string, acceleratorTypes: any[], projectId: string, zone: string): Promise<any[]> {
    const computeSkus = await fetchComputeEngineSkus(accessToken);

    const gpuSkus = computeSkus.filter(sku =>
        sku.description.toLowerCase().includes('gpu') ||
        sku.category.resourceGroup.toLowerCase().includes('gpu'));

    return Promise.all(acceleratorTypes.map(async gpuType => {
        const regex = new RegExp(gpuType.name.replace(/-/g, '.*'), 'i');
        const matchingSku = gpuSkus.find(sku => regex.test(sku.description));

        // Handling non-matching SKUs more informatively
        if (!matchingSku) {
            return {
                ...gpuType,
                estimatedUsagePerHour: 'Check availability or contact support for pricing',
            };
        }

        // Improving handling when pricing information is available
        const pricePerHour = matchingSku ? formatPricingInfo(matchingSku.pricingInfo) : 'Pricing details unavailable. Confirm SKU availability.';

        return {
            ...gpuType,
            estimatedUsagePerHour: pricePerHour,
        };
    }));
}

// Utility function to format pricing information
function formatPricingInfo(pricingInfo: any): string {
    if (!pricingInfo || pricingInfo.length === 0) return 'Pricing information unavailable';

    const pricingExpression = pricingInfo[0].pricingExpression;
    if (!pricingExpression || pricingExpression.tieredRates.length === 0) return 'Pricing tiers unavailable';

    const tieredRate = pricingExpression.tieredRates[0].unitPrice;

    // Explicitly converting to numbers to ensure arithmetic addition
    const units = Number(tieredRate.units);
    const nanos = Number(tieredRate.nanos) / 1e9;

    // Check if both units and nanos are valid numbers
    if (isNaN(units) || isNaN(nanos)) return 'Invalid pricing data';

    const pricePerHour = units + nanos;
    const formattedPrice = `$${pricePerHour.toFixed(2)} ${tieredRate.currencyCode} per hour`;

    return formattedPrice;
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

export async function getDecryptedHuggingFaceToken(userId: string): Promise<string> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { encryptedHFAccessToken: true },
        });

        if (!user || !user.encryptedHFAccessToken) {
            throw new Error("User or encrypted Hugging Face token not found");
        }

        return decryptToken(user.encryptedHFAccessToken);
    } catch (error) {
        console.error("Error retrieving or decrypting Hugging Face token: ", error);
        throw new Error("Unable to retrieve or decrypt Hugging Face token");
    }
}
