// Legacy arbitrary-command bridge is intentionally disabled during X1 migration.
// Do not restore shell-command dispatch here. Replace this endpoint only with a
// typed, allowlisted, tenant-scoped X1 work-packet adapter plus independent tests.
export default async function bridgeCommand() {
  return Response.json(
    {
      error: "LEGACY_COMMAND_BRIDGE_DISABLED",
      message: "Submit structured work through the approved X1 control-plane contract. Arbitrary command strings are not accepted."
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );
}
