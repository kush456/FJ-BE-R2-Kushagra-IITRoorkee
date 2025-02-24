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

interface AddCategoryDialogProps {
  onCategoryAdded: (category: any) => void;
}

export default function AddCategoryDialog({ onCategoryAdded }: AddCategoryDialogProps) {
  const [newCategory, setNewCategory] = useState({ name: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.type) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post('/api/categories', newCategory);
      setLoading(false);

      if (response.status !== 201) {
        setError(response.data.error || "Something went wrong");
        return;
      }

      onCategoryAdded(response.data);
      setNewCategory({ name: '', type: '' });
      setIsDialogOpen(false);

    } catch (error) {
      setLoading(false);
      setError((error as any).response?.data?.error || "Something went wrong");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Name</label>
            <Input
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Type</label>
            <Select value={newCategory.type} onValueChange={(value) => setNewCategory({ ...newCategory, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button onClick={handleAddCategory} disabled={loading}>
            {loading ? "Adding..." : "Add Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
