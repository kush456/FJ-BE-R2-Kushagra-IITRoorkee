"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bar } from 'react-chartjs-2';

interface ReportDialogProps {
  onClose: () => void;
  transactions: any[];
}

export default function ReportDialog({ onClose, transactions }: ReportDialogProps) {
  const [reportType, setReportType] = useState("monthly");

  const generateReportData = () => {
    if (reportType === "monthly") {
      const monthlyExpenses = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((acc, transaction) => {
          const date = new Date(transaction.date);
          const month = date.toLocaleString('default', { month: 'short' });
          acc[month] = (acc[month] || 0) + Number(transaction.amount);
          return acc;
        }, {});

      const monthlyIncome = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((acc, transaction) => {
          const date = new Date(transaction.date);
          const month = date.toLocaleString('default', { month: 'short' });
          acc[month] = (acc[month] || 0) + Number(transaction.amount);
          return acc;
        }, {});

      return {
        labels: Object.keys(monthlyExpenses),
        datasets: [
          {
            label: 'Monthly Expenses',
            data: Object.values(monthlyExpenses),
            backgroundColor: '#FF6384',
          },
          {
            label: 'Monthly Income',
            data: Object.values(monthlyIncome),
            backgroundColor: '#36A2EB',
          },
        ],
      };
    } else if (reportType === "yearly") {
      const yearlyExpenses = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((acc, transaction) => {
          const date = new Date(transaction.date);
          const year = date.getFullYear();
          acc[year] = (acc[year] || 0) + Number(transaction.amount);
          return acc;
        }, {});

      const yearlyIncome = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((acc, transaction) => {
          const date = new Date(transaction.date);
          const year = date.getFullYear();
          acc[year] = (acc[year] || 0) + Number(transaction.amount);
          return acc;
        }, {});

      return {
        labels: Object.keys(yearlyExpenses),
        datasets: [
          {
            label: 'Yearly Expenses',
            data: Object.values(yearlyExpenses),
            backgroundColor: '#FF6384',
          },
          {
            label: 'Yearly Income',
            data: Object.values(yearlyIncome),
            backgroundColor: '#36A2EB',
          },
        ],
      };
    }
  };

  const reportData = generateReportData() || { labels: [], datasets: [] };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="monthly">Monthly Income vs. Expenses</option>
              <option value="yearly">Yearly Income vs. Expenses</option>
            </select>
          </div>
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
            <Bar data={reportData} />
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
