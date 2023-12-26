
// frontend/app/routes/dashboard.datasets.lookup.tsx

import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getDatasets } from "~/models/dataset.server"; // Adjust the import path to your actual function

export const loader: LoaderFunction = async () => {
  try {
    const datasets = await getDatasets(); // Fetch all datasets
    return json({ datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw new Response('Error fetching datasets', { status: 500 });
  }
};

// Continue in the same file

const DatasetLookupPage = () => {
  const { datasets } = useLoaderData<{ datasets: Array<{ id: string; name: string }> }>();

  if (!datasets) {
    return <div>No datasets available</div>;
  }

  return (
    <div>
      <h1>Select a Dataset</h1>
      <div style={{ overflowY: 'auto', maxHeight: '400px', border: '1px solid #ccc' }}>
        {datasets.map((dataset) => (
          <div key={dataset.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            <Link to={`/dashboard/datasets/${dataset.id}`} style={{ textDecoration: 'none' }}>
              {dataset.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatasetLookupPage;
