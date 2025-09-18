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

    const requests = await prisma.friendship.findMany({
      where: {
        receiverId: session.user.id,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
