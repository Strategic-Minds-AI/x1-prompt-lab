// Legacy bridge polling is intentionally disabled during X1 migration.
// Pending LocalCommand records must not be returned to a bridge for execution.
// Replace this endpoint only with authenticated, typed X1 leases after contract
// and tenant-isolation tests pass.
export default async function bridgePoll() {
  return Response.json(
    {
      error: "LEGACY_COMMAND_BRIDGE_DISABLED",
      message: "Legacy LocalCommand dispatch is disabled. No command was leased or returned."
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
