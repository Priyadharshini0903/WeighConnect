
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOracleConnection } from "@/lib/oracle";

// GET: Fetch all Plant Weighbridge Configurations
export async function GET() {
  let connection: oracledb.Connection | undefined;

  try {
    connection = await getOracleConnection();

    const result = await connection.execute(
      `SELECT
        WBID, PLANTCODE, PLANTID, WBNAME, WBLOCATION, WBTYPE,
        DIOIP, DIOPORT, DIOSTATUS,
        RFIDIP1, RFIDPORT1, RFSTATUS1, RFTYPE1,
        RFIDIP2, RFIDPORT2, RFSTATUS2, RFTYPE2,
        DSPIP1, DSPPORT1, DSPTYPE1, DSPSTATUS1,
        DSPIP2, DSPPORT2, DSPTYPE2, DSPSTATUS2,
        WBSTATUS, CLIENTIP, STARTDATETIME,
        RTSP_URL1, RTSP_URL2, WBRUNMODE, ISRUNNING,
        SYNCTIME, WBPROCESSTYPE, INDICATORTYPE
      FROM WEIGHBRIDGE_CONFIGURATION
      WHERE WBLOCATION NOT LIKE '%A-Block%'
        AND WBLOCATION NOT LIKE '%B-Block%'
      ORDER BY WBID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_ARRAY }
    );

    const columns = [
      "WBID", "PLANTCODE", "PLANTID", "WBNAME", "WBLOCATION", "WBTYPE",
      "DIOIP", "DIOPORT", "DIOSTATUS",
      "RFIDIP1", "RFIDPORT1", "RFSTATUS1", "RFTYPE1",
      "RFIDIP2", "RFIDPORT2", "RFSTATUS2", "RFTYPE2",
      "DSPIP1", "DSPPORT1", "DSPTYPE1", "DSPSTATUS1",
      "DSPIP2", "DSPPORT2", "DSPTYPE2", "DSPSTATUS2",
      "WBSTATUS", "CLIENTIP", "STARTDATETIME",
      "RTSP_URL1", "RTSP_URL2", "WBRUNMODE", "ISRUNNING",
      "SYNCTIME", "WBPROCESSTYPE", "INDICATORTYPE",
    ];

    const records = (result.rows || []).map((row) => {
      const values = row as unknown[];

      return Object.fromEntries(
        columns.map((column, index) => [
          column,
          values[index] instanceof Date
            ? (values[index] as Date).toISOString()
            : values[index] ?? null,
        ])
      );
    });

    return NextResponse.json({
      success: true,
      records,
      totalRecords: records.length,
    });
  } catch (error) {
    console.error("PLANT WB CONFIGURATION GET ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch weighbridge configurations." },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// PUT: Update an existing Plant Weighbridge Configuration
export async function PUT(request: NextRequest) {
  let connection: oracledb.Connection | undefined;

  try {
    const body = await request.json();

    const wbId = Number(body.WBID);

    if (!Number.isInteger(wbId) || wbId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid WBID is required." },
        { status: 400 }
      );
    }

    // These fields are present in the 35-column structure you shared.
    const fields = [
      "PLANTCODE",
      "PLANTID",
      "WBNAME",
      "WBLOCATION",
      "WBTYPE",
      "DIOIP",
      "DIOPORT",
      "RFIDIP1",
      "RFIDPORT1",
      "RFIDIP2",
      "RFIDPORT2",
      "DSPIP1",
      "DSPPORT1",
      "DSPIP2",
      "DSPPORT2",
      "WBSTATUS",
      "RTSP_URL1",
      "RTSP_URL2",
      "WBRUNMODE",
      "WBPROCESSTYPE",
      "INDICATORTYPE",
    ];

    // These four fields are used by the original PHP model,
    // but were not present in the 35-column structure shared.
    const optionalFields = [
      "ENTRYTIMEOUT",
      "WEIGHTSTABLETIME",
      "PROCESSCLEARTIMEOUT",
      "PROCESSCLEARWEIGHT",
    ];

    connection = await getOracleConnection();

    // Check which optional columns actually exist in Oracle.
    const metadata = await connection.execute(
      `SELECT COLUMN_NAME
       FROM USER_TAB_COLUMNS
       WHERE TABLE_NAME = 'WEIGHBRIDGE_CONFIGURATION'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_ARRAY }
    );

    const existingColumns = new Set(
      (metadata.rows || []).map((row) =>
        String((row as unknown[])[0]).toUpperCase()
      )
    );

    const availableOptionalFields = optionalFields.filter((field) =>
      existingColumns.has(field)
    );

    const updateFields = [...fields, ...availableOptionalFields];

    const binds: Record<string, string | number | null> = {
      WBID: wbId,
    };

    for (const field of updateFields) {
      const value = body[field];

      // Do not allow undefined values to enter the SQL bind object.
      binds[field] =
        value === undefined || value === ""
          ? null
          : value;
    }

    const setClause = updateFields
      .map((field) => `${field} = :${field}`)
      .join(", ");

    const sql = `
      UPDATE WEIGHBRIDGE_CONFIGURATION
      SET ${setClause}
      WHERE WBID = :WBID
    `;

    const result = await connection.execute(sql, binds, {
      autoCommit: true,
    });

    if (!result.rowsAffected || result.rowsAffected === 0) {
      return NextResponse.json(
        { success: false, message: "Weighbridge record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Weighbridge configuration updated successfully.",
      updatedWBID: wbId,
      updatedRows: result.rowsAffected,
      skippedOptionalFields: optionalFields.filter(
        (field) => !existingColumns.has(field)
      ),
    });
  } catch (error) {
    console.error("PLANT WB CONFIGURATION PUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update weighbridge configuration.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
