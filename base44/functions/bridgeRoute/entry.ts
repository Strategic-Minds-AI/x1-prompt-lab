import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const files = body.files || [];
    if (!files.length) return Response.json({});
    const prompt =
      'You are an intelligent file organizer. Given this list of files (path, size, extension), decide the best destination subfolder name for each. Use clear category names such as: Documents, Images, Videos, Code, Archives, Spreadsheets, Music, Installers, PDFs, Presentations, Other. Return a JSON object mapping each file path to a single folder name (just the folder name, no slashes).\n\nFiles:\n' +
      JSON.stringify(files.slice(0, 200));
    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: { type: 'object', additionalProperties: { type: 'string' } },
    });
    return Response.json(res);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}