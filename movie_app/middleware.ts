import { NextRequest, NextResponse } from "next/server";

// Routes that don't need NFT verification
const PUBLIC_ROUTES = [
  "/nft",
  "/api/create-mint-transaction",
  "/api/complete-mint",
  "/api/verify-nft",
  "/_next",
  "/favicon.ico",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Always allow public routes ──────────────────────────────────
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ─── Check wallet session cookie ─────────────────────────────────
  const walletAddress = request.cookies.get("wallet_address")?.value;

  if (!walletAddress) {
    console.log(
      `[Middleware] No wallet session — redirecting ${pathname} → /nft`
    );
    return NextResponse.redirect(new URL("/nft", request.url));
  }

  // ─── Verify NFT on-chain via internal API ────────────────────────
  try {
    const verifyUrl = new URL("/api/verify-nft", request.url);
    verifyUrl.searchParams.set("wallet", walletAddress);

    const res = await fetch(verifyUrl.toString(), {
      headers: { "x-internal-secret": process.env.INTERNAL_SECRET || "" },
    });

    const data = await res.json();

    if (!data.valid) {
      console.log(
        `[Middleware] NFT invalid/expired for ${walletAddress} — redirecting → /nft`
      );
      const redirectUrl = new URL("/nft", request.url);
      redirectUrl.searchParams.set("reason", data.reason || "nft_required");
      return NextResponse.redirect(redirectUrl);
    }

    // ─── Pass NFT info to page via headers ───────────────────────
    const response = NextResponse.next();
    response.headers.set("x-nft-tier", data.tier.toString());
    response.headers.set("x-nft-tier-name", data.tierName);
    response.headers.set("x-nft-expires-at", data.expiresAt.toString());
    return response;
  } catch (error) {
    console.error("[Middleware] NFT verify failed:", error);
    // On error, fail open — don't block users due to RPC issues
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
