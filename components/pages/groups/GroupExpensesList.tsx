import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, DollarSign, Users, Eye } from 'lucide-react';

interface GroupExpense {
  id: string;
  amount: number;
  description: string;
  date: string;
  splitType: string;
  payer: {
    id: string;
    name: string;
    email: string;
  };
  participants: Array<{
    id: string;
    paid: number;
    share: number;
    netBalance: number;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  group: {
    id: string;
    name: string;
  };
}

interface GroupExpensesListProps {
  groupId: string;
  refreshTrigger: number;
  onExpenseClick?: (expense: GroupExpense) => void;
}

export default function GroupExpensesList({ 
  groupId, 
  refreshTrigger, 
  onExpenseClick 
}: GroupExpensesListProps) {
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/groups/${groupId}/expenses`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch expenses');
      }
      
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [groupId, refreshTrigger]);

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchExpenses} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No group expenses yet</h3>
          <p className="text-gray-500">
            Start by adding your first group expense to track shared costs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card key={expense.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium">{expense.description}</h3>
                  <Badge variant={expense.splitType === 'equal' ? 'default' : 'secondary'}>
                    {expense.splitType === 'equal' ? 'Equal split' : 'Custom split'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-xs">
                        {getInitials(expense.payer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>Paid by {expense.payer.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{expense.participants.length} people</span>
                  </div>
                </div>

                {/* Participants Summary */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-500">Split between:</span>
                  <div className="flex -space-x-2">
                    {expense.participants.slice(0, 4).map((participant) => (
                      <Avatar key={participant.id} className="w-6 h-6 border-2 border-white">
                        <AvatarFallback className="text-xs">
                          {getInitials(participant.user.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {expense.participants.length > 4 && (
                      <div className="w-6 h-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{expense.participants.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Net Balances Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {expense.participants.map((participant) => {
                    const netBalance = Number(participant.netBalance);
                    return (
                      <div key={participant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="truncate">{participant.user.name.split(' ')[0]}</span>
                        <span className={`font-mono ${
                          netBalance > 0 ? 'text-green-600' : 
                          netBalance < 0 ? 'text-red-600' : 
                          'text-gray-500'
                        }`}>
                          {netBalance > 0 ? '+' : ''}${netBalance.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${Number(expense.amount).toFixed(2)}
                  </div>
                </div>
                
                {onExpenseClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExpenseClick(expense)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}