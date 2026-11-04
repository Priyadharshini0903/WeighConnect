
import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOracleConnection } from "@/lib/oracle";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    connection = await getOracleConnection();

    // 1. Get users from USER_MASTER
    const userResult = await connection.execute(
      `SELECT *
       FROM USER_MASTER
       WHERE TMP_DELETE = 0
       ORDER BY RECORD_ID`,
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    // 2. Get available roles from DROPDOWN_MASTER
    const roleResult = await connection.execute(
      `SELECT *
        FROM DROPDOWN_MASTER
        WHERE DROPDOWN_NAME = 'role_id'
        AND TMP_DELETE = 0`,
      [],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    const users = (userResult.rows || []).map((row: any) => ({
      id: String(row.RECORD_ID ?? ""),
      firstName: row.FIRST_NAME ?? "",
      lastName: row.LAST_NAME ?? "",
      email: row.EMAIL ?? "",
      roleId: row.ROLE_ID ?? "",
      status: row.APPROVED === "True" ? "Active" : "Inactive",
      approved: row.APPROVED ?? "False",
      emailValidated: row.EMAIL_VALIDATED ?? "False",
      clientIp: row.CLIENT_IP ?? "",
    }));

    const roles = (roleResult.rows || []).map((row: any) => ({
      value: row.DROPDOWN_VALUE ?? "",
      label: row.DROPDOWN_VALUE ?? "",
    }));

    return NextResponse.json({
      success: true,
      users,
      roles,
      totalRecords: users.length,
    });

  } catch (error) {
    console.error("MANAGE USERS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve users from Oracle.",
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
