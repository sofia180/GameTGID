import type { PrismaClient } from "@prisma/client";

export interface LeaderboardEntry {
  userId: string;
  username: string | null;
  wins: number;
}

export async function getLeaderboard(prisma: PrismaClient, limit = 20): Promise<LeaderboardEntry[]> {
  const data = await prisma.gameRoom.groupBy({
    by: ["winnerId"],
    where: { status: "finished", winnerId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
    take: limit
  });

  const userIds = data.map((row) => row.winnerId).filter((id): id is string => !!id);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true }
  });
  const lookup = new Map(users.map((u) => [u.id, u]));

  return data.map((row) => ({
    userId: row.winnerId ?? "",
    username: lookup.get(row.winnerId ?? "")?.username ?? null,
    wins: row._count._all
  }));
}
