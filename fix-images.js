const mysql = require("mysql2/promise");
const db = require("./src/config/database");

async function updateImages() {
  const c = await mysql.createConnection({
    host: db.host,
    user: db.user,
    password: db.password,
    port: db.port,
    database: db.database,
  });

  // Cập nhật poster cho các phim thiếu
  await c.query(
    "UPDATE movies SET poster_url='/images/kungfupanda4.svg' WHERE id=8"
  );
  await c.query(
    "UPDATE movies SET poster_url='/images/godzilla-kong.svg' WHERE id=9"
  );
  await c.query("UPDATE movies SET poster_url='/images/batman.svg' WHERE id=7");

  // Cập nhật banner cho tất cả phim
  await c.query(
    "UPDATE movies SET banner_url='/images/banner-default.svg' WHERE banner_url IS NULL OR banner_url=''"
  );

  console.log("Done!");
  await c.end();
}

updateImages();
