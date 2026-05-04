const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "zlylt1106",
  database: "family_demo",
  dateStrings: true,
});

module.exports = db;
