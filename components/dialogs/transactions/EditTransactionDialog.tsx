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
import { Edit, Trash } from 'lucide-react'
import { Category } from '@prisma/client'
import { useSession } from 'next-auth/react'

interface EditTransactionDialogProps {
  transaction: any;
  categories: Category[];
  onTransactionUpdated: (transaction: any) => void;
  onTransactionDeleted: (id: string) => void;
}

export default function EditTransactionDialog({ transaction, categories, onTransactionUpdated, onTransactionDeleted }: EditTransactionDialogProps) {
    //console.log(transaction);
  const [updatedTransaction, setUpdatedTransaction] = useState(transaction);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const session = useSession().data;

  const handleUpdateTransaction = async () => {
    if (!updatedTransaction.type || !updatedTransaction.category || !updatedTransaction.amount || !updatedTransaction.date) {
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
      
      const updatedTransactionWithUser = {
        ...updatedTransaction,
        userId: session.user.id,
        category: { id: updatedTransaction.category.id },
      };
      //console.log("Sending updated transaction: ", updatedTransactionWithUser);
      const response = await axios.put(`/api/transactions/${transaction.id}`, updatedTransactionWithUser);
      //console.log("Response from server: ", response);
      setLoading(false);

      if (response.status !== 200) {
        setError(response.data.error || "Something went wrong");
        return;
      }

      // Close the modal and reset the form
      setIsDialogOpen(false);

      // Notify parent component about the updated transaction
      onTransactionUpdated({
        ...response.data,
        category: updatedTransaction.category,
        amount: Number(response.data.amount),
      });

    } catch (error) {
      console.error("Error updating transaction: ", error);
      setLoading(false);
      setError((error as any).response?.data?.error || "Something went wrong");
    }
  };

  const handleDeleteTransaction = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.delete(`/api/transactions/${transaction.id}`);
      setLoading(false);

      if (response.status !== 200) {
        setError(response.data.error || "Something went wrong");
        return;
      }

      // Close the modal
      setIsDialogOpen(false);

      // Notify parent component about the deleted transaction
      onTransactionDeleted(transaction.id);

    } catch (error) {
      setLoading(false);
      setError((error as any).response?.data?.error || "Something went wrong");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Type</label>
            <Select value={updatedTransaction.type} onValueChange={(value) => setUpdatedTransaction({ ...updatedTransaction, type: value })}>
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
            <Select
              value={updatedTransaction.category.id}
              onValueChange={(value) => {
                const selectedCategory = categories.find((cat) => cat.id === value);
                setUpdatedTransaction({ ...updatedTransaction, category: selectedCategory });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Amount</label>
            <Input
              type="number"
              value={updatedTransaction.amount}
              onChange={(e) => setUpdatedTransaction({ ...updatedTransaction, amount: parseFloat(e.target.value) })}
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Description</label>
            <Input
              value={updatedTransaction.description || ""}
              onChange={(e) => setUpdatedTransaction({ ...updatedTransaction, description: e.target.value })}
              placeholder="Enter description"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Date</label>
            <Input
              type="date"
              value={updatedTransaction.date}
              onChange={(e) => setUpdatedTransaction({ ...updatedTransaction, date: e.target.value })}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex justify-between">
            <Button onClick={handleUpdateTransaction} disabled={loading}>
              {loading ? "Updating..." : "Update Transaction"}
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction} disabled={loading}>
              {loading ? "Deleting..." : "Delete Transaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
