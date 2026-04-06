import React, { useEffect, useState } from "react";
import { apiCall } from "./secureApi";

type Bootstrap = {
  player: { handle: string; crewId: string | null; state: any };
  crew: null | { id: string; name: string; tag: string | null; cash: number; roster: Array<{ id: string; handle: string }>; messages: Array<{ id: string; handle: string; body: string; createdAt: string }> };
  invites: Array<any>;
  market: Array<any>;
  contracts: Array<any>;
  territories: Array<any>;
};

export default function AppWorld() {
  const [handle, setHandle] = useState("Cipher");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [listingItem, setListingItem] = useState("consumable-1");
  const [listingQty, setListingQty] = useState("1");
  const [listingPrice, setListingPrice] = useState("150");

  const registerOrLoad = async () => {
    setError("");
    try {
      const result = await apiCall(`/api/demo/register`, { method: "POST", body: JSON.stringify({ handle }) });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    registerOrLoad().catch(() => undefined);
  }, []);

  const reload = async () => {
    const result = await apiCall(`/api/demo/${handle}/bootstrap`);
    setData(result);
  };

  const act = async (action: any) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/actions`, { method: "POST", body: JSON.stringify({ action }) });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const createListing = async () => {
    try {
      const result = await apiCall(`/api/demo/${handle}/market/listings`, { method: "POST", body: JSON.stringify({ itemId: listingItem, quantity: Number(listingQty), unitPrice: Number(listingPrice) }) });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const buyListing = async (listingId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/market/listings/${listingId}/buy`, { method: "POST" });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const cancelListing = async (listingId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/market/listings/${listingId}/cancel`, { method: "POST" });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const claimContract = async (contractId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/contracts/${contractId}/claim`, { method: "POST" });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const attackTerritory = async (territoryId: string) => {
    try {
      const result = await apiCall(`/api/demo/${handle}/territories/${territoryId}/attack`, { method: "POST" });
      setData({ ...(result.bootstrap as Bootstrap), territories: result.territories, market: data?.market || [], contracts: data?.contracts || [] });
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!data) {
    return <div style={{ minHeight: "100vh", background: "#09090b", color: "white", padding: 24 }}>Loading world foundation…</div>;
  }

  const state = data.player.state;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "white", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={panelStyle}>
          <h1 style={{ margin: 0, fontSize: 36 }}>Metro Syndicate Economy + World Foundation</h1>
          <p style={{ color: "#a1a1aa" }}>Persistent demo player economy with market, contracts, and territory attacks.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" style={inputStyle} />
            <button onClick={registerOrLoad} style={buttonPrimary}>Load handle</button>
            <button onClick={reload} style={buttonGhost}>Refresh</button>
          </div>
        </header>

        {error ? <div style={{ color: "#f87171" }}>{error}</div> : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[["Handle", data.player.handle],["Cash", state.cash],["Bank", state.bank],["Respect", state.respect],["Energy", state.energy],["Health", state.health],["Crew", data.crew?.name || "None"]].map(([label, value]) => (
            <div key={String(label)} style={cardStyle}>
              <div style={labelStyle}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>{String(value)}</div>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          <Panel title="Quick actions">
            <button onClick={() => act({ type: "work" })} style={buttonPrimary}>Work</button>
            <button onClick={() => act({ type: "crime", crimeId: "pick" })} style={buttonGhost}>Crime</button>
            <button onClick={() => act({ type: "buyItem", itemId: "consumable-1" })} style={buttonGhost}>Buy Stim Drink</button>
            <button onClick={() => act({ type: "buyItem", itemId: "utility-1" })} style={buttonGhost}>Buy Signal Rig</button>
          </Panel>

          <Panel title="Create market listing">
            <input value={listingItem} onChange={(e) => setListingItem(e.target.value)} style={inputStyle} />
            <input value={listingQty} onChange={(e) => setListingQty(e.target.value)} style={inputStyle} />
            <input value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} style={inputStyle} />
            <button onClick={createListing} style={buttonPrimary}>List item</button>
          </Panel>

          <Panel title="Inventory">
            {Object.entries(state.inventory || {}).map(([itemId, qty]) => (
              <div key={itemId} style={rowStyle}>{itemId} <span>{String(qty)}</span></div>
            ))}
          </Panel>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
          <Panel title="Market">
            {data.market.map((listing) => (
              <div key={listing.id} style={rowStyle}>
                <div>
                  <div style={{ fontWeight: 700 }}>{listing.itemId}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12 }}>{listing.quantity} units • {listing.unitPrice} each</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => buyListing(listing.id)} style={buttonPrimary}>Buy</button>
                  {listing.playerId === data.player.id ? <button onClick={() => cancelListing(listing.id)} style={buttonGhost}>Cancel</button> : null}
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Contracts">
            {data.contracts.map((contract) => (
              <div key={contract.id} style={rowStyle}>
                <div>
                  <div style={{ fontWeight: 700 }}>{contract.title}</div>
                  <div style={{ color: "#d4d4d8" }}>{contract.body}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12 }}>Cash {contract.rewardCash} • Respect {contract.rewardRespect}</div>
                </div>
                <button onClick={() => claimContract(contract.id)} style={buttonPrimary}>Claim</button>
              </div>
            ))}
          </Panel>

          <Panel title="Territories">
            {data.territories.map((territory) => (
              <div key={territory.id} style={rowStyle}>
                <div>
                  <div style={{ fontWeight: 700 }}>{territory.name}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12 }}>{territory.cityId} • income {territory.baseIncome}</div>
                  <div style={{ color: "#d4d4d8" }}>{territory.control ? `${territory.control.crewName} holding (defense ${territory.control.defense})` : "Unclaimed"}</div>
                </div>
                <button onClick={() => attackTerritory(territory.id)} style={buttonPrimary}>Attack</button>
              </div>
            ))}
          </Panel>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Recent Log</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {state.log.map((entry: string, index: number) => <div key={index} style={rowStyle}>{entry}</div>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={panelStyle}><h2 style={{ marginTop: 0 }}>{title}</h2><div style={{ display: "grid", gap: 8 }}>{children}</div></div>;
}

const panelStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,0.04)" };
const cardStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 16, background: "rgba(255,255,255,0.03)" };
const labelStyle: React.CSSProperties = { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#71717a" };
const rowStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const inputStyle: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "white", padding: "0 12px" };
const buttonPrimary: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "white", color: "black", fontWeight: 700, padding: "0 14px", cursor: "pointer" };
const buttonGhost: React.CSSProperties = { minHeight: 42, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "white", fontWeight: 700, padding: "0 14px", cursor: "pointer" };
