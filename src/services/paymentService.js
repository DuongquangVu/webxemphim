/**
 * PaymentService - Mô phỏng thanh toán online
 * Trong thực tế sẽ tích hợp với các cổng thanh toán như:
 * - VNPay
 * - MoMo
 * - ZaloPay
 * - Stripe
 */

class PaymentService {
  constructor() {
    this.supportedMethods = [
      "cash",
      "credit_card",
      "e_wallet",
      "bank_transfer",
    ];
  }

  /**
   * Tạo yêu cầu thanh toán
   */
  async createPaymentRequest(booking, paymentMethod) {
    if (!this.supportedMethods.includes(paymentMethod)) {
      throw new Error("Phương thức thanh toán không được hỗ trợ");
    }

    const paymentRequest = {
      orderId: booking.booking_code,
      amount: booking.total_amount,
      currency: "VND",
      method: paymentMethod,
      description: `Thanh toán đặt vé - ${booking.booking_code}`,
      createdAt: new Date(),
      expiredAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    };

    // Tạo payment URL tùy theo phương thức
    switch (paymentMethod) {
      case "credit_card":
        return this.createCreditCardPayment(paymentRequest);
      case "e_wallet":
        return this.createEWalletPayment(paymentRequest);
      case "bank_transfer":
        return this.createBankTransferPayment(paymentRequest);
      default:
        return this.createCashPayment(paymentRequest);
    }
  }

  /**
   * Mô phỏng thanh toán thẻ tín dụng
   */
  async createCreditCardPayment(request) {
    return {
      ...request,
      paymentUrl: `/payment/credit-card/${request.orderId}`,
      instructions: [
        "Nhập thông tin thẻ tín dụng",
        "Xác nhận OTP từ ngân hàng",
        "Hoàn tất thanh toán",
      ],
    };
  }

  /**
   * Mô phỏng thanh toán ví điện tử
   */
  async createEWalletPayment(request) {
    return {
      ...request,
      paymentUrl: `/payment/e-wallet/${request.orderId}`,
      qrCode: this.generateQRCode(request),
      instructions: [
        "Mở ứng dụng ví điện tử (MoMo, ZaloPay...)",
        "Quét mã QR hoặc nhập mã thanh toán",
        "Xác nhận thanh toán",
      ],
    };
  }

  /**
   * Mô phỏng chuyển khoản ngân hàng
   */
  async createBankTransferPayment(request) {
    return {
      ...request,
      bankInfo: {
        bankName: "Vietcombank",
        accountNumber: "1234567890",
        accountName: "CINEMA BOOKING CO LTD",
        branch: "Chi nhánh Hồ Chí Minh",
        transferContent: `BOOKING ${request.orderId}`,
      },
      instructions: [
        "Chuyển khoản với nội dung: " + request.orderId,
        "Gửi ảnh chụp màn hình chuyển khoản",
        "Chờ xác nhận trong 5-10 phút",
      ],
    };
  }

  /**
   * Thanh toán tiền mặt
   */
  async createCashPayment(request) {
    return {
      ...request,
      instructions: [
        "Đến quầy vé trước giờ chiếu 30 phút",
        "Xuất trình mã booking: " + request.orderId,
        "Thanh toán và nhận vé",
      ],
    };
  }

  /**
   * Xác nhận thanh toán
   */
  async confirmPayment(orderId, transactionInfo) {
    // Mô phỏng xác nhận (thực tế sẽ verify với payment gateway)
    const isValid = Math.random() < 0.95; // 95% success

    if (isValid) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        paidAt: new Date(),
        message: "Thanh toán thành công",
      };
    }

    return {
      success: false,
      message: "Xác nhận thanh toán thất bại. Vui lòng liên hệ hỗ trợ.",
    };
  }

  /**
   * Hoàn tiền
   */
  async refund(transactionId, amount, reason) {
    // Mô phỏng hoàn tiền
    return {
      success: true,
      refundId: `REF_${Date.now()}`,
      amount,
      reason,
      refundedAt: new Date(),
      message:
        "Hoàn tiền thành công. Tiền sẽ được hoàn trong 3-5 ngày làm việc.",
    };
  }

  /**
   * Kiểm tra trạng thái thanh toán
   */
  async checkPaymentStatus(orderId) {
    // Mô phỏng (thực tế query từ payment gateway)
    return {
      orderId,
      status: "pending", // pending, paid, failed, expired
      checkedAt: new Date(),
    };
  }

  /**
   * Tạo mã QR (mô phỏng)
   */
  generateQRCode(request) {
    return `QR_${request.orderId}_${request.amount}`;
  }

  /**
   * Webhook handler cho payment gateway callback
   */
  async handleWebhook(payload, signature) {
    // Xác thực signature
    // const isValid = this.verifySignature(payload, signature);
    // if (!isValid) throw new Error('Invalid signature');

    const { orderId, status, transactionId } = payload;

    return {
      orderId,
      status,
      transactionId,
      processedAt: new Date(),
    };
  }
}

module.exports = new PaymentService();
