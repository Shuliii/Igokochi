import mysql from "mysql2/promise";
console.log(process.env.DB_PORT);

export const db = mysql.createPool({
  host: process.env.DB_HOST || "",
  port: process.env.DB_PORT || "",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "igokochi_pass",
  database: process.env.DB_NAME || "igokochi",
  waitForConnections: true,
  connectionLimit: 10,
});
