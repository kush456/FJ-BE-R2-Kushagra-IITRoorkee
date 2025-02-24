"use client"

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  budget: number;
}

interface BudgetPageProps {
  categories: BudgetCategory[];
}

export default function BudgetPage({ categories: initialCategories }: BudgetPageProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories);

  const handleBudgetChange = async (id: string, budget: number) => {
    try {
      const res = await axios.put(`/api/budget/${id}`, { budget });

      const updatedCategory = res.data;
      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category.id === id ? { ...category, budget: updatedCategory.budget } : category
        )
      );

      toast.success("Budget updated successfully!");
    } catch (error) {
      console.error("Error updating budget: ", error);
      toast.error("Failed to update budget.");
    }
  };

  const handleInputChange = (id: string, value: number) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === id ? { ...category, budget: value } : category
      )
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground ">Budget Goals</h1>
        <p className="text-muted-foreground">Take control of your spending and set smart budget goals to stay on top of your finances!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {categories.map((category, index) => {
          const data = {
            labels: ['Spent', 'Budget'],
            datasets: [
              {
                label: category.name,
                data: [category.spent, category.budget],
                backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)'],
              },
            ],
          };

          return (
            <Card key={index} className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">{category.name}</h2>
              <p className="text-sm text-muted-foreground mb-2">Spent: ₹{category.spent}</p>
              <p className="text-sm text-muted-foreground mb-2">
                Remaining: {category.budget ? `₹${category.budget - category.spent}` : "As much as you want xD"}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Budget: {category.budget ? `₹${category.budget}` : "No budget set yet"}
              </p>
              <div className="flex justify-between items-center mt-4">
                <input
                  type="number"
                  value={category.budget || ""}
                  onChange={(e) => handleInputChange(category.id, parseInt(e.target.value))}
                  className="border p-2 rounded"
                  placeholder="Set budget"
                />
                <Button onClick={() => handleBudgetChange(category.id, category.budget)}>Set Budget</Button>
              </div>
              <div className="mt-4">
                <Bar data={data} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
