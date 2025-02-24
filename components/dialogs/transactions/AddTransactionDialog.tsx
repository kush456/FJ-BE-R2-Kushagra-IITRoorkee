"use client"

import { useState } from 'react'
import axios from 'axios'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface AddTransactionDialogProps {
  onTransactionAdded: (transaction: any) => void;
  categories: any[];
}

export default function AddTransactionDialog({ onTransactionAdded, categories }: AddTransactionDialogProps) {
  const [newTransaction, setNewTransaction] = useState({ type: '', category: { id: '', name: '', userId: '', type: '' }, amount: '', description: '', date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const session = useSession().data;

  const handleAddTransaction = async () => {
    if (!newTransaction.type || !newTransaction.category.id || !newTransaction.amount || !newTransaction.date) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!session) {
        setError("Unauthorized");
        setLoading(false);
        return;
      }
      const newTransactionWithUser = {
        ...newTransaction,
        userId: session.user.id,
        category: { id: newTransaction.category.id },
      };
      //console.log("Sending new transaction: ", newTransactionWithUser);
      const response = await axios.post('/api/transactions', newTransactionWithUser);
      //console.log("Response from server: ", response);
      setLoading(false);

      if (response.status !== 201) {
        setError(response.data.error || "Something went wrong");
        return;
      }

      setIsDialogOpen(false);
      onTransactionAdded({
        ...response.data,
        category: newTransaction.category,
        amount: Number(response.data.amount),
      });

    } catch (error) {
      console.error("Error adding transaction: ", error);
      setLoading(false);
      setError((error as any).response?.data?.error || "Something went wrong");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Type</label>
            <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Category</label>
            <Select value={newTransaction.category.id} onValueChange={(value) => {
              const selectedCategory = categories.find(category => category.id === value);
              setNewTransaction({ ...newTransaction, category: selectedCategory });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Amount</label>
            <Input
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Description</label>
            <Input
              value={newTransaction.description || ""}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              placeholder="Enter description"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Date</label>
            <Input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button onClick={handleAddTransaction} disabled={loading}>
            {loading ? "Adding..." : "Add Transaction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
