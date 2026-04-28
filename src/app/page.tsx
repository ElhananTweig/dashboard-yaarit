import Dashboard from "@/components/dashboard/Dashboard";
import { loadSnapshot } from "@/lib/sheets/repository";

// Always render fresh on the server: every page load runs the daily יומי
// cleanup and reads the latest sheet state.
export const dynamic = "force-dynamic";

export default async function Page() {
  const initial = await loadSnapshot();
  return <Dashboard initial={initial} />;
}
