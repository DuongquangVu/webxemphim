const mysql = require("mysql2/promise");
const dbConfig = require("./database");

async function updateMovieImages() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
      database: dbConfig.database,
    });

    console.log("Đang cập nhật ảnh phim...");

    // Cập nhật poster và banner cho các phim
    const movieImages = [
      {
        id: 1,
        title: "Avengers: Endgame",
        poster_url:
          "https://image.tmdb.org/t/p/w500/or06FN3Dka5tuj1V8MfGbGjs3dE.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
      },
      {
        id: 2,
        title: "Spirited Away",
        poster_url:
          "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg",
      },
      {
        id: 3,
        title: "Parasite",
        poster_url:
          "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
      },
      {
        id: 4,
        title: "Dune: Part Two",
        poster_url:
          "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
      },
    ];

    // Thêm cột banner_url nếu chưa có
    try {
      await connection.query(`
        ALTER TABLE movies ADD COLUMN banner_url VARCHAR(255) AFTER poster_url
      `);
      console.log("✓ Đã thêm cột banner_url");
    } catch (e) {
      // Cột đã tồn tại
      console.log("- Cột banner_url đã tồn tại");
    }

    // Cập nhật từng phim
    for (const movie of movieImages) {
      await connection.query(
        `UPDATE movies SET poster_url = ?, banner_url = ? WHERE id = ?`,
        [movie.poster_url, movie.banner_url, movie.id]
      );
      console.log(`✓ Đã cập nhật: ${movie.title}`);
    }

    // Thêm thêm phim mẫu với ảnh
    const newMovies = [
      {
        title: "Oppenheimer",
        description:
          "Câu chuyện về J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử.",
        duration: 180,
        release_date: "2024-07-21",
        end_date: "2024-10-21",
        genre: "Tiểu sử, Lịch sử",
        director: "Christopher Nolan",
        actors: "Cillian Murphy, Emily Blunt, Robert Downey Jr.",
        poster_url:
          "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
        status: "now_showing",
        rating: 8.5,
      },
      {
        title: "Spider-Man: Across the Spider-Verse",
        description:
          "Miles Morales trở lại trong cuộc phiêu lưu đa vũ trụ với các Spider-People.",
        duration: 140,
        release_date: "2024-06-02",
        end_date: "2024-09-02",
        genre: "Hoạt hình, Hành động",
        director: "Joaquim Dos Santos",
        actors: "Shameik Moore, Hailee Steinfeld",
        poster_url:
          "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/nGxUxi3PfXDRm7Vg95VBNgNM8yc.jpg",
        status: "now_showing",
        rating: 8.7,
      },
      {
        title: "The Batman",
        description: "Batman khám phá những bí ẩn tăm tối của Gotham City.",
        duration: 176,
        release_date: "2024-03-04",
        end_date: "2024-06-04",
        genre: "Hành động, Tội phạm",
        director: "Matt Reeves",
        actors: "Robert Pattinson, Zoë Kravitz, Paul Dano",
        poster_url:
          "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fvber9AVy6tC6bL9.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
        status: "now_showing",
        rating: 7.8,
      },
      {
        title: "Kung Fu Panda 4",
        description: "Po tiếp tục hành trình trở thành Rồng Chiến Binh.",
        duration: 94,
        release_date: "2024-08-08",
        end_date: "2024-11-08",
        genre: "Hoạt hình, Hài",
        director: "Mike Mitchell",
        actors: "Jack Black, Awkwafina, Viola Davis",
        poster_url:
          "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg",
        status: "coming_soon",
        rating: 7.0,
      },
      {
        title: "Godzilla x Kong: The New Empire",
        description: "Godzilla và Kong cùng nhau đối đầu với mối đe dọa mới.",
        duration: 115,
        release_date: "2024-09-29",
        end_date: "2024-12-29",
        genre: "Hành động, Khoa học viễn tưởng",
        director: "Adam Wingard",
        actors: "Rebecca Hall, Brian Tyree Henry",
        poster_url:
          "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
        banner_url:
          "https://image.tmdb.org/t/p/original/veIyxxi5Gs8gvztLEW1Ysb8rrzs.jpg",
        status: "coming_soon",
        rating: 7.2,
      },
    ];

    // Thêm cột rating nếu chưa có
    try {
      await connection.query(`
        ALTER TABLE movies ADD COLUMN rating DECIMAL(3,1) DEFAULT 0 AFTER status
      `);
      console.log("✓ Đã thêm cột rating");
    } catch (e) {
      console.log("- Cột rating đã tồn tại");
    }

    // Insert phim mới
    for (const movie of newMovies) {
      try {
        await connection.query(
          `INSERT INTO movies (title, description, duration, release_date, end_date, genre, director, actors, poster_url, banner_url, status, rating) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE poster_url = VALUES(poster_url), banner_url = VALUES(banner_url)`,
          [
            movie.title,
            movie.description,
            movie.duration,
            movie.release_date,
            movie.end_date,
            movie.genre,
            movie.director,
            movie.actors,
            movie.poster_url,
            movie.banner_url,
            movie.status,
            movie.rating,
          ]
        );
        console.log(`✓ Đã thêm/cập nhật: ${movie.title}`);
      } catch (e) {
        console.log(`- Lỗi với ${movie.title}:`, e.message);
      }
    }

    // Cập nhật rating cho phim cũ
    await connection.query(`UPDATE movies SET rating = 8.4 WHERE id = 1`);
    await connection.query(`UPDATE movies SET rating = 8.6 WHERE id = 2`);
    await connection.query(`UPDATE movies SET rating = 8.5 WHERE id = 3`);
    await connection.query(`UPDATE movies SET rating = 8.8 WHERE id = 4`);

    console.log("\n========================================");
    console.log("CẬP NHẬT ẢNH PHIM THÀNH CÔNG!");
    console.log("========================================\n");
  } catch (error) {
    console.error("Lỗi:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy
updateMovieImages()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
