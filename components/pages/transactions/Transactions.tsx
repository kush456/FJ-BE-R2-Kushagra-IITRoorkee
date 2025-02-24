"use client"

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import AddTransactionDialog from "@/components/dialogs/transactions/AddTransactionDialog"
import EditTransactionDialog from "@/components/dialogs/transactions/EditTransactionDialog"
import ViewTransactionDialog from "@/components/dialogs/transactions/ViewTransactionDialog"
import AddCategoryDialog from "@/components/dialogs/categories/AddCategoryDialog"
import axios from 'axios';

interface Transaction {
  id: string;
  type: string;
  category: Category;
  amount: number;
  description: string | null;
  date: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  userId: string;
}

interface TransactionsPageProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function TransactionsPage({ transactions: initialTransactions, categories: initialCategories }: TransactionsPageProps) {
    const [isClient, setIsClient] = useState(false)
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [categories, setCategories] = useState<Category[]>(initialCategories);

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return null; 
    }

    const handleTransactionAdded = (transaction: Transaction) => {
      const updatedTransactions = [transaction, ...transactions];
      updatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(updatedTransactions);
      //console.log("transaction added :", transaction);
    };

    const handleTransactionUpdated = (updatedTransaction: Transaction) => {
      const updatedTransactions = transactions.map(transaction =>
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      );
      updatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(updatedTransactions);
    };

    const handleTransactionDeleted = (id: string) => {
      const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
      setTransactions(updatedTransactions);
    };

    const handleCategoryAdded = (category: Category) => {
      setCategories([...categories, category]);
    };

    //console.log("transactions displayed :", transactions);

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <div className="flex gap-4">
          <AddTransactionDialog onTransactionAdded={handleTransactionAdded} categories={categories} />
          <AddCategoryDialog onCategoryAdded={handleCategoryAdded} />
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9"
            />
          </div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="p-6">
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <ViewTransactionDialog key={transaction.id} transaction={transaction}>
              <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.description || (transaction.type === 'income' ? 'Income' : 'Expense')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? `+₹${Number(transaction.amount).toFixed(2)}` : `-₹${Number(transaction.amount).toFixed(2)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.category?.id
                        ? categories.find(category => category.id === transaction.category.id)?.name || 'Unknown Category'
                        : 'No Category'}
                    </p>
                  </div>
                  <EditTransactionDialog
                    transaction={transaction}
                    categories={categories}
                    onTransactionUpdated={handleTransactionUpdated}
                    onTransactionDeleted={handleTransactionDeleted}
                  />
                </div>
              </div>
            </ViewTransactionDialog>
          ))}
        </div>
      </Card>
    </div>
  )
}