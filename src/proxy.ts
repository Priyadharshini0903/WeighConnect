import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET;

// Maps the new React pages to their original PHP permission URLs.
const legacyPageMapping: Record<string, string[]> = {
  "/plant-live-transactions": [
    "/Pages/GetCurrentTranscation",
    "/Pages/GetMinesTruckMaster",
  ],
  "/weighbridge": ["/weighbridge/wb"],
  "/reports": ["/Reports/index", "/bagcounterReports/index"],
  "/settings/plant-wb-configuration": [
    "/weighbridge/Configuration",
  ],
  "/settings/manage-users": ["/Users/manageUsers"],
  "/settings/access-configuration": ["/AccessManagement/index"],
};

function getPageAccess(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string"
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string"
        );
      }
    } catch {
      return [];
    }
  }

  return [];
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("weighconnect_session")?.value;

  if (!token || !AUTH_SECRET) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(AUTH_SECRET)
    );

    const currentPath = request.nextUrl.pathname;

    const pageAccess = getPageAccess(payload.pageAccess);

    const legacyUrls = legacyPageMapping[currentPath] ?? [];

    const hasPermission =
      pageAccess.includes(currentPath) ||
      legacyUrls.some((url) => pageAccess.includes(url));

    if (!hasPermission) {
      return new NextResponse(
        "Access Denied. You do not have permission to open this page.",
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/plant-live-transactions/:path*",
    "/weighbridge/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};