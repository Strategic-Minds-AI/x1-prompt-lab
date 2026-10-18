import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function decodeHeader(headers, name) {
  const h = (headers || []).find((x) => (x.name || '').toLowerCase() === name.toLowerCase());
  return h ? h.value : '';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const S = base44.asServiceRole;
    const { accessToken } = await S.connectors.getConnection('gmail');
    const auth = { Authorization: 'Bearer ' + accessToken };

    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+in:inbox&maxResults=10',
      { headers: auth, signal: AbortSignal.timeout(10000) }
    );
    if (!listRes.ok) return Response.json({ error: 'gmail list error' }, { status: 502 });
    const list = await listRes.json();
    const ids = (list.messages || []).map((m) => m.id);

    const emails = [];
    for (const id of ids) {
      const mRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/' + id + '?format=full&metadataHeaders=From&metadataHeaders=Subject',
        { headers: auth, signal: AbortSignal.timeout(10000) }
      );
      if (!mRes.ok) continue;
      const m = await mRes.json();
      emails.push({
        from: decodeHeader(m.payload && m.payload.headers, 'From'),
        subject: decodeHeader(m.payload && m.payload.headers, 'Subject'),
        snippet: (m.snippet || '').slice(0, 200),
      });
    }

    let digest = '';
    try {
      const r = await S.integrations.Core.InvokeLLM({
        prompt:
          'You are the PromptLab system orchestrator monitoring the agent inbox (ai@thevisioncortex.com). Summarize the unread emails: count, the most important/urgent ones (sender + subject), and ONE suggested action or reply. Be terse. Flag anything that needs the owner immediately.\n\nEmails:\n' +
          JSON.stringify(emails),
        response_json_schema: {
          type: 'object',
          properties: { summary: { type: 'string' }, important: { type: 'string' }, next_action: { type: 'string' } },
        },
      });
      const d = r && typeof r === 'object' ? r : {};
      digest = (d.summary || '') + '\nImportant: ' + (d.important || 'none') + '\nNext action: ' + (d.next_action || 'none');
    } catch (e) {
      digest = emails.length + ' unread emails.';
    }

    const msg =
      '📧 Inbox Monitor (' + emails.length + ' unread)\n' +
      digest +
      (emails.length ? '\n\nTop:\n' + emails.slice(0, 5).map((e) => '• ' + (e.subject || '(no subject)') + ' — ' + (e.from || '')).join('\n') : '');

    await S.entities.AgentMessage.create({
      agent_name: 'orchestrator',
      role: 'assistant',
      content: msg,
      target_agent: 'all',
      channel: 'bus',
    });

    return Response.json({ ok: true, unread: emails.length, digest });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}