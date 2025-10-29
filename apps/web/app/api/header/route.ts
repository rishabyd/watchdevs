import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        name: true,
        image: true,
        email: true,
        wallet: { select: { balanceCredits: true } },
      },
    });
    const payload = {
      role: user?.role,
      name: user?.name,
      image: user?.image,
      email: user?.email,
      balanceCredits: Number(user?.wallet?.balanceCredits),
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error("GET /api/wallet/topups failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
