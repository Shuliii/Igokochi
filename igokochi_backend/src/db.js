import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "igokochi_user",
  password: process.env.DB_PASSWORD || "igokochi_pass",
  database: process.env.DB_NAME || "igokochi",
  waitForConnections: true,
  connectionLimit: 10,
});
