import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const message = (body?.message || body?.body || '').toString();
    if (!message) return Response.json({ error: 'message required' }, { status: 400 });

    const sid = secrets.get('TWILIO_ACCOUNT_SID');
    const token = secrets.get('TWILIO_AUTH_TOKEN');
    const from = secrets.get('TWILIO_WHATSAPP_FROM');
    const to = secrets.get('USER_WHATSAPP_TO');
    if (!sid || !token || !from || !to) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const auth = btoa(`${sid}:${token}`);
    const form = new URLSearchParams();
    form.append('From', from);
    form.append('To', to);
    form.append('Body', message.slice(0, 1500));

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data?.error_message || data?.message || 'Twilio error' }, { status: 502 });
    return Response.json({ sid: data.sid, status: data.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}