import { getStore } from "@netlify/blobs";

const CODE = "1897";
const STATIONS = ["A", "B", "C"];
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const store = () => getStore({ name: "fte", consistency: "strong" });
const safe = s => String(s || "").trim().toLowerCase().replace(/[^a-z0-9 _-]/g, "").slice(0, 40) || "x";
const roomKey = (cls, st) => `room/${safe(cls)}/${safe(st)}`;
const classKey = cls => `class/${safe(cls)}`;
const stuPrefix = cls => `stu/${safe(cls)}/`;
async function students(cls) {
  const st = store(); const { blobs } = await st.list({ prefix: stuPrefix(cls) });
  const out = {}; await Promise.all(blobs.map(async b => { const v = await st.get(b.key, { type: "json", consistency: "strong" }); if (v) out[v.name || b.key] = v; }));
  return out;
}
const emptyRoom = () => ({ ver: 0, members: [], rows: [], sim: {}, pred: {} });
const emptyClass = () => ({ ver: 0, students: {}, unlock: false });

// optimistic update with conditional writes (low contention: one group of ~5)
async function update(key, init, fn) {
  const st = store();
  for (let i = 0; i < 10; i++) {
    const cur = await st.getWithMetadata(key, { type: "json", consistency: "strong" });
    const val = cur ? cur.data : init();
    const out = fn(val);
    if (out === null) return val;
    out.ver = (val.ver || 0) + 1;
    const res = cur ? await st.setJSON(key, out, { onlyIfMatch: cur.etag }) : await st.setJSON(key, out, { onlyIfNew: true });
    if (res.modified) return out;
    await new Promise(r => setTimeout(r, 30 + Math.random() * 150));
  }
  throw new Error("busy");
}

function assignRole(members, level) {
  const has = r => members.filter(m => m.role === r).length;
  const order = level >= 3 ? ["analyst", "recorder", "trial"] : level === 2 ? ["recorder", "trial", "analyst"] : ["trial", "recorder", "analyst"];
  const cap = { trial: 3, recorder: 1, analyst: 1 };
  for (const r of order) if (has(r) < cap[r]) return r;
  return "trial";
}

export default async (req) => {
  const url = new URL(req.url);
  try {
    if (req.method === "GET") {
      const op = url.searchParams.get("op");
      const cls = url.searchParams.get("cls");
      if (op === "room") {
        const v = await store().get(roomKey(cls, url.searchParams.get("st")), { type: "json", consistency: "strong" });
        return json(v || emptyRoom());
      }
      if (op === "board") {
        const c = (await store().get(classKey(cls), { type: "json", consistency: "strong" })) || emptyClass();
        const done = { A: 0, B: 0, C: 0 }, assigned = { A: 0, B: 0, C: 0 };
        c.students = await students(cls);
        for (const s of Object.values(c.students)) { if (s.station && assigned[s.station] != null) { assigned[s.station]++; if (s.doneStation) done[s.station]++; } }
        const rooms = {};
        for (const k of STATIONS) {
          const r = await store().get(roomKey(cls, k), { type: "json", consistency: "strong" });
          rooms[k] = r ? { rows: r.rows.map(x => ({ raw: x.raw })), members: r.members.length } : { rows: [], members: 0 };
        }
        return json({ done, assigned, unlock: !!c.unlock, rooms });
      }
      if (op === "teacher") {
        if (url.searchParams.get("code") !== CODE) return json({ error: "code" }, 403);
        const c = (await store().get(classKey(cls), { type: "json", consistency: "strong" })) || emptyClass();
        c.students = await students(cls);
        const rooms = {};
        for (const k of STATIONS) rooms[k] = (await store().get(roomKey(cls, k), { type: "json", consistency: "strong" })) || emptyRoom();
        return json({ cls: c, rooms });
      }
      return new Response("Find the Electron is running.");
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json();
    const { op, cls, st } = b;
    const name = String(b.name || "").trim().slice(0, 60);
    if (op === "join") {
      let me;
      const r = await update(roomKey(cls, st), emptyRoom, room => {
        me = room.members.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (me) return null;
        const role = assignRole(room.members, b.level || 2);
        const trial = role === "trial" ? (room.members.filter(m => m.role === "trial").length % 3) + 1 : null;
        me = { name, level: b.level || 2, role, trial, t: Date.now() };
        room.members.push(me);
        return room;
      });
      return json({ room: r, me });
    }
    if (op === "sim") {
      const r = await update(roomKey(cls, st), emptyRoom, room => { room.sim = { ...(b.sim || {}), by: name, t: Date.now() }; return room; });
      return json({ ver: r.ver });
    }
    if (op === "pred") {
      const r = await update(roomKey(cls, st), emptyRoom, room => { room.pred[name] = b.value; return room; });
      return json({ ver: r.ver });
    }
    if (op === "run") {
      const r = await update(roomKey(cls, st), emptyRoom, room => {
        if (room.rows.length >= 8) return null;
        if (room.rows.some(x => x.id === b.row.id)) return null;
        room.rows.push({ id: b.row.id, by: name, t: Date.now(), raw: b.row.raw, rec: {} });
        return room;
      });
      return json({ room: r });
    }
    if (op === "cell") {
      const r = await update(roomKey(cls, st), emptyRoom, room => {
        const row = room.rows.find(x => x.id === b.id); if (!row) return null;
        row.rec[b.col] = { v: String(b.value).slice(0, 20), by: name };
        return room;
      });
      return json({ ver: r.ver });
    }
    if (op === "delrow") {
      const r = await update(roomKey(cls, st), emptyRoom, room => { room.rows = room.rows.filter(x => x.id !== b.id); return room; });
      return json({ ver: r.ver });
    }
    if (op === "progress") {
      await store().setJSON(stuPrefix(cls) + safe(name), { ...(b.data || {}), name, t: Date.now() });
      return json({ ok: true });
    }
    if (op === "unlock" || op === "lock" || op === "reset" || op === "kick") {
      if (b.code !== CODE) return json({ error: "code" }, 403);
      if (op === "reset") {
        const s = store();
        await s.delete(classKey(cls));
        const { blobs } = await s.list({ prefix: stuPrefix(cls) });
        for (const x of blobs) await s.delete(x.key);
        for (const k of STATIONS) await s.delete(roomKey(cls, k));
        return json({ ok: true });
      }
      if (op === "kick") {
        await update(roomKey(cls, b.station), emptyRoom, room => { room.members = room.members.filter(m => m.name !== b.who); return room; });
        return json({ ok: true });
      }
      await update(classKey(cls), emptyClass, c => { c.unlock = op === "unlock"; return c; });
      return json({ ok: true });
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
};

export const config = { path: "/api" };
