import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CONNECTOR_ID = "69db1e5e75a5f8c15c80cf34";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const title = (body?.title || 'promptlab-backup').toString().slice(0, 120);
    const content = body?.content;
    if (!content) return Response.json({ error: 'content required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    const fileName = `${title}.md`;
    const metadata = { name: fileName, mimeType: 'text/markdown' };
    const boundary = 'promptlab-' + Math.random().toString(36).slice(2);
    const multipart =
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: text/markdown\r\n\r\n' +
      content + '\r\n' +
      '--' + boundary + '--';

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'multipart/related; boundary=' + boundary,
        },
        body: multipart,
        signal: AbortSignal.timeout(15000),
      }
    );
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data?.error?.message || 'Drive API error' }, { status: 502 });
    return Response.json({ file_id: data.id, web_view_link: data.webViewLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}