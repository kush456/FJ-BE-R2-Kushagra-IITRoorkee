import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface GroupBalance {
  id: string;
  balance: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Settlement {
  id: string;
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

interface GroupBalancesProps {
  groupId: string;
  currentUserId: string;
}

export default function GroupBalances({ groupId, currentUserId }: GroupBalancesProps) {
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, [groupId]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/balances`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch group balances');
      }

      const data = await response.json();
      setBalances(data.balances || []);
      setSettlements(data.pendingSettlements || []);
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast.error('Failed to load group balances');
    } finally {
      setLoading(false);
    }
  };

  const markSettlementPaid = async (settlementId: string) => {
    try {
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark settlement as paid');
      }

      toast.success('Settlement marked as paid!');
      fetchBalances(); // Refresh the data
    } catch (error) {
      console.error('Error marking settlement as paid:', error);
      toast.error('Failed to mark settlement as paid');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const positiveBalances = balances.filter(b => b.balance > 0);
  const negativeBalances = balances.filter(b => b.balance < 0);
  const userSettlements = settlements.filter(s => 
    s.fromUser.id === currentUserId || s.toUser.id === currentUserId
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owed to You</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${positiveBalances.reduce((sum, b) => sum + b.balance, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total You Owe</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${Math.abs(negativeBalances.reduce((sum, b) => sum + b.balance, 0)).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userSettlements.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Balances
          </CardTitle>
          <CardDescription>
            Current balance for each group member
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No balances yet</p>
          ) : (
            <div className="space-y-3">
              {balances.map((balance) => (
                <div key={balance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{balance.user.name || balance.user.email}</p>
                    <p className="text-sm text-gray-500">{balance.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      balance.balance > 0 ? 'text-green-600' : 
                      balance.balance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {balance.balance > 0 ? '+' : ''}${balance.balance.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {balance.balance > 0 ? 'is owed' : 
                       balance.balance < 0 ? 'owes' : 'settled up'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Settlements */}
      {userSettlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Pending Settlements
            </CardTitle>
            <CardDescription>
              Settlements involving you that need to be resolved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userSettlements.map((settlement) => {
                const isOwed = settlement.toUser.id === currentUserId;
                const otherUser = isOwed ? settlement.fromUser : settlement.toUser;
                
                return (
                  <div key={settlement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {isOwed ? (
                          <>
                            <span className="text-green-600">{otherUser.name || otherUser.email}</span>
                            <span className="text-gray-600"> owes you </span>
                            <span className="font-bold">${settlement.amount.toFixed(2)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-600">You owe </span>
                            <span className="text-red-600">{otherUser.name || otherUser.email}</span>
                            <span className="text-gray-600"> </span>
                            <span className="font-bold">${settlement.amount.toFixed(2)}</span>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{otherUser.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                      {!isOwed && (
                        <Button
                          size="sm"
                          onClick={() => markSettlementPaid(settlement.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}