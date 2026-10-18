import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getBridge } from '../../shared/bridge.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (typeof body.session_id !== 'string' || typeof body.command_id !== 'string') {
      return Response.json({ error: 'session_id and command_id required' }, { status: 400 });
    }
    if (!['done', 'failed'].includes(body.status)) {
      return Response.json({ error: 'Only done or failed command results are accepted' }, { status: 400 });
    }
    const bridge = await getBridge(base44, body.session_id);
    if (!bridge) return Response.json({ error: 'invalid session' }, { status: 403 });

    const { items } = await base44.asServiceRole.entities.LocalCommand.filter(
      { id: body.command_id, session_id: body.session_id },
      { limit: 1 }
    );
    const command = items[0];
    if (!command) return Response.json({ error: 'command not found for this session' }, { status: 404 });
    if (command.status !== 'running') return Response.json({ error: 'command is not running' }, { status: 409 });

    await base44.asServiceRole.entities.LocalCommand.update(command.id, {
      status: body.status,
      output: (typeof body.output === 'string' ? body.output : '').slice(0, 50000),
      result: body.result && typeof body.result === 'object' ? body.result : null,
      error: (typeof body.error === 'string' ? body.error : '').slice(0, 2000),
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: 'Unable to record local bridge result' }, { status: 500 });
  }
}
