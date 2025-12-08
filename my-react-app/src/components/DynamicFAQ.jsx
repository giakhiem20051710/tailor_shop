import { useState } from "react";

const DynamicFAQ = ({ faqs = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const defaultFAQs = [
    {
      question: "Mất bao lâu để hoàn thành một bộ đồ may đo?",
      answer: "Thời gian trung bình 5–10 ngày làm việc tuỳ mẫu. Với các dịp gấp, My Hiền sẽ ưu tiên lịch và báo rõ thời gian ngay từ lúc tư vấn.",
    },
    {
      question: "Nếu nhận đồ chưa vừa ý thì sao?",
      answer: "Bạn được chỉnh sửa form miễn phí trong 90 ngày. Chúng tôi ưu tiên sự thoải mái và tự tin của bạn hơn bất cứ điều gì khác.",
    },
    {
      question: "Tôi chưa rõ mình hợp kiểu đồ nào, có cần chuẩn bị gì không?",
      answer: "Bạn chỉ cần cho biết dịp, phong cách mong muốn và ngân sách. Stylist sẽ gợi ý vài phương án và cho bạn thử phom trực tiếp.",
    },
    {
      question: "Giá cả như thế nào?",
      answer: "Giá sản phẩm phụ thuộc vào mẫu mã và chất liệu vải. Áo dài cưới từ 2.500.000₫, vest công sở từ 1.800.000₫, đầm dạ hội từ 3.200.000₫. Chúng tôi sẽ báo giá chi tiết sau khi tư vấn.",
    },
    {
      question: "Có thể đặt may online không?",
      answer: "Có, bạn có thể đặt may online qua website. Tuy nhiên, chúng tôi khuyến khích bạn đến tiệm để được đo trực tiếp và tư vấn kỹ hơn.",
    },
    {
      question: "Chính sách bảo hành như thế nào?",
      answer: "Chúng tôi bảo hành đường may trong vòng 6 tháng kể từ ngày nhận hàng. Nếu có lỗi từ phía sản xuất, chúng tôi sẽ sửa chữa miễn phí.",
    },
    {
      question: "Có hỗ trợ giao hàng không?",
      answer: "Có, chúng tôi hỗ trợ giao hàng tận nơi. Miễn phí vận chuyển cho đơn hàng trên 3 triệu đồng trong nội thành TP.HCM.",
    },
    {
      question: "Làm thế nào để trở thành thành viên thân thiết?",
      answer: "Khách hàng đặt may từ lần thứ 3 trở đi sẽ tự động trở thành thành viên thân thiết, được hưởng nhiều ưu đãi đặc biệt như giảm 10% cho mọi đơn hàng.",
    },
  ];

  const displayFAQs = faqs.length > 0 ? faqs : defaultFAQs;

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full space-y-3">
      {displayFAQs.map((faq, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
        >
          <button
            onClick={() => toggleFAQ(index)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-[14px] md:text-[15px] font-semibold text-[#111827] pr-4">
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 text-[#1B4332] flex-shrink-0 transition-transform duration-300 ${
                openIndex === index ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-5 pb-4 pt-0">
              <p className="text-[13px] md:text-[14px] text-[#4B5563] leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DynamicFAQ;

