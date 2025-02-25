import { authOptions } from "@/lib/configs/auth/authOptions";
import { getServerSession } from "next-auth";
import BudgetPage from "@/components/pages/budget/BudgetPage";
import { getCategories } from "@/lib/utils/categories";
import Navbar from "@/components/layout/Navbar";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <p className="text-center mt-10 text-red-500">You must be logged in to view this page.</p>;
  }
  const categoriesResponse = await getCategories(session);
  const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];
  console.log("categories are: ", categories);
  return (
    <div>
      <Navbar />
      <BudgetPage categories={categories} />
    </div>
  );
}
