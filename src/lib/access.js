import { db } from "@/lib/db";
import { getSession, forbiddenResponse, unauthorizedResponse } from "@/lib/auth";

export async function getAuthContext() {
  const session = await getSession();
  if (!session?.id || !session?.role) return null;
  const user = await db.user.findUnique({
    where: { id: String(session.id) },
    select: {
      id: true, name: true, email: true, role: true, active: true,
      instructor: { select: { id: true, clubId: true } },
      student: { select: { id: true, clubId: true } },
    },
  });
  if (!user?.active || user.role !== session.role) return null;
  return { session, user };
}

export async function requireContext(roles = []) {
  const ctx = await getAuthContext();
  if (!ctx) return { ctx: null, response: unauthorizedResponse() };
  if (roles.length && !roles.includes(ctx.user.role)) return { ctx: null, response: forbiddenResponse() };
  return { ctx, response: null };
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  let originUrl;
  try { originUrl = new URL(origin); } catch { return false; }

  const requestUrl = new URL(request.url);
  if (originUrl.origin === requestUrl.origin) return true; // direct connection, no proxy in front

  // Behind a reverse proxy / tunnel / forwarded port, request.url reflects
  // the internal host Next.js actually received, not the public URL the
  // browser sees — so trust the standard forwarded headers too.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const effectiveOrigin = `${forwardedProto || requestUrl.protocol.replace(":", "")}://${forwardedHost}`;
    if (originUrl.origin === effectiveOrigin) return true;
  }

  // Last resort: an explicitly configured trusted URL, for proxies that
  // don't forward X-Forwarded-* at all. Set this in .env if you're testing
  // through a tunnel/proxy and still see "Invalid origin".
  const trusted = process.env.NEXT_PUBLIC_APP_URL;
  if (trusted) {
    try { if (originUrl.origin === new URL(trusted).origin) return true; } catch {}
  }

  return false;
}