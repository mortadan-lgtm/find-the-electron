import { getStore } from "@netlify/blobs";

const CODE = "1897";
const STATIONS = ["A", "B", "C"];
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const store = () => getStore({ name: "fte", consistency: "strong" });
const safe = s => String(s || "").trim().toLowerCase().replace(/[^a-z0-9 _-]/g, "").slice(0, 40) || "x";
const roomKey = (cls, st) => `room/${safe(cls)}/${safe(st)}`;
const classKey = cls => `class/${safe(cls)}`;
const stuPrefix = cls => `stu/${safe(cls)}/`;
const allocKey = cls => `alloc/${safe(cls)}`;
const subPrefix = cls => `sub/${safe(cls)}/`, finPrefix = cls => `fin/${safe(cls)}/`;
async function listIds(prefix) { const { blobs } = await store().list({ prefix }); return blobs.map(x => x.key.slice(prefix.length)); }
async function loadAll(prefix) { const st = store(), out = {}; const ids = await listIds(prefix);
  await Promise.all(ids.map(async id => { const v = await st.get(prefix + id, { type: "json", consistency: "strong" }); if (v) out[id] = v; })); return out; }
const getAlloc = async cls => (await store().get(allocKey(cls), { type: "json", consistency: "strong" })) || emptyAlloc();
const emptyAlloc = () => ({ ver: 0, subs: {}, st: {}, done: false, fin: {}, mix: {}, mixed: false });
// a student's stations to choose from: the ones whose starting question they got wrong (all three if none or all wrong)
const poolOf = c => { const p = STATIONS.filter((k, i) => !c[i]); return p.length ? p : STATIONS.slice(); };
const pick = (pool, cnt, cap) => { let c = pool.filter(x => cnt[x] < cap); if (!c.length) c = STATIONS.filter(x => cnt[x] < cap); if (!c.length) c = STATIONS.slice();
  return c.sort((x, y) => cnt[x] - cnt[y] || STATIONS.indexOf(x) - STATIONS.indexOf(y))[0]; };
// everyone at once: most constrained students first, then whoever finished first; teams as even as possible
function allocateAll(a) {
  const list = Object.entries(a.subs).sort(([, x], [, y]) => poolOf(x.c).length - poolOf(y.c).length || x.t - y.t);
  const cap = Math.max(1, Math.ceil(list.length / 3)), cnt = { A: 0, B: 0, C: 0 }; a.st = {};
  for (const [k, sub] of list) { const s = pick(poolOf(sub.c), cnt, cap); a.st[k] = s; cnt[s]++; }
  a.done = true; return a;
}
// jigsaw: deal each station's students round the three tables, so every new team has someone from A, B and C
const stationOf = (a, k) => (a.fin && a.fin[k] && a.fin[k].station) || a.st[k];
const nameOf = (a, k) => (a.fin && a.fin[k] && a.fin[k].name) || (a.names && a.names[k]) || (a.subs && a.subs[k] && a.subs[k].name) || k;
function mixAll(a) {
  a.fin = a.fin || {}; const keys = [...new Set([...Object.keys(a.st), ...Object.keys(a.fin)])], by = { A: [], B: [], C: [] };
  keys.forEach(k => { const s = stationOf(a, k); if (by[s]) by[s].push(k); });
  a.mix = {}; let i = 0;
  for (const s of STATIONS) for (const k of by[s].sort()) a.mix[k] = STATIONS[i++ % 3];
  a.mixed = true; return a;
}
function mixOne(a, k) {
  const mine = stationOf(a, k), cnt = {}, same = {};
  STATIONS.forEach(t => { cnt[t] = 0; same[t] = 0; });
  Object.entries(a.mix).forEach(([j, t]) => { cnt[t]++; if (stationOf(a, j) === mine) same[t]++; });
  a.mix[k] = STATIONS.slice().sort((x, y) => same[x] - same[y] || cnt[x] - cnt[y])[0]; return a;
}
function mixView(a, k, finIds) {
  const keys = [...new Set([...Object.keys(a.st), ...finIds])], team = a.mixed ? a.mix[k] || null : null;
  return { mixed: !!a.mixed, n: finIds.length, total: keys.length, known: finIds.includes(k), team,
    members: team ? Object.entries(a.mix).filter(([, t]) => t === team).map(([j]) => ({ name: nameOf(a, j), station: stationOf(a, j) })).sort((x, y) => (x.station || '').localeCompare(y.station || '')) : [] };
}
// a latecomer after the stations are shown: smallest team, preferring their gap
function allocateOne(a, k, c, total) {
  const cnt = { A: 0, B: 0, C: 0 }; Object.values(a.st).forEach(s => cnt[s]++);
  a.st[k] = pick(poolOf(c), cnt, Math.max(1, Math.ceil(total / 3))); return a;
}
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
  for (let i = 0; i < 40; i++) {
    const cur = await st.getWithMetadata(key, { type: "json", consistency: "strong" });
    const val = cur ? cur.data : init();
    const out = fn(val);
    if (out === null) return val;
    out.ver = (val.ver || 0) + 1;
    const res = cur ? await st.setJSON(key, out, { onlyIfMatch: cur.etag }) : await st.setJSON(key, out, { onlyIfNew: true });
    if (res.modified) return out;
    await new Promise(r => setTimeout(r, 40 + Math.random() * Math.min(1500, 120 * (i + 1))));
  }
  throw new Error("busy");
}

// roles decided when the stations are shown: in each team the best starting score leads, the next processes,
// and everyone else is a trial lead. Small teams lose trial leads first, never the leader or the processor.
const lvlOf = sub => (sub && sub.c ? sub.c.filter(Boolean).length : 1);
function assignTeamRoles(a, subs) {
  a.roles = {};
  for (const s of STATIONS) {
    const ks = Object.keys(a.st).filter(k => a.st[k] === s).sort((x, y) => lvlOf(subs[y]) - lvlOf(subs[x]) || (subs[x].t - subs[y].t));
    const nT = Math.max(1, ks.length - 2);
    ks.forEach((k, i) => { a.roles[k] = i === 0 ? { role: "leader", nTrial: nT } : i === 1 ? { role: "processor", nTrial: nT } : { role: "trial", trial: i - 1, nTrial: nT }; });
  }
  return a;
}
function roleForLatecomer(a, k) {
  const mates = Object.keys(a.st).filter(j => j !== k && a.st[j] === a.st[k]).map(j => (a.roles || {})[j]).filter(Boolean);
  const has = r => mates.some(m => m.role === r), nT = mates.filter(m => m.role === "trial").length;
  a.roles = a.roles || {};
  a.roles[k] = !has("leader") ? { role: "leader", nTrial: Math.max(1, nT) } : !has("processor") ? { role: "processor", nTrial: Math.max(1, nT) } : { role: "trial", trial: nT + 1, nTrial: nT + 1 };
  return a;
}
function assignRole(members, level) {
  const has = r => members.filter(m => m.role === r).length;
  const order = level >= 3 ? ["leader", "processor", "trial"] : ["processor", "leader", "trial"];
  const cap = { trial: 3, processor: 1, leader: 1 };
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
      if (op === "alloc") {
        const a = await getAlloc(cls), k = safe(url.searchParams.get("name")), ids = await listIds(subPrefix(cls));
        return json({ done: a.done, n: ids.length, known: ids.includes(k), station: a.done ? (a.st[k] || null) : null });
      }
      if (op === "mix") {
        const a = await getAlloc(cls);
        return json(mixView(a, safe(url.searchParams.get("name")), await listIds(finPrefix(cls))));
      }
      if (op === "teacher") {
        if (url.searchParams.get("code") !== CODE) return json({ error: "code" }, 403);
        const c = (await store().get(classKey(cls), { type: "json", consistency: "strong" })) || emptyClass();
        c.students = await students(cls);
        const rooms = {};
        for (const k of STATIONS) rooms[k] = (await store().get(roomKey(cls, k), { type: "json", consistency: "strong" })) || emptyRoom();
        const alloc = await getAlloc(cls); alloc.subs = await loadAll(subPrefix(cls)); alloc.fin = await loadAll(finPrefix(cls));
        return json({ cls: c, rooms, alloc });
      }
      return new Response("Find the Electron is running.");
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json();
    const { op, cls, st } = b;
    const name = String(b.name || "").trim().slice(0, 60);
    if (op === "join") {
      let me; const al = await getAlloc(cls), pre = (al.st[safe(name)] === st && al.roles) ? al.roles[safe(name)] : null;
      const r = await update(roomKey(cls, st), emptyRoom, room => {
        me = room.members.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (me) return null;
        const role = pre ? pre.role : assignRole(room.members, b.level || 2);
        const trial = role === "trial" ? (pre ? pre.trial : (room.members.filter(m => m.role === "trial").length % 3) + 1) : null;
        me = { name, level: b.level || 2, role, trial, nTrial: pre ? pre.nTrial : 3, t: Date.now() };
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
        if (room.rows.length >= 5) return null;
        if (room.rows.some(x => x.id === b.row.id)) return null;
        const rec = {}; for (const [c, v] of Object.entries(b.row.rec || {}).slice(0, 6)) rec[String(c).slice(0, 10)] = { v: String(v).slice(0, 20), by: name };
        room.rows.push({ id: b.row.id, by: name, t: Date.now(), raw: b.row.raw, rec });
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
    if (op === "submit") {
      const k = safe(name); if (!name) return json({ error: "name" }, 400);
      const st = store(), key = subPrefix(cls) + k, old = await st.get(key, { type: "json", consistency: "strong" });
      const c = (b.correct || []).slice(0, 3).map(Boolean);
      await st.setJSON(key, { name, c, t: old ? old.t : Date.now() });
      let a = await getAlloc(cls); const ids = await listIds(subPrefix(cls));
      if (a.done && !a.st[k]) a = await update(allocKey(cls), emptyAlloc, al => al.st[k] ? null : roleForLatecomer(allocateOne(al, k, c, ids.length), k));
      return json({ done: a.done, n: ids.length, known: true, station: a.done ? (a.st[k] || null) : null });
    }
    if (op === "finished") {
      const k = safe(name); if (!name) return json({ error: "name" }, 400);
      let a = await getAlloc(cls);
      const station = STATIONS.includes(b.station) ? b.station : a.st[k];
      await store().setJSON(finPrefix(cls) + k, { name, station, t: Date.now() });
      if (a.mixed && !a.mix[k]) a = await update(allocKey(cls), emptyAlloc, al => { if (al.mix[k]) return null; al.fin = al.fin || {}; al.fin[k] = { name, station }; return mixOne(al, k); });
      return json(mixView(a, k, await listIds(finPrefix(cls))));
    }
    if (op === "progress") {
      await store().setJSON(stuPrefix(cls) + safe(name), { ...(b.data || {}), name, t: Date.now() });
      return json({ ok: true });
    }
    if (op === "unlock" || op === "lock" || op === "reset" || op === "kick" || op === "allocate" || op === "unallocate" || op === "mixteams" || op === "unmix") {
      if (b.code !== CODE) return json({ error: "code" }, 403);
      if (op === "reset") {
        const s = store();
        await s.delete(classKey(cls));
        const { blobs } = await s.list({ prefix: stuPrefix(cls) });
        for (const x of blobs) await s.delete(x.key);
        for (const k of STATIONS) await s.delete(roomKey(cls, k));
        await s.delete(allocKey(cls));
        for (const pre of [subPrefix(cls), finPrefix(cls)]) for (const id of await listIds(pre)) await s.delete(pre + id);
        return json({ ok: true });
      }
      if (op === "allocate") { const subs = await loadAll(subPrefix(cls)); const a = await update(allocKey(cls), emptyAlloc, al => { al.subs = subs; allocateAll(al); assignTeamRoles(al, subs); delete al.subs; al.names = Object.fromEntries(Object.entries(subs).map(([k, v]) => [k, v.name])); return al; }); return json({ ok: true, st: a.st }); }
      if (op === "mixteams") { const fin = await loadAll(finPrefix(cls)); await update(allocKey(cls), emptyAlloc, al => { al.fin = fin; return mixAll(al); }); await update(classKey(cls), emptyClass, c => { c.unlock = true; return c; }); return json({ ok: true }); }
      if (op === "unmix") { await update(allocKey(cls), emptyAlloc, al => { al.mixed = false; al.mix = {}; return al; }); return json({ ok: true }); }
      if (op === "unallocate") { await update(allocKey(cls), emptyAlloc, al => { al.done = false; al.st = {}; return al; }); return json({ ok: true }); }
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
