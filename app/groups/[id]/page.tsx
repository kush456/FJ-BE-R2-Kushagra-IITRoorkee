'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, DollarSign, Receipt, HandCoins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AddGroupExpenseDialog from '@/components/dialogs/groups/AddGroupExpenseDialog';
import GroupExpensesList from '@/components/pages/groups/GroupExpensesList';
import GroupExpenseDetailsDialog from '@/components/dialogs/groups/GroupExpenseDetailsDialog';

interface GroupMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface GroupDetails {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  members: GroupMember[];
  _count: {
    expenses: number;
  };
}

interface GroupBalance {
  userId: string;
  balance: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [groupResponse, balancesResponse, settlementsResponse] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/balances`),
        fetch(`/api/groups/${groupId}/settlements`)
      ]);
      
      if (!groupResponse.ok || !balancesResponse.ok || !settlementsResponse.ok) {
        throw new Error('Failed to fetch group details');
      }
      
      const groupData = await groupResponse.json();
      const balancesData = await balancesResponse.json();
      const settlementsData = await settlementsResponse.json();
      
      setGroup(groupData);
      setBalances(balancesData.balances || []);
      setSettlements(settlementsData.settlements || []);
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load group details');
      // Ensure we have default values even on error
      setBalances([]);
      setSettlements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExpenseClick = (expense: any) => {
    setSelectedExpense(expense);
    setExpenseDetailsOpen(true);
  };

  const handleExpenseDetailsClose = () => {
    setExpenseDetailsOpen(false);
    setSelectedExpense(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Group not found'}</p>
            <div className="space-x-2">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalBalance = Array.isArray(balances) ? balances.reduce((sum, b) => sum + Number(b.balance), 0) : 0;
  const creditors = Array.isArray(balances) ? balances.filter(b => Number(b.balance) > 0.01) : [];
  const debtors = Array.isArray(balances) ? balances.filter(b => Number(b.balance) < -0.01) : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>
      </div>

      {/* Group Info Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{group.name}</CardTitle>
              {group.description && (
                <p className="text-gray-600 mt-2">{group.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{group.members.length} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Receipt className="w-4 h-4" />
                  <span>{group._count.expenses} expenses</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Group Balance</div>
              <div className={`text-2xl font-bold ${Math.abs(totalBalance) < 0.01 ? 'text-green-600' : 'text-gray-900'}`}>
                {Math.abs(totalBalance) < 0.01 ? 'Settled' : `$${Math.abs(totalBalance).toFixed(2)}`}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Owed</p>
                    <p className="text-xl font-bold text-green-600">
                      ${(creditors?.reduce((sum, c) => sum + Number(c.balance), 0) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <HandCoins className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Owing</p>
                    <p className="text-xl font-bold text-red-600">
                      ${Math.abs(debtors?.reduce((sum, d) => sum + Number(d.balance), 0) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Expenses</p>
                    <p className="text-xl font-bold text-blue-600">{group._count.expenses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Current Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!balances || balances.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No balances yet</p>
              ) : (
                <div className="space-y-3">
                  {balances
                    .sort((a, b) => Number(b.balance) - Number(a.balance))
                    .map((balance) => {
                      const member = group?.members?.find(m => m.userId === balance.userId);
                      if (!member) return null;
                      
                      const balanceAmount = Number(balance.balance);
                      const isPositive = balanceAmount > 0.01;
                      const isNegative = balanceAmount < -0.01;
                      
                      return (
                        <div key={balance.userId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {getInitials(member.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.user.name}</div>
                              <div className="text-sm text-gray-500">{member.user.email}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {Math.abs(balanceAmount) < 0.01 ? (
                              <Badge variant="secondary">Settled</Badge>
                            ) : (
                              <div>
                                <div className={`text-lg font-bold ${
                                  isPositive ? 'text-green-600' : 
                                  isNegative ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  {isPositive ? '+' : ''}${balanceAmount.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {isPositive ? 'is owed' : isNegative ? 'owes' : 'settled'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Group Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Group Members ({group.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {/* Expenses Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Group Expenses</h3>
              <p className="text-sm text-gray-500">
                Manage shared expenses for this group
              </p>
            </div>
            <AddGroupExpenseDialog
              groupId={groupId}
              groupMembers={group.members.map(m => ({
                id: m.user.id,
                name: m.user.name,
                email: m.user.email
              }))}
              onExpenseAdded={handleRefresh}
            />
          </div>

          {/* Expenses List */}
          <GroupExpensesList
            groupId={groupId}
            refreshTrigger={refreshTrigger}
            onExpenseClick={handleExpenseClick}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          {/* Settlements Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Group Settlements</h3>
              <p className="text-sm text-gray-500">
                Simplified debts to minimize number of transactions
              </p>
            </div>
          </div>

          {/* Settlements List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandCoins className="w-5 h-5" />
                Who Owes Whom
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="text-center py-8">
                  <HandCoins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All settled up!</h3>
                  <p className="text-gray-500">
                    No outstanding debts in this group.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((settlement, index) => {
                    const fromUser = group.members.find(m => m.userId === settlement.fromUserId)?.user;
                    const toUser = group.members.find(m => m.userId === settlement.toUserId)?.user;
                    
                    if (!fromUser || !toUser) return null;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {getInitials(fromUser.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{fromUser.name}</div>
                            <div className="text-sm text-gray-500">owes</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">
                              ${Number(settlement.amount).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">to</div>
                            <div className="font-medium">{toUser.name}</div>
                          </div>
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {getInitials(toUser.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {/* Members Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Group Members</h3>
              <p className="text-sm text-gray-500">
                Manage who&apos;s in this group
              </p>
            </div>
            {/* TODO: Add invite member button */}
          </div>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({group.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group?.members?.map((member) => {
                  const balance = balances?.find(b => b.userId === member.userId);
                  const balanceAmount = balance ? Number(balance.balance) : 0;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-lg">{member.user.name}</div>
                          <div className="text-sm text-gray-500">{member.user.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Balance</div>
                        {Math.abs(balanceAmount) < 0.01 ? (
                          <Badge variant="secondary">Settled</Badge>
                        ) : (
                          <div className={`text-lg font-bold ${
                            balanceAmount > 0 ? 'text-green-600' : 
                            balanceAmount < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {balanceAmount > 0 ? '+' : ''}${balanceAmount.toFixed(2)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {balanceAmount > 0 ? 'is owed' : balanceAmount < 0 ? 'owes' : 'settled'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Group Expense Details Dialog */}
      <GroupExpenseDetailsDialog
        isOpen={expenseDetailsOpen}
        onClose={handleExpenseDetailsClose}
        expense={selectedExpense}
        onExpenseUpdated={handleRefresh}
        onExpenseDeleted={handleRefresh}
      />
    </div>
  );
}
