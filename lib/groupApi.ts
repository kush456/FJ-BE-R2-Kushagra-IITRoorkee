import axios from 'axios';

export async function fetchGroups() {
  const res = await axios.get('/api/groups');
  return res.data.groups || [];
}

export async function fetchGroupBalances(groupId: string) {
  const res = await axios.get(`/api/groups/${groupId}/balances`);
  return res.data.balances || [];
}

export async function fetchGroupSettlements(groupId: string) {
  const res = await axios.get(`/api/groups/${groupId}/settlements`);
  return res.data.settlements || [];
}

export async function createGroup({ name, memberIds }: { name: string; memberIds: string[] }) {
  const res = await axios.post('/api/groups', { name, memberIds });
  return res.data.group;
}
