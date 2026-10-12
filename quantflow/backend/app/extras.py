"""Extra endpoints the node frontend needs. Drop this file next to main.py (see ../PATCH.md, 3 small edits).

  POST /api/modify            move SL/TP of an open position (trailing stop)  - paper + MT5
  POST /api/broker            switch execution broker at runtime (paper | mt5), only while flat + manual
  GET  /api/trades            closed trades, mirrored into SQLite table `trades` (profit report)
  POST /api/db/node_values    snapshots of every node's readouts -> SQLite table `node_values`
"""
from __future__ import annotations
import asyncio, logging, time
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .config import settings, BrokerKind
from .brokers import PaperBroker, MT5Broker

log = logging.getLogger("extras")

SCHEMA = """
CREATE TABLE IF NOT EXISTS trades (
  ticket TEXT PRIMARY KEY, symbol TEXT, side TEXT, lots REAL,
  open_price REAL, close_price REAL, open_time INTEGER, close_time INTEGER,
  profit REAL, sl REAL, tp REAL, broker TEXT
);
CREATE TABLE IF NOT EXISTS node_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts REAL NOT NULL, symbol TEXT, mode TEXT,
  node TEXT NOT NULL, key TEXT NOT NULL, value REAL, text TEXT
);
CREATE INDEX IF NOT EXISTS ix_nv_ts ON node_values(ts);
CREATE INDEX IF NOT EXISTS ix_trades_ct ON trades(close_time);
"""


class ModifyReq(BaseModel):
    ticket: str
    sl: Optional[float] = None      # absolute PRICE, not points
    tp: Optional[float] = None


class BrokerReq(BaseModel):
    kind: str = Field(pattern="^(paper|mt5)$")


class NodeRow(BaseModel):
    node: str
    key: str
    value: Optional[float] = None
    text: Optional[str] = None


class NodeValues(BaseModel):
    symbol: str = ""
    mode: str = ""
    rows: list[NodeRow]


def build_router(application) -> APIRouter:
    r = APIRouter()
    state = {"ready": False}

    async def db():
        d = application.store._db
        if not state["ready"]:
            await d.executescript(SCHEMA)
            await d.commit()
            state["ready"] = True
        return d

    @r.post("/api/modify")
    async def modify(req: ModifyReq):
        b = application.broker
        if isinstance(b, PaperBroker):
            pos = b._positions.get(req.ticket)
            if pos is None:
                raise HTTPException(404, f"unknown ticket {req.ticket}")
            if req.sl is not None:
                pos.sl = req.sl
            if req.tp is not None:
                pos.tp = req.tp
            return {"ok": True, "sl": pos.sl, "tp": pos.tp}
        if isinstance(b, MT5Broker):
            def _do():
                mt5 = b._require()
                p = mt5.positions_get(ticket=int(req.ticket))
                if not p:
                    return {"ok": False, "message": "no such position"}
                p = p[0]
                res = mt5.order_send({"action": mt5.TRADE_ACTION_SLTP, "position": p.ticket,
                                      "symbol": p.symbol, "sl": req.sl if req.sl is not None else p.sl,
                                      "tp": req.tp if req.tp is not None else p.tp})
                ok = res is not None and res.retcode == mt5.TRADE_RETCODE_DONE
                return {"ok": ok, "message": getattr(res, "comment", "")}
            return await asyncio.to_thread(_do)
        raise HTTPException(501, f"broker {getattr(b, 'name', '?')} cannot modify SL")

    @r.post("/api/broker")
    async def switch_broker(req: BrokerReq):
        if application.risk.mode.value == "auto":
            raise HTTPException(409, "disarm AUTO before switching broker")
        if application.broker is not None and await application.broker.positions():
            raise HTTPException(409, "close all positions before switching broker")
        old = settings.broker
        settings.broker = BrokerKind(req.kind)
        nb = application.make_broker()
        if not await nb.connect():
            settings.broker = old
            raise HTTPException(502, f"{req.kind} could not connect "
                                     "(MT5 needs Windows + a running terminal)")
        application.broker = nb
        await application.push_status()
        return {"broker": nb.name}

    @r.get("/api/trades")
    async def trades(limit: int = Query(1000, le=10000)):
        d = await db()
        b = application.broker
        if isinstance(b, PaperBroker):          # mirror paper closes into the DB (idempotent)
            for c in b.closed_log:
                await d.execute(
                    "INSERT OR IGNORE INTO trades (ticket,symbol,side,lots,open_price,close_price,"
                    "open_time,close_time,profit,sl,tp,broker) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                    (c["ticket"], c["symbol"], c["side"], c["lots"], c["open_price"], c["close_price"],
                     c["open_time"], c["close_time"], c["profit"], c.get("sl"), c.get("tp"), b.name))
            await d.commit()
        cur = await d.execute("SELECT * FROM trades ORDER BY close_time DESC LIMIT ?", (limit,))
        return {"rows": [dict(x) for x in await cur.fetchall()]}

    @r.post("/api/db/node_values")
    async def node_values(req: NodeValues):
        d = await db()
        now = time.time()
        await d.executemany(
            "INSERT INTO node_values (ts,symbol,mode,node,key,value,text) VALUES (?,?,?,?,?,?,?)",
            [(now, req.symbol, req.mode, x.node, x.key,
              x.value if x.value is not None and x.value == x.value else None, x.text) for x in req.rows])
        await d.commit()
        return {"stored": len(req.rows)}

    return r
