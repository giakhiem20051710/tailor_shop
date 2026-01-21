import { useState, useEffect, useRef } from "react";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! 👋 Tôi có thể giúp gì cho bạn hôm nay?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickReplies = [
    "Tư vấn chọn size",
    "Giá cả sản phẩm",
    "Thời gian giao hàng",
    "Chính sách đổi trả",
    "Đặt lịch hẹn",
  ];

  // AI-powered response patterns
  const getAIResponse = (text) => {
    const lowerText = text.toLowerCase();
    
    // Size/measurement related
    if (lowerText.includes("size") || lowerText.includes("số đo") || lowerText.includes("đo")) {
      return "Chúng tôi có bảng size chi tiết và video hướng dẫn đo. Bạn có thể:\n• Xem tại trang Hỗ trợ\n• Đến tiệm để được đo trực tiếp miễn phí\n• Gọi hotline để được tư vấn qua điện thoại\n\nBạn muốn tôi gửi link hướng dẫn không?";
    }
    
    // Price related
    if (lowerText.includes("giá") || lowerText.includes("bao nhiêu") || lowerText.includes("chi phí")) {
      return "Giá sản phẩm phụ thuộc vào mẫu mã và chất liệu vải:\n\n💰 Áo dài cưới: Từ 2.500.000₫\n💰 Vest công sở: Từ 1.800.000₫\n💰 Đầm dạ hội: Từ 3.200.000₫\n💰 Áo dài thường ngày: Từ 1.500.000₫\n\nBạn quan tâm đến sản phẩm nào? Tôi có thể tư vấn chi tiết hơn!";
    }
    
    // Delivery time
    if (lowerText.includes("thời gian") || lowerText.includes("bao lâu") || lowerText.includes("giao hàng") || lowerText.includes("hoàn thành")) {
      return "⏰ Thời gian may trung bình:\n• Áo dài: 5-7 ngày làm việc\n• Vest: 7-10 ngày làm việc\n• Đầm dạ hội: 8-12 ngày làm việc\n\nVới các dịp gấp (cưới hỏi, sự kiện), chúng tôi sẽ ưu tiên và báo rõ thời gian ngay từ lúc tư vấn. Bạn có cần gấp không?";
    }
    
    // Policy/return
    if (lowerText.includes("đổi") || lowerText.includes("trả") || lowerText.includes("bảo hành") || lowerText.includes("chỉnh sửa")) {
      return "✅ Chính sách của chúng tôi:\n• Bảo hành đường may 6 tháng\n• Chỉnh sửa miễn phí trong 30 ngày nếu size không vừa\n• Cam kết chỉnh sửa đến khi bạn hài lòng\n• Sản phẩm may đo không thể đổi trả nhưng chúng tôi luôn hỗ trợ chỉnh sửa\n\nBạn có câu hỏi gì khác về chính sách không?";
    }
    
    // Appointment/booking
    if (lowerText.includes("đặt lịch") || lowerText.includes("hẹn") || lowerText.includes("tư vấn") || lowerText.includes("đến tiệm")) {
      return "📅 Bạn có thể đặt lịch hẹn bằng nhiều cách:\n\n1️⃣ Qua website: Vào trang 'Đặt may' hoặc 'Dashboard'\n2️⃣ Gọi hotline: 0901 134 256\n3️⃣ Đến tiệm trực tiếp\n\n⏰ Giờ làm việc: 07:00 - 23:00 hàng ngày\n📍 Địa chỉ: 123 Nguyễn Thị Minh Khai, Q.1, TP.HCM\n\nBạn muốn đặt lịch cho dịp nào?";
    }
    
    // Fabric/material
    if (lowerText.includes("vải") || lowerText.includes("chất liệu") || lowerText.includes("lụa") || lowerText.includes("linen")) {
      return "🧵 Chúng tôi có nhiều loại vải cao cấp:\n\n• Lụa Taffeta: Sang trọng, phù hợp áo dài cưới\n• Lụa Satin: Bóng đẹp, hợp đầm dạ hội\n• Linen: Thoáng mát, hợp trang phục hằng ngày\n• Cashmere: Cao cấp, hợp vest công sở\n\nBạn có thể xem kho vải tại trang 'Kho vải' hoặc đến tiệm để xem trực tiếp. Bạn quan tâm loại vải nào?";
    }
    
    // Style/suggestion
    if (lowerText.includes("phong cách") || lowerText.includes("gợi ý") || lowerText.includes("nên chọn") || lowerText.includes("phù hợp")) {
      return "✨ Chúng tôi có AI Style Assistant để gợi ý phong cách phù hợp với bạn!\n\nBạn có thể:\n• Truy cập trang 'AI Gợi ý Phong cách'\n• Cho biết dịp sử dụng và sở thích\n• Nhận gợi ý thiết kế phù hợp\n\nHoặc bạn có thể mô tả dịp sử dụng, tôi sẽ tư vấn trực tiếp!";
    }
    
    // Greeting
    if (lowerText.includes("xin chào") || lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("chào")) {
      return "Xin chào! 👋 Rất vui được hỗ trợ bạn!\n\nTôi có thể giúp bạn:\n• Tư vấn chọn size và mẫu mã\n• Thông tin về giá cả và thời gian\n• Đặt lịch hẹn tư vấn\n• Gợi ý phong cách phù hợp\n\nBạn cần hỗ trợ gì hôm nay?";
    }
    
    // Thank you
    if (lowerText.includes("cảm ơn") || lowerText.includes("thanks") || lowerText.includes("thank")) {
      return "Cảm ơn bạn đã liên hệ với My Hiền Tailor! 😊\n\nNếu bạn có thêm câu hỏi, đừng ngần ngại nhắn tin nhé. Chúc bạn một ngày tốt lành!";
    }
    
    // Default intelligent response
    return "Cảm ơn bạn đã liên hệ! 🤖\n\nTôi là AI Assistant của My Hiền Tailor. Để được tư vấn chi tiết hơn, bạn có thể:\n\n📞 Gọi hotline: 0901 134 256\n💬 Nhắn tin Facebook/Zalo\n🏪 Đến tiệm: 123 Nguyễn Thị Minh Khai, Q.1, TP.HCM\n\nHoặc bạn có thể hỏi tôi về:\n• Giá cả sản phẩm\n• Thời gian giao hàng\n• Tư vấn chọn size\n• Đặt lịch hẹn\n• Gợi ý phong cách";
  };

  const handleSendMessage = (text = null) => {
    const messageText = text || inputMessage.trim();
    if (!messageText) return;

    // Thêm tin nhắn người dùng
    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Bot typing
    setIsTyping(true);

    // AI Bot response sau 1-2 giây (simulate thinking)
    setTimeout(() => {
      const botResponse = getAIResponse(messageText);

      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickReply = (text) => {
    handleSendMessage(text);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#1B4332] text-white w-14 h-14 rounded-full shadow-lg hover:bg-[#14532d] transition-all duration-300 flex items-center justify-center group hover:scale-110"
          aria-label="Mở chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            1
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1B4332] to-[#14532d] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[14px]">Hỗ trợ khách hàng</h3>
                <p className="text-[11px] text-white/80">Thường phản hồi trong vài phút</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Đóng chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-[#1B4332] text-white"
                      : "bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-line">
                    {message.text}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      message.sender === "user" ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-white border-t border-gray-200">
              <p className="text-[11px] text-gray-500 mb-2">Câu hỏi thường gặp:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="text-[11px] px-3 py-1.5 bg-gray-100 hover:bg-[#1B4332] hover:text-white rounded-full transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="bg-[#1B4332] text-white px-4 py-2 rounded-full hover:bg-[#14532d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
              Hoặc liên hệ:{" "}
              <a href="tel:0901134256" className="text-[#1B4332] hover:underline">
                0901 134 256
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

