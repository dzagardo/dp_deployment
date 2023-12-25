import { Link } from "@remix-run/react";
import Dashboard from "./dashboard";
import DatasetView from './dashboard.datasets';
import NewDatasetPage from "./dashboard.datasets.new";
import DatasetDetailsPage from "./notes.$noteId";

export default function DatasetIndexPage() {
  return (
    <NewDatasetPage />
  );
}