import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useBridge() {
  const [sessionId, setSessionId] = useState(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { items } = await base44.entities.LocalBridge.filter({}, { sort: "-created_date", limit: 1 });
      if (items[0]) setSessionId(items[0].session_id);
    } catch (e) { /* none yet */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async () => {
    const sid = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    await base44.entities.LocalBridge.create({ session_id: sid, status: "offline", computer_name: "" });
    setSessionId(sid);
    return sid;
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await base44.functions.invoke("bridgeStatus", { session_id: sessionId });
      setOnline(res.data?.online || false);
    } catch (e) { /* ignore */ }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [sessionId, refresh]);

  const sendCommand = useCallback(async (type, command, args) => {
    if (!sessionId) return null;
    const res = await base44.functions.invoke("bridgeCommand", { session_id: sessionId, type, command, args });
    return res.data?.command_id || null;
  }, [sessionId]);

  return { sessionId, online, loading, create, sendCommand, refresh };
}