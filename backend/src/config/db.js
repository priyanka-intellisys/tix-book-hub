const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Password@123",
  database: process.env.DB_NAME || "priyanka",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const ensureColumn = async (connection, table, columns, name, definition) => {
  if (!columns.has(name)) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
};

const movieStatusDefinition = "ENUM('draft','upcoming','booking_open','now_showing','house_full','ended','cancelled','active','inactive','hidden') NOT NULL DEFAULT 'draft'";

const runSqlFile = async (connection, filePath) => {
  if (!fs.existsSync(filePath)) return;
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await connection.query(statement);
  }
};

const ensureUsersSchema = async (connection) => {
  const [columns] = await connection.query("SHOW COLUMNS FROM users");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  const idColumn = columnMap.get("id");

  if (idColumn && /int/i.test(idColumn.Type)) {
    await connection.query("ALTER TABLE users MODIFY id VARCHAR(24) NOT NULL");
  }

  await ensureColumn(connection, "users", columnMap, "status", "ENUM('active', 'blocked', 'pending') NOT NULL DEFAULT 'active'");
  await ensureColumn(connection, "users", columnMap, "image", "TEXT NULL");
  await ensureColumn(connection, "users", columnMap, "reset_password_token", "VARCHAR(255) NULL");
  await ensureColumn(connection, "users", columnMap, "reset_password_expires", "DATETIME NULL");
  await ensureColumn(connection, "users", columnMap, "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
};

const ensureMoviesSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      vendor VARCHAR(24) NULL,
      title VARCHAR(255) NOT NULL,
      language VARCHAR(255) NOT NULL,
      duration VARCHAR(80) NOT NULL,
      image TEXT NOT NULL,
      poster_url TEXT NULL,
      banner_url TEXT NULL,
      description TEXT NULL,
      theatre VARCHAR(255) NOT NULL,
      theatre_name VARCHAR(255) NULL,
      theatre_city VARCHAR(255) NULL,
      theatre_address TEXT NULL,
      screen_number VARCHAR(80) NULL,
      show_date VARCHAR(80) NULL,
      show_time VARCHAR(80) NULL,
      show_times JSON NULL,
      total_seats INT NOT NULL DEFAULT 120,
      regular_seats INT NOT NULL DEFAULT 0,
      prime_seats INT NOT NULL DEFAULT 0,
      vip_seats INT NOT NULL DEFAULT 0,
      booked_seats JSON NULL,
      ticket_price DECIMAL(10,2) NOT NULL DEFAULT 240,
      status ENUM('draft','upcoming','booking_open','now_showing','house_full','ended','cancelled','active','inactive','hidden') NOT NULL DEFAULT 'draft',
      genre VARCHAR(255) NOT NULL,
      cast TEXT NULL,
      director VARCHAR(255) NULL,
      release_date VARCHAR(80) NOT NULL,
      rating VARCHAR(80) NULL,
      hero VARCHAR(255) NULL,
      certificate VARCHAR(80) NULL,
      format VARCHAR(120) NOT NULL DEFAULT '2D',
      trailer_url TEXT NULL,
      trailer_file_url TEXT NULL,
      gallery_images JSON NULL,
      documents JSON NULL,
      interest_count VARCHAR(120) NULL,
      about_movie TEXT NULL,
      screen_name VARCHAR(120) NULL,
      city VARCHAR(150) NULL,
      location TEXT NULL,
      end_time VARCHAR(80) NULL,
      seat_layout JSON NULL,
      regular_rows INT NOT NULL DEFAULT 0,
      regular_seats_per_row INT NOT NULL DEFAULT 0,
      prime_rows INT NOT NULL DEFAULT 0,
      prime_seats_per_row INT NOT NULL DEFAULT 0,
      vip_rows INT NOT NULL DEFAULT 0,
      vip_seats_per_row INT NOT NULL DEFAULT 0,
      regular_rows_start VARCHAR(10) NULL,
      regular_rows_end VARCHAR(10) NULL,
      prime_rows_start VARCHAR(10) NULL,
      prime_rows_end VARCHAR(10) NULL,
      vip_rows_start VARCHAR(10) NULL,
      vip_rows_end VARCHAR(10) NULL,
      blocked_seats JSON NULL,
      regular_seat_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      premium_seat_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      vip_seat_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
      total_reviews INT NOT NULL DEFAULT 0,
      rating_distribution JSON NULL,
      is_offer_applicable BOOLEAN NOT NULL DEFAULT FALSE,
      offers JSON NULL,
      cast_members JSON NULL,
      crew_members JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movies_vendor_id (vendor_id),
      INDEX idx_movies_status (status)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM movies");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));

  await ensureColumn(connection, "movies", columnMap, "vendor_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "movies", columnMap, "vendor", "VARCHAR(24) NULL");
  await ensureColumn(connection, "movies", columnMap, "poster_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "banner_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "theatre_name", "VARCHAR(255) NULL");
  await ensureColumn(connection, "movies", columnMap, "theatre_city", "VARCHAR(255) NULL");
  await ensureColumn(connection, "movies", columnMap, "theatre_address", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "screen_number", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "show_date", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "show_time", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "show_times", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "total_seats", "INT NOT NULL DEFAULT 120");
  await ensureColumn(connection, "movies", columnMap, "regular_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "prime_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "vip_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "booked_seats", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "ticket_price", "DECIMAL(10,2) NOT NULL DEFAULT 240");
  await connection.query(`ALTER TABLE movies MODIFY status ${movieStatusDefinition}`);
  await ensureColumn(connection, "movies", columnMap, "trailer_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "trailer_file_url", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "gallery_images", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "documents", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "interest_count", "VARCHAR(120) NULL");
  await ensureColumn(connection, "movies", columnMap, "about_movie", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "screen_name", "VARCHAR(120) NULL");
  await ensureColumn(connection, "movies", columnMap, "city", "VARCHAR(150) NULL");
  await ensureColumn(connection, "movies", columnMap, "location", "TEXT NULL");
  await ensureColumn(connection, "movies", columnMap, "end_time", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movies", columnMap, "seat_layout", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "regular_rows", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "regular_seats_per_row", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "prime_rows", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "prime_seats_per_row", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "vip_rows", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "vip_seats_per_row", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "regular_rows_start", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movies", columnMap, "regular_rows_end", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movies", columnMap, "prime_rows_start", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movies", columnMap, "prime_rows_end", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movies", columnMap, "vip_rows_start", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movies", columnMap, "vip_rows_end", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movies", columnMap, "blocked_seats", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "regular_seat_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "premium_seat_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "vip_seat_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "average_rating", "DECIMAL(3,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "total_reviews", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movies", columnMap, "rating_distribution", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "is_offer_applicable", "BOOLEAN NOT NULL DEFAULT FALSE");
  await ensureColumn(connection, "movies", columnMap, "offers", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "cast_members", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "crew_members", "JSON NULL");
  await ensureColumn(connection, "movies", columnMap, "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await ensureColumn(connection, "movies", columnMap, "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
};

const migrateMovieRecords = async (connection) => {
  const [rows] = await connection.query("SELECT id, data, created_at, updated_at FROM app_records WHERE model = 'Movie'");
  for (const row of rows) {
    const movie = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    const title = String(movie.title || "").trim();
    const language = String(movie.language || "").trim();
    const duration = String(movie.duration || "").trim();
    const image = String(movie.image || "").trim();
    const theatre = String(movie.theatre || "").trim();
    const genre = String(movie.genre || "").trim();
    const releaseDate = String(movie.releaseDate || movie.release_date || "").trim();

    if (!title || !language || !duration || !image || !theatre || !genre || !releaseDate) continue;

    await connection.query(
      `INSERT IGNORE INTO movies (
        id, vendor_id, vendor, title, language, duration, image, poster_url, banner_url,
        description, theatre, theatre_name, theatre_city, theatre_address, screen_number,
        show_date, show_time, show_times, total_seats, booked_seats, ticket_price, status,
        genre, cast, director, release_date, rating, hero, certificate, format, trailer_url,
        interest_count, about_movie, is_offer_applicable, offers, cast_members, crew_members,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movie._id || row.id,
        movie.vendorId || movie.vendor || null,
        movie.vendor || movie.vendorId || null,
        title,
        language,
        duration,
        image,
        movie.posterUrl || null,
        movie.bannerUrl || null,
        movie.description || "",
        theatre,
        movie.theatreName || null,
        movie.theatreCity || null,
        movie.theatreAddress || null,
        movie.screenNumber || null,
        movie.showDate || null,
        movie.showTime || null,
        JSON.stringify(movie.showTimes || []),
        Number(movie.totalSeats || 120),
        JSON.stringify(movie.bookedSeats || []),
        Number(movie.ticketPrice || 240),
        movie.status || "active",
        genre,
        movie.cast || "",
        movie.director || "",
        releaseDate,
        movie.rating || "",
        movie.hero || "",
        movie.certificate || "",
        movie.format || "2D",
        movie.trailerUrl || "",
        movie.interestCount || "",
        movie.aboutMovie || "",
        Boolean(movie.isOfferApplicable),
        JSON.stringify(movie.offers || []),
        JSON.stringify(movie.castMembers || []),
        JSON.stringify(movie.crewMembers || []),
        movie.createdAt || row.created_at,
        movie.updatedAt || row.updated_at,
      ]
    );
  }
};

const ensureFlightsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS flights (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      airline_name VARCHAR(255) NOT NULL,
      airline_logo TEXT NULL,
      flight_number VARCHAR(80) NOT NULL,
      flight_type VARCHAR(80) NOT NULL DEFAULT 'domestic',
      from_city VARCHAR(150) NOT NULL,
      from_airport VARCHAR(255) NOT NULL,
      from_code VARCHAR(20) NOT NULL,
      to_city VARCHAR(150) NOT NULL,
      to_airport VARCHAR(255) NOT NULL,
      to_code VARCHAR(20) NOT NULL,
      departure_date VARCHAR(80) NOT NULL,
      departure_time VARCHAR(80) NOT NULL,
      arrival_date VARCHAR(80) NULL,
      arrival_time VARCHAR(80) NOT NULL,
      duration VARCHAR(80) NOT NULL,
      aircraft VARCHAR(120) NOT NULL DEFAULT 'A320',
      class_type VARCHAR(120) NOT NULL DEFAULT 'Economy',
      total_seats INT NOT NULL DEFAULT 0,
      available_seats INT NOT NULL DEFAULT 0,
      booked_seats INT NOT NULL DEFAULT 0,
      blocked_seats INT NOT NULL DEFAULT 0,
      base_fare DECIMAL(10,2) NOT NULL DEFAULT 0,
      taxes DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      cabin_baggage VARCHAR(255) NULL,
      checkin_baggage VARCHAR(255) NULL,
      refundable BOOLEAN NOT NULL DEFAULT FALSE,
      meal_included BOOLEAN NOT NULL DEFAULT FALSE,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      seats JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_flights_vendor_id (vendor_id),
      INDEX idx_flights_status (status),
      INDEX idx_flights_route (from_code, to_code)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM flights");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "flights", columnMap, "vendor_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "flights", columnMap, "airline_logo", "TEXT NULL");
  await ensureColumn(connection, "flights", columnMap, "booked_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "flights", columnMap, "blocked_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "flights", columnMap, "seats", "JSON NULL");
};

const ensureBookingsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_code VARCHAR(80) NOT NULL UNIQUE,
      user_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      module VARCHAR(80) NOT NULL,
      title VARCHAR(255) NOT NULL,
      movie_id VARCHAR(24) NULL,
      show_id VARCHAR(24) NULL,
      flight_id VARCHAR(24) NULL,
      customer_name VARCHAR(150) NULL,
      customer_email VARCHAR(190) NULL,
      customer_mobile VARCHAR(30) NULL,
      theatre VARCHAR(255) NULL,
      show_date VARCHAR(120) NULL,
      show_time VARCHAR(120) NULL,
      seats JSON NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'confirmed',
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'paid',
      details JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bookings_user_id (user_id),
      INDEX idx_bookings_vendor_id (vendor_id),
      INDEX idx_bookings_module (module)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM bookings");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "bookings", columnMap, "booking_id", "VARCHAR(80) NULL UNIQUE");
  await ensureColumn(connection, "bookings", columnMap, "theatre_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "bookings", columnMap, "screen_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "bookings", columnMap, "seat_numbers", "JSON NULL");
  await ensureColumn(connection, "bookings", columnMap, "total_amount", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "bookings", columnMap, "booking_status", "ENUM('pending','confirmed','completed','cancelled','refunded') NOT NULL DEFAULT 'confirmed'");
  await ensureColumn(connection, "bookings", columnMap, "qr_token", "VARCHAR(255) NULL UNIQUE");
  await ensureColumn(connection, "bookings", columnMap, "qr_code_url", "TEXT NULL");
  await ensureColumn(connection, "bookings", columnMap, "checked_in", "BOOLEAN NOT NULL DEFAULT FALSE");
  await ensureColumn(connection, "bookings", columnMap, "checked_in_at", "DATETIME NULL");
  await ensureColumn(connection, "bookings", columnMap, "scanned_by", "VARCHAR(24) NULL");
  await ensureColumn(connection, "bookings", columnMap, "edit_count", "INT NOT NULL DEFAULT 0");
  await connection.query("ALTER TABLE bookings MODIFY payment_status ENUM('pending','success','paid','failed','refunded') NOT NULL DEFAULT 'pending'");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS qr_checkins (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(80) NOT NULL,
      qr_token VARCHAR(255) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      checked_by VARCHAR(24) NULL,
      status VARCHAR(40) NOT NULL,
      message VARCHAR(255) NULL,
      checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_qr_checkins_booking_id (booking_id),
      INDEX idx_qr_checkins_qr_token (qr_token),
      INDEX idx_qr_checkins_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS flight_bookings (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(24) NULL,
      booking_code VARCHAR(80) NOT NULL,
      user_id VARCHAR(24) NOT NULL,
      flight_id VARCHAR(24) NOT NULL,
      passenger_name VARCHAR(150) NOT NULL,
      passenger_mobile VARCHAR(30) NOT NULL,
      passenger_email VARCHAR(190) NOT NULL,
      seat_number VARCHAR(120) NOT NULL,
      class_type VARCHAR(120) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'refunded') NOT NULL DEFAULT 'confirmed',
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'paid',
      booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      details JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_flight_bookings_user_id (user_id),
      INDEX idx_flight_bookings_flight_id (flight_id)
    )
  `);
};

const ensurePaymentsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(80) NULL,
      user_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      movie_id VARCHAR(24) NULL,
      flight_id VARCHAR(24) NULL,
      order_id VARCHAR(120) NULL,
      payment_id VARCHAR(120) NULL,
      razorpay_order_id VARCHAR(120) NULL,
      razorpay_payment_id VARCHAR(120) NULL,
      razorpay_signature VARCHAR(255) NULL,
      provider VARCHAR(80) NOT NULL DEFAULT 'razorpay',
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      status ENUM('pending', 'success', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      method VARCHAR(80) NULL,
      details JSON NULL,
      paid_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_payments_booking_id (booking_id),
      INDEX idx_payments_user_id (user_id),
      INDEX idx_payments_vendor_id (vendor_id),
      INDEX idx_payments_movie_id (movie_id),
      INDEX idx_payments_flight_id (flight_id),
      INDEX idx_payments_status (status)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM payments");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "payments", columnMap, "movie_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "payments", columnMap, "flight_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "payments", columnMap, "razorpay_order_id", "VARCHAR(120) NULL");
  await ensureColumn(connection, "payments", columnMap, "razorpay_payment_id", "VARCHAR(120) NULL");
  await ensureColumn(connection, "payments", columnMap, "razorpay_signature", "VARCHAR(255) NULL");
};

const ensureMovieScreenShowSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_screens (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      theatre_id VARCHAR(24) NULL,
      movie_id VARCHAR(24) NULL,
      name VARCHAR(120) NOT NULL,
      rows_count INT NOT NULL DEFAULT 10,
      seats_per_row INT NOT NULL DEFAULT 10,
      total_seats INT NOT NULL DEFAULT 120,
      vip_seats INT NOT NULL DEFAULT 0,
      prime_seats INT NOT NULL DEFAULT 0,
      regular_seats INT NOT NULL DEFAULT 120,
      visible_row_start VARCHAR(10) NULL,
      visible_row_end VARCHAR(10) NULL,
      vip_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      prime_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      regular_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      screen_type VARCHAR(40) NOT NULL DEFAULT '2D',
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movie_screens_vendor_id (vendor_id),
      INDEX idx_movie_screens_movie_id (movie_id),
      INDEX idx_movie_screens_theatre_id (theatre_id),
      CONSTRAINT fk_movie_screens_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE SET NULL
    )
  `);

  const [screenColumns] = await connection.query("SHOW COLUMNS FROM movie_screens");
  const screenMap = new Map(screenColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "movie_screens", screenMap, "vip_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movie_screens", screenMap, "prime_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movie_screens", screenMap, "regular_seats", "INT NOT NULL DEFAULT 120");
  await ensureColumn(connection, "movie_screens", screenMap, "visible_row_start", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movie_screens", screenMap, "visible_row_end", "VARCHAR(10) NULL");
  await ensureColumn(connection, "movie_screens", screenMap, "vip_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movie_screens", screenMap, "prime_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "movie_screens", screenMap, "regular_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS screen_seat_layouts (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      screen_id VARCHAR(24) NOT NULL,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(24) NULL,
      category ENUM('VIP','PREMIUM','REGULAR') NOT NULL,
      row_start VARCHAR(10) NOT NULL,
      row_end VARCHAR(10) NOT NULL,
      seats_per_row INT NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      expected_seats INT NOT NULL DEFAULT 0,
      generated_seats INT NOT NULL DEFAULT 0,
      visible_row_start VARCHAR(10) NULL,
      visible_row_end VARCHAR(10) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_screen_layout_category (screen_id, category),
      INDEX idx_screen_seat_layouts_screen_id (screen_id),
      INDEX idx_screen_seat_layouts_movie_id (movie_id)
    )
  `);

  const [layoutColumns] = await connection.query("SHOW COLUMNS FROM screen_seat_layouts");
  const layoutMap = new Map(layoutColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "screen_seat_layouts", layoutMap, "expected_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "screen_seat_layouts", layoutMap, "visible_row_start", "VARCHAR(10) NULL");
  await ensureColumn(connection, "screen_seat_layouts", layoutMap, "visible_row_end", "VARCHAR(10) NULL");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS seat_layouts (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      screen_id VARCHAR(24) NOT NULL,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(24) NULL,
      category ENUM('VIP','PREMIUM','REGULAR') NOT NULL,
      row_start VARCHAR(10) NOT NULL,
      row_end VARCHAR(10) NOT NULL,
      seats_per_row INT NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      expected_seats INT NOT NULL DEFAULT 0,
      generated_seats INT NOT NULL DEFAULT 0,
      visible_row_start VARCHAR(10) NULL,
      visible_row_end VARCHAR(10) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_seat_layout_category (screen_id, category),
      INDEX idx_seat_layouts_screen_id (screen_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_shows (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      movie_id VARCHAR(24) NOT NULL,
      theatre_id VARCHAR(24) NULL,
      screen_id VARCHAR(24) NOT NULL,
      show_date VARCHAR(80) NOT NULL,
      show_time VARCHAR(80) NOT NULL,
      end_time VARCHAR(80) NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movie_shows_vendor_id (vendor_id),
      INDEX idx_movie_shows_movie_id (movie_id),
      INDEX idx_movie_shows_screen_id (screen_id),
      UNIQUE KEY uniq_movie_show_slot (movie_id, screen_id, show_date, show_time),
      CONSTRAINT fk_movie_shows_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      CONSTRAINT fk_movie_shows_screen FOREIGN KEY (screen_id) REFERENCES movie_screens(id) ON DELETE CASCADE
    )
  `);
};

const ensureVendorListingsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_listings (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      module VARCHAR(80) NOT NULL DEFAULT 'general',
      title VARCHAR(255) NOT NULL,
      city VARCHAR(150) NULL,
      route VARCHAR(255) NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      inventory INT NOT NULL DEFAULT 0,
      image_url TEXT NULL,
      details JSON NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vendor_listings_vendor_id (vendor_id),
      INDEX idx_vendor_listings_module (module),
      INDEX idx_vendor_listings_status (status)
    )
  `);
};

const ensureSettlementsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS settlements (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      booking_id VARCHAR(80) NULL,
      payment_id VARCHAR(120) NULL,
      gross_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      platform_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
      net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      settlement_status ENUM('pending', 'processing', 'settled', 'failed') NOT NULL DEFAULT 'pending',
      settlement_reference VARCHAR(120) NULL,
      settled_at DATETIME NULL,
      details JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_settlements_vendor_id (vendor_id),
      INDEX idx_settlements_booking_id (booking_id),
      INDEX idx_settlements_status (settlement_status)
    )
  `);
};

const ensureMovieSeatsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_seats (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      row_name VARCHAR(10) NOT NULL,
      seat_number VARCHAR(10) NOT NULL,
      seat_no VARCHAR(20) NOT NULL,
      show_id VARCHAR(255) NOT NULL,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(255) NULL,
      screen_id VARCHAR(255) NULL,
      seat_type VARCHAR(40) NOT NULL DEFAULT 'regular',
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('available', 'booked', 'blocked') NOT NULL DEFAULT 'available',
      booked_by VARCHAR(24) NULL,
      booking_id VARCHAR(24) NULL,
      customer_name VARCHAR(150) NULL,
      customer_email VARCHAR(190) NULL,
      customer_mobile VARCHAR(30) NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      payment_status VARCHAR(40) NULL,
      booking_status VARCHAR(40) NULL,
      booking_date DATETIME NULL,
      blocked_by VARCHAR(24) NULL,
      blocked_reason VARCHAR(255) NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_movie_show_seat (show_id, seat_no),
      INDEX idx_movie_seats_show_id (show_id),
      INDEX idx_movie_seats_movie_id (movie_id),
      INDEX idx_movie_seats_status (status)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM movie_seats");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "movie_seats", columnMap, "row_name", "VARCHAR(10) NOT NULL DEFAULT 'A'");
  await ensureColumn(connection, "movie_seats", columnMap, "row_label", "VARCHAR(10) NOT NULL DEFAULT 'A'");
  await ensureColumn(connection, "movie_seats", columnMap, "seat_number", "VARCHAR(10) NOT NULL DEFAULT '01'");
  await ensureColumn(connection, "movie_seats", columnMap, "seat_code", "VARCHAR(20) NULL");
  await ensureColumn(connection, "movie_seats", columnMap, "category", "VARCHAR(40) NOT NULL DEFAULT 'REGULAR'");
  await ensureColumn(connection, "movie_seats", columnMap, "seat_type", "VARCHAR(40) NOT NULL DEFAULT 'regular'");
  await ensureColumn(connection, "movie_seats", columnMap, "price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
};

const ensureSeatsSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS seats (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      show_id VARCHAR(24) NOT NULL,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(24) NULL,
      screen_id VARCHAR(24) NULL,
      row_name VARCHAR(10) NOT NULL,
      row_label VARCHAR(10) NOT NULL DEFAULT 'A',
      seat_number VARCHAR(10) NOT NULL,
      seat_no VARCHAR(20) NOT NULL,
      seat_code VARCHAR(20) NULL,
      seat_type VARCHAR(40) NOT NULL DEFAULT 'regular',
      category VARCHAR(40) NOT NULL DEFAULT 'REGULAR',
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('available', 'booked', 'blocked') NOT NULL DEFAULT 'available',
      booked_by VARCHAR(24) NULL,
      booking_id VARCHAR(80) NULL,
      blocked_by VARCHAR(24) NULL,
      blocked_reason VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_seats_show_seat (show_id, seat_no),
      INDEX idx_seats_show_id (show_id),
      INDEX idx_seats_movie_id (movie_id),
      INDEX idx_seats_status (status)
    )
  `);

  const [columns] = await connection.query("SHOW COLUMNS FROM seats");
  const columnMap = new Map(columns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "seats", columnMap, "row_label", "VARCHAR(10) NOT NULL DEFAULT 'A'");
  await ensureColumn(connection, "seats", columnMap, "seat_code", "VARCHAR(20) NULL");
  await ensureColumn(connection, "seats", columnMap, "category", "VARCHAR(40) NOT NULL DEFAULT 'REGULAR'");
};

const ensureMovieProductionSchema = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS theatres (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      theatre_name VARCHAR(255) NOT NULL,
      city VARCHAR(150) NULL,
      location TEXT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_theatres_vendor_id (vendor_id)
    )
  `);

  const [theatreColumns] = await connection.query("SHOW COLUMNS FROM theatres");
  const theatreMap = new Map(theatreColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "theatres", theatreMap, "theatre_name", "VARCHAR(255) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "theatres", theatreMap, "city", "VARCHAR(150) NULL");
  await ensureColumn(connection, "theatres", theatreMap, "location", "TEXT NULL");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS screens (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      theatre_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      screen_name VARCHAR(120) NOT NULL,
      total_rows INT NOT NULL DEFAULT 10,
      seats_per_row INT NOT NULL DEFAULT 10,
      total_seats INT NOT NULL DEFAULT 120,
      vip_seats INT NOT NULL DEFAULT 0,
      prime_seats INT NOT NULL DEFAULT 0,
      regular_seats INT NOT NULL DEFAULT 120,
      vip_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      prime_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      regular_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_screens_vendor_id (vendor_id)
    )
  `);

  const [screenColumns] = await connection.query("SHOW COLUMNS FROM screens");
  const screenMap = new Map(screenColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "screens", screenMap, "screen_name", "VARCHAR(120) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "screens", screenMap, "total_rows", "INT NOT NULL DEFAULT 10");
  await ensureColumn(connection, "screens", screenMap, "seats_per_row", "INT NOT NULL DEFAULT 10");
  await ensureColumn(connection, "screens", screenMap, "total_seats", "INT NOT NULL DEFAULT 120");
  await ensureColumn(connection, "screens", screenMap, "vip_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "screens", screenMap, "prime_seats", "INT NOT NULL DEFAULT 0");
  await ensureColumn(connection, "screens", screenMap, "regular_seats", "INT NOT NULL DEFAULT 120");
  await ensureColumn(connection, "screens", screenMap, "vip_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "screens", screenMap, "prime_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await ensureColumn(connection, "screens", screenMap, "regular_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS shows (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NULL,
      theatre_id VARCHAR(24) NULL,
      screen_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      show_date VARCHAR(80) NULL,
      show_time VARCHAR(80) NULL,
      end_time VARCHAR(80) NULL,
      regular_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      premium_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      vip_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'booking_open',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_shows_movie_id (movie_id),
      INDEX idx_shows_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS qr_scans (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(80) NOT NULL,
      qr_token VARCHAR(255) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      scanned_by VARCHAR(24) NULL,
      scan_status VARCHAR(40) NOT NULL,
      scan_message VARCHAR(255) NULL,
      scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_qr_scans_booking_id (booking_id),
      INDEX idx_qr_scans_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_pricing (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      movie_id VARCHAR(24) NULL,
      show_id VARCHAR(24) NULL,
      seat_type VARCHAR(40) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      day_type VARCHAR(40) NOT NULL DEFAULT 'all',
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movie_pricing_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      booking_id VARCHAR(80) NOT NULL,
      user_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      reason TEXT NULL,
      refund_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      admin_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      vendor_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_refunds_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS payouts (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
      platform_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
      vendor_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
      payout_status VARCHAR(40) NOT NULL DEFAULT 'pending',
      payout_date DATETIME NULL,
      transaction_id VARCHAR(120) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payouts_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS vendor_staff (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NULL,
      mobile VARCHAR(30) NULL,
      role VARCHAR(80) NOT NULL,
      permissions JSON NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vendor_staff_vendor_id (vendor_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      vendor_id VARCHAR(24) NULL,
      user_id VARCHAR(24) NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NULL,
      type VARCHAR(80) NOT NULL DEFAULT 'general',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      booking_id VARCHAR(80) NULL,
      movie_id VARCHAR(24) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_vendor_id (vendor_id),
      INDEX idx_notifications_user_id (user_id)
    )
  `);

  const [notificationColumns] = await connection.query("SHOW COLUMNS FROM notifications");
  const notificationMap = new Map(notificationColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "notifications", notificationMap, "user_id", "VARCHAR(24) NULL");
  await ensureColumn(connection, "notifications", notificationMap, "booking_id", "VARCHAR(80) NULL");
  await ensureColumn(connection, "notifications", notificationMap, "movie_id", "VARCHAR(24) NULL");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_reviews (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      booking_id VARCHAR(24) NULL,
      user_id VARCHAR(24) NULL,
      vendor_id VARCHAR(24) NULL,
      rating INT NOT NULL,
      review TEXT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'published',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_movie_reviews_movie_id (movie_id)
    )
  `);

  const [reviewColumns] = await connection.query("SHOW COLUMNS FROM movie_reviews");
  const reviewMap = new Map(reviewColumns.map((column) => [column.Field, column]));
  await ensureColumn(connection, "movie_reviews", reviewMap, "booking_id", "VARCHAR(80) NULL");
  await ensureColumn(connection, "movie_reviews", reviewMap, "review", "TEXT NULL");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_status_logs (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      old_status VARCHAR(40) NULL,
      new_status VARCHAR(40) NOT NULL,
      changed_by VARCHAR(24) NULL,
      reason TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movie_status_logs_movie_id (movie_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_documents (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      document_type VARCHAR(120) NOT NULL,
      file_name VARCHAR(255) NULL,
      file_url TEXT NOT NULL,
      mime_type VARCHAR(120) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movie_documents_movie_id (movie_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movie_gallery (
      id VARCHAR(24) NOT NULL PRIMARY KEY,
      movie_id VARCHAR(24) NOT NULL,
      vendor_id VARCHAR(24) NULL,
      file_name VARCHAR(255) NULL,
      file_url TEXT NOT NULL,
      mime_type VARCHAR(120) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_movie_gallery_movie_id (movie_id)
    )
  `);
};

const ready = (async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_records (
        id VARCHAR(24) NOT NULL,
        model VARCHAR(80) NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (model, id),
        INDEX idx_app_records_model (model)
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(24) NOT NULL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        mobile VARCHAR(30) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'vendor', 'user') NOT NULL DEFAULT 'user',
        status ENUM('active', 'blocked', 'pending') NOT NULL DEFAULT 'active',
        image TEXT NULL,
        reset_password_token VARCHAR(255) NULL,
        reset_password_expires DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await ensureUsersSchema(connection);
    await ensureMoviesSchema(connection);
    await ensureFlightsSchema(connection);
    await ensureBookingsSchema(connection);
    await ensurePaymentsSchema(connection);
    await ensureMovieScreenShowSchema(connection);
    await ensureVendorListingsSchema(connection);
    await ensureMovieSeatsSchema(connection);
    await ensureSeatsSchema(connection);
    await ensureSettlementsSchema(connection);
    await ensureMovieProductionSchema(connection);
    await runSqlFile(connection, path.join(__dirname, "..", "..", "migrations", "2026-06-18-vendor-production-modules.sql"));
    await migrateMovieRecords(connection);
    console.log("MySQL connected successfully");
    console.log("All tables created successfully");
    return true;
  } catch (err) {
    console.log("Database Error", err);
    return false;
  } finally {
    if (connection) connection.release();
  }
})();

module.exports = {
  pool,
  ready,
};
