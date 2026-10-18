import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const S = base44.asServiceRole;
    const { accessToken } = await S.connectors.getConnection('github');
    const auth = { Authorization: 'Bearer ' + accessToken, Accept: 'application/vnd.github+json', 'User-Agent': 'PromptLab-Orchestrator' };

    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&direction=desc', {
      headers: auth,
      signal: AbortSignal.timeout(15000),
    });
    if (!reposRes.ok) {
      const detail = await reposRes.text();
      return Response.json({ error: 'github api error', status: reposRes.status, detail }, { status: 502 });
    }
    const repos = await reposRes.json();

    const recent = (repos || [])
      .filter((r) => r.pushed_at && new Date(r.pushed_at) >= new Date(since))
      .map((r) => ({ name: r.full_name, pushed: r.pushed_at, stars: r.stargazers_count, open_issues: r.open_issues_count, url: r.html_url, language: r.language }))
      .slice(0, 15);

    let digest = '';
    try {
      const r = await S.integrations.Core.InvokeLLM({
        prompt:
          'You are the PromptLab system orchestrator. Summarize GitHub activity into a concise proactive digest: total repos tracked, number active in the last 7 days, the most active repos, and ONE suggested next action (review a repo, ingest a project into the library, flag stale code, or open an issue). Be terse and actionable.\n\nData:\n' +
          JSON.stringify({ total_repos: repos.length, active_last_7d: recent.length, recent }),
        response_json_schema: {
          type: 'object',
          properties: { summary: { type: 'string' }, next_action: { type: 'string' } },
        },
      });
      const d = r && typeof r === 'object' ? r : {};
      digest = (d.summary || '') + '\nNext action: ' + (d.next_action || '');
    } catch (e) {
      digest = 'Tracked ' + repos.length + ' repos; ' + recent.length + ' active in last 7d.';
    }

    const msg =
      '🐙 GitHub Scan\n' +
      digest +
      (recent.length ? '\n\nActive repos (last 7d):\n' + recent.map((r) => '• ' + r.name + ' — issues: ' + r.open_issues + (r.language ? ' [' + r.language + ']' : '')).join('\n') : '\n\nNo repo pushes in the last 7 days.');

    await S.entities.AgentMessage.create({
      agent_name: 'orchestrator',
      role: 'assistant',
      content: msg,
      target_agent: 'all',
      channel: 'bus',
    });

    return Response.json({ ok: true, total_repos: repos.length, active: recent.length, digest });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}