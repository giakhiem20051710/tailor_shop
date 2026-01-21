import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import DynamicFAQ from "../components/DynamicFAQ.jsx";
import usePageMeta from "../hooks/usePageMeta";

const SupportPage = () => {
  const navigate = useNavigate();
  const { section } = useParams();

  usePageMeta({
    title: "Trung tâm hỗ trợ may đo | Bảng size & chính sách My Hiền Tailor",
    description:
      "Tra cứu bảng size, hướng dẫn đo, chính sách thanh toán, giao hàng và bảo hành của My Hiền Tailor.",
  });

  const supportSections = {
    "size-consultation": {
      title: "Tư vấn chọn size",
      intro: "Quý cô hiện đang gặp khó khăn trong vấn đề chọn kích cỡ phù hợp với loại váy thiết kế đang chọn tại nhà CAM, vui lòng tham khảo hướng dẫn chi tiết và bảng size bên dưới đây. Nếu quý cô còn nhiều băn khoăn trong vấn đề lựa chọn size, vui lòng liên hệ trực tiếp qua số Hotline hoặc tin nhắn FB Messenger để được nhân viên nhà CAM chỉ dẫn chi tiết nhé.",
      content: [
        {
          heading: "Hướng dẫn cách đo kích cỡ phù hợp với thời trang thiết kế, váy thiết kế",
          items: [
            {
              title: "Đo vòng ngực (vòng 1):",
              text: "Dùng thước dây đo 1 vòng vùng dưới cánh tay ở vị trí to nhất.",
              videoId: "2nyIspLy5Ts",
            },
            {
              title: "Đo vòng eo (vòng 2):",
              text: "Dùng thước dây đo 1 vòng ở vị trí nhỏ nhất trên lỗ rốn khoảng 4 phân.",
              videoId: "LNOrlv2yKFg",
            },
            {
              title: "Đo vòng mông (vòng 3):",
              text: "Dùng thước dây đo 1 vòng ở vùng mông (nơi nở nhất).",
              videoId: "jxDzihwVApM",
            },
            {
              title: "Đo dài thân:",
              text: "Đo từ mép may ở vị trí cao nhất xuống đến vị trí phù hợp.",
            },
            {
              title: "Đo ngang vai:",
              text: "Đo từ mép vai trái sang mép vai phải.",
            },
            {
              title: "Đo dài tay:",
              text: "Đo từ đường may vào vai áo chỗ cao nhất cho tới hết ống tay.",
            },
            {
              title: "Đo vòng ngực trên:",
              text: "Vòng trên ngực để xác định vị trí ôm sát của đầm cúp ống, đo bằng cách vòng thước dây sát dưới nách đo từ trước ra sau một vòng khép kín.",
            },
            {
              title: "Đo vòng vai:",
              text: "Khi đặt may các loại đầm trễ vai, bẹt vai, bạn cần lấy số đo vòng này. Vòng thước dây từ trước ra sau, bọc cả hai bên tay một vòng tròn khép kín.",
            },
            {
              title: "Số đo hạ ngực:",
              text: "Từ điểm giữa của cổ ra tới đầu vai, hạ thước dây xuống ngang đầu nhũ hoa. (Số đo trung bình từ 22 – 25 cm)",
            },
            {
              title: "Số đo ngang ngực:",
              text: "Từ đầu nhũ hoa bên trái, căng thước dây chạm đầu nhũ hoa bên phải. (Số đo trung bình từ 15 – 17 cm)",
            },
            {
              title: "Số đo hạ eo:",
              text: "Điểm bắt đầu là trên vai như số đo hạ ngực nhưng căng thước dây qua vòng 1 và kéo dài xuống chạm vòng 2. (Số đo trung bình từ 37 – 39 cm)",
            },
            {
              title: "Số đo vòng nách:",
              text: "Vòng thước dây từ đỉnh vai xuống nách một vòng tròn khép kín.",
            },
            {
              title: "Số đo vòng bắp tay:",
              text: "Vòng thước dây quanh bắp tay.",
            },
          ],
        },
        {
          heading: "Lưu ý quan trọng",
          text: "Tùy vào những kiểu đầm thiết kế mà sẽ tinh chỉnh một số kiểu đo cho phù hợp như phải hạ eo thế nào cho chuẩn, hạ ngực bao nhiêu để phù hợp với mẫu đầm thiết kế hơn nên không phải cứ đặt đúng vị trí là mọi thứ sẽ suôn sẻ mà còn phải nhìn vào vóc dáng của người khách mà sửa chữa đúng với kiểu dáng thì mới cho ra một sản phẩm thời trang đẹp, vừa vặn với mọi vóc dáng.",
        },
      ],
    },
    "shopping-guide": {
      title: "Hướng dẫn mua hàng",
      content: [
        {
          heading: "Bước 1: Chọn sản phẩm",
          text: "Bạn có thể xem các mẫu trên website hoặc đến tiệm để xem trực tiếp. Nhân viên sẽ tư vấn về form dáng, chất liệu phù hợp với bạn.",
        },
        {
          heading: "Bước 2: Đặt may",
          text: "Điền form đặt may với thông tin chi tiết về sản phẩm, số đo, ngân sách và thời gian cần nhận. Bạn có thể đặt online hoặc trực tiếp tại tiệm.",
        },
        {
          heading: "Bước 3: Đo và xác nhận",
          text: "Nếu chưa có số đo, chúng tôi sẽ hẹn lịch đo. Sau khi đo xong, bạn sẽ xác nhận lại thông tin và thanh toán đặt cọc (thường 50% giá trị đơn hàng).",
        },
        {
          heading: "Bước 4: May và thử",
          text: "Chúng tôi sẽ may theo số đo đã xác nhận. Khi hoàn thành, bạn sẽ được hẹn lịch thử đồ. Nếu cần chỉnh sửa, chúng tôi sẽ chỉnh ngay.",
        },
        {
          heading: "Bước 5: Nhận hàng",
          text: "Sau khi chỉnh sửa xong và bạn hài lòng, bạn thanh toán phần còn lại và nhận đồ. Có thể nhận tại tiệm hoặc giao hàng tận nơi.",
        },
      ],
    },
    "payment-policy": {
      title: "Chính sách thanh toán",
      content: [
        {
          heading: "Phương thức thanh toán",
          text: "Chúng tôi chấp nhận thanh toán bằng tiền mặt, chuyển khoản ngân hàng, hoặc thẻ tín dụng/ghi nợ tại tiệm.",
        },
        {
          heading: "Thanh toán đặt cọc",
          text: "Khi đặt may, khách hàng cần đặt cọc 50% giá trị đơn hàng. Số tiền còn lại sẽ thanh toán khi nhận hàng.",
        },
        {
          heading: "Hoàn tiền",
          text: "Nếu hủy đơn hàng trước khi bắt đầu may, chúng tôi sẽ hoàn lại 100% tiền đặt cọc. Nếu đã bắt đầu may, sẽ tính theo tiến độ công việc.",
        },
        {
          heading: "Thanh toán online",
          text: "Đối với đơn hàng đặt online, bạn có thể chuyển khoản trước. Thông tin tài khoản sẽ được gửi qua email hoặc tin nhắn.",
        },
      ],
    },
    "shipping-policy": {
      title: "Chính sách vận chuyển",
      content: [
        {
          heading: "Phí vận chuyển",
          text: "Miễn phí vận chuyển cho đơn hàng trên 3 triệu đồng trong nội thành TP.HCM. Đơn hàng dưới 3 triệu: 50.000₫. Ngoại thành và tỉnh khác: tính theo bảng giá của đơn vị vận chuyển.",
        },
        {
          heading: "Thời gian giao hàng",
          text: "Nội thành TP.HCM: 1-2 ngày làm việc. Các tỉnh khác: 3-5 ngày làm việc tùy theo địa điểm. Thời gian có thể thay đổi trong các dịp lễ, Tết.",
        },
        {
          heading: "Đóng gói",
          text: "Sản phẩm được đóng gói cẩn thận trong hộp carton, có túi bảo vệ, đảm bảo không bị nhăn hoặc hư hỏng trong quá trình vận chuyển.",
        },
        {
          heading: "Kiểm tra hàng",
          text: "Vui lòng kiểm tra hàng ngay khi nhận. Nếu có vấn đề, vui lòng liên hệ trong vòng 24 giờ để được hỗ trợ.",
        },
      ],
    },
    "warranty-return": {
      title: "Bảo hành & Đổi trả",
      content: [
        {
          heading: "Bảo hành",
          text: "Chúng tôi bảo hành đường may trong vòng 6 tháng kể từ ngày nhận hàng. Nếu có lỗi từ phía sản xuất, chúng tôi sẽ sửa chữa miễn phí.",
        },
        {
          heading: "Chỉnh sửa miễn phí",
          text: "Trong vòng 30 ngày đầu sau khi nhận hàng, nếu size không vừa do lỗi đo đạc từ phía chúng tôi, chúng tôi sẽ chỉnh sửa miễn phí.",
        },
        {
          heading: "Đổi trả",
          text: "Sản phẩm may đo không thể đổi trả vì được làm theo số đo riêng của từng khách hàng. Tuy nhiên, chúng tôi cam kết chỉnh sửa đến khi bạn hài lòng.",
        },
        {
          heading: "Lỗi sản phẩm",
          text: "Nếu sản phẩm có lỗi về chất liệu, màu sắc, hoặc đường may, chúng tôi sẽ nhận lại và may lại mới hoàn toàn miễn phí.",
        },
      ],
    },
    "membership-policy": {
      title: "Chính sách hội viên",
      content: [
        {
          heading: "Thành viên thân thiết",
          text: "Khách hàng đặt may từ lần thứ 3 trở đi sẽ tự động trở thành thành viên thân thiết, được hưởng nhiều ưu đãi đặc biệt.",
        },
        {
          heading: "Ưu đãi thành viên",
          text: "Giảm 10% cho mọi đơn hàng, ưu tiên lịch hẹn, được tư vấn miễn phí về phong cách, nhận thông báo sớm về các chương trình khuyến mãi.",
        },
        {
          heading: "Tích điểm",
          text: "Mỗi đơn hàng sẽ được tích điểm tương ứng với giá trị đơn. Điểm tích lũy có thể dùng để giảm giá cho các đơn hàng tiếp theo.",
        },
        {
          heading: "Quà tặng",
          text: "Thành viên thân thiết sẽ nhận được quà tặng đặc biệt vào dịp sinh nhật và các dịp lễ trong năm.",
        },
      ],
    },
    "privacy-policy": {
      title: "CHÍNH SÁCH QUYỀN RIÊNG TƯ",
      intro: "Camfashion.vn xem quyền riêng tư của bạn là vấn đề rất nghiêm túc. Camfashion.vn cam kết bảo vệ sự riêng tư của bạn và chính sách về quyền riêng tư này giải thích việc thu thập, sử dụng và tiết lộ dữ liệu của chúng tôi. Chính sách này đề cập đến cách Camfashion.vn xử lý thông tin cá nhân mà Camfashion.vn thu thập và nhận được từ bạn. Camfashion.vn cung cấp các dịch vụ của mình (\"Dịch vụ\") cho bạn tuân theo Điều khoản Dịch vụ và Chính sách về Quyền riêng tư sau đây. Thỉnh thoảng chúng tôi có thể cập nhật Chính sách về Quyền riêng tư này. Bạn có thể xem bản mới nhất của Chính sách về Quyền riêng tư bất kỳ lúc nào tại đây. Việc bạn tiếp tục sử dụng Dịch vụ sau khi có bất kỳ thay đổi nào như vậy sẽ cấu thành sự chấp nhận Chính sách về Quyền riêng tư mới.",
      content: [
        {
          heading: "1. Thu thập và sử dụng thông tin",
          text: "Khi bạn đăng ký tài khoản Camfashion.vn, Camfashion.vn thu thập thông tin cá nhân chẳng hạn như tên người dùng, địa chỉ email, ngày sinh, giới tính và bất kỳ thông tin cá nhân nào khác mà bạn nhập vào Dịch vụ, cũng như hình ảnh đại diện tài khoản của bạn. Camfashion.vn sẽ sử dụng thông tin cá nhân của bạn nhằm các mục đích nói chung sau đây: (i) để cung cấp cho bạn Dịch vụ; (ii) để trả lời các câu hỏi và ý kiến của bạn; (iii) để thông báo cho bạn thông qua email (hoặc các phương thức điện tử khác) về Dịch vụ; (iv) nhằm các mục đích thống kê và (v) mục đích khác được nêu rõ cho bạn tại thời điểm thu thập. Khi sử dụng Dịch vụ, bạn có thể thiết lập thông tin cá nhân của mình, Camfashion.vn lưu trữ và thu thập thông tin này để Camfashion.vn có thể cung cấp cho bạn Dịch vụ và các tính năng cá nhân. Vui lòng lưu ý rằng nếu bạn nhập chi tiết thanh toán vào Dịch vụ khi mua các gói (đăng ký) Dịch vụ, Camfashion.vn không nhận hoặc lưu trữ thông tin thanh toán đó, vì thông tin đó do nhà cung cấp dịch vụ thanh toán của chúng tôi tiếp nhận, lưu trữ và sử dụng nhằm mục đích hoàn thành giao dịch mua.",
        },
        {
          heading: "2. Lưu trữ thông tin cá nhân",
          text: "Các thông tin cá nhân Thành Viên sẽ được tự động lưu bảo mật trong bộ nhớ máy chủ website Camfashion.vn trong suốt thời gian là Thành Viên của Thành Viên trên Camfashion.vn và/hoặc ngay khi Thành Viên gửi yêu cầu xóa thông tin cá nhân trên website Camfashion.vn tới số điện thoại hoặc email liên hệ của Ban Quản trị website Camfashion.vn",
        },
        {
          heading: "3. Cookie",
          text: "Cookie là một lượng dữ liệu nhỏ, thường bao gồm ký hiệu định danh duy nhất ẩn danh được gửi đến trình duyệt của bạn từ các thiết bị (máy tính hoặc điện thoại…) của bạn và được lưu trữ trên thiết bị của bạn. Bạn có thể cấu hình trình duyệt của mình để chấp nhận tất cả cookie, từ chối tất cả cookie hoặc thông báo cho bạn khi cookie được đặt. Nếu bạn muốn xóa bất kỳ cookie nào đã có trên thiết bị của mình, vui lòng tham khảo hướng dẫn về trình duyệt của bạn để xác định vị trí của tập tin hoặc thư mục lưu trữ cookie. Nếu bạn từ chối tất cả cookie, bạn sẽ không thể sử dụng một số tính năng của Dịch vụ. Camfashion.vn cho phép các tổ chức khác hiển thị quảng cáo hoặc cung cấp dịch vụ trên một số trang của Dịch vụ. Các tổ chức này có thể sử dụng cookie và các công nghệ khác để thu thập thông tin về việc bạn sử dụng Dịch vụ. Các tổ chức này có thể sử dụng thông tin này để cung cấp cho bạn quảng cáo về các sản phẩm và dịch vụ mà họ tin rằng sẽ phù hợp với sở thích của bạn. Bằng việc sử dụng Dịch vụ, bạn chấp thuận khả năng nhà quảng cáo sẽ giả định rằng bạn đáp ứng các tiêu chí nhắm mục tiêu được sử dụng để hiển thị quảng cáo. Chúng tôi cũng có thể quảng cáo đến bạn thay cho một hoặc nhiều bên thứ ba, nhưng trong trường hợp làm như vậy chúng tôi sẽ không chia sẻ địa chỉ email của bạn hoặc thông tin cá nhân khác với các bên thứ ba đó.",
        },
        {
          heading: "4. Bảo mật và An ninh",
          text: "Chúng tôi sẽ thực hiện các biện pháp để bảo vệ dữ liệu cá nhân bằng cách sử dụng biện pháp bảo vệ an ninh tiêu chuẩn hợp lý, chống mất mát hoặc trộm cắp, cũng như truy cập trái phép, tiết lộ, sao chép, sử dụng hoặc sửa đổi không thích hợp. Chỉ bạn và chúng tôi mới có thể nhìn thấy dữ liệu cá nhân của bạn được bảo vệ bằng mật khẩu và bằng phương thức khác theo quy định trong Chính sách về Quyền riêng tư này. Bạn đồng ý giữ bảo mật (các) mật khẩu của mình và không tiết lộ cho bất kỳ người nào khác, hoặc để cho mật khẩu bị tiết lộ. Camfashion.vn có biện pháp bảo vệ tuân thủ các quy định để bảo vệ thông tin cá nhân của bạn. Tuy nhiên, truyền tải dữ liệu qua internet không được đảm bảo bảo mật 100%. Do đó, Camfashion.vn không thể đảm bảo hoặc cam kết bảo mật bất kỳ thông tin nào mà bạn chuyển tới Camfashion.vn. Cụ thể, bằng việc truy cập và sử dụng Dịch vụ, bạn tự chịu rủi ro và có trách nhiệm hạn chế quyền truy cập vào máy tính của bạn và đảm bảo rằng máy tính của bạn không có tất cả các loại mã độc hại, phần mềm gián điệp, virút, Trojan, v.v. mà có thể theo dõi bất kỳ dữ liệu bạn nhập vào Dịch vụ, bao gồm địa chỉ email và thông tin liên quan đến thanh toán. Chúng tôi không chịu trách nhiệm đối với bất kỳ tổn thất hoặc thiệt hại nào phát sinh từ việc người dùng không tuân thủ theo phần này. Tuy nhiên, khi bạn thanh toán cho Dịch vụ phải trả tiền, Camfashion.vn sử dụng các nhà cung cấp dịch vụ thanh toán an toàn để đảm bảo rằng khoản thanh toán của bạn được an toàn.",
        },
        {
          heading: "5. Các trang web của bên thứ ba",
          text: "Trong trường hợp Dịch vụ liên kết đến các trang web khác, các trang web khác đó không hoạt động theo Chính sách về Quyền riêng tư này. Camfashion.vn khuyến nghị bạn nên kiểm tra các tuyên bố về quyền riêng tư được đăng trên các trang web khác đó để hiểu thủ tục thu thập, sử dụng và tiết lộ thông tin cá nhân của họ.",
        },
        {
          heading: "6. Liên lạc với Camfashion.vn",
          text: "Nếu bạn có bất kỳ thắc mắc hoặc đề xuất nào liên quan đến Chính sách về Quyền riêng tư của chúng tôi, bạn có thể liên lạc với Camfashion.vn qua email theo địa chỉ Camfashion.vn@gmail.com Xin trân trọng cám ơn!",
        },
      ],
    },
  };

  const currentSection = supportSections[section] || supportSections["size-consultation"];

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header currentPage="/support" />

      <div className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-4xl mx-auto px-5 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 space-y-2">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280]">
              Hỗ trợ khách hàng
            </p>
            <h1 className="heading-font text-[30px] md:text-[34px] text-[#111827]">
              Trung tâm hỗ trợ may đo My Hiền Tailor
            </h1>
            <h2 className="heading-font text-[20px] md:text-[22px] text-[#1B4332]">
              {currentSection.title}
            </h2>
            <p className="text-[14px] text-[#6B7280] max-w-2xl mx-auto">
              Thông tin chi tiết về các chính sách và dịch vụ hỗ trợ của chúng tôi.
            </p>
          </div>

          {/* Intro text for size consultation */}
          {currentSection.intro && (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                {currentSection.intro}
              </p>
            </div>
          )}

          {/* Size Chart Table - only for size consultation */}
          {section === "size-consultation" && (
            <div className="mb-6 relative overflow-hidden rounded-2xl shadow-lg">
              {/* Background với hoa văn watercolor mờ */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FEF9F3] via-[#FFFBF5] to-[#FEF9F3]">
                {/* Hoa văn watercolor mờ */}
                <div className="absolute inset-0 opacity-[0.12]" style={{
                  backgroundImage: `
                    radial-gradient(ellipse 400px 300px at 30% 40%, rgba(251, 182, 206, 0.3) 0%, transparent 50%),
                    radial-gradient(ellipse 350px 250px at 70% 60%, rgba(255, 192, 203, 0.25) 0%, transparent 50%),
                    radial-gradient(ellipse 300px 200px at 50% 80%, rgba(255, 182, 193, 0.2) 0%, transparent 50%),
                    radial-gradient(ellipse 250px 180px at 20% 70%, rgba(255, 160, 122, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse 200px 150px at 80% 30%, rgba(255, 182, 193, 0.2) 0%, transparent 50%)
                  `,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                }}></div>
                {/* Pattern hoa nhỏ */}
                <div className="absolute inset-0 opacity-[0.06]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20 Q60 30 50 40 Q40 30 50 20 M30 50 Q40 60 30 70 Q20 60 30 50 M70 50 Q80 60 70 70 Q60 60 70 50' fill='none' stroke='%23FFB6C1' stroke-width='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '120px 120px',
                  backgroundPosition: 'center',
                }}></div>
              </div>

              {/* Content */}
              <div className="relative bg-[#FEF9F3]/95 backdrop-blur-sm p-8 md:p-12">
                <div className="text-center mb-10">
                  <h2 className="text-[24px] md:text-[28px] font-bold text-[#D97706] mb-4 tracking-wide">
                    Bảng chọn size
                  </h2>
                  <p className="text-[18px] md:text-[20px] italic text-[#D97706] font-serif" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    fontWeight: 400
                  }}>
                    Đầm/dress
                  </p>
                </div>

                {/* Size Chart Table */}
                <div className="max-w-2xl mx-auto">
                  <div className="relative overflow-hidden rounded-xl border border-[#8B4513]/30 shadow-lg bg-white/80 backdrop-blur-sm">
                    {/* Họa tiết bên trong bảng */}
                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
                      backgroundImage: `
                        radial-gradient(ellipse 200px 150px at 20% 30%, rgba(255, 182, 193, 0.4) 0%, transparent 60%),
                        radial-gradient(ellipse 180px 120px at 80% 70%, rgba(251, 182, 206, 0.35) 0%, transparent 60%),
                        radial-gradient(ellipse 150px 100px at 50% 50%, rgba(255, 192, 203, 0.3) 0%, transparent 60%),
                        url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 15 Q45 25 40 35 Q35 25 40 15 M20 40 Q25 50 20 60 Q15 50 20 40 M60 40 Q65 50 60 60 Q55 50 60 40' fill='none' stroke='%23FFB6C1' stroke-width='0.8' opacity='0.3'/%3E%3C/svg%3E")
                      `,
                      backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100px 100px',
                      backgroundPosition: 'center, center, center, center',
                    }}></div>
                    <table className="w-full text-center border-collapse relative z-10">
                      <thead>
                        <tr className="bg-[#8B4513] text-white">
                          <th className="px-6 py-5 text-[16px] md:text-[18px] font-bold border-r border-[#A0522D]/50">
                            Size
                          </th>
                          <th className="px-6 py-5 text-[16px] md:text-[18px] font-bold border-r border-[#A0522D]/50">
                            S
                          </th>
                          <th className="px-6 py-5 text-[16px] md:text-[18px] font-bold border-r border-[#A0522D]/50">
                            M
                          </th>
                          <th className="px-6 py-5 text-[16px] md:text-[18px] font-bold">
                            L
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-[#F5E6D3] border-b border-[#D4A574]/40">
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#8B4513] border-r border-[#D4A574]/40">
                            Ngực
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] border-r border-[#D4A574]/40 bg-[#FAF0E6]">
                            82
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] border-r border-[#D4A574]/40 bg-[#FAF0E6]">
                            85
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] bg-[#FAF0E6]">
                            90
                          </td>
                        </tr>
                        <tr className="bg-[#FAF0E6] border-b border-[#D4A574]/40">
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#8B4513] border-r border-[#D4A574]/40 bg-[#F5E6D3]">
                            Eo
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] border-r border-[#D4A574]/40">
                            64
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] border-r border-[#D4A574]/40">
                            68
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033]">
                            72
                          </td>
                        </tr>
                        <tr className="bg-[#F5E6D3]">
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#8B4513] border-r border-[#D4A574]/40">
                            Mông
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] border-r border-[#D4A574]/40 bg-[#FAF0E6]">
                            88
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] border-r border-[#D4A574]/40 bg-[#FAF0E6]">
                            92
                          </td>
                          <td className="px-6 py-5 text-[16px] md:text-[18px] font-bold text-[#5C4033] bg-[#FAF0E6]">
                            96
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Logo CAM DESIGN FASHION */}
                <div className="mt-12 text-center">
                  <div className="inline-block">
                    <div className="relative flex items-center justify-center mb-3">
                      <span className="text-[32px] md:text-[36px] font-bold text-[#8B4513] tracking-tight">CAM</span>
                      <span
                        className="absolute text-[16px] text-[#8B4513] leading-none"
                        style={{
                          transform: 'translate(-50%, -50%)',
                          top: '50%',
                          left: 'calc(50% + 20px)',
                          lineHeight: '1'
                        }}
                      >
                        👑
                      </span>
                    </div>
                    <div className="border-t border-[#8B4513]/60 pt-3">
                      <span className="text-[11px] md:text-[12px] tracking-[0.2em] text-[#8B4513] font-semibold uppercase">
                        DESIGN FASHION
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            {currentSection.content.map((item, index) => (
              <div key={index} className="border-b border-[#E5E7EB] pb-6 last:border-b-0 last:pb-0">
                <h2 className="heading-font text-[18px] md:text-[20px] text-[#111827] mb-4">
                  {item.heading}
                </h2>
                {item.items ? (
                  <div className="space-y-4">
                    {item.items.map((measureItem, itemIndex) => (
                      <div key={itemIndex} className="pl-4 border-l-2 border-[#E5E7EB]">
                        <h3 className="text-[15px] font-semibold text-[#111827] mb-1 flex items-center gap-2">
                          <span className="text-[#22C55E] text-[16px]">★</span>
                          <span>{measureItem.title}</span>
                        </h3>
                        <p className="text-[14px] text-[#4B5563] leading-relaxed mb-3">
                          {measureItem.text}
                        </p>
                        {measureItem.videoId && (
                          <div className="mt-4 mb-2 rounded-lg overflow-hidden shadow-md">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${measureItem.videoId}`}
                                title={measureItem.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-[#4B5563] leading-relaxed">
                    {item.text}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-8 bg-[#F9FAFB] rounded-2xl p-6 border border-[#E5E7EB]">
            <h3 className="text-[16px] font-semibold text-[#111827] mb-4">
              Các chủ đề khác
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.keys(supportSections).map((key) => (
                <a
                  key={key}
                  href={`/support/${key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/support/${key}`);
                  }}
                  className="text-[13px] text-[#374151] hover:text-[#1B4332] hover:underline transition-colors"
                >
                  • {supportSections[key].title}
                </a>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="heading-font text-[22px] md:text-[24px] text-[#111827] mb-2">
                Câu hỏi thường gặp
              </h2>
              <p className="text-[13px] text-[#6B7280]">
                Tìm câu trả lời nhanh cho các thắc mắc phổ biến
              </p>
            </div>
            <DynamicFAQ />
          </div>

          {/* Contact & Social Support */}
          <div className="mt-8 space-y-6">
            {/* Contact */}
            <div className="text-center">
              <p className="text-[13px] text-[#6B7280] mb-4">
                Cần hỗ trợ thêm? Liên hệ với chúng tôi:
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-[13px]">
                <a
                  href="tel:0901134256"
                  className="px-4 py-2 bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  0901 134 256
                </a>
                <a
                  href="mailto:dvkh@camfashion.vn"
                  className="px-4 py-2 border-2 border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  dvkh@camfashion.vn
                </a>
              </div>
            </div>

            {/* Social Media Support */}
            <div className="bg-gradient-to-r from-[#1B4332] to-[#14532d] rounded-2xl p-6 text-white">
              <h3 className="text-[16px] font-semibold mb-4 text-center">
                Hỗ trợ qua mạng xã hội
              </h3>
              <p className="text-[12px] text-white/80 mb-4 text-center">
                Nhắn tin trực tiếp với chúng tôi qua Zalo hoặc Facebook để được tư vấn nhanh nhất
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://zalo.me/0901134256"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#0068FF] hover:bg-[#0052CC] rounded-full transition-colors flex items-center justify-center gap-2 text-[13px] font-medium shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 5.58 2 10c0 2.5 1.5 4.75 3.8 6.24L4.5 21.5l5.5-1.2c1.4.38 2.9.6 4.5.6 5.52 0 10-3.58 10-8s-4.48-8-10-8zm0 14c-1.1 0-2.1-.2-3.1-.5l-.7-.2-1.5.3.3-1.5-.2-.7c-.3-1-.5-2-.5-3.1 0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6z" />
                  </svg>
                  Nhắn tin Zalo
                </a>
                <a
                  href="https://m.me/camfashion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#1877F2] hover:bg-[#1565C0] rounded-full transition-colors flex items-center justify-center gap-2 text-[13px] font-medium shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Nhắn tin Facebook
                </a>
              </div>
              <p className="text-[11px] text-white/70 mt-4 text-center">
                ⏰ Thời gian phản hồi: 07:00 - 23:00 hàng ngày
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#111827] text-white py-10 text-[12px]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-6">
            <div className="md:col-span-2">
              <h3 className="heading-font text-[16px] mb-2">MỸ HIỀN TAILOR</h3>
              <p className="text-[#9CA3AF] max-w-md">
                Tiệm may đo nhỏ, nhưng cẩn thận trong từng đường kim mũi chỉ.
                Chúng tôi mong bạn có thể mặc đồ may đo thường xuyên, không chỉ
                trong những dịp "đặc biệt".
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Địa chỉ
              </h4>
              <p className="text-[#9CA3AF]">
                123 Đường ABC
                <br />
                Quận XYZ, TP. Hồ Chí Minh
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Liên hệ
              </h4>
              <p className="text-[#9CA3AF]">
                Email: info@lavitailor.com
                <br />
                Phone: 0901 234 567
                <br />
                Giờ mở cửa: 9:00 - 20:00
              </p>
            </div>
          </div>
          <div className="border-t border-[#1F2937] pt-4 flex justify-between items-center text-[#6B7280] text-[11px]">
            <span>© 2025 Mỹ Hiền Tailor</span>
            <div className="flex gap-4">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SupportPage;

