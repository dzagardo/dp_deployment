import React, { useEffect, useState } from 'react';
import { Form, useSubmit } from '@remix-run/react';
import { useUser } from '~/utils';
import crypto from 'crypto';

// Function to decrypt the token (copied from gcpauth.server)
const decryptToken = (hash: string) => {
  const parts = hash.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const secretKey = process.env.ENCRYPTION_SECRET_KEY || 'default_secret_key';
  const algorithm = 'aes-256-ctr';
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
};

type ComputeResource = {
  id: string;
  name: string;
  machineType: string;
};

type MachineType = {
  id: string;
  name: string;
  description?: string;
  estimatedUsagePerHour?: string;
};

type AcceleratorType = {
  id: string;
  name: string;
  description?: string;
  estimatedUsagePerHour?: string;
};

type LoaderData = {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    encryptedToken: string | null;
  };
  computeResources?: ComputeResource[];
  machineTypes?: MachineType[];
  acceleratorTypes?: AcceleratorType[];
  errorMessage?: string;
};

function NCMLView() {
  const currentUser = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const submit = useSubmit();

  useEffect(() => {
    // Define the function inside the useEffect
    const handleGetResources = async () => {
      if (!currentUser || !currentUser.encryptedToken) {
        console.error("No user or encrypted token found");
        return;
      }

      try {
        // Send a POST request to your decrypt API route
        const decryptResponse = await fetch('/api/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ hash: currentUser.encryptedToken }),
        });

        const decryptData = await decryptResponse.json();

        if (!decryptResponse.ok) {
          throw new Error(decryptData.error || 'Decryption failed');
        }

        const accessToken = decryptData.decryptedToken;

        // Fetch machine types with the accessToken
        const machineTypesResponse = await fetch(`/api/machine-types`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const machineTypesData = await machineTypesResponse.json();

        if (!machineTypesResponse.ok) {
          throw new Error(machineTypesData.error || 'Failed to fetch machine types');
        }

        setMachineTypes(machineTypesData.machineTypes);

      } catch (error) {
        console.error("Error in handleGetResources:", error);
      }
    };

    // Call the function
    handleGetResources();
  }, [currentUser]);

  const handleRunCode = (event: React.FormEvent) => {
    event.preventDefault();
    // Implement your logic to run the code here
    // For example, you might want to send a request to a server to run a job
    console.log("Running code with the selected options...");
  };


  return (
    <div>
      <h1>LLM Fine-Tuning Dashboard</h1>
      <Form method="post" onSubmit={handleRunCode}>
        {/* Autocomplete search for Hugging Face datasets */}
        {/* Autocomplete search for Hugging Face models */}
        {/* Dataset selection */}
        <div>
          <label htmlFor="dataset">Dataset:</label>
          <input
            type="text"
            id="dataset"
            name="dataset"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {/* Display search results as options */}
        </div>

        {/* Model selection */}
        {/* Similar to dataset selection */}

        {/* Optimizer selection */}
        <div>
          <label htmlFor="optimizer">Optimizer:</label>
          <select id="optimizer" name="optimizer">
            <option value="adam">Adam</option>
            <option value="sgd">SGD</option>
            {/* Add more optimizers */}
          </select>
        </div>

        {/* Number of epochs */}
        <div>
          <label htmlFor="epochs">Epochs:</label>
          <input type="number" id="epochs" name="epochs" min="1" />
        </div>

        {/* Machine Types Selection */}
        {machineTypes && (
          <div className="mt-4">
            <label htmlFor="machineType" className="block text-sm font-medium text-gray-700">Select Machine Type:</label>
            <select id="machineType" name="machineType" required className="mt-1 block w-full border-2 p-2 rounded">
              <option value="">Select a machine type</option>
              {machineTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name} - Description: {type.description}, Estimated Usage: {type.estimatedUsagePerHour}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Run Code
        </button>
      </Form>
    </div>
  );
}

export default NCMLView;