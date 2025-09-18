"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddFriendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendRequestSent: () => void;
}

export function AddFriendDialog({ isOpen, onClose, onFriendRequestSent }: AddFriendDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!email) {
      toast.error("Please enter an email address.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send friend request.");
      }

      toast.success("Friend request sent successfully!");
      onFriendRequestSent();
      onClose();
      setEmail("");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Friend</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to add as a friend.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSendRequest} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
