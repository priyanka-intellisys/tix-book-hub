const { pool, ready } = require("../config/db");

const registry = {};
const memoryStore = {};
let mysqlAvailable = true;

const clone = (value) => {
  if (value === undefined || value === null) return value;
  if (value instanceof Date) return new Date(value);
  if (Array.isArray(value)) return value.map(clone);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clone(entry)]));
  }
  return value;
};

const getPath = (item, path) =>
  String(path)
    .split(".")
    .reduce((current, key) => (current === undefined || current === null ? undefined : current[key]), item);

const same = (left, right) => String(left) === String(right);

const matchesOperator = (actual, expected) => {
  if (expected && typeof expected === "object" && !Array.isArray(expected) && !(expected instanceof Date)) {
    if (expected.$in) return expected.$in.some((value) => same(actual, value));
    if (expected.$nin) return !expected.$nin.some((value) => same(actual, value));
    if (expected.$gt !== undefined) return actual > expected.$gt;
    if (expected.$lt !== undefined) return actual < expected.$lt;
  }

  if (Array.isArray(actual)) return actual.some((value) => same(value, expected));
  return same(actual, expected);
};

const matchesQuery = (item, query = {}) =>
  Object.entries(query || {}).every(([key, expected]) => {
    if (key === "$or") return expected.some((entry) => matchesQuery(item, entry));
    if (key === "$and") return expected.every((entry) => matchesQuery(item, entry));
    return matchesOperator(getPath(item, key), expected);
  });

const applyUpdate = (target, update = {}) => {
  Object.entries(update).forEach(([key, value]) => {
    if (key === "$addToSet") {
      Object.entries(value).forEach(([field, entry]) => {
        const values = entry && entry.$each ? entry.$each : [entry];
        target[field] = Array.isArray(target[field]) ? target[field] : [];
        values.forEach((nextValue) => {
          if (!target[field].some((current) => same(current, nextValue))) target[field].push(nextValue);
        });
      });
      return;
    }

    target[key] = clone(value);
  });
};

const userFromRow = (Model, row) =>
  new Model({
    _id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    password: row.password,
    role: row.role,
    status: row.status,
    image: row.image || "",
    resetPasswordToken: row.reset_password_token || undefined,
    resetPasswordExpires: row.reset_password_expires || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const parseJson = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const movieFromRow = (Model, row) =>
  new Model({
    _id: row.id,
    vendorId: row.vendor_id || undefined,
    vendor: row.vendor || row.vendor_id || undefined,
    title: row.title,
    language: row.language,
    duration: row.duration,
    image: row.image,
    posterUrl: row.poster_url || "",
    bannerUrl: row.banner_url || "",
    description: row.description || "",
    theatre: row.theatre,
    theatreName: row.theatre_name || "",
    theatreCity: row.theatre_city || "",
    theatreAddress: row.theatre_address || "",
    screenNumber: row.screen_number || "",
    showDate: row.show_date || "",
    showTime: row.show_time || "",
    showTimes: parseJson(row.show_times, []),
    totalSeats: Number(row.total_seats || 120),
    regularSeatCount: Number(row.regular_seats || 0),
    primeSeatCount: Number(row.prime_seats || 0),
    vipSeatCount: Number(row.vip_seats || 0),
    bookedSeats: parseJson(row.booked_seats, []),
    ticketPrice: Number(row.ticket_price || 240),
    status: row.status || "active",
    genre: row.genre,
    cast: row.cast || "",
    director: row.director || "",
    releaseDate: row.release_date,
    rating: row.rating || "",
    hero: row.hero || "",
    certificate: row.certificate || "",
    format: row.format || "2D",
    trailerUrl: row.trailer_url || "",
    trailerFileUrl: row.trailer_file_url || "",
    galleryImages: parseJson(row.gallery_images, []),
    documents: parseJson(row.documents, []),
    interestCount: row.interest_count || "",
    aboutMovie: row.about_movie || "",
    screenName: row.screen_name || "",
    city: row.city || row.theatre_city || "",
    location: row.location || row.theatre_address || "",
    endTime: row.end_time || "",
    seatLayout: parseJson(row.seat_layout, []),
    regularRows: Number(row.regular_rows || 0),
    regularSeatsPerRow: Number(row.regular_seats_per_row || 0),
    primeRows: Number(row.prime_rows || 0),
    primeSeatsPerRow: Number(row.prime_seats_per_row || 0),
    vipRows: Number(row.vip_rows || 0),
    vipSeatsPerRow: Number(row.vip_seats_per_row || 0),
    regularRowsStart: row.regular_rows_start || "",
    regularRowsEnd: row.regular_rows_end || "",
    primeRowsStart: row.prime_rows_start || "",
    primeRowsEnd: row.prime_rows_end || "",
    premiumRowsStart: row.prime_rows_start || "",
    premiumRowsEnd: row.prime_rows_end || "",
    vipRowsStart: row.vip_rows_start || "",
    vipRowsEnd: row.vip_rows_end || "",
    blockedSeats: parseJson(row.blocked_seats, []),
    regularSeatPrice: Number(row.regular_seat_price || row.ticket_price || 0),
    premiumSeatPrice: Number(row.premium_seat_price || 0),
    vipSeatPrice: Number(row.vip_seat_price || 0),
    averageRating: Number(row.average_rating || 0),
    totalReviews: Number(row.total_reviews || 0),
    ratingDistribution: parseJson(row.rating_distribution, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    isOfferApplicable: Boolean(row.is_offer_applicable),
    offers: parseJson(row.offers, []),
    castMembers: parseJson(row.cast_members, []),
    crewMembers: parseJson(row.crew_members, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const flightFromRow = (Model, row) =>
  new Model({
    _id: row.id,
    vendorId: row.vendor_id || undefined,
    vendor: row.vendor_id || undefined,
    airlineName: row.airline_name,
    airlineLogo: row.airline_logo || "",
    flightNumber: row.flight_number,
    flightType: row.flight_type || "domestic",
    fromCity: row.from_city,
    fromAirport: row.from_airport,
    fromCode: row.from_code,
    toCity: row.to_city,
    toAirport: row.to_airport,
    toCode: row.to_code,
    departureDate: row.departure_date,
    departureTime: row.departure_time,
    arrivalDate: row.arrival_date || "",
    arrivalTime: row.arrival_time,
    duration: row.duration,
    aircraft: row.aircraft || "A320",
    aircraftType: row.aircraft || "A320",
    classType: row.class_type || "Economy",
    cabinClass: row.class_type || "Economy",
    totalSeats: Number(row.total_seats || 0),
    availableSeats: Number(row.available_seats || 0),
    bookedSeats: Number(row.booked_seats || 0),
    blockedSeats: Number(row.blocked_seats || 0),
    baseFare: Number(row.base_fare || 0),
    taxes: Number(row.taxes || 0),
    totalPrice: Number(row.total_price || 0),
    ticketPrice: Number(row.total_price || 0),
    cabinBaggage: row.cabin_baggage || "",
    cabin_baggage: row.cabin_baggage || "",
    checkinBaggage: row.checkin_baggage || "",
    baggageAllowance: [row.cabin_baggage, row.checkin_baggage].filter(Boolean).join(" + "),
    refundable: Boolean(row.refundable),
    mealIncluded: Boolean(row.meal_included),
    status: row.status || "active",
    seats: parseJson(row.seats, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const bookingFromRow = (Model, row) =>
  new Model({
    _id: row.id,
    bookingId: row.booking_id || row.booking_code,
    bookingCode: row.booking_code,
    user: row.user_id,
    vendor: row.vendor_id || undefined,
    vendorId: row.vendor_id || undefined,
    module: row.module,
    title: row.title,
    movieId: row.movie_id || undefined,
    theatreId: row.theatre_id || undefined,
    screenId: row.screen_id || undefined,
    showId: row.show_id || undefined,
    flightId: row.flight_id || undefined,
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    customerMobile: row.customer_mobile || "",
    theatre: row.theatre || "",
    showDate: row.show_date || "",
    showTime: row.show_time || "",
    seats: parseJson(row.seats, []),
    seatNumbers: parseJson(row.seat_numbers, parseJson(row.seats, [])),
    amount: Number(row.amount || 0),
    totalAmount: Number(row.total_amount || row.amount || 0),
    status: row.status || "confirmed",
    paymentStatus: row.payment_status || "paid",
    bookingStatus: row.booking_status || row.status || "confirmed",
    qrToken: row.qr_token || "",
    qrCodeUrl: row.qr_code_url || "",
    checkedIn: Boolean(row.checked_in),
    checkedInAt: row.checked_in_at || null,
    scannedBy: row.scanned_by || "",
    editCount: Number(row.edit_count || 0),
    details: parseJson(row.details, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const vendorListingFromRow = (Model, row) =>
  new Model({
    _id: row.id,
    vendor: row.vendor_id || undefined,
    vendorId: row.vendor_id || undefined,
    module: row.module,
    title: row.title,
    city: row.city || "",
    route: row.route || "",
    price: Number(row.price || 0),
    inventory: Number(row.inventory || 0),
    imageUrl: row.image_url || "",
    details: parseJson(row.details, {}),
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const screenFromRow = (Model, row) =>
  new Model({
    _id: row.id,
    vendor: row.vendor_id || undefined,
    vendorId: row.vendor_id || undefined,
    theatreId: row.theatre_id || undefined,
    movieId: row.movie_id || undefined,
    name: row.name,
    screenName: row.name,
    rows: Number(row.rows_count || 10),
    seatsPerRow: Number(row.seats_per_row || 10),
    totalSeats: Number(row.total_seats || (Number(row.rows_count || 10) * Number(row.seats_per_row || 10))),
    vipSeats: Number(row.vip_seats || 0),
    primeSeats: Number(row.prime_seats || 0),
    regularSeats: Number(row.regular_seats || 0),
    vipPrice: Number(row.vip_price || 0),
    primePrice: Number(row.prime_price || 0),
    regularPrice: Number(row.regular_price || 0),
    screenType: row.screen_type || "2D",
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const showFromRow = (Model, row) =>
  new Model({
    _id: row.id,
    vendor: row.vendor_id || undefined,
    vendorId: row.vendor_id || undefined,
    movieId: row.movie_id,
    theatreId: row.theatre_id || undefined,
    screenId: row.screen_id,
    showDate: row.show_date,
    showTime: row.show_time,
    endTime: row.end_time || "",
    price: Number(row.price || 0),
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const populate = async (result, path) => {
  const rows = Array.isArray(result) ? result : [result];
  if (path !== "user" || !registry.User) return;

  const users = await registry.User.readAll();
  rows.filter(Boolean).forEach((row) => {
    if (!row.user || typeof row.user === "object") return;
    const user = users.find((item) => same(item._id, row.user));
    if (user) row.user = user;
  });
};

class Query {
  constructor(executor) {
    this.executor = executor;
    this.sortSpec = null;
    this.populatePath = null;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  select() {
    return this;
  }

  populate(path) {
    this.populatePath = path;
    return this;
  }

  async exec() {
    const result = await this.executor();
    const values = Array.isArray(result) ? [...result] : result;

    if (Array.isArray(values) && this.sortSpec) {
      const [[field, direction]] = Object.entries(this.sortSpec);
      values.sort((left, right) => {
        const leftValue = getPath(left, field);
        const rightValue = getPath(right, field);
        if (leftValue === rightValue) return 0;
        return leftValue > rightValue ? direction : -direction;
      });
    }

    if (this.populatePath) await populate(values, this.populatePath);
    return values;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const createInMemoryModel = (name, defaults = {}, seed = []) => {
  class InMemoryDocument {
    constructor(data = {}) {
      Object.assign(this, clone(defaults), clone(data));
      this._id = this._id || InMemoryDocument.newId();
      this.createdAt = this.createdAt || new Date();
      this.updatedAt = this.updatedAt || new Date();
    }

    static newId() {
      return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`.slice(0, 24);
    }

    static get _items() {
      if (!memoryStore[name]) memoryStore[name] = [];
      return memoryStore[name];
    }

    static async readAll() {
      const requiresMysql = ["User", "Movie", "Flight", "Booking", "VendorListing", "Screen", "Show"].includes(name);
      if (!mysqlAvailable && !requiresMysql) return this._items;

      try {
        mysqlAvailable = await ready;
        if (!mysqlAvailable) {
          if (requiresMysql) throw new Error("MySQL connection is not available");
          return this._items;
        }
        if (name === "User") {
          const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
          return rows.map((row) => userFromRow(this, row));
        }
        if (name === "Movie") {
          const [rows] = await pool.query("SELECT * FROM movies ORDER BY created_at DESC");
          return rows.map((row) => movieFromRow(this, row));
        }
        if (name === "Flight") {
          const [rows] = await pool.query("SELECT * FROM flights ORDER BY created_at DESC");
          return rows.map((row) => flightFromRow(this, row));
        }
        if (name === "Booking") {
          const [rows] = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
          return rows.map((row) => bookingFromRow(this, row));
        }
        if (name === "VendorListing") {
          const [rows] = await pool.query("SELECT * FROM vendor_listings ORDER BY created_at DESC");
          return rows.map((row) => vendorListingFromRow(this, row));
        }
        if (name === "Screen") {
          const [rows] = await pool.query("SELECT * FROM movie_screens ORDER BY created_at DESC");
          return rows.map((row) => screenFromRow(this, row));
        }
        if (name === "Show") {
          const [rows] = await pool.query("SELECT * FROM movie_shows ORDER BY show_date DESC, show_time DESC");
          return rows.map((row) => showFromRow(this, row));
        }
        const [rows] = await pool.query("SELECT data FROM app_records WHERE model = ?", [name]);
        return rows.map((row) => new this(typeof row.data === "string" ? JSON.parse(row.data) : row.data));
      } catch (error) {
        mysqlAvailable = false;
        if (requiresMysql) throw error;
        console.log(`MySQL unavailable for ${name}; using memory fallback`, error.message);
        return this._items;
      }
    }

    static async write(document) {
      const requiresMysql = ["User", "Movie", "Flight", "Booking", "VendorListing", "Screen", "Show"].includes(name);
      if (!mysqlAvailable && !requiresMysql) return document;

      try {
        mysqlAvailable = await ready;
        if (!mysqlAvailable) {
          if (requiresMysql) throw new Error("MySQL connection is not available");
          return document;
        }
        if (name === "User") {
          await pool.query(
            `INSERT INTO users (
              id, name, email, mobile, password, role, status, image,
              reset_password_token, reset_password_expires, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              email = VALUES(email),
              mobile = VALUES(mobile),
              password = VALUES(password),
              role = VALUES(role),
              status = VALUES(status),
              image = VALUES(image),
              reset_password_token = VALUES(reset_password_token),
              reset_password_expires = VALUES(reset_password_expires),
              updated_at = VALUES(updated_at)`,
            [
              document._id,
              document.name || "",
              document.email || "",
              document.mobile || "",
              document.password || "",
              document.role || "user",
              document.status || "active",
              document.image || "",
              document.resetPasswordToken || null,
              document.resetPasswordExpires || null,
              document.createdAt,
              document.updatedAt,
            ]
          );
          return document;
        }
        if (name === "Movie") {
          await pool.query(
            `INSERT INTO movies (
              id, vendor_id, vendor, title, language, duration, image, poster_url, banner_url,
              description, theatre, theatre_name, theatre_city, theatre_address, screen_number,
              show_date, show_time, show_times, total_seats, regular_seats, prime_seats, vip_seats, booked_seats, ticket_price, status,
              genre, cast, director, release_date, rating, hero, certificate, format, trailer_url,
              trailer_file_url, gallery_images, documents, interest_count, about_movie, screen_name,
              city, location, end_time, seat_layout, regular_rows, regular_seats_per_row,
              prime_rows, prime_seats_per_row, vip_rows, vip_seats_per_row,
              regular_rows_start, regular_rows_end, prime_rows_start, prime_rows_end,
              vip_rows_start, vip_rows_end, blocked_seats, regular_seat_price, premium_seat_price,
              vip_seat_price, average_rating, total_reviews, rating_distribution,
              is_offer_applicable, offers, cast_members, crew_members,
              created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              vendor_id = VALUES(vendor_id),
              vendor = VALUES(vendor),
              title = VALUES(title),
              language = VALUES(language),
              duration = VALUES(duration),
              image = VALUES(image),
              poster_url = VALUES(poster_url),
              banner_url = VALUES(banner_url),
              description = VALUES(description),
              theatre = VALUES(theatre),
              theatre_name = VALUES(theatre_name),
              theatre_city = VALUES(theatre_city),
              theatre_address = VALUES(theatre_address),
              screen_number = VALUES(screen_number),
              show_date = VALUES(show_date),
              show_time = VALUES(show_time),
              show_times = VALUES(show_times),
              total_seats = VALUES(total_seats),
              regular_seats = VALUES(regular_seats),
              prime_seats = VALUES(prime_seats),
              vip_seats = VALUES(vip_seats),
              booked_seats = VALUES(booked_seats),
              ticket_price = VALUES(ticket_price),
              status = VALUES(status),
              genre = VALUES(genre),
              cast = VALUES(cast),
              director = VALUES(director),
              release_date = VALUES(release_date),
              rating = VALUES(rating),
              hero = VALUES(hero),
              certificate = VALUES(certificate),
              format = VALUES(format),
              trailer_url = VALUES(trailer_url),
              trailer_file_url = VALUES(trailer_file_url),
              gallery_images = VALUES(gallery_images),
              documents = VALUES(documents),
              interest_count = VALUES(interest_count),
              about_movie = VALUES(about_movie),
              screen_name = VALUES(screen_name),
              city = VALUES(city),
              location = VALUES(location),
              end_time = VALUES(end_time),
              seat_layout = VALUES(seat_layout),
              regular_rows = VALUES(regular_rows),
              regular_seats_per_row = VALUES(regular_seats_per_row),
              prime_rows = VALUES(prime_rows),
              prime_seats_per_row = VALUES(prime_seats_per_row),
              vip_rows = VALUES(vip_rows),
              vip_seats_per_row = VALUES(vip_seats_per_row),
              regular_rows_start = VALUES(regular_rows_start),
              regular_rows_end = VALUES(regular_rows_end),
              prime_rows_start = VALUES(prime_rows_start),
              prime_rows_end = VALUES(prime_rows_end),
              vip_rows_start = VALUES(vip_rows_start),
              vip_rows_end = VALUES(vip_rows_end),
              blocked_seats = VALUES(blocked_seats),
              regular_seat_price = VALUES(regular_seat_price),
              premium_seat_price = VALUES(premium_seat_price),
              vip_seat_price = VALUES(vip_seat_price),
              average_rating = VALUES(average_rating),
              total_reviews = VALUES(total_reviews),
              rating_distribution = VALUES(rating_distribution),
              is_offer_applicable = VALUES(is_offer_applicable),
              offers = VALUES(offers),
              cast_members = VALUES(cast_members),
              crew_members = VALUES(crew_members),
              updated_at = VALUES(updated_at)`,
            [
              document._id,
              document.vendorId || document.vendor || null,
              document.vendor || document.vendorId || null,
              document.title || "",
              document.language || "",
              document.duration || "",
              document.image || "",
              document.posterUrl || "",
              document.bannerUrl || "",
              document.description || "",
              document.theatre || "",
              document.theatreName || "",
              document.theatreCity || "",
              document.theatreAddress || "",
              document.screenNumber || "",
              document.showDate || "",
              document.showTime || "",
              JSON.stringify(document.showTimes || []),
              Number(document.totalSeats || 120),
              Number(document.regularSeatCount || document.regularSeats || 0),
              Number(document.primeSeatCount || document.primeSeats || 0),
              Number(document.vipSeatCount || document.vipSeats || 0),
              JSON.stringify(document.bookedSeats || []),
              Number(document.ticketPrice || 240),
              document.status || "active",
              document.genre || "",
              document.cast || "",
              document.director || "",
              document.releaseDate || "",
              document.rating || "",
              document.hero || "",
              document.certificate || "",
              document.format || "2D",
              document.trailerUrl || "",
              document.trailerFileUrl || "",
              JSON.stringify(document.galleryImages || []),
              JSON.stringify(document.documents || []),
              document.interestCount || "",
              document.aboutMovie || "",
              document.screenName || document.screenNumber || "",
              document.city || document.theatreCity || "",
              document.location || document.theatreAddress || "",
              document.endTime || "",
              JSON.stringify(document.seatLayout || []),
              Number(document.regularRows || 0),
              Number(document.regularSeatsPerRow || 0),
              Number(document.primeRows || 0),
              Number(document.primeSeatsPerRow || 0),
              Number(document.vipRows || 0),
              Number(document.vipSeatsPerRow || 0),
              document.regularRowsStart || "",
              document.regularRowsEnd || "",
              document.primeRowsStart || document.premiumRowsStart || "",
              document.primeRowsEnd || document.premiumRowsEnd || "",
              document.vipRowsStart || "",
              document.vipRowsEnd || "",
              JSON.stringify(document.blockedSeats || []),
              Number(document.regularSeatPrice || document.ticketPrice || 0),
              Number(document.premiumSeatPrice || 0),
              Number(document.vipSeatPrice || 0),
              Number(document.averageRating || 0),
              Number(document.totalReviews || 0),
              JSON.stringify(document.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
              Boolean(document.isOfferApplicable),
              JSON.stringify(document.offers || []),
              JSON.stringify(document.castMembers || []),
              JSON.stringify(document.crewMembers || []),
              document.createdAt,
              document.updatedAt,
            ]
          );
          return document;
        }
        if (name === "Flight") {
          const totalPrice = Number(document.totalPrice ?? document.ticketPrice ?? document.price ?? 0);
          const baseFare = Number(document.baseFare || 0);
          const taxes = Number(document.taxes || 0);
          const totalSeats = Number(document.totalSeats || 0);
          const bookedSeats = Number(document.bookedSeats || 0);
          const blockedSeats = Number(document.blockedSeats || 0);
          const availableSeats = Number(document.availableSeats ?? Math.max(totalSeats - bookedSeats - blockedSeats, 0));

          await pool.query(
            `INSERT INTO flights (
              id, vendor_id, airline_name, airline_logo, flight_number, flight_type,
              from_city, from_airport, from_code, to_city, to_airport, to_code,
              departure_date, departure_time, arrival_date, arrival_time, duration,
              aircraft, class_type, total_seats, available_seats, booked_seats, blocked_seats,
              base_fare, taxes, total_price, cabin_baggage, checkin_baggage,
              refundable, meal_included, status, seats, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              vendor_id = VALUES(vendor_id),
              airline_name = VALUES(airline_name),
              airline_logo = VALUES(airline_logo),
              flight_number = VALUES(flight_number),
              flight_type = VALUES(flight_type),
              from_city = VALUES(from_city),
              from_airport = VALUES(from_airport),
              from_code = VALUES(from_code),
              to_city = VALUES(to_city),
              to_airport = VALUES(to_airport),
              to_code = VALUES(to_code),
              departure_date = VALUES(departure_date),
              departure_time = VALUES(departure_time),
              arrival_date = VALUES(arrival_date),
              arrival_time = VALUES(arrival_time),
              duration = VALUES(duration),
              aircraft = VALUES(aircraft),
              class_type = VALUES(class_type),
              total_seats = VALUES(total_seats),
              available_seats = VALUES(available_seats),
              booked_seats = VALUES(booked_seats),
              blocked_seats = VALUES(blocked_seats),
              base_fare = VALUES(base_fare),
              taxes = VALUES(taxes),
              total_price = VALUES(total_price),
              cabin_baggage = VALUES(cabin_baggage),
              checkin_baggage = VALUES(checkin_baggage),
              refundable = VALUES(refundable),
              meal_included = VALUES(meal_included),
              status = VALUES(status),
              seats = VALUES(seats),
              updated_at = VALUES(updated_at)`,
            [
              document._id,
              document.vendorId || document.vendor || null,
              document.airlineName || document.airline || "",
              document.airlineLogo || document.airlineLogoUrl || "",
              document.flightNumber || "",
              document.flightType || "domestic",
              document.fromCity || document.from || "",
              document.fromAirport || "",
              document.fromCode || "",
              document.toCity || document.to || "",
              document.toAirport || "",
              document.toCode || "",
              document.departureDate || "",
              document.departureTime || "",
              document.arrivalDate || "",
              document.arrivalTime || "",
              document.duration || "",
              document.aircraft || document.aircraftType || "A320",
              document.classType || document.cabinClass || "Economy",
              totalSeats,
              availableSeats,
              bookedSeats,
              blockedSeats,
              baseFare,
              taxes,
              totalPrice,
              document.cabinBaggage || document.cabin_baggage || document.cabinBaggageInfo || "",
              document.checkinBaggage || document.checkin_baggage || document.baggageAllowance || "",
              Boolean(document.refundable),
              Boolean(document.mealIncluded),
              document.status || "active",
              JSON.stringify(document.seats || []),
              document.createdAt,
              document.updatedAt,
            ]
          );
          return document;
        }
        if (name === "Booking") {
          const details = document.details || {};
          const flightId = document.flightId || details.flightId || details.flight?._id || details.flight?.id || null;
          const bookingCode = document.bookingCode || `TH${Date.now().toString(36).toUpperCase()}`;
          const bookingId = document.bookingId || bookingCode;

          document.bookingCode = bookingCode;
          document.bookingId = bookingId;

          await pool.query(
            `INSERT INTO bookings (
              id, booking_id, booking_code, user_id, vendor_id, module, title, movie_id, theatre_id, screen_id, show_id, flight_id,
              customer_name, customer_email, customer_mobile, theatre, show_date, show_time,
              seats, seat_numbers, amount, total_amount, status, payment_status, booking_status,
              qr_token, qr_code_url, checked_in, checked_in_at, scanned_by, edit_count, details, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              booking_id = VALUES(booking_id),
              vendor_id = VALUES(vendor_id),
              title = VALUES(title),
              movie_id = VALUES(movie_id),
              theatre_id = VALUES(theatre_id),
              screen_id = VALUES(screen_id),
              show_id = VALUES(show_id),
              flight_id = VALUES(flight_id),
              customer_name = VALUES(customer_name),
              customer_email = VALUES(customer_email),
              customer_mobile = VALUES(customer_mobile),
              theatre = VALUES(theatre),
              show_date = VALUES(show_date),
              show_time = VALUES(show_time),
              seats = VALUES(seats),
              seat_numbers = VALUES(seat_numbers),
              amount = VALUES(amount),
              total_amount = VALUES(total_amount),
              status = VALUES(status),
              payment_status = VALUES(payment_status),
              booking_status = VALUES(booking_status),
              qr_token = VALUES(qr_token),
              qr_code_url = VALUES(qr_code_url),
              checked_in = VALUES(checked_in),
              checked_in_at = VALUES(checked_in_at),
              scanned_by = VALUES(scanned_by),
              edit_count = VALUES(edit_count),
              details = VALUES(details),
              updated_at = VALUES(updated_at)`,
            [
              document._id,
              bookingId,
              bookingCode,
              document.user,
              document.vendorId || document.vendor || null,
              document.module || "",
              document.title || "",
              document.movieId || details.movieId || null,
              document.theatreId || details.theatreId || null,
              document.screenId || details.screenId || null,
              document.showId || details.showId || null,
              flightId,
              document.customerName || details.customerName || details.passenger?.name || "",
              document.customerEmail || details.customerEmail || details.passenger?.email || "",
              document.customerMobile || details.customerMobile || details.passenger?.mobile || "",
              details.theatre?.name || details.theatre || document.theatre || "",
              details.showDate || document.showDate || "",
              details.showTime || document.showTime || "",
              JSON.stringify(document.seats || []),
              JSON.stringify(document.seatNumbers || document.seats || []),
              Number(document.amount || 0),
              Number(document.totalAmount || document.amount || 0),
              document.status || "confirmed",
              document.paymentStatus || "paid",
              document.bookingStatus || document.status || "confirmed",
              document.qrToken || null,
              document.qrCodeUrl || null,
              Boolean(document.checkedIn),
              document.checkedInAt || null,
              document.scannedBy || null,
              Number(document.editCount || 0),
              JSON.stringify(details),
              document.createdAt,
              document.updatedAt,
            ]
          );

          if (document.module === "flight" && flightId) {
            const passenger = details.passenger || {};
            await pool.query(
              `INSERT INTO flight_bookings (
                id, booking_id, booking_code, user_id, flight_id, passenger_name,
                passenger_mobile, passenger_email, seat_number, class_type, total_amount,
                booking_status, payment_status, booking_date, details, created_at, updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                passenger_name = VALUES(passenger_name),
                passenger_mobile = VALUES(passenger_mobile),
                passenger_email = VALUES(passenger_email),
                seat_number = VALUES(seat_number),
                class_type = VALUES(class_type),
                total_amount = VALUES(total_amount),
                booking_status = VALUES(booking_status),
                payment_status = VALUES(payment_status),
                details = VALUES(details),
                updated_at = VALUES(updated_at)`,
              [
                document._id,
                document._id,
                bookingCode,
                document.user,
                flightId,
                passenger.name || document.customerName || "",
                passenger.mobile || document.customerMobile || "",
                passenger.email || document.customerEmail || "",
                (document.seats || details.seats || []).join(", "),
                document.classType || details.cabinClass || details.classType || "Economy",
                Number(document.amount || 0),
                document.status || "confirmed",
                document.paymentStatus || "paid",
                document.createdAt,
                JSON.stringify(details),
                document.createdAt,
                document.updatedAt,
              ]
            );
          }

          return document;
        }
        if (name === "VendorListing") {
          await pool.query(
            `INSERT INTO vendor_listings (
              id, vendor_id, module, title, city, route, price, inventory,
              image_url, details, status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              vendor_id = VALUES(vendor_id),
              module = VALUES(module),
              title = VALUES(title),
              city = VALUES(city),
              route = VALUES(route),
              price = VALUES(price),
              inventory = VALUES(inventory),
              image_url = VALUES(image_url),
              details = VALUES(details),
              status = VALUES(status),
              updated_at = VALUES(updated_at)`,
            [
              document._id,
              document.vendorId || document.vendor || null,
              document.module || "general",
              document.title || "Untitled listing",
              document.city || "",
              document.route || "",
              Number(document.price || 0),
              Number(document.inventory || 0),
              document.imageUrl || document.image_url || "",
              JSON.stringify(document.details || {}),
              document.status || "active",
              document.createdAt,
              document.updatedAt,
            ]
          );
          return document;
        }
        if (name === "Screen") {
          const rows = Math.max(Number(document.rows || document.totalRows || 10), 1);
          const seatsPerRow = Math.max(Number(document.seatsPerRow || document.seats_per_row || 10), 1);
          const vipSeats = Number(document.vipSeats || document.vip_seats || 0);
          const primeSeats = Number(document.primeSeats || document.prime_seats || 0);
          const regularSeats = Number(document.regularSeats || document.regular_seats || 0);
          const totalSeats = Number(document.totalSeats || vipSeats + primeSeats + regularSeats || rows * seatsPerRow);
          await pool.query(
            `INSERT INTO movie_screens (
              id, vendor_id, theatre_id, movie_id, name, rows_count, seats_per_row,
              total_seats, vip_seats, prime_seats, regular_seats, vip_price, prime_price,
              regular_price, screen_type, status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              vendor_id = VALUES(vendor_id),
              theatre_id = VALUES(theatre_id),
              movie_id = VALUES(movie_id),
              name = VALUES(name),
              rows_count = VALUES(rows_count),
              seats_per_row = VALUES(seats_per_row),
              total_seats = VALUES(total_seats),
              vip_seats = VALUES(vip_seats),
              prime_seats = VALUES(prime_seats),
              regular_seats = VALUES(regular_seats),
              vip_price = VALUES(vip_price),
              prime_price = VALUES(prime_price),
              regular_price = VALUES(regular_price),
              screen_type = VALUES(screen_type),
              status = VALUES(status),
              updated_at = VALUES(updated_at)`,
            [
              document._id,
              document.vendorId || document.vendor || null,
              document.theatreId || null,
              document.movieId || null,
              document.name || document.screenName || "Screen",
              rows,
              seatsPerRow,
              totalSeats,
              vipSeats,
              primeSeats,
              regularSeats || Math.max(totalSeats - vipSeats - primeSeats, 0),
              Number(document.vipPrice || document.vip_price || document.vipSeatPrice || 0),
              Number(document.primePrice || document.prime_price || document.premiumSeatPrice || 0),
              Number(document.regularPrice || document.regular_price || document.regularSeatPrice || 0),
              document.screenType || "2D",
              document.status || "active",
              document.createdAt,
              document.updatedAt,
            ]
          );
          return document;
        }
        if (name === "Show") {
          await pool.query(
            `INSERT INTO movie_shows (
              id, vendor_id, movie_id, theatre_id, screen_id, show_date, show_time,
              end_time, price, status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              vendor_id = VALUES(vendor_id),
              theatre_id = VALUES(theatre_id),
              end_time = VALUES(end_time),
              price = VALUES(price),
              status = VALUES(status),
              updated_at = VALUES(updated_at)`,
            [
              document._id,
              document.vendorId || document.vendor || null,
              document.movieId,
              document.theatreId || null,
              document.screenId,
              document.showDate || "",
              document.showTime || "",
              document.endTime || "",
              Number(document.price || 0),
              document.status || "active",
              document.createdAt,
              document.updatedAt,
            ]
          );
          return document;
        }
        await pool.query(
          `INSERT INTO app_records (id, model, data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)`,
          [
            document._id,
            name,
            JSON.stringify(document.toObject()),
            document.createdAt,
            document.updatedAt,
          ]
        );
      } catch (error) {
        mysqlAvailable = false;
        if (requiresMysql) throw error;
        console.log(`MySQL write failed for ${name}; using memory fallback`, error.message);
      }

      return document;
    }

    static async remove(query = {}) {
      const rows = await this.readAll();
      const removed = rows.filter((item) => matchesQuery(item, query));

      if (mysqlAvailable && removed.length) {
        mysqlAvailable = await ready;
        if (mysqlAvailable) {
          if (name === "User") {
            await pool.query(`DELETE FROM users WHERE id IN (${removed.map(() => "?").join(",")})`, removed.map((item) => item._id));
          } else if (name === "Movie") {
            await pool.query(`DELETE FROM movies WHERE id IN (${removed.map(() => "?").join(",")})`, removed.map((item) => item._id));
          } else if (name === "Flight") {
            await pool.query(`DELETE FROM flights WHERE id IN (${removed.map(() => "?").join(",")})`, removed.map((item) => item._id));
          } else if (name === "Booking") {
            const ids = removed.map((item) => item._id);
            await pool.query(`DELETE FROM flight_bookings WHERE booking_id IN (${removed.map(() => "?").join(",")})`, ids);
            await pool.query(`DELETE FROM bookings WHERE id IN (${removed.map(() => "?").join(",")})`, ids);
          } else if (name === "VendorListing") {
            await pool.query(`DELETE FROM vendor_listings WHERE id IN (${removed.map(() => "?").join(",")})`, removed.map((item) => item._id));
          } else if (name === "Screen") {
            await pool.query(`DELETE FROM movie_screens WHERE id IN (${removed.map(() => "?").join(",")})`, removed.map((item) => item._id));
          } else if (name === "Show") {
            await pool.query(`DELETE FROM movie_shows WHERE id IN (${removed.map(() => "?").join(",")})`, removed.map((item) => item._id));
          } else {
            await pool.query(
              `DELETE FROM app_records WHERE model = ? AND id IN (${removed.map(() => "?").join(",")})`,
              [name, ...removed.map((item) => item._id)]
            );
          }
        }
      } else if (["User", "Movie", "Flight", "Booking", "VendorListing", "Screen", "Show"].includes(name) && removed.length) {
        throw new Error("MySQL connection is not available");
      }

      return removed;
    }

    static find(query = {}) {
      return new Query(async () => (await this.readAll()).filter((item) => matchesQuery(item, query)));
    }

    static findOne(query = {}) {
      return new Query(async () => (await this.readAll()).find((item) => matchesQuery(item, query)) || null);
    }

    static findById(id) {
      return this.findOne({ _id: id });
    }

    static async create(data) {
      const document = new this(data);
      await document.save();
      return document;
    }

    static findOneAndUpdate(query, update, options = {}) {
      return new Query(async () => {
        let document = (await this.readAll()).find((item) => matchesQuery(item, query));
        if (!document && options.upsert) {
          document = new this({ ...query });
        }
        if (!document) return null;
        applyUpdate(document, update);
        document.updatedAt = new Date();
        await document.save();
        return document;
      });
    }

    static findByIdAndUpdate(id, update, options = {}) {
      return this.findOneAndUpdate({ _id: id }, update, options);
    }

    static findOneAndDelete(query) {
      return new Query(async () => {
        const [removed] = await this.remove(query);
        if (!removed) return null;
        memoryStore[name] = this._items.filter((item) => !same(item._id, removed._id));
        return removed;
      });
    }

    static findByIdAndDelete(id) {
      return this.findOneAndDelete({ _id: id });
    }

    static async deleteMany(query = {}) {
      const removed = await this.remove(query);
      memoryStore[name] = this._items.filter((item) => !matchesQuery(item, query));
      return { deletedCount: removed.length };
    }

    static async countDocuments(query = {}) {
      return (await this.readAll()).filter((item) => matchesQuery(item, query)).length;
    }

    static async aggregate(pipeline = []) {
      const group = pipeline.find((stage) => stage.$group)?.$group;
      if (!group?.total?.$sum) return [];
      const field = String(group.total.$sum).replace(/^\$/, "");
      const rows = await this.readAll();
      return [{ _id: group._id || null, total: rows.reduce((sum, item) => sum + Number(getPath(item, field) || 0), 0) }];
    }

    markModified() {}

    toObject() {
      return clone(this);
    }

    async save() {
      const existingIndex = this.constructor._items.findIndex((item) => same(item._id, this._id));
      this.updatedAt = new Date();
      if (existingIndex >= 0) {
        this.constructor._items[existingIndex] = this;
      } else {
        this.constructor._items.push(this);
      }
      await this.constructor.write(this);
      return this;
    }
  }

  InMemoryDocument.modelName = name;
  memoryStore[name] = seed.map((item) => new InMemoryDocument(item));
  registry[name] = InMemoryDocument;
  return InMemoryDocument;
};

module.exports = createInMemoryModel;
