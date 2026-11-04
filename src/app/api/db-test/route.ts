
import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOracleConnection } from "@/lib/oracle";

export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    connection = await getOracleConnection();

    const result = await connection.execute(
      `SELECT
          s.RECORD_ID,
          s.EMAIL,
          s.FIRST_NAME,
          s.LAST_NAME,
          s.ROLE_ID,
          s.APPROVED,
          s.EMAIL_VALIDATED,
          r.DEFAULT_PAGE,
          r.ROLE_NAME,
          r.ROLE_ID AS ROLE_MASTER_ROLE_ID
       FROM USER_MASTER s
       LEFT JOIN ROLE_MASTER r
          ON s.ROLE_ID = r.ROLE_NAME
       WHERE s.EMAIL = :email`,
      { email: "admin@weighconnect.com" },
      { outFormat: oracledb.OUT_FORMAT_ARRAY }
    );

    const rows = (result.rows ?? []).map((row) => {
      const values = row as unknown[];

      return {
        RECORD_ID: values[0],
        EMAIL: values[1],
        FIRST_NAME: values[2],
        LAST_NAME: values[3],
        ROLE_ID: values[4],
        APPROVED: values[5],
        EMAIL_VALIDATED: values[6],
        DEFAULT_PAGE: values[7],
        ROLE_NAME: values[8],
        ROLE_MASTER_ROLE_ID: values[9],
      };
    });

    return NextResponse.json({
      success: true,
      message: "Login query executed successfully!",
      data: rows,
    });

  } catch (error) {
    console.error("DB TEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );

  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
