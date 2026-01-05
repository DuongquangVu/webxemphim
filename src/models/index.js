const User = require("./User");
const Movie = require("./Movie");
const Cinema = require("./Cinema");
const Room = require("./Room");
const Seat = require("./Seat");
const Showtime = require("./Showtime");
const Booking = require("./Booking");
const Ticket = require("./Ticket");
const SeatLock = require("./SeatLock");
const Review = require("./Review");
const { pool } = require("./BaseModel");

module.exports = {
  User,
  Movie,
  Cinema,
  Room,
  Seat,
  Showtime,
  Booking,
  Ticket,
  SeatLock,
  Review,
  pool,
};
