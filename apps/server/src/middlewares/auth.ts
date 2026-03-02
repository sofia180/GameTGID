import type { NextFunction, Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { verifyJwt } from "../auth/jwt";

export interface AuthedRequest extends Request {
  user?: { id: string; telegramId: string };
}

export function authMiddleware(secret: string, prisma?: PrismaClient) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }
    try {
      const token = auth.replace("Bearer ", "");
      const payload = verifyJwt(token, secret);

      if (prisma) {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { isBanned: true }
        });
        if (!user || user.isBanned) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      req.user = { id: payload.sub, telegramId: payload.telegramId };
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}
