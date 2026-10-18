import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeLocalCommand } from '../../shared/bridge-contract.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const normalized = normalizeLocalCommand(body);
    if (!normalized.ok) return Response.json({ error: normalized.error }, { status: normalized.status || 400 });

    const created = await base44.entities.LocalCommand.create(normalized.command);
    return Response.json({ command_id: created.id, type: normalized.command.type, operation: normalized.command.command || null });
  } catch (error) {
    return Response.json({ error: 'Unable to queue local command' }, { status: 500 });
  }
}
