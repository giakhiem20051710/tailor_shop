import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
    {
        id: 'occasion',
        text: 'Chào bạn, mình là AI Stylist của Lavi Tailor ✨. Hôm nay bạn cần tìm trang phục cho dịp nào?',
        options: [
            { label: '💍 Đám cưới / Dự lễ', value: 'wedding' },
            { label: '💼 Đi làm / Công sở', value: 'office' },
            { label: '🥂 Tiệc tùng / Sự kiện', value: 'party' },
            { label: '☕ Đi chơi / Hằng ngày', value: 'daily' },
        ]
    },
    {
        id: 'category',
        text: 'Tuyệt vời! Bạn đang muốn tìm loại trang phục nào?',
        options: [
            { label: 'Áo dài truyền thống/cách tân', value: 'ao-dai' },
            { label: 'Vest / Suit thanh lịch', value: 'vest' },
            { label: 'Đầm / Váy', value: 'dam' },
            { label: 'Chưa rõ, hãy gợi ý cho tôi', value: 'all' },
        ]
    },
    {
        id: 'style',
        text: 'Bạn thích phong cách nào nhất?',
        options: [
            { label: '✨ Sang trọng & Quý phái', value: 'luxury' },
            { label: '🌿 Tối giản & Tinh tế', value: 'minimalist' },
            { label: '🎀 Nữ tính & Nhẹ nhàng', value: 'feminine' },
            { label: '💃 Cá tính & Nổi bật', value: 'bold' },
        ]
    }
];

const StylistChatbot = ({ isOpen, onClose, products }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const messagesEndRef = useRef(null);

    // Initialize chat when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            addBotMessage(QUESTIONS[0].text);
        }
    }, [isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const addBotMessage = (text) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text }]);
        }, 800);
    };

    const addUserMessage = (text) => {
        setMessages(prev => [...prev, { type: 'user', text }]);
    };

    const handleOptionClick = (option) => {
        // Prevent multiple clicks
        if (isTyping) return;

        addUserMessage(option.label);

        // Save answer
        const currentQuestion = QUESTIONS[step];
        const newAnswers = { ...answers, [currentQuestion.id]: option.value };
        setAnswers(newAnswers);

        // Move to next step or finish
        if (step < QUESTIONS.length - 1) {
            setStep(prev => prev + 1);
            setTimeout(() => {
                addBotMessage(QUESTIONS[step + 1].text);
            }, 500);
        } else {
            // Analyze and Recommend
            setTimeout(() => {
                finishChat(newAnswers);
            }, 500);
        }
    };

    const finishChat = (finalAnswers) => {
        setIsTyping(true);

        // Simple Recommendation Logic
        setTimeout(() => {
            let filtered = products.filter(p => {
                let score = 0;
                // Match Occasion
                if (p.occasion === finalAnswers.occasion || p.occasion === 'all') score += 3;
                // Match Category
                if (finalAnswers.category !== 'all' && p.category === finalAnswers.category) score += 3;

                return score > 0;
            });

            // Sort by rudimentary relevance (mock score)
            // In real app, we would use tags/styleCategory from AI analysis
            filtered.sort(() => 0.5 - Math.random());

            const top3 = filtered.slice(0, 3);
            setRecommendations(top3);

            setIsTyping(false);
            if (top3.length > 0) {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: `Dựa trên sở thích của bạn, đây là ${top3.length} gợi ý tốt nhất từ Lavi Tailor:`,
                    isResult: true
                }]);
            } else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: 'Xin lỗi, hiện tại mình chưa tìm thấy mẫu nào khớp hoàn toàn. Tuy nhiên bạn có thể tham khảo bộ sưu tập mới nhất nhé!',
                    isResult: true
                }]);
            }
        }, 1500);
    };

    const handleReset = () => {
        setMessages([]);
        setStep(0);
        setAnswers({});
        setRecommendations([]);
        setTimeout(() => addBotMessage(QUESTIONS[0].text), 100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Chat Interface */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">

                {/* Header */}
                <div className="bg-[#1B4332] p-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 relative">
                            <span className="text-xl">🤖</span>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#1B4332] rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm md:text-base">Lavi AI Stylist</h3>
                            <p className="text-[10px] md:text-xs text-white/70">Tư vấn phong cách 24/7</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-full transition-colors text-xs" title="Làm mới">
                            Start Over ↺
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[85%] rounded-2xl p-3.5 text-sm md:text-base leading-relaxed shadow-sm ${msg.type === 'user'
                                        ? 'bg-[#1B4332] text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-1.5 items-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}

                    {/* Recommendations Result */}
                    {recommendations.length > 0 && !isTyping && (
                        <div className="grid grid-cols-1 gap-3 mt-2 animate-fade-in">
                            {recommendations.map((prod, i) => (
                                <div
                                    key={i}
                                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-[#D4AF37] transition-colors cursor-pointer group"
                                    onClick={() => {
                                        onClose();
                                        navigate(`/product/${prod.key}`, { state: { product: prod } });
                                    }}
                                >
                                    <img src={prod.image} alt={prod.name} className="w-16 h-20 object-cover rounded-lg bg-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[#1B4332] text-sm truncate group-hover:text-[#D4AF37] transition-colors">{prod.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{prod.desc}</p>
                                        <p className="text-xs font-semibold text-[#D4AF37] mt-1">{prod.price}</p>
                                    </div>
                                    <button className="p-2 bg-gray-50 rounded-full group-hover:bg-[#1B4332] group-hover:text-white transition-colors">
                                        →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Options Area */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                    {!isTyping && recommendations.length === 0 && step < QUESTIONS.length && (
                        <div className="flex flex-wrap gap-2">
                            {QUESTIONS[step].options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleOptionClick(opt)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-[#1B4332] hover:text-white text-gray-700 text-sm rounded-full transition-all border border-transparent hover:border-[#1B4332] animate-fade-in-up"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {!isTyping && recommendations.length > 0 && (
                        <button
                            onClick={handleReset}
                            className="w-full py-3 bg-[#D4AF37] text-white font-bold rounded-lg hover:bg-[#b5952f] transition-colors uppercase tracking-wider text-sm"
                        >
                            Tìm kiếm khác
                        </button>
                    )}

                    {/* Fallback if no options showing */}
                    {(isTyping || (!isTyping && recommendations.length === 0 && step >= QUESTIONS.length)) && (
                        <p className="text-center text-xs text-gray-400 italic">AI đang phân tích...</p>
                    )}

                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-gray-400">Powered by Gemini AI Technology</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StylistChatbot;
