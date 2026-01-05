const { Cinema, Room } = require("../models");

class CinemaController {
  // Lấy tất cả rạp
  async getAllCinemas(req, res) {
    try {
      const cinemas = await Cinema.getCinemaWithRoomCount();
      res.json({
        success: true,
        data: cinemas,
      });
    } catch (error) {
      console.error("Get all cinemas error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy chi tiết rạp
  async getCinemaDetail(req, res) {
    try {
      const { id } = req.params;
      const cinema = await Cinema.getCinemaWithRooms(id);

      if (!cinema) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy rạp",
        });
      }

      res.json({
        success: true,
        data: cinema,
      });
    } catch (error) {
      console.error("Get cinema detail error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy rạp theo thành phố
  async getByCity(req, res) {
    try {
      const { city } = req.params;
      const cinemas = await Cinema.getByCity(city);

      res.json({
        success: true,
        data: cinemas,
        city,
      });
    } catch (error) {
      console.error("Get cinemas by city error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }

  // Lấy danh sách thành phố
  async getCities(req, res) {
    try {
      const cities = await Cinema.getCities();
      res.json({
        success: true,
        data: cities,
      });
    } catch (error) {
      console.error("Get cities error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
}

module.exports = new CinemaController();
