import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  telegramId: string;
}

export function signJwt(payload: JwtPayload, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyJwt(token: string, secret: string) {
  return jwt.verify(token, secret) as JwtPayload;
}
