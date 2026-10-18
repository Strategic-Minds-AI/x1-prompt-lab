import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (!body.session_id || !body.type || !body.command)
      return Response.json({ error: 'session_id, type, command required' }, { status: 400 });
    const created = await base44.entities.LocalCommand.create({
      session_id: body.session_id,
      type: body.type,
      command: body.command,
      args: body.args || {},
      status: 'pending',
    });
    return Response.json({ command_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}