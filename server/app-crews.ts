import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { type GameAction } from "./gameplayEngine";
import { applyPlayerAction, bootstrapHandle, createCrewForHandle, createCrewInvite, ensureDemoPlayer, postCrewMessage, respondToInvite, searchPlayers } from "./persistence";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api", mode: "crews-persistence-foundation", ts: new Date().toISOString() });
});

app.post("/api/demo/register", async (req, res) => {
  try {
    const handle = String(req.body?.handle || "");
    await ensureDemoPlayer(handle);
    res.json(await bootstrapHandle(handle));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

app.get("/api/demo/:handle/bootstrap", async (req, res) => {
  try {
    res.json(await bootstrapHandle(req.params.handle));
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Bootstrap failed" });
  }
});

app.post("/api/demo/:handle/actions", async (req, res) => {
  try {
    const action = req.body?.action as GameAction | undefined;
    if (!action?.type) return res.status(400).json({ error: "Missing action" });
    const result = await applyPlayerAction(req.params.handle, action);
    res.json({ ...result, bootstrap: await bootstrapHandle(req.params.handle) });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Action failed" });
  }
});

app.post("/api/demo/:handle/crews", async (req, res) => {
  try {
    const crew = await createCrewForHandle(req.params.handle, String(req.body?.name || ""), String(req.body?.tag || ""));
    io.emit("crew:refresh", { crewId: crew.id });
    res.json(await bootstrapHandle(req.params.handle));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Crew creation failed" });
  }
});

app.get("/api/demo/:handle/players/search", async (req, res) => {
  try {
    res.json(await searchPlayers(String(req.query.q || ""), req.params.handle));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Search failed" });
  }
});

app.post("/api/demo/:handle/crews/:crewId/invites", async (req, res) => {
  try {
    const invite = await createCrewInvite(req.params.handle, String(req.body?.targetHandle || ""));
    res.json({ ok: true, inviteId: invite.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invite failed" });
  }
});

app.post("/api/demo/:handle/invites/:inviteId/respond", async (req, res) => {
  try {
    const result = await respondToInvite(req.params.handle, req.params.inviteId, !!req.body?.accept);
    res.json({ ...result, bootstrap: await bootstrapHandle(req.params.handle) });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invite response failed" });
  }
});

app.post("/api/demo/:handle/crews/:crewId/chat", async (req, res) => {
  try {
    const row = await postCrewMessage(req.params.handle, req.params.crewId, String(req.body?.body || ""));
    const payload = await bootstrapHandle(req.params.handle);
    io.to(`crew:${req.params.crewId}`).emit("crew:message", row);
    res.json(payload);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Chat failed" });
  }
});

io.on("connection", (socket) => {
  socket.on("crew:join", (crewId: string) => {
    socket.join(`crew:${crewId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Metro Syndicate crews foundation listening on :${PORT}`);
});
