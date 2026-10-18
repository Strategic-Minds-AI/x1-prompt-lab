import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { items } = await base44.entities.LocalBridge.filter({ session_id: body.session_id }, { limit: 1 });
    const bridge = items[0];
    if (!bridge) return Response.json({ error: 'not found' }, { status: 404 });
    const online = bridge.status === 'online' && bridge.last_seen &&
      (Date.now() - new Date(bridge.last_seen).getTime() < 60000);
    const { items: cmds } = await base44.entities.LocalCommand.filter(
      { session_id: body.session_id },
      { sort: '-created_date', limit: 20 }
    );
    return Response.json({ online, bridge: { ...bridge, session_id: undefined }, commands: cmds });
  } catch (error) {
    return Response.json({ error: 'Unable to read local bridge status' }, { status: 500 });
  }
}
