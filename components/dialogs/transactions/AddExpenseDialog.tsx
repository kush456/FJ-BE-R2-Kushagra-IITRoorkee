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
import { Loader2, Plus, Minus, Users } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { fetchFriends } from "@/lib/friendApi";

interface Friend {
  id: string;
  name: string;
  email: string;
}

interface Participant {
  userId: string;
  name: string;
  paid: number;
  share: number;
}

interface AddExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

export function AddExpenseDialog({ isOpen, onClose, onExpenseAdded }: AddExpenseDialogProps) {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Load friends when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  // Update participants when friends are selected or amount changes
  useEffect(() => {
    updateParticipants();
  }, [selectedFriends, amount, splitType, session]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const friendsData = await fetchFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoadingFriends(false);
    }
  };

  const updateParticipants = () => {
    if (!session?.user || !amount) return;

    const allParticipants = [
      { id: session.user.id!, name: session.user.name!, email: session.user.email! },
      ...friends.filter(f => selectedFriends.includes(f.id))
    ];

    const totalAmount = parseFloat(amount) || 0;
    const equalShare = totalAmount / allParticipants.length;

    const newParticipants: Participant[] = allParticipants.map(p => ({
      userId: p.id,
      name: p.name,
      paid: 0, // User will set who paid what
      share: splitType === "equal" ? equalShare : 0
    }));

    setParticipants(newParticipants);
  };

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

  const handleAddExpense = async () => {
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
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerId: session?.user?.id,
          amount: expectedAmount,
          description,
          splitType,
          participants: participants.map(p => ({
            userId: p.userId,
            paid: p.paid,
            share: p.share
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create expense");
      }

      toast.success("Expense added successfully!");
      onExpenseAdded();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast.error(error.message || "Failed to add expense");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFriends([]);
    setAmount("");
    setDescription("");
    setSplitType("equal");
    setParticipants([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Shared Expense
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

          {/* Friend Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Split with friends</label>
            {loadingFriends ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading friends...
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {friends.length === 0 ? (
                  <p className="text-sm text-gray-500">No friends available</p>
                ) : (
                  friends.map(friend => (
                    <label key={friend.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFriends(prev => [...prev, friend.id]);
                          } else {
                            setSelectedFriends(prev => prev.filter(id => id !== friend.id));
                          }
                        }}
                      />
                      <span className="text-sm">{friend.name} ({friend.email})</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Split Configuration */}
          {participants.length > 0 && (
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAddExpense} disabled={isLoading || participants.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}