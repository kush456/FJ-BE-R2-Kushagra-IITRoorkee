"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react";

interface ViewTransactionDialogProps {
  transaction: any;
  children: React.ReactNode;
}

export default function ViewTransactionDialog({ transaction, children }: ViewTransactionDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <div onClick={() => setIsDialogOpen(true)}>{children}</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">Type</label>
            <p>{transaction.type}</p>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Category</label>
            <p>{transaction.category?.name}</p>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Amount</label>
            <p>{transaction.amount}</p>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Description</label>
            <p>{transaction.description || "N/A"}</p>
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Date</label>
            <p>{new Date(transaction.date).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
