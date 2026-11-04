
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getOracleConnection } from "@/lib/oracle";

const AUTH_SECRET = process.env.AUTH_SECRET;

export async function POST(request: NextRequest) {
  let connection;

  try {
    // 1. Verify logged-in user
    if (!AUTH_SECRET) {
      return NextResponse.json(
        { success: false, message: "Authentication configuration missing." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("weighconnect_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Please log in again." },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const createdBy = [
      String(payload.userName ?? ""),
      String(payload.lastName ?? ""),
    ].filter(Boolean).join(" ");

    // 2. Read submitted permissions
    const body = await request.json();

    const roleName = String(body.roleName ?? "").trim();
    const defaultPage = String(body.defaultPage ?? "").trim();
    const pageAccess = body.pageAccess;
    const controlAccess = body.controlAccess;

    if (!roleName || !defaultPage) {
      return NextResponse.json(
        { success: false, message: "Select a role and default page." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(pageAccess) ||
      !Array.isArray(controlAccess) ||
      !controlAccess.every((item) =>
        ["Add", "Edit", "Delete"].includes(item)
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid permission data." },
        { status: 400 }
      );
    }

    // 3. Connect to Oracle
    connection = await getOracleConnection();

    // 4. Check whether this role already has permissions
    const existing = await connection.execute(
      `SELECT ROLE_NAME
       FROM ROLE_MASTER
       WHERE UPPER(TRIM(ROLE_NAME)) = UPPER(TRIM(:roleName))`,
      { roleName },
      { outFormat: 4002 }
    );

    const pageAccessJson = JSON.stringify(pageAccess);
    const controlAccessJson = JSON.stringify(controlAccess);

    // 5. Update existing permissions or insert new permissions
    if (existing.rows && existing.rows.length > 0) {
      await connection.execute(
        `UPDATE ROLE_MASTER
         SET DEFAULT_PAGE = :defaultPage,
             PAGE_ACCESS = :pageAccess,
             CONTROL_ACCESS = :controlAccess,
             LAST_UPDATED_BY = :updatedBy
         WHERE UPPER(TRIM(ROLE_NAME)) = UPPER(TRIM(:roleName))`,
        {
          roleName,
          defaultPage,
          pageAccess: pageAccessJson,
          controlAccess: controlAccessJson,
          updatedBy: createdBy,
        }
      );
    } else {
      await connection.execute(
        `INSERT INTO ROLE_MASTER
         (ROLE_NAME, DEFAULT_PAGE, PAGE_ACCESS, CONTROL_ACCESS, CREATED_BY)
         VALUES
         (:roleName, :defaultPage, :pageAccess, :controlAccess, :createdBy)`,
        {
          roleName,
          defaultPage,
          pageAccess: pageAccessJson,
          controlAccess: controlAccessJson,
          createdBy,
        }
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Role permissions saved successfully.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }

    console.error("Save access configuration error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save role permissions." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}