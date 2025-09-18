"use client";

import { Friend } from "./FriendsPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface FriendListProps {
  friends: Friend[];
  isLoading: boolean;
}

export function FriendList({ friends, isLoading }: FriendListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return <p className="text-sm text-gray-500">You haven&apos;t added any friends yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {friends.map((friend) => (
        <li key={friend.id} className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${friend.email}.png`} alt={friend.name || friend.email} />
            <AvatarFallback>{friend.name?.[0] || friend.email[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{friend.name || "No Name"}</p>
            <p className="text-sm text-gray-500">{friend.email}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
