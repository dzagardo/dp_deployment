import { Link } from "@remix-run/react";
import Dashboard from "./dashboard";
import DatasetView from './dashboard.dp.datasets';
import NewDatasetPage from "./dashboard.dp.datasets.new";
import DatasetDetailsPage from "./notes.$noteId";
import DatasetLookupPage from "./dashboard.dp.datasets.management";

export default function DatasetIndexPage() {
  return (
    <DatasetLookupPage />
  );
}