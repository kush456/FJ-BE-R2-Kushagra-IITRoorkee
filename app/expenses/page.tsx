"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Receipt, Search, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { AddExpenseDialog } from "@/components/dialogs/transactions/AddExpenseDialog";
import { ExpenseDetailsDialog } from "@/components/dialogs/transactions/ExpenseDetailsDialog";
import { toast } from "sonner";

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  splitType: string;
  groupId?: string;
  payer: {
    id: string;
    name: string;
    email: string;
  };
  group?: {
    id: string;
    name: string;
  };
  participants: Array<{
    id: string;
    userId: string;
    paid: number;
    share: number;
    netBalance: number;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "group", "oneoff"
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [expenseDetailsDialogOpen, setExpenseDetailsDialogOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, filterType]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else {
        toast.error("Failed to load expenses");
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error("Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.payer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.group?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType === "group") {
      filtered = filtered.filter(expense => expense.groupId);
    } else if (filterType === "oneoff") {
      filtered = filtered.filter(expense => !expense.groupId);
    }

    setFilteredExpenses(filtered);
  };

  const handleExpenseAdded = () => {
    loadExpenses();
  };

  const handleExpenseClick = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setExpenseDetailsDialogOpen(true);
  };

  const getUserExpenseShare = (expense: Expense) => {
    const participant = expense.participants?.find(p => p.userId === session?.user?.id);
    return participant ? participant.share : 0;
  };

  const getUserNetBalance = (expense: Expense) => {
    const participant = expense.participants?.find(p => p.userId === session?.user?.id);
    return participant ? participant.netBalance : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <p>Please sign in to view your expenses.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shared Expenses</h1>
          <p className="text-muted-foreground">Manage and track your shared expenses</p>
        </div>
        <Button onClick={() => setAddExpenseDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Shared Expense
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search expenses, people, or groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "group" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("group")}
            >
              Group Expenses
            </Button>
            <Button
              variant={filterType === "oneoff" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("oneoff")}
            >
              One-off Expenses
            </Button>
          </div>
        </div>
      </Card>

      {/* Expenses List */}
      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p>Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-500 mb-4">
              {expenses.length === 0 
                ? "You haven't created any shared expenses yet."
                : "No expenses match your current filters."
              }
            </p>
            <Button onClick={() => setAddExpenseDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => {
              const userNetBalance = getUserNetBalance(expense);
              const userShare = getUserExpenseShare(expense);
              
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpenseClick(expense.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{expense.description}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(expense.date)}</span>
                        <span>•</span>
                        <span>Paid by {expense.payer.name}</span>
                        {expense.group ? (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {expense.group.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {expense.participants.length} people
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Your share: </span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(userShare)}
                      </span>
                    </div>
                    {userNetBalance !== 0 && (
                      <div className="text-xs">
                        <span className={`${
                          userNetBalance > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {userNetBalance > 0 ? 'You are owed ' : 'You owe '}
                          {formatCurrency(Math.abs(userNetBalance))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
        onExpenseUpdated={handleExpenseAdded}
        onExpenseDeleted={handleExpenseAdded}
      />
    </div>
  );
}