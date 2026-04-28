import mysql from "mysql2/promise";
console.log(process.env.DB_PORT);

export const db = mysql.createPool({
  host: process.env.DB_HOST || "143.198.198.140",
  port: process.env.DB_PORT || 30306,
  user: process.env.DB_USER || "igokochi_user",
  password: process.env.DB_PASSWORD || "igokochi_pass",
  database: process.env.DB_NAME || "igokochi",
  waitForConnections: true,
  connectionLimit: 10,
});
