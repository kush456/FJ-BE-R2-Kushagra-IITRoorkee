"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Participant {
  userId: string;
  name: string;
  paid: number;
  share: number;
}

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdated: () => void;
  onExpenseDeleted: () => void;
  expense: any;
}

export function EditExpenseDialog({ 
  isOpen, 
  onClose, 
  onExpenseUpdated, 
  onExpenseDeleted, 
  expense 
}: EditExpenseDialogProps) {
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form with expense data
  useEffect(() => {
    if (expense && isOpen) {
      setDescription(expense.description || "");
      setAmount(expense.amount.toString());
      setSplitType(expense.splitType);
      
      const initialParticipants: Participant[] = expense.participants.map((p: any) => ({
        userId: p.userId,
        name: p.user.name,
        paid: parseFloat(p.paid.toString()),
        share: parseFloat(p.share.toString())
      }));
      
      setParticipants(initialParticipants);
    }
  }, [expense, isOpen]);

  // Update participants when amount or split type changes
  useEffect(() => {
    if (splitType === "equal" && participants.length > 0 && amount) {
      const totalAmount = parseFloat(amount) || 0;
      const equalShare = totalAmount / participants.length;
      
      setParticipants(prev => 
        prev.map(p => ({ ...p, share: equalShare }))
      );
    }
  }, [amount, splitType, participants.length]);

  const updateParticipantPaid = (userId: string, paidAmount: number) => {
    setParticipants(prev => 
      prev.map(p => p.userId === userId ? { ...p, paid: paidAmount } : p)
    );
  };

  const updateParticipantShare = (userId: string, shareAmount: number) => {
    setParticipants(prev => 
      prev.map(p => p.userId === userId ? { ...p, share: shareAmount } : p)
    );
  };

  const handleUpdateExpense = async () => {
    if (!description || !amount || participants.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalPaid = participants.reduce((sum, p) => sum + p.paid, 0);
    const totalShares = participants.reduce((sum, p) => sum + p.share, 0);
    const expectedAmount = parseFloat(amount);

    if (Math.abs(totalPaid - expectedAmount) > 0.01) {
      toast.error(`Total paid (${totalPaid}) must equal expense amount (${expectedAmount})`);
      return;
    }

    if (Math.abs(totalShares - expectedAmount) > 0.01) {
      toast.error(`Total shares (${totalShares}) must equal expense amount (${expectedAmount})`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: expectedAmount,
          participants: participants.map(p => ({
            userId: p.userId,
            paid: p.paid,
            share: p.share
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update expense");
      }

      toast.success("Expense updated successfully!");
      onExpenseUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error updating expense:", error);
      toast.error(error.message || "Failed to update expense");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }

      toast.success("Expense deleted successfully!");
      onExpenseDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error(error.message || "Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Edit Shared Expense
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <Input
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total Amount *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Split Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Split Type</label>
              <Select value={splitType} onValueChange={setSplitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Split Equally</SelectItem>
                  <SelectItem value="custom">Custom Split</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Payment & Split Details</h3>
              <div className="space-y-3">
                {participants.map(participant => (
                  <div key={participant.userId} className="grid grid-cols-3 gap-3 p-3 border rounded">
                    <div className="col-span-1">
                      <span className="text-sm font-medium">{participant.name}</span>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Paid</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={participant.paid || ""}
                        onChange={(e) => updateParticipantPaid(participant.userId, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Share</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={participant.share || ""}
                        onChange={(e) => updateParticipantShare(participant.userId, parseFloat(e.target.value) || 0)}
                        disabled={splitType === "equal"}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <div>Total Paid: ${participants.reduce((sum, p) => sum + p.paid, 0).toFixed(2)}</div>
                <div>Total Shares: ${participants.reduce((sum, p) => sum + p.share, 0).toFixed(2)}</div>
                <div>Expected: ${parseFloat(amount) || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDeleteExpense} 
            disabled={isLoading || isDeleting}
            className="gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading || isDeleting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExpense} disabled={isLoading || isDeleting}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Expense
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}