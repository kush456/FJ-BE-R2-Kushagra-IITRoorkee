import React from 'react';

interface GroupBalancesProps {
  groupId: string;
}

export function GroupBalances({ groupId }: GroupBalancesProps) {
    console.log("Group ID:", groupId); 
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Group Balances</h3>
      <p className="text-gray-500">Group balances functionality coming soon...</p>
    </div>
  );
}
