import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const S = base44.asServiceRole;
    const { accessToken } = await S.connectors.getConnection('supabase');
    const auth = { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' };

    const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: auth,
      signal: AbortSignal.timeout(15000),
    });
    if (!projectsRes.ok) {
      const detail = await projectsRes.text();
      return Response.json({ error: 'supabase api error', status: projectsRes.status, detail }, { status: 502 });
    }
    const projects = await projectsRes.json();

    const inspected = [];
    for (const p of (projects || []).slice(0, 5)) {
      const ref = p.id;
      let tables = [];
      try {
        const schemaRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query/read-only`, {
          method: 'POST',
          headers: auth,
          body: JSON.stringify({ query: "select table_name from information_schema.tables where table_schema='public' order by table_name;" }),
          signal: AbortSignal.timeout(15000),
        });
        if (schemaRes.ok) {
          const body = await schemaRes.json();
          // PostgREST-style or rows; fall back gracefully
          const rows = Array.isArray(body) ? body : (body?.rows || body?.data || []);
          tables = rows.map((r) => r.table_name || r[0]).filter(Boolean);
        }
      } catch (e) {
        tables = [];
      }
      inspected.push({
        name: p.name,
        ref,
        region: p.region,
        status: p.status,
        tables: tables.length,
        table_names: tables.slice(0, 20),
      });
    }

    let digest = '';
    try {
      const r = await S.integrations.Core.InvokeLLM({
        prompt:
          'You are the PromptLab system orchestrator. Summarize Supabase project state into a concise proactive digest: number of projects, per-project table counts, and ONE suggested next action (audit a schema, back up data, flag an idle project, or ingest a table into the prompt library). Be terse and actionable.\n\nData:\n' +
          JSON.stringify({ total_projects: (projects || []).length, inspected }),
        response_json_schema: {
          type: 'object',
          properties: { summary: { type: 'string' }, next_action: { type: 'string' } },
        },
      });
      const d = r && typeof r === 'object' ? r : {};
      digest = (d.summary || '') + '\nNext action: ' + (d.next_action || '');
    } catch (e) {
      digest = 'Tracked ' + (projects || []).length + ' Supabase projects; ' + inspected.reduce((s, p) => s + p.tables, 0) + ' public tables across inspected projects.';
    }

    const msg =
      '🗄️ Supabase Scan\n' +
      digest +
      '\n\nProjects:\n' +
      inspected.map((p) => `• ${p.name} (${p.region || '—'}) — ${p.tables} tables [${p.status || '—'}]`).join('\n');

    await S.entities.AgentMessage.create({
      agent_name: 'orchestrator',
      role: 'assistant',
      content: msg,
      target_agent: 'all',
      channel: 'bus',
    });

    return Response.json({ ok: true, total_projects: (projects || []).length, inspected, digest });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}