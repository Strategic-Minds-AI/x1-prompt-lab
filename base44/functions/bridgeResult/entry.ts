import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getBridge } from '../../shared/bridge.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const bridge = await getBridge(base44, body.session_id);
    if (!bridge) return Response.json({ error: 'invalid session' }, { status: 403 });
    await base44.asServiceRole.entities.LocalCommand.update(body.command_id, {
      status: body.status || 'done',
      output: (body.output || '').slice(0, 50000),
      result: body.result || null,
      error: (body.error || '').slice(0, 2000),
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}