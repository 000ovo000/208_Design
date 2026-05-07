const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "lg104HH924cc1229",
  database: process.env.DB_NAME || "kinlight",
  dateStrings: true,
});

module.exports = db;
