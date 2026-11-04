
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import oracledb from "oracledb";
import { getOracleConnection } from "@/lib/oracle";

// Pages included in the current React migration scope
const availablePages = [
  {
    id: "1",
    name: "Plant Live Transactions",
    url: "/plant-live-transactions",
  },
  {
    id: "2",
    name: "Weighbridge",
    url: "/weighbridge",
  },
  {
    id: "3",
    name: "Reports",
    url: "/reports",
  },
  {
    id: "4",
    name: "Plant WB Configuration",
    url: "/settings/plant-wb-configuration",
  },
  {
    id: "5",
    name: "Manage Users",
    url: "/settings/manage-users",
  },
  {
    id: "6",
    name: "Access Configuration",
    url: "/settings/access-configuration",
  },
];

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String);
  }

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("weighconnect_session")?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret) {
    throw new Error("UNAUTHORIZED");
  }

  const secretKey = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, secretKey);

  return payload;
}

export async function GET(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    await verifySession();

    const roleName = request.nextUrl.searchParams.get("roleName")?.trim();

    connection = await getOracleConnection();

    // 1. Load available roles
    const roleResult = await connection.execute(
      `SELECT DROPDOWN_VALUE
       FROM DROPDOWN_MASTER
       WHERE DROPDOWN_NAME = 'role_id'
         AND TMP_DELETE = 0`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const roles = (roleResult.rows || []).map((row: any) => ({
      value: String(row.DROPDOWN_VALUE),
      label: String(row.DROPDOWN_VALUE),
    }));

    // 2. Return available pages
    // If no role is selected, no saved permission lookup is needed.
    if (!roleName) {
      return NextResponse.json({
        success: true,
        roles,
        pages: availablePages,
        permission: null,
      });
    }

    // 3. Load saved permissions for the selected role
    const permissionResult = await connection.execute(
      `SELECT ROLE_NAME, DEFAULT_PAGE, PAGE_ACCESS, CONTROL_ACCESS
       FROM ROLE_MASTER
       WHERE UPPER(TRIM(ROLE_NAME)) = UPPER(TRIM(:roleName))`,
      { roleName },
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchInfo: {
          PAGE_ACCESS: { type: oracledb.STRING },
          CONTROL_ACCESS: { type: oracledb.STRING },
        },
      }
    );

    const row = permissionResult.rows?.[0] as
      | {
          ROLE_NAME: string;
          DEFAULT_PAGE: string | null;
          PAGE_ACCESS: unknown;
          CONTROL_ACCESS: unknown;
        }
      | undefined;

    const permission = row
      ? {
          roleName: String(row.ROLE_NAME),
          defaultPage: String(row.DEFAULT_PAGE || ""),
          pageAccess: parseJsonArray(row.PAGE_ACCESS),
          controlAccess: parseJsonArray(row.CONTROL_ACCESS),
        }
      : null;

    return NextResponse.json({
      success: true,
      roles,
      pages: availablePages,
      permission,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Please log in again." },
        { status: 401 }
      );
    }

    console.error("ACCESS CONFIGURATION GET ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load access configuration." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Oracle connection close error:", error);
      }
    }
  }
}
