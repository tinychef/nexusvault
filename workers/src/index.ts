/**
 * NexusVault Sync Worker
 *
 * Phase 3 implementation: Real-time sync backend using Cloudflare Workers,
 * Durable Objects for per-vault state, and R2 for binary .loro file storage.
 *
 * Current state: skeleton — returns service info. Full implementation in Phase 3.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          service: "NexusVault Sync",
          version: "0.1.0",
          status: "not-implemented",
          phase: "Phase 3 pending",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("NexusVault Sync — not yet implemented", { status: 501 });
  },
};

/** Durable Object for per-vault real-time sync state (Phase 3) */
export class VaultSync {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Record<string, unknown>,
  ) {}

  async fetch(_request: Request): Promise<Response> {
    return new Response("VaultSync Durable Object — Phase 3 pending", { status: 501 });
  }
}
