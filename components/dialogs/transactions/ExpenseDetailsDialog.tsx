"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Users, DollarSign, ArrowRight, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { EditExpenseDialog } from "./EditExpenseDialog";

interface ExpenseParticipant {
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
}

interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface ExpenseDetails {
  id: string;
  amount: number;
  description: string;
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
  participants: ExpenseParticipant[];
  settlements: Settlement[];
}

interface ExpenseDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string | null;
  onExpenseUpdated?: () => void;
  onExpenseDeleted?: () => void;
}

export function ExpenseDetailsDialog({ 
  isOpen, 
  onClose, 
  expenseId, 
  onExpenseUpdated, 
  onExpenseDeleted 
}: ExpenseDetailsDialogProps) {
  const { data: session } = useSession();
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpenseDetails();
    }
  }, [isOpen, expenseId]);

  const fetchExpenseDetails = async () => {
    if (!expenseId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch expense details");
      }

      const data = await response.json();
      setExpense(data);
    } catch (error: any) {
      console.error("Error fetching expense details:", error);
      toast.error(error.message || "Failed to load expense details");
    } finally {
      setIsLoading(false);
    }
  };

  const getUserParticipant = () => {
    if (!expense || !session?.user?.id) return null;
    return expense.participants.find(p => p.userId === session.user.id);
  };

  const handleExpenseUpdated = () => {
    fetchExpenseDetails(); // Refresh the expense data
    if (onExpenseUpdated) onExpenseUpdated();
  };

  const handleExpenseDeleted = () => {
    onClose(); // Close this dialog
    if (onExpenseDeleted) onExpenseDeleted();
  };

  const getExpenseSettlements = () => {
    if (!expense?.settlements) return [];
    return expense.settlements;
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Expense Details
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading expense details...</span>
          </div>
        ) : expense ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{expense.description}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <div className="font-semibold text-lg">{formatCurrency(expense.amount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <div>{formatDate(expense.date)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Paid by:</span>
                  <div>{expense.payer.name}</div>
                </div>
                <div>
                  <span className="text-gray-500">Split Type:</span>
                  <div className="capitalize">{expense.splitType}</div>
                </div>
              </div>
              {expense.group && (
                <div className="mt-2">
                  <span className="text-gray-500">Group:</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {expense.group.name}
                  </div>
                </div>
              )}
            </div>

            {/* Your Share */}
            {getUserParticipant() && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Your Share
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">You Paid:</span>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(getUserParticipant()!.paid)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Your Share:</span>
                    <div className="font-semibold">
                      {formatCurrency(getUserParticipant()!.share)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Net Balance:</span>
                    <div className={`font-semibold ${
                      getUserParticipant()!.netBalance > 0 ? 'text-green-600' : 
                      getUserParticipant()!.netBalance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {getUserParticipant()!.netBalance > 0 ? '+' : ''}
                      {formatCurrency(getUserParticipant()!.netBalance)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {getUserParticipant()!.netBalance > 0 && "You're owed money"}
                  {getUserParticipant()!.netBalance < 0 && "You owe money"}
                  {getUserParticipant()!.netBalance === 0 && "You're settled up"}
                </div>
              </div>
            )}

            {/* All Participants */}
            <div>
              <h4 className="font-semibold mb-3">Split Breakdown</h4>
              <div className="space-y-2">
                {expense.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{participant.user.name}</div>
                      <div className="text-xs text-gray-500">{participant.user.email}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-right">
                      <div>
                        <div className="text-gray-500 text-xs">Paid</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(participant.paid)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Share</div>
                        <div className="font-medium">
                          {formatCurrency(participant.share)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Balance</div>
                        <div className={`font-medium ${
                          participant.netBalance > 0 ? 'text-green-600' : 
                          participant.netBalance < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {participant.netBalance > 0 ? '+' : ''}
                          {formatCurrency(participant.netBalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settlements for this expense */}
            {getExpenseSettlements().length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Settlements for this Expense</h4>
                <div className="space-y-2">
                  {getExpenseSettlements().map((settlement) => {
                    return (
                      <div key={settlement.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            settlement.status === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">{settlement.fromUser.name}</span> owes{' '}
                              <span className="font-medium">{settlement.toUser.name}</span>{' '}
                              {formatCurrency(settlement.amount)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <ArrowRight className="h-3 w-3" />
                              <span className={`capitalize ${
                                settlement.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {settlement.status.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="space-y-1 text-gray-600">
                <div>Total expense: {formatCurrency(expense.amount)}</div>
                <div>Split among {expense.participants.length} people</div>
                <div>
                  {expense.groupId ? `Group expense in "${expense.group?.name}"` : 'One-off shared expense'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load expense details
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Edit Expense Dialog */}
        {expense && (
          <EditExpenseDialog
            isOpen={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            onExpenseUpdated={handleExpenseUpdated}
            onExpenseDeleted={handleExpenseDeleted}
            expense={expense}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}