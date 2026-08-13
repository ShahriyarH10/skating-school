import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "oss-token";
const ISSUER = "online-skating-school";
const AUDIENCE = "oss-dashboard";
const SESSION_SECONDS = 60 * 60 * 12;

function getSecret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production");
    return new TextEncoder().encode("dev-only-secret-change-this-before-production-please");
  }
  if (value.length < 32 && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  return new TextEncoder().encode(value);
}

async function sessionPayload(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}

export async function signToken(payload) {
  return sessionPayload(payload);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER, audience: AUDIENCE });
    return payload;
  } catch {
    return null;
  }
}

function isSecureRequest(request) {
  if (!request) return process.env.NODE_ENV === "production";
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  try { return new URL(request.url).protocol === "https:"; } catch { return false; }
}

export async function setAuthCookie(token, request) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}

export async function removeAuthCookie(request) {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, secure: isSecureRequest(request), sameSite: "lax", maxAge: 0, path: "/" });
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

export function unauthorizedResponse() { return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } }); }
export function forbiddenResponse() { return Response.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } }); }

export function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}
