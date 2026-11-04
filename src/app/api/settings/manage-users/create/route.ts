
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { randomBytes, scryptSync } from "crypto";
import oracledb from "oracledb";
import { getOracleConnection } from "@/lib/oracle";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

export async function POST(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "").trim();
    const status = String(body.status || "Active");

    // 1. Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    // 2. Verify the logged-in user
    const cookieStore = await cookies();
    const token = cookieStore.get("weighconnect_session")?.value;
    const secret = process.env.AUTH_SECRET;

    if (!token || !secret) {
      return NextResponse.json(
        { success: false, message: "Please log in again." },
        { status: 401 }
      );
    }

    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    const createdBy = String(payload.userName || "");

    // 3. Connect to Oracle
    connection = await getOracleConnection();

    // 4. Check duplicate email
    const existingUser = await connection.execute(
      `SELECT RECORD_ID
       FROM USER_MASTER
       WHERE LOWER(EMAIL) = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingUser.rows && existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "This email address already exists." },
        { status: 409 }
      );
    }

    // 5. Validate role against DROPDOWN_MASTER
    const roleResult = await connection.execute(
      `SELECT DROPDOWN_VALUE
       FROM DROPDOWN_MASTER
       WHERE LOWER(DROPDOWN_NAME) = 'role_id'
         AND TMP_DELETE = 0
         AND LOWER(DROPDOWN_VALUE) = LOWER(:role)`,
      { role },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const roleRow = roleResult.rows?.[0] as
      | { DROPDOWN_VALUE: string }
      | undefined;

    if (!roleRow) {
      return NextResponse.json(
        { success: false, message: "Please select a valid user role." },
        { status: 400 }
      );
    }

    // 6. Convert status and hash password
    const approved = status === "Active" ? "True" : "False";
    const hashedPassword = password;

    // 7. Insert new user
    await connection.execute(
      `INSERT INTO USER_MASTER
       (
         FIRST_NAME,
         LAST_NAME,
         EMAIL,
         PASSWORD,
         ROLE_ID,
         APPROVED,
         CREATED_BY,
         EMAIL_VALIDATED
       )
       VALUES
       (
         :firstName,
         :lastName,
         :email,
         :password,
         :role,
         :approved,
         :createdBy,
         :emailValidated
       )`,
      {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: roleRow.DROPDOWN_VALUE,
        approved,
        createdBy,
        emailValidated: "True",
      },
      { autoCommit: true }
    );

    return NextResponse.json({
      success: true,
      message: `User ${email} created successfully.`,
    });

  } catch (error) {
    console.error("CREATE USER API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error
          ? error.message
          : "Unable to create user.",
      },
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
