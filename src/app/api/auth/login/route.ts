
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import oracledb from "oracledb";
import { getOracleConnection } from "@/lib/oracle";

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();

    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    // 1. Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please enter email." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Please enter password." },
        { status: 400 }
      );
    }

    // 2. Connect to Oracle
    connection = await getOracleConnection();

    // 3. Fetch user and role details
    const result = await connection.execute(
      `SELECT
          s.RECORD_ID,
          s.EMAIL,
          s.PASSWORD,
          s.FIRST_NAME,
          s.LAST_NAME,
          s.ROLE_ID,
          s.APPROVED,
          s.EMAIL_VALIDATED,
          r.DEFAULT_PAGE,
          r.PAGE_ACCESS,
          r.CONTROL_ACCESS,
          r.ROLE_NAME,
          r.ROLE_ID
       FROM USER_MASTER s
       LEFT JOIN ROLE_MASTER r
          ON s.ROLE_ID = r.ROLE_NAME
       WHERE s.EMAIL = :email`,
      { email },
     {
  outFormat: oracledb.OUT_FORMAT_ARRAY,
  fetchInfo: {
    PAGE_ACCESS: { type: oracledb.STRING },
    CONTROL_ACCESS: { type: oracledb.STRING },
  },
}
    );

    // 4. Convert Oracle array into a normal JavaScript object
    const values = result.rows?.[0] as unknown[] | undefined;

    if (!values) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is not registered.",
        },
        { status: 401 }
      );
    }

    const user = {
      RECORD_ID: values[0],
      EMAIL: values[1],
      PASSWORD: values[2],
      FIRST_NAME: values[3],
      LAST_NAME: values[4],
      ROLE_ID: values[5],
      APPROVED: values[6],
      EMAIL_VALIDATED: values[7],
      DEFAULT_PAGE: values[8],
      PAGE_ACCESS: values[9],
      CONTROL_ACCESS: values[10],
      ROLE_NAME: values[11],
      ROLE_MASTER_ROLE_ID: values[12],
    };

    // 5. Compare password directly, matching the PHP application
    if (password !== String(user.PASSWORD ?? "")) {
      return NextResponse.json(
        {
          success: false,
          message: "Password Not matching!!",
        },
        { status: 401 }
      );
    }

    // 6. Check account approval
    if (String(user.APPROVED).toLowerCase() !== "true") {
      return NextResponse.json(
        {
          success: false,
          message: "This email Address is not activated!!",
        },
        { status: 403 }
      );
    }

    // 7. Check email verification
    if (String(user.EMAIL_VALIDATED).toLowerCase() !== "true") {
      return NextResponse.json(
        {
          success: false,
          message: "This email Address is not verified yet!!",
        },
        { status: 403 }
      );
    }

    // 8. Create JWT
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      throw new Error("AUTH_SECRET is not configured.");
    }

    const secretKey = new TextEncoder().encode(secret);

    const token = await new SignJWT({
      userId: String(user.RECORD_ID),
      email: String(user.EMAIL),
      userName: String(user.FIRST_NAME ?? ""),
      lastName: String(user.LAST_NAME ?? ""),
      roleId: String(user.ROLE_ID ?? ""),
      roleName: String(user.ROLE_NAME ?? ""),
      defaultPage: String(user.DEFAULT_PAGE ?? ""),
      pageAccess: user.PAGE_ACCESS ?? null,
      controlAccess: user.CONTROL_ACCESS ?? null,
      companyId: 1,
      userDevice: "PC",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secretKey);

    // 9. Store login session in HTTP-only cookie
    const cookieStore = await cookies();

    cookieStore.set("weighconnect_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    // 10. Login successful
    return NextResponse.json({
      success: true,
      message: "Login successful.",
      redirectTo: "/plant-live-transactions",
    });

 } catch (error) {
  console.error("LOGIN API ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown login error",
    },
    { status: 500 }
  );

  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
