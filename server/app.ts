import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { CITIES, CRIMES, ITEMS, JOBS, RIVALS, makeInitialState } from "../shared/gameData";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api", ts: new Date().toISOString() });
});

app.get("/api/bootstrap", (_req, res) => {
  res.json({
    player: makeInitialState("Cipher"),
    cities: CITIES,
    jobs: JOBS,
    crimes: CRIMES,
    rivals: RIVALS,
    items: ITEMS,
  });
});

io.on("connection", (socket) => {
  socket.emit("system", { ok: true, message: "Connected to Metro Syndicate realtime." });

  socket.on("crew:message", (body: string) => {
    io.emit("crew:message", {
      handle: "local-test",
      body: String(body || "").slice(0, 400),
      createdAt: new Date().toISOString(),
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Metro Syndicate API listening on :${PORT}`);
});
