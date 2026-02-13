import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-pwd") ||
    pathname.startsWith("/confirm") || // Supabase email confirmation
    pathname.startsWith("/change-pwd");

  // Routes accessible to authenticated non-hosts
  const isNotAHostRoute = pathname === "/not-a-host";

  // Redirect unauthenticated users to login (except for auth routes and not-a-host)
  if (!user && !isAuthRoute && !isNotAHostRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // For authenticated users, check if they're a host
  if (user && !isAuthRoute && !isNotAHostRoute) {
    const { data: host, error } = await supabase
      .from("pkt_host")
      .select("id")
      .eq("driver_id", user.sub)
      .single();

    if (error || !host) {
      const url = request.nextUrl.clone();
      url.pathname = "/not-a-host";
      return NextResponse.redirect(url);
    }

    // Block access only when the host has zero parkings or exactly one
    // incomplete parking. Hosts with 2+ parkings can always access the dashboard.
    const isCompleteSetupRoute = pathname === "/complete-setup";
    if (!isCompleteSetupRoute) {
      const { data: parkings } = await supabase
        .from("pkt_parking")
        .select("id, info_parcheggio_completed, prezzi_disponibilita_completed, descrizione_accesso_completed, galleria_foto_completed")
        .eq("host_id", host.id);

      const parkingList = Array.isArray(parkings) ? parkings : [];
      const needsSetup =
        parkingList.length === 0 ||
        (parkingList.length === 1 &&
          !(
            parkingList[0].info_parcheggio_completed &&
            parkingList[0].prezzi_disponibilita_completed &&
            parkingList[0].descrizione_accesso_completed &&
            parkingList[0].galleria_foto_completed
          ));

      if (needsSetup) {
        const url = request.nextUrl.clone();
        url.pathname = "/complete-setup";
        return NextResponse.redirect(url);
      }
    }

    // Redirect from login to dashboard (or complete-setup if already handled above)
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
