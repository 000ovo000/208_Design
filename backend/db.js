require("dotenv").config();

const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "zlylt1106",//换成自己的密码
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "kinlight_db",
  dateStrings: true,
});

module.exports = db;
