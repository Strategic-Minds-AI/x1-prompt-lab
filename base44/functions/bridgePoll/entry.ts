import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getBridge } from '../../shared/bridge.ts';
import { validateQueuedLocalCommand } from '../../shared/bridge-contract.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const bridge = await getBridge(base44, body.session_id);
    if (!bridge) return Response.json({ error: 'invalid session' }, { status: 403 });

    await base44.asServiceRole.entities.LocalBridge.update(bridge.id, {
      last_seen: new Date().toISOString(),
      status: 'online',
    });

    const { items } = await base44.asServiceRole.entities.LocalCommand.filter(
      { session_id: body.session_id, status: 'pending' },
      { sort: 'created_date', limit: 1 }
    );
    if (!items.length) return Response.json({ empty: true });

    const cmd = items[0];
    const validation = validateQueuedLocalCommand(cmd);
    if (!validation.ok) {
      await base44.asServiceRole.entities.LocalCommand.update(cmd.id, {
        status: 'failed',
        error: 'Rejected by local bridge safety contract: ' + validation.error,
      });
      return Response.json({ error: 'queued command rejected by safety contract', command_id: cmd.id }, { status: 409 });
    }

    await base44.asServiceRole.entities.LocalCommand.update(cmd.id, { status: 'running' });
    return Response.json({
      command_id: cmd.id,
      type: cmd.type,
      command: cmd.command,
      args: cmd.args || {},
    });
  } catch (error) {
    return Response.json({ error: 'Unable to poll local bridge' }, { status: 500 });
  }
}
