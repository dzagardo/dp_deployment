import { Link } from "@remix-run/react";
import Dashboard from './Dashboard'; // Adjust the path if necessary


export default function ChecklistIndexPage() {
  return (
    <p>
      No checklist selected. Select a checklist on the left, or{" "}
      <Link to="new" className="text-blue-500 underline">
        create a new checklist.
      </Link>

    </p>
  );
}
