import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";
import DashboardPage from "@/components/pages/dashboard/Dashboard";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <p className="text-center mt-10 text-red-500">You must be logged in to view this page.</p>;
  }

  return (
    <div>
        <DashboardPage />
    </div>
  );
}
