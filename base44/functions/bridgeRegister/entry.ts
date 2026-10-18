import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getBridge } from '../../shared/bridge.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const bridge = await getBridge(base44, body.session_id);
    if (!bridge) return Response.json({ error: 'invalid session' }, { status: 403 });
    await base44.asServiceRole.entities.LocalBridge.update(bridge.id, {
      status: 'online',
      last_seen: new Date().toISOString(),
      computer_name: body.computer_name || bridge.computer_name,
      os: body.os || bridge.os,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}