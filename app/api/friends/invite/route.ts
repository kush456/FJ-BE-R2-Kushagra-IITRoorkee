import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email: receiverEmail } = await req.json();

    if (!receiverEmail) {
      return NextResponse.json({ error: "Receiver email is required" }, { status: 400 });
    }

    if (receiverEmail === session.user.email) {
      return NextResponse.json({ error: "You cannot add yourself as a friend" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({
      where: { email: receiverEmail },
    });

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if a friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId: receiver.id },
          { requesterId: receiver.id, receiverId: session.user.id },
        ],
      },
    });

    if (existingFriendship) {
        if (existingFriendship.status === 'ACCEPTED') {
            return NextResponse.json({ error: "You are already friends with this user" }, { status: 400 });
        }
        return NextResponse.json({ error: "A friend request already exists" }, { status: 400 });
    }

    // Create new friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: session.user.id,
        receiverId: receiver.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Friend request sent", friendship }, { status: 201 });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
