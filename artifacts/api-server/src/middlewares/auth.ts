import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ message: "Server misconfiguration" });
    return;
  }
  try {
    const payload = jwt.verify(token, secret) as { role?: string };
    if (payload.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}
