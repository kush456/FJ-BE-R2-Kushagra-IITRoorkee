"use client"
import { fetchGroups, fetchGroupBalances, fetchGroupSettlements } from '@/lib/groupApi';


import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      let allSettlements: Record<string, Settlement[]> = {};
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
      <h2 className="text-lg font-bold">Groups</h2>
      {groups.length === 0 && <p>No groups found.</p>}
      {groups.map(group => {
        const userBalance = balances.find(b => b.groupId === group.id && b.userId === userId);
        const groupSettlements = settlements[group.id] || [];
        return (
          <Card key={group.id} className="p-4 mb-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{group.name}</div>
                <div className="text-sm text-gray-500">Your balance: <span className={userBalance && userBalance.balance < 0 ? 'text-red-500' : 'text-green-600'}>{userBalance ? userBalance.balance.toFixed(2) : '0.00'}</span></div>
              </div>
            </div>
            <div className="mt-2">
              <div className="font-medium">Settlements</div>
              {groupSettlements.length === 0 && <div className="text-xs text-gray-400">No outstanding settlements</div>}
              {groupSettlements.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1">
                  <span>{s.fromUser.name} → {s.toUser.name}: <b>{s.amount.toFixed(2)}</b> {s.status === 'PAID' ? <span className="text-green-600">(Paid)</span> : <span className="text-yellow-600">(Pending)</span>}</span>
                  {s.status !== 'PAID' && s.fromUser.id === userId && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      await fetch(`/api/settlements/${s.id}`, { method: 'PATCH' });
                      // Refresh settlements
                      const res = await fetch(`/api/groups/${group.id}/settlements`);
                      const data = await res.json();
                      setSettlements(prev => ({ ...prev, [group.id]: data.settlements }));
                    }}>Settle Up</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default GroupOverview;
