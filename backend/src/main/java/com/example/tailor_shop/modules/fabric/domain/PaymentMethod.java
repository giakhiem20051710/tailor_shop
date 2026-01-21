package com.example.tailor_shop.modules.fabric.domain;

/**
 * Phương thức thanh toán (giống FPT Shop)
 */
public enum PaymentMethod {
    COD,              // Thanh toán khi nhận hàng
    BANK_TRANSFER,    // Chuyển khoản ngân hàng
    CREDIT_CARD,      // Thẻ tín dụng
    DEBIT_CARD,       // Thẻ ghi nợ
    E_WALLET,         // Ví điện tử (MoMo, ZaloPay, etc.)
    INSTALLMENT       // Trả góp
}

