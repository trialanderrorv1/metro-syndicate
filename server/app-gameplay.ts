import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { applyGameAction, type GameAction } from "./gameplayEngine";
import { CITIES, CRIMES, ITEMS, JOBS, RIVALS, makeInitialState, type PlayerState } from "../shared/gameData";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

let demoState: PlayerState = makeInitialState("Cipher");

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api", mode: "gameplay-foundation", ts: new Date().toISOString() });
});

app.get("/api/bootstrap", (_req, res) => {
  res.json({
    player: demoState,
    cities: CITIES,
    jobs: JOBS,
    crimes: CRIMES,
    rivals: RIVALS,
    items: ITEMS,
  });
});

app.post("/api/actions", (req, res) => {
  try {
    const action = req.body?.action as GameAction | undefined;
    if (!action?.type) return res.status(400).json({ error: "Missing action" });
    const result = applyGameAction(demoState, action);
    demoState = result.state;
    io.emit("player:update", result.state);
    res.json({ player: result.state, feed: result.feed });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Action failed" });
  }
});

app.post("/api/reset-demo", (_req, res) => {
  demoState = makeInitialState("Cipher");
  io.emit("player:update", demoState);
  res.json({ player: demoState });
});

io.on("connection", (socket) => {
  socket.emit("player:update", demoState);
  socket.emit("system", { ok: true, message: "Connected to Metro Syndicate gameplay foundation." });
});

httpServer.listen(PORT, () => {
  console.log(`Metro Syndicate gameplay foundation listening on :${PORT}`);
});
