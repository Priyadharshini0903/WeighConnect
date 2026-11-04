import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getOracleConnection } from "@/lib/oracle";

export async function POST(request: NextRequest) {
  let connection;

  try {
    // 1. Verify the logged-in user's session
    const cookieStore = await cookies();
    const token = cookieStore.get("weighconnect_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error("AUTH_SECRET is not configured.");
    }

    await jwtVerify(token, new TextEncoder().encode(secret));

    // 2. Read the user ID and new status
    const body = await request.json();
    const { id, status } = body;

    if (!id || !["Active", "Inactive"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID or status." },
        { status: 400 }
      );
    }

    // 3. Convert React status to the Oracle value
    const approved = status === "Active" ? "True" : "False";

    // 4. Update Oracle
    connection = await getOracleConnection();

    const result = await connection.execute(
      `UPDATE USER_MASTER
       SET APPROVED = :approved
       WHERE RECORD_ID = :id
         AND TMP_DELETE = 0`,
      { approved, id },
      { autoCommit: true }
    );

    if (!result.rowsAffected) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}.`,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update user status." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}