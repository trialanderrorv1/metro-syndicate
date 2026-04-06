import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { type GameAction } from "./gameplayEngine";
import { applyPlayerAction, bootstrapHandle, ensureDemoPlayer } from "./persistence";
import { attackTerritory, buyListing, cancelListing, claimContract, createListing, listContracts, listMarket, listTerritories } from "./economyWorld";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api", mode: "economy-world-foundation", ts: new Date().toISOString() });
});

app.post("/api/demo/register", async (req, res) => {
  try {
    const handle = String(req.body?.handle || "");
    await ensureDemoPlayer(handle);
    res.json({ ...(await bootstrapHandle(handle)), market: await listMarket(), contracts: await listContracts(), territories: await listTerritories() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

app.get("/api/demo/:handle/bootstrap", async (req, res) => {
  try {
    res.json({ ...(await bootstrapHandle(req.params.handle)), market: await listMarket(), contracts: await listContracts(), territories: await listTerritories() });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Bootstrap failed" });
  }
});

app.post("/api/demo/:handle/actions", async (req, res) => {
  try {
    const action = req.body?.action as GameAction | undefined;
    if (!action?.type) return res.status(400).json({ error: "Missing action" });
    await applyPlayerAction(req.params.handle, action);
    res.json({ ...(await bootstrapHandle(req.params.handle)), market: await listMarket(), contracts: await listContracts(), territories: await listTerritories() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Action failed" });
  }
});

app.get("/api/world/market", async (_req, res) => {
  res.json(await listMarket());
});

app.post("/api/demo/:handle/market/listings", async (req, res) => {
  try {
    const data = await createListing(req.params.handle, String(req.body?.itemId || ""), Number(req.body?.quantity || 1), Number(req.body?.unitPrice || 1));
    res.json({ ...data, market: await listMarket(), contracts: await listContracts(), territories: await listTerritories() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Listing failed" });
  }
});

app.post("/api/demo/:handle/market/listings/:listingId/buy", async (req, res) => {
  try {
    const data = await buyListing(req.params.handle, req.params.listingId);
    res.json({ ...data, market: await listMarket(), contracts: await listContracts(), territories: await listTerritories() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Buy failed" });
  }
});

app.post("/api/demo/:handle/market/listings/:listingId/cancel", async (req, res) => {
  try {
    const data = await cancelListing(req.params.handle, req.params.listingId);
    res.json({ ...data, market: await listMarket(), contracts: await listContracts(), territories: await listTerritories() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Cancel failed" });
  }
});

app.get("/api/world/contracts", async (_req, res) => {
  res.json(await listContracts());
});

app.post("/api/demo/:handle/contracts/:contractId/claim", async (req, res) => {
  try {
    const data = await claimContract(req.params.handle, req.params.contractId);
    res.json({ ...data, market: await listMarket(), contracts: await listContracts(), territories: await listTerritories() });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Claim failed" });
  }
});

app.get("/api/world/territories", async (_req, res) => {
  res.json(await listTerritories());
});

app.post("/api/demo/:handle/territories/:territoryId/attack", async (req, res) => {
  try {
    const data = await attackTerritory(req.params.handle, req.params.territoryId);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Attack failed" });
  }
});

io.on("connection", (socket) => {
  socket.emit("system", { ok: true, message: "Connected to Metro Syndicate economy/world foundation." });
});

httpServer.listen(PORT, () => {
  console.log(`Metro Syndicate economy/world foundation listening on :${PORT}`);
});
