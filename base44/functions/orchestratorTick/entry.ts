import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const S = base44.asServiceRole;

    const [undoneRes, doneRes, bridgesRes, busRes] = await Promise.allSettled([
      S.entities.BootstrapTask.filter({ done: false }, { sort: 'order', limit: 100 }),
      S.entities.BootstrapTask.filter({ done: true }, { limit: 100 }),
      S.entities.LocalBridge.filter({ status: 'online' }, { limit: 10 }),
      S.entities.AgentMessage.filter({}, { sort: '-created_date', limit: 5 }),
    ]);

    const tasks = undoneRes.status === 'fulfilled' ? undoneRes.value.items : [];
    const done = doneRes.status === 'fulfilled' ? doneRes.value.items : [];
    const bridges = bridgesRes.status === 'fulfilled' ? bridgesRes.value.items : [];
    const recent = busRes.status === 'fulfilled' ? busRes.value.items : [];

    const bridgeOnline = bridges.length > 0;
    const nextTask = tasks[0] || null;
    const state = {
      totalTasks: tasks.length + done.length,
      doneCount: done.length,
      undoneCount: tasks.length,
      bridgeOnline,
      bridgeName: bridges[0]?.computer_name || null,
      nextTask: nextTask ? { phase: nextTask.phase, title: nextTask.title, order: nextTask.order } : null,
      recentBus: recent.map((m) => ({ agent: m.agent_name, content: (m.content || '').slice(0, 120) })),
    };

    let directive = '';
    try {
      const r = await S.integrations.Core.InvokeLLM({
        prompt:
          'You are the PromptLab system orchestrator. Given system state, produce a concise orchestration directive: a one-line status, the single highest-priority next action to advance the roadmap, and any risk or adjustment needed. Be terse and actionable.',
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            next_action: { type: 'string' },
            risk: { type: 'string' },
          },
        },
      });
      const d = r && typeof r === 'object' ? r : {};
      directive = `Status: ${d.status || ''}\nNext action: ${d.next_action || ''}\nRisk: ${d.risk || ''}`;
    } catch (e) {
      directive = `Status: ${done.length}/${state.totalTasks} done, bridge ${bridgeOnline ? 'online' : 'offline'}.\nNext action: ${nextTask ? nextTask.phase + ' — ' + nextTask.title : 'roadmap complete'}.\nRisk: ${bridgeOnline ? 'none' : 'bridge offline — local systems unreachable.'}`;
    }

    const msg =
      '🛰️ Orchestrator Tick\n' +
      directive +
      '\n\nNext task: ' + (nextTask ? nextTask.phase + ' → ' + nextTask.title : 'none — roadmap complete');

    await S.entities.AgentMessage.create({
      agent_name: 'orchestrator',
      role: 'assistant',
      content: msg,
      target_agent: 'all',
      channel: 'bus',
    });

    return Response.json({ ok: true, state, directive });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}