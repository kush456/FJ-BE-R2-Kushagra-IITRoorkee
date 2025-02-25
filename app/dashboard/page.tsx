import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";
import DashboardPage from "@/components/pages/dashboard/Dashboard";
import { getRecentTransactions, getTotalExpense, getTotalIncome, getTransactions } from "@/lib/utils/dashboard";
import Navbar from "@/components/layout/Navbar";

export default async function Dashboard() {
  //const nextAuthUrl = process.env.NEXTAUTH_URL;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return <p className="text-center mt-10 text-red-500">You must be logged in to view this page.</p>;
  }
  


  const totalIncomeResponse = await getTotalIncome(session);
  const totalExpenseResponse = await getTotalExpense(session);
  const totalIncome = totalIncomeResponse.ok ? await totalIncomeResponse.json() : 0;
  const totalExpense = totalExpenseResponse.ok ? await totalExpenseResponse.json() : 0;

  const recentTransactionsResponse = await getRecentTransactions(session);
  const recentTransactions = recentTransactionsResponse.ok? await recentTransactionsResponse.json() : [];
  const transactionsResponse = await getTransactions(session);
  const transactions = transactionsResponse.ok? await transactionsResponse.json() : [];

  return (
    <div>
      <Navbar />
      <DashboardPage totalIncome={totalIncome} totalExpense={totalExpense} recentTransactions={recentTransactions} transactions={transactions}/>
    </div>
  );
}
