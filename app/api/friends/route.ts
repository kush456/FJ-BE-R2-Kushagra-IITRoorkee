import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    // Remap to return a clean list of friends
    const friends = friendships.map(f => {
        return f.requesterId === session.user.id ? f.receiver : f.requester;
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
