import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

// Simple in-memory rate limiter (per-instance, best effort).
// For stronger guarantees across instances, use a shared store (Redis, Upstash, etc.).
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max per window per IP per route

type RateLimitEntry = {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  // Netlify/Proxies typically set x-forwarded-for
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    return xff.split(",")[0].trim()
  }
  return request.ip ?? "unknown"
}

function isRateLimited(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname

  // Only apply to sensitive POST API routes
  const isSensitivePost =
    request.method === "POST" &&
    (pathname.startsWith("/api/change-password") ||
      pathname.startsWith("/api/profile/update") ||
      pathname.startsWith("/api/availability/save"))

  if (!isSensitivePost) {
    return false
  }

  const ip = getClientIp(request)
  const key = `${ip}:${pathname}`
  const now = Date.now()

  const existing = rateLimitStore.get(key)
  if (!existing) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return false
  }

  const elapsed = now - existing.windowStart
  if (elapsed > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return false
  }

  // Same window
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  existing.count += 1
  rateLimitStore.set(key, existing)
  return false
}

export default async function proxy(request: NextRequest) {
  if (isRateLimited(request)) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }

  return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}