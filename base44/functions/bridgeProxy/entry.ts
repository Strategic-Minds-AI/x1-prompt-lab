import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getBridge } from '../../shared/bridge.ts';
import { validateOllamaProxyRequest } from '../../shared/bridge-contract.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { session_id } = body;
    const validation = validateOllamaProxyRequest(body);
    if (!validation.ok) return Response.json({ error: validation.error }, { status: validation.status || 400 });
    if (!session_id) return Response.json({ error: 'session_id required' }, { status: 400 });

    const bridge = await getBridge(base44, session_id);
    if (!bridge || bridge.status !== 'online') return Response.json({ error: 'bridge offline' }, { status: 409 });

    const request = validation.normalized;
    const created = await base44.entities.LocalCommand.create({
      session_id,
      type: 'proxy',
      command: request.url,
      args: { method: request.method, headers: request.headers, body: request.body },
      status: 'pending',
    });

    let done = false, attempts = 0, cmd;
    while (!done && attempts < 60) {
      await new Promise((r) => setTimeout(r, 1000));
      const { items } = await base44.asServiceRole.entities.LocalCommand.filter({ id: created.id, session_id }, { limit: 1 });
      cmd = items[0];
      if (cmd && (cmd.status === 'done' || cmd.status === 'failed')) done = true;
      attempts++;
    }
    if (!done) return Response.json({ error: 'timeout waiting for local Ollama', command_id: created.id }, { status: 504 });
    return Response.json({
      status: cmd.result?.status || 0,
      headers: cmd.result?.headers || {},
      body: cmd.output || '',
      error: cmd.error || null,
    });
  } catch (error) {
    return Response.json({ error: 'Unable to proxy local Ollama request' }, { status: 500 });
  }
}
