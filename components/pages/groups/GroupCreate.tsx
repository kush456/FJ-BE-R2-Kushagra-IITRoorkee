"use client";
import React, { useEffect, useState } from 'react';
import { createGroup } from '@/lib/groupApi';
import { fetchFriends } from '@/lib/friendApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Friend {
  id: string;
  name: string;
  email: string;
}

interface GroupCreateProps {
  onGroupCreated?: () => void;
}

const GroupCreate: React.FC<GroupCreateProps> = ({ onGroupCreated }) => {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchFriends().then(setFriends);
  }, []);

  const handleSelect = (id: string) => {
    if (!selected.includes(id)) setSelected([...selected, id]);
  };
  const handleRemove = (id: string) => {
    setSelected(selected.filter(sid => sid !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createGroup({ name, memberIds: selected });
      setName('');
      setSelected([]);
      if (onGroupCreated) onGroupCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg bg-white shadow-md">
      <h2 className="text-xl font-bold mb-2">Create a Group</h2>
      <div>
        <label className="block font-medium mb-1">Group Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Enter group name" />
      </div>
      <div>
        <label className="block font-medium mb-1">Add Members</label>
        <div className="mb-2">
          <Select onValueChange={handleSelect} open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selected.length === 0 ? 'Select friends...' : `${selected.length} selected`} />
            </SelectTrigger>
            <SelectContent>
              {friends.filter(f => !selected.includes(f.id)).map(f => (
                <SelectItem key={f.id} value={f.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://avatar.vercel.sh/${f.email}.png`} alt={f.name || f.email} />
                      <AvatarFallback>{f.name?.[0] || f.email[0]}</AvatarFallback>
                    </Avatar>
                    <span>{f.name}</span>
                    <span className="text-xs text-gray-400">({f.email})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.map(id => {
            const f = friends.find(fr => fr.id === id);
            if (!f) return null;
            return (
              <span key={id} className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-sm">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={`https://avatar.vercel.sh/${f.email}.png`} alt={f.name || f.email} />
                  <AvatarFallback>{f.name?.[0] || f.email[0]}</AvatarFallback>
                </Avatar>
                {f.name}
                <button type="button" className="ml-1 text-blue-600 hover:text-red-500" onClick={() => handleRemove(id)}>&times;</button>
              </span>
            );
          })}
        </div>
        <div className="text-xs text-gray-400 mt-1">You can select multiple friends to add to the group.</div>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" disabled={loading || !name || selected.length === 0} className="w-full">
        {loading ? 'Creating...' : 'Create Group'}
      </Button>
    </form>
  );
};

export default GroupCreate;
