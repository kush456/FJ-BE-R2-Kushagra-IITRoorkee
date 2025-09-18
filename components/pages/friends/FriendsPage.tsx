"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Mail } from "lucide-react";
import { AddFriendDialog } from "@/components/dialogs/friends/AddFriendDialog";
import { FriendList } from "./FriendList";
import { FriendRequestList } from "./FriendRequestList";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Friend {
  id: string;
  name: string | null;
  email: string;
}

export interface FriendRequest {
  id: string;
  requester: Friend;
}

export function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
      ]);

      if (!friendsRes.ok || !requestsRes.ok) {
        throw new Error("Failed to fetch data from the server.");
      }

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();

      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching friends data:", error);
      toast.error("Failed to load your friends and requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Friends</h1>
        <Button onClick={() => setIsAddFriendOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Friend
        </Button>
      </div>

      <AddFriendDialog
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onFriendRequestSent={fetchData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2" /> My Friends ({friends.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FriendList friends={friends} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2" /> Friend Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FriendRequestList
                requests={requests}
                isLoading={isLoading}
                onAction={fetchData}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
