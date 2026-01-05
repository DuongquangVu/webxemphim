const express = require("express");
const router = express.Router();
const { cinemaController } = require("../controllers");

// Lấy tất cả rạp (public)
router.get("/", cinemaController.getAllCinemas);

// Lấy danh sách thành phố (public)
router.get("/cities", cinemaController.getCities);

// Lấy rạp theo thành phố (public)
router.get("/city/:city", cinemaController.getByCity);

// Lấy chi tiết rạp (public)
router.get("/:id", cinemaController.getCinemaDetail);

module.exports = router;
