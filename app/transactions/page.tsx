import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";
import TransactionsPage from "@/components/pages/transactions/Transactions";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <p className="text-center mt-10 text-red-500">You must be logged in to view this page.</p>;
  }

  const transactions = (await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { category: true }, // Include category in the response
  })).map(transaction => ({
    ...transaction,
    amount: Number(transaction.amount),
    date: transaction.date.toISOString(),
    category: {
      ...transaction.category,
      budget: transaction.category.budget ? Number(transaction.category.budget) : null,
    },
  }));

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
  });

  return (
    <div>
        <TransactionsPage transactions={transactions} categories={categories} />
    </div>
  );
}
