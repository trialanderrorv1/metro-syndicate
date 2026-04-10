import type { Request, Response, NextFunction } from "express";

type BucketState = { count: number; resetAt: number };
const buckets = new Map<string, BucketState>();

export function memoryRateLimit(limit: number, windowMs: number, keyFn?: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn ? keyFn(req) : `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= limit) {
      return res.status(429).json({ error: "Too many requests. Please slow down." });
    }

    current.count += 1;
    return next();
  };
}
