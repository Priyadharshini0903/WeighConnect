import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { getOracleConnection } from "@/lib/oracle";


export async function POST(request: NextRequest) {
  let connection;

  try {
    const body = await request.json();
    const transactionType = body.transactionType;

    // Validate transaction type
    if (!["C", "R", "O"].includes(transactionType)) {
      return NextResponse.json(
        { success: false, message: "Invalid transaction type" },
        { status: 400 }
      );
    }

    connection = await getOracleConnection();

    const bindParams = { transactionType };
    const options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    };

    // Transporter list
    const transporterResult = await connection.execute(
      `SELECT DISTINCT LOGICODE AS CODE, LOGIDESC AS NAME
       FROM TRANS
       WHERE TRANSTYPE = :transactionType`,
      bindParams,
      options
    );

    // Product list
    const productResult = await connection.execute(
      `SELECT DISTINCT PRODCODE AS CODE, PRODDESC AS NAME
       FROM TRANS
       WHERE TRANSTYPE = :transactionType`,
      bindParams,
      options
    );

    // Supplier list
    const supplierResult = await connection.execute(
      `SELECT DISTINCT SUPPCODE AS CODE, SUPPDESC AS NAME
       FROM TRANS
       WHERE TRANSTYPE = :transactionType`,
      bindParams,
      options
    );

    return NextResponse.json({
      success: true,
      transporters: transporterResult.rows,
      products: productResult.rows,
      suppliers: supplierResult.rows,
    });
  } catch (error) {
    console.error("Dropdown API error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load dropdown data" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}