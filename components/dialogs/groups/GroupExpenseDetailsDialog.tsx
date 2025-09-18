"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Receipt, Users, DollarSign, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface GroupExpenseParticipant {
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

interface GroupExpenseDetails {
  id: string;
  amount: number;
  description: string;
  date: string;
  splitType: string;
  groupId: string;
  payer: {
    id: string;
    name: string;
    email: string;
  };
  group: {
    id: string;
    name: string;
  };
  participants: GroupExpenseParticipant[];
}

interface GroupExpenseDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: GroupExpenseDetails | null;
  onExpenseUpdated?: () => void;
  onExpenseDeleted?: () => void;
}

export default function GroupExpenseDetailsDialog({ 
  isOpen, 
  onClose, 
  expense, 
  onExpenseDeleted 
}: GroupExpenseDetailsDialogProps) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const getUserParticipant = () => {
    if (!expense || !session?.user?.id) return null;
    return expense.participants.find(p => p.userId === session.user.id);
  };

  const handleDeleteExpense = async () => {
    if (!expense) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this group expense? This action cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/groups/${expense.groupId}/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }

      toast.success("Group expense deleted successfully!");
      onClose();
      if (onExpenseDeleted) onExpenseDeleted();
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error(error.message || "Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
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

  if (!isOpen || !expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Group Expense Details
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteExpense}
                disabled={isDeleting}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
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
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(expense.payer.name)}
                    </AvatarFallback>
                  </Avatar>
                  {expense.payer.name}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Split Type:</span>
                <Badge variant={expense.splitType === 'equal' ? 'default' : 'secondary'}>
                  {expense.splitType === 'equal' ? 'Equal split' : 'Custom split'}
                </Badge>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-gray-500">Group:</span>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-600">{expense.group.name}</span>
              </div>
            </div>
          </div>

          {/* Your Share */}
          {getUserParticipant() && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Your Share in this Expense
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
                {getUserParticipant()!.netBalance > 0 && "This expense increases your group balance"}
                {getUserParticipant()!.netBalance < 0 && "This expense decreases your group balance"}
                {getUserParticipant()!.netBalance === 0 && "This expense doesn't affect your group balance"}
              </div>
            </div>
          )}

          {/* All Participants */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Split Breakdown ({expense.participants.length} members)
            </h4>
            <div className="space-y-3">
              {expense.participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {getInitials(participant.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{participant.user.name}</div>
                      <div className="text-xs text-gray-500">{participant.user.email}</div>
                      {participant.userId === expense.payer.id && (
                        <Badge variant="outline" className="text-xs mt-1">Payer</Badge>
                      )}
                    </div>
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

          {/* Group Context Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Group Context</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total expense amount:</span>
                <span className="font-medium">{formatCurrency(expense.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Split among:</span>
                <span className="font-medium">{expense.participants.length} group members</span>
              </div>
              <div className="flex justify-between">
                <span>Group:</span>
                <span className="font-medium text-blue-600">{expense.group.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-3 p-2 bg-white rounded border">
                <strong>Note:</strong> This expense affects overall group balances. 
                Check the group&apos;s Settlements tab to see simplified payment recommendations.
              </div>
            </div>
          </div>

          {/* Action Summary */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">What happened?</h4>
            <div className="space-y-1 text-gray-600">
              <div>• <strong>{expense.payer.name}</strong> paid {formatCurrency(expense.amount)} for &quot;{expense.description}&quot;</div>
              <div>• The expense was split {expense.splitType === 'equal' ? 'equally' : 'with custom amounts'} among {expense.participants.length} group members</div>
              <div>• Each person&apos;s group balance was updated based on what they paid vs. their share</div>
              <div>• Group settlements were recalculated to minimize the number of transactions needed</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}