import { FriendsPage } from "@/components/pages/friends/FriendsPage";
import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Friends - FinTrack",
  description: "Manage your friends and split expenses.",
};

export default function Friends() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-8">
        <FriendsPage />
      </div>
    </div>
  );
}
