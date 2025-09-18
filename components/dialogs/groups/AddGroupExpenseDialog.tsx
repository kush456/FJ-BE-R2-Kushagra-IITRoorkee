import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface GroupMember {
  id: string;
  name: string;
  email: string;
}

interface ExpenseParticipant {
  userId: string;
  paid: number;
  share: number;
}

interface AddGroupExpenseDialogProps {
  groupId: string;
  groupMembers: GroupMember[];
  onExpenseAdded: () => void;
  trigger?: React.ReactNode;
}

export default function AddGroupExpenseDialog({ 
  groupId, 
  groupMembers, 
  onExpenseAdded, 
  trigger 
}: AddGroupExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<ExpenseParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize participants when dialog opens
  useEffect(() => {
    if (open && groupMembers.length > 0) {
      // Default: all group members participate equally
      const amountNum = parseFloat(amount) || 0;
      const equalShare = groupMembers.length > 0 ? amountNum / groupMembers.length : 0;
      
      setParticipants(groupMembers.map(member => ({
        userId: member.id,
        paid: 0,
        share: equalShare
      })));
      
      // Default payer to first member
      if (!payerId && groupMembers.length > 0) {
        setPayerId(groupMembers[0].id);
      }
    }
  }, [open, groupMembers, amount, payerId]);

  // Update shares when amount or split type changes
  useEffect(() => {
    if (splitType === 'equal') {
      const amountNum = parseFloat(amount) || 0;
      const equalShare = participants.length > 0 ? amountNum / participants.length : 0;
      
      setParticipants(prev => prev.map(p => ({ ...p, share: equalShare })));
    }
  }, [amount, splitType, participants.length]);

  // Update payer's paid amount when payer changes
  useEffect(() => {
    if (payerId && amount) {
      const amountNum = parseFloat(amount) || 0;
      setParticipants(prev => prev.map(p => ({
        ...p,
        paid: p.userId === payerId ? amountNum : 0
      })));
    }
  }, [payerId, amount]);

  const handleParticipantChange = (userId: string, field: 'paid' | 'share', value: number) => {
    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async () => {
    if (!amount || !description || !payerId || participants.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const totalShares = participants.reduce((sum, p) => sum + p.share, 0);
    const amountNum = parseFloat(amount);
    
    if (Math.abs(totalShares - amountNum) > 0.01) {
      toast.error('Total shares must equal the expense amount');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerId,
          amount: amountNum,
          description,
          splitType,
          participants,
        }),
      });

      if (response.ok) {
        toast.success('Group expense added successfully!');
        setOpen(false);
        resetForm();
        onExpenseAdded();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add group expense');
      }
    } catch (error) {
      toast.error('An error occurred while adding the expense');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setPayerId('');
    setSplitType('equal');
    setParticipants([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Group Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Group Expense</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Amount*</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Paid by*</label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {groupMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description*</label>
            <Input
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Split Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How should this be split?</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={splitType === 'equal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSplitType('equal')}
                >
                  Split equally
                </Button>
                <Button
                  variant={splitType === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSplitType('custom')}
                >
                  Custom amounts
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.map((participant) => {
                const member = groupMembers.find(m => m.id === participant.userId);
                if (!member) return null;

                return (
                  <div key={participant.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Paid</div>
                        <Input
                          type="number"
                          className="w-20 text-center"
                          value={participant.paid}
                          onChange={(e) => handleParticipantChange(
                            participant.userId, 
                            'paid', 
                            parseFloat(e.target.value) || 0
                          )}
                          step="0.01"
                          disabled={participant.userId !== payerId}
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Owes</div>
                        <Input
                          type="number"
                          className="w-20 text-center"
                          value={participant.share}
                          onChange={(e) => handleParticipantChange(
                            participant.userId, 
                            'share', 
                            parseFloat(e.target.value) || 0
                          )}
                          step="0.01"
                          disabled={splitType === 'equal'}
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Net</div>
                        <div className={`font-mono ${
                          participant.paid - participant.share > 0 ? 'text-green-600' : 
                          participant.paid - participant.share < 0 ? 'text-red-600' : 
                          'text-gray-500'
                        }`}>
                          {(participant.paid - participant.share).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Summary */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span>Total paid:</span>
                  <span className="font-mono">${participants.reduce((sum, p) => sum + p.paid, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Total shares:</span>
                  <span className="font-mono">${participants.reduce((sum, p) => sum + p.share, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>Difference:</span>
                  <span className={`font-mono ${Math.abs(participants.reduce((sum, p) => sum + p.paid, 0) - participants.reduce((sum, p) => sum + p.share, 0)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(participants.reduce((sum, p) => sum + p.paid, 0) - participants.reduce((sum, p) => sum + p.share, 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
