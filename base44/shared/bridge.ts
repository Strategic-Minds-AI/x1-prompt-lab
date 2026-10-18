export async function getBridge(base44, sessionId) {
  if (!sessionId) return null;
  const { items } = await base44.asServiceRole.entities.LocalBridge.filter(
    { session_id: sessionId },
    { limit: 1 }
  );
  return items[0] || null;
}