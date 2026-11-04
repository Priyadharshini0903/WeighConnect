
import { NextRequest, NextResponse } from "next/server";
import { getOracleConnection } from "@/lib/oracle";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET;

export async function POST(request: NextRequest) {
  let connection;

  try {
    // Verify login session
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

    await jwtVerify(token, new TextEncoder().encode(AUTH_SECRET));

    // Read submitted data
    const body = await request.json();

    const email = String(body.email ?? "").trim();
    const role = String(body.role ?? "").trim();
    const status = body.status === "Active" ? "True" : "False";

    if (!email || !role) {
      return NextResponse.json(
        { success: false, message: "Email and role are required." },
        { status: 400 }
      );
    }

    connection = await getOracleConnection();

    // Same update behaviour as the original PHP editUser() model
    const result = await connection.execute(
      `UPDATE USER_MASTER
       SET ROLE_ID = :role,
           APPROVED = :approved
       WHERE EMAIL = :email`,
      {
        role,
        approved: status,
        email,
      }
    );

    if (!result.rowsAffected) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }

    console.error("UPDATE USER ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update user." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
