"use client"

import { Card } from "@/components/ui/card"
import {  TrendingDown, TrendingUp, Equal, Users, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Pie, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { useRouter } from 'next/navigation'
import ReportDialog from "@/components/dialogs/reporting/ReportDialog"
import GroupOverview from './GroupOverview'
import { AddExpenseDialog } from "@/components/dialogs/transactions/AddExpenseDialog"
import { ExpenseDetailsDialog } from "@/components/dialogs/transactions/ExpenseDetailsDialog"

// Register the required chart elements
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

interface DashboardPageProps {
  totalIncome: number;
  totalExpense: number;
  recentTransactions: any[];
  transactions: any[];
}

export default function DashboardPage({ totalIncome, totalExpense, recentTransactions, transactions }: DashboardPageProps) {
    const [isClient, setIsClient] = useState(false)
    const [showExpenses, setShowExpenses] = useState(true)
    const [showSpendingOverview, setShowSpendingOverview] = useState(true)
    const [showBothCharts, setShowBothCharts] = useState(false)
    const [showMonthly, setShowMonthly] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
    const [showDaily, setShowDaily] = useState(true)
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false)
    const [expenseDetailsDialogOpen, setExpenseDetailsDialogOpen] = useState(false)
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
    const [sharedExpenses, setSharedExpenses] = useState<any[]>([])
    const [loadingExpenses, setLoadingExpenses] = useState(false)
    const router = useRouter()
        
    useEffect(() => {
        setIsClient(true)
        loadSharedExpenses()
    }, [])

    const loadSharedExpenses = async () => {
        setLoadingExpenses(true)
        try {
            const response = await fetch('/api/expenses')
            if (response.ok) {
                const expenses = await response.json()
                setSharedExpenses(expenses)
            }
        } catch (error) {
            console.error('Error loading shared expenses:', error)
        } finally {
            setLoadingExpenses(false)
        }
    }

    const handleExpenseAdded = () => {
        loadSharedExpenses()
        // Could also refresh other data if needed
    }

    const handleExpenseClick = (expenseId: string) => {
        setSelectedExpenseId(expenseId)
        setExpenseDetailsDialogOpen(true)
    }

    const getUserExpenseShare = (expense: any, userId: string) => {
        const participant = expense.participants?.find((p: any) => p.userId === userId)
        return participant ? participant.share : 0
    }

    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

    if (!isClient) {
        return null; 
    }

    const currentMonth = new Date(selectedMonth).getMonth();
    const currentYear = new Date(selectedMonth).getFullYear();

    const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    const displayedTransactions = showMonthly ? monthlyTransactions : transactions;

    const monthlyIncome = monthlyTransactions
        .filter(transaction => transaction.type === 'income')
        .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

    const monthlyExpense = monthlyTransactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((acc, transaction) => acc + Number(transaction.amount), 0);

    const totalBalance = showMonthly ? (monthlyIncome - monthlyExpense) : (totalIncome - totalExpense);

    const filteredTransactions = displayedTransactions.filter(transaction => 
        showExpenses ? transaction.type === 'expense' : transaction.type === 'income'
    );

    const categories = filteredTransactions
        .filter(transaction => transaction.category)
        .reduce((acc, transaction) => {
            acc[transaction.category.name] = (acc[transaction.category.name] || 0) + Number(transaction.amount);
            return acc;
        }, {});

    const pieData = {
        labels: Object.keys(categories),
        datasets: [
            {
                data: Object.values(categories),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
            },
        ],
    };

    const dailyExpenses = displayedTransactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((acc, transaction) => {
            const date = new Date(transaction.date).toLocaleDateString();
            acc[date] = (acc[date] || 0) + Number(transaction.amount);
            return acc;
        }, {});

    const dailyIncome = displayedTransactions
        .filter(transaction => transaction.type === 'income')
        .reduce((acc, transaction) => {
            const date = new Date(transaction.date).toLocaleDateString();
            acc[date] = (acc[date] || 0) + Number(transaction.amount);
            return acc;
        }, {});

    const monthlyExpenses = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const month = date.toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + Number(transaction.amount);
            return acc;
        }, {});

    const monthlyIncomeData = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const month = date.toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + Number(transaction.amount);
            return acc;
        }, {});

    const barData = {
        labels: Object.keys(showSpendingOverview ? (showDaily ? dailyExpenses : monthlyExpenses) : (showDaily ? dailyIncome : monthlyIncomeData)),
        datasets: [
            {
                label: showSpendingOverview ? (showDaily ? 'Daily Expenses' : 'Monthly Expenses') : (showDaily ? 'Daily Income' : 'Monthly Income'),
                data: Object.values(showSpendingOverview ? (showDaily ? dailyExpenses : monthlyExpenses) : (showDaily ? dailyIncome : monthlyIncomeData)),
                backgroundColor: showSpendingOverview ? '#FF6384' : '#36A2EB',
            },
        ],
    };

    console.log("transactions ", transactions);
    console.log("pie data: ", pieData);

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Group Overview */}
      <GroupOverview userId={userId} />
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground">Track your financial health at a glance</p>
        </div>
        <div className="flex gap-2">
        {showMonthly && (
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="border rounded p-2"
            />
          )}
          <Button size="sm" variant={"destructive"} onClick={() => setShowMonthly(!showMonthly)}>
            {showMonthly ? 'Show Total Transactions' : 'Show Monthly Transactions'}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setAddExpenseDialogOpen(true)} className="gap-2">
            <Users className="h-4 w-4" />
            Add Shared Expense
          </Button>
          <Button size="sm" onClick={() => setReportDialogOpen(true)}>
            Generate Report
          </Button>
          <Button size="sm" onClick={() => router.push('/budget')}>
            Set Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Equal className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <h2 className="text-2xl font-bold text-foreground">₹{totalBalance.toFixed(2)}</h2>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <h2 className="text-2xl font-bold text-foreground">₹{(showMonthly ? monthlyIncome : totalIncome).toFixed(2)}</h2>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <h2 className="text-2xl font-bold text-foreground">₹{(showMonthly ? monthlyExpense : totalExpense).toFixed(2)}</h2>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{showSpendingOverview ? 'Spending Overview' : 'Income Overview'}</h3>
            <div className="flex gap-2">
              {!showMonthly && (
                <Button variant="outline" size="sm" onClick={() => setShowDaily(!showDaily)}>
                  {showDaily ? 'Show Monthly' : 'Show Daily'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowSpendingOverview(!showSpendingOverview)}>
                {showSpendingOverview ? 'Show Income Overview' : 'Show Spending Overview'}
              </Button>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
            <Bar data={barData} />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Category Breakdown</h3>
            <Button variant="outline" size="sm" onClick={() => setShowExpenses(!showExpenses)}>
              {showExpenses ? 'Show Income' : 'Show Expenses'}
            </Button>
          </div>
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
            <Pie data={pieData} />
          </div>
        </Card>
        {showBothCharts && (
          <Card className="p-6 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Combined Overview</h3>
              <Button variant="outline" size="sm" onClick={() => setShowBothCharts(!showBothCharts)}>
                {showBothCharts ? 'Hide Combined Overview' : 'Show Combined Overview'}
              </Button>
            </div>
            <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
              <Bar data={{
                labels: Object.keys(dailyExpenses),
                datasets: [
                  {
                    label: 'Daily Expenses',
                    data: Object.values(dailyExpenses),
                    backgroundColor: '#FF6384',
                  },
                  {
                    label: 'Daily Income',
                    data: Object.values(dailyIncome),
                    backgroundColor: '#36A2EB',
                  },
                ],
              }} />
            </div>
          </Card>
        )}
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Button variant="default" size="sm" onClick={() => router.push('/transactions')}>View All Transactions</Button>
        </div>
        <div className="space-y-4">
          {/* Regular Transactions */}
          {recentTransactions.map((transaction, index) => (
            <div key={`transaction-${index}`} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${transaction.type === "income" ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.type === "income" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className={`font-semibold ${transaction.type === "income" ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.type === "income" ? `+₹${Number(transaction.amount).toFixed(2)}` : `-₹${Math.abs(Number(transaction.amount)).toFixed(2)}`}
              </p>
            </div>
          ))}
          
          {/* Shared Expenses */}
          {loadingExpenses ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
              Loading shared expenses...
            </div>
          ) : (
            sharedExpenses.slice(0, 5).map((expense) => {
              const userShare = getUserExpenseShare(expense, userId)
              return (
                <div 
                  key={`expense-${expense.id}`} 
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpenseClick(expense.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Receipt className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        {expense.group ? (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {expense.group.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Shared with {expense.participants?.length - 1} friend{expense.participants?.length > 2 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      -₹{userShare.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your share
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Report Dialog */}
      {reportDialogOpen && <ReportDialog onClose={() => setReportDialogOpen(false)} transactions={transactions} />}

      {/* Add Expense Dialog */}
      <AddExpenseDialog 
        isOpen={addExpenseDialogOpen}
        onClose={() => setAddExpenseDialogOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />

      {/* Expense Details Dialog */}
      <ExpenseDetailsDialog 
        isOpen={expenseDetailsDialogOpen}
        onClose={() => setExpenseDetailsDialogOpen(false)}
        expenseId={selectedExpenseId}
      />
    </div>
  )
}