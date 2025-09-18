"use client";

import { FriendRequest } from "./FriendsPage";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";

interface FriendRequestListProps {
  requests: FriendRequest[];
  isLoading: boolean;
  onAction: () => void;
}

export function FriendRequestList({ requests, isLoading, onAction }: FriendRequestListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResponse = async (requestId: string, action: "ACCEPT" | "REJECT") => {
    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action.toLowerCase()} request.`);
      }

      toast.success(`Friend request ${action.toLowerCase()}ed.`);
      onAction(); // Refresh the lists
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return <p className="text-sm text-gray-500">You have no pending friend requests.</p>;
  }

  return (
    <ul className="space-y-4">
      {requests.map((request) => (
        <li key={request.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${request.requester.email}.png`} alt={request.requester.name || request.requester.email} />
              <AvatarFallback>{request.requester.name?.[0] || request.requester.email[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.requester.name || "No Name"}</p>
              <p className="text-sm text-gray-500">{request.requester.email}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {processingId === request.id ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleResponse(request.id, "ACCEPT")}>
                  <Check className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleResponse(request.id, "REJECT")}>
                  <X className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
