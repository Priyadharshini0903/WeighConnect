import oracledb from "oracledb";

export async function getOracleConnection() {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const host = process.env.ORACLE_HOST;
  const port = process.env.ORACLE_PORT || "1521";
  const service = process.env.ORACLE_SERVICE;

  if (!user || !password || !host || !service) {
    throw new Error("Oracle environment configuration is incomplete.");
  }

  const connection = await oracledb.getConnection({
    user,
    password,
    connectString: `${host}:${port}/${service}`,
    connectTimeout: 40,
  });

  return connection;
}