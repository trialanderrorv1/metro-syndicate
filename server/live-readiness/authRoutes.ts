import { Router, Request, Response, NextFunction } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "../persistence";

const SESSION_COOKIE = "metro_session";
const SESSION_TTL_DAYS = 30;

type SafeUser = {
  id: string;
  handle: string;
  email: string;
  premiumActive: boolean;
  premiumUntil: string | null;
  premiumCoins: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeHandle(handle: string) {
  return handle.trim();
}

function makePasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parseCookies(header: string | undefined) {
  const out: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = value;
  }
  return out;
}

function getSessionToken(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE] || null;
}

function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`);
}

function clearSessionCookie(res: Response) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

async function getPremiumSummary(userId: string) {
  const grants = await prisma.premiumGrant.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { premiumUntil: "desc" },
  });
  const now = Date.now();
  const active = grants.find((g) => new Date(g.premiumUntil).getTime() > now) || null;
  const premiumCoins = grants.reduce((sum, grant) => sum + Number(grant.grantedCoins || 0), 0);
  return {
    premiumActive: !!active,
    premiumUntil: active ? active.premiumUntil.toISOString() : null,
    premiumCoins,
  };
}

async function toSafeUser(user: { id: string; handle: string; email: string }): Promise<SafeUser> {
  const premium = await getPremiumSummary(user.id);
  return {
    id: user.id,
    handle: user.handle,
    email: user.email,
    premiumActive: premium.premiumActive,
    premiumUntil: premium.premiumUntil,
    premiumCoins: premium.premiumCoins,
  };
}

async function createSession(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  });
  return { sessionToken, expiresAt };
}

export async function authUserFromRequest(req: Request) {
  const token = getSessionToken(req);
  if (!token) return null;
  const session = await prisma.userSession.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await authUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  (req as any).authUser = user;
  next();
}

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const handle = normalizeHandle(String(req.body?.handle || ""));
    const email = normalizeEmail(String(req.body?.email || ""));
    const password = String(req.body?.password || "");

    if (handle.length < 3 || handle.length > 20) return res.status(400).json({ error: "Handle must be 3-20 characters" });
    if (!email.includes("@")) return res.status(400).json({ error: "Valid email required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const existing = await prisma.userAccount.findFirst({
      where: { OR: [{ handle }, { email }] },
      select: { id: true },
    });
    if (existing) return res.status(409).json({ error: "Handle or email already in use" });

    const user = await prisma.userAccount.create({
      data: {
        handle,
        email,
        passwordHash: makePasswordHash(password),
      },
      select: { id: true, handle: true, email: true },
    });

    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "auth.register",
        metadata: { handle, email },
      },
    });

    const session = await createSession(user.id);
    setSessionCookie(res, session.sessionToken, session.expiresAt);
    res.json({ ok: true, user: await toSafeUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const identifier = String(req.body?.identifier || "").trim();
    const password = String(req.body?.password || "");
    if (!identifier || !password) return res.status(400).json({ error: "Identifier and password required" });

    const user = await prisma.userAccount.findFirst({
      where: identifier.includes("@") ? { email: normalizeEmail(identifier) } : { handle: identifier },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "auth.login",
        metadata: { identifier },
      },
    });

    const session = await createSession(user.id);
    setSessionCookie(res, session.sessionToken, session.expiresAt);
    res.json({ ok: true, user: await toSafeUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  try {
    const token = getSessionToken(req);
    if (token) {
      await prisma.userSession.deleteMany({ where: { sessionToken: token } });
    }
    const user = (req as any).authUser;
    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "auth.logout",
      },
    });
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Logout failed" });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const user = await authUserFromRequest(req);
    if (!user) return res.status(200).json({ user: null });
    res.json({ user: await toSafeUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Session lookup failed" });
  }
});
