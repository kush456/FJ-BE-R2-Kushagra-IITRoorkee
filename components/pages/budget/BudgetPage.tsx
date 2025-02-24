"use client"

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BudgetCategory {
  name: string;
  goal: number;
  spent: number;
}

const initialCategories: BudgetCategory[] = [
  { name: "Food", goal: 5000, spent: 3000 },
  { name: "Transport", goal: 2000, spent: 1500 },
  { name: "Entertainment", goal: 3000, spent: 1000 },
];

export default function BudgetPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [newGoal, setNewGoal] = useState(0);

  const addCategory = () => {
    setCategories([...categories, { name: newCategory, goal: newGoal, spent: 0 }]);
    setNewCategory("");
    setNewGoal(0);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Budget Goals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {categories.map((category, index) => (
          <Card key={index} className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">{category.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">Goal: ₹{category.goal}</p>
            <p className="text-sm text-muted-foreground mb-2">Spent: ₹{category.spent}</p>
            <p className="text-sm text-muted-foreground mb-2">Remaining: ₹{category.goal - category.spent}</p>
          </Card>
        ))}
      </div>
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Category Name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="border rounded p-2"
        />
        <input
          type="number"
          placeholder="Goal Amount"
          value={newGoal}
          onChange={(e) => setNewGoal(Number(e.target.value))}
          className="border rounded p-2"
        />
        <Button onClick={addCategory}>Add Category</Button>
      </div>
    </div>
  );
}
