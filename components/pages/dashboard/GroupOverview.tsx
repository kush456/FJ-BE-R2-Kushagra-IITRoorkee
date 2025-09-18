"use client"
import { fetchGroups, fetchGroupBalances, fetchGroupSettlements } from '@/lib/groupApi';
import { useRouter } from 'next/navigation';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight, Users } from 'lucide-react';

interface Group {
  id: string;
  name: string;
}

interface GroupBalance {
  groupId: string;
  userId: string;
  balance: number;
  group: { name: string };
}

interface Settlement {
  id: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
  amount: number;
  status: string;
}

const GroupOverview: React.FC<{ userId: string }> = ({ userId }) => {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [settlements, setSettlements] = useState<Record<string, Settlement[]>>({});

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  useEffect(() => {
    if (groups.length === 0) return;
    Promise.all(
      groups.map(async (g) => {
        const [balances, settlements] = await Promise.all([
          fetchGroupBalances(g.id),
          fetchGroupSettlements(g.id),
        ]);
        return { groupId: g.id, balances, settlements };
      })
    ).then(results => {
      let allBalances: GroupBalance[] = [];
      const allSettlements: Record<string, Settlement[]> = {};
      results.forEach(r => {
        if (!r) return;
        allBalances = allBalances.concat(r.balances);
        allSettlements[r.groupId] = r.settlements;
      });
      setBalances(allBalances);
      setSettlements(allSettlements);
    });
  }, [groups]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Your Groups</h2>
        {groups.length > 0 && (
          <div className="text-sm text-gray-500">Click any group to view details</div>
        )}
      </div>
      {groups.length === 0 && (
        <Card className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500">Create your first group to start splitting expenses with friends!</p>
        </Card>
      )}
      {groups.map(group => {
        const userBalance = balances.find(b => b.groupId === group.id && b.userId === userId);
        const groupSettlements = settlements[group.id] || [];
        return (
          <Card key={group.id} className="p-4 mb-2 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/groups/${group.id}`)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-lg">{group.name}</div>
                  <div className="text-sm text-gray-500">
                    Your balance: <span className={userBalance && userBalance.balance < 0 ? 'text-red-500' : 'text-green-600'}>
                      ${userBalance ? Math.abs(userBalance.balance).toFixed(2) : '0.00'}
                      {userBalance && userBalance.balance < 0 ? ' (you owe)' : userBalance && userBalance.balance > 0 ? ' (you are owed)' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm text-gray-500">
                  <div>{groupSettlements.length} settlements</div>
                  <div>Click to view details</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            {/* Quick settlements preview - only show if there are active settlements */}
            {groupSettlements.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500 mb-2">Recent settlements:</div>
                <div className="space-y-1">
                  {groupSettlements.slice(0, 2).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {s.fromUser.name} → {s.toUser.name}: ${Number(s.amount).toFixed(2)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        s.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {s.status === 'PAID' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {groupSettlements.length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{groupSettlements.length - 2} more settlements
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default GroupOverview;
