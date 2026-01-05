const mysql = require("mysql2/promise");
const db = require("./src/config/database");

async function fix() {
  const c = await mysql.createConnection({
    host: db.host,
    user: db.user,
    password: db.password,
    port: db.port,
    database: db.database,
  });

  // Cập nhật tất cả banner về local SVG
  await c.query("UPDATE movies SET banner_url = '/images/banner-default.svg'");

  console.log("All banners updated to local SVG!");
  await c.end();
}

fix();
