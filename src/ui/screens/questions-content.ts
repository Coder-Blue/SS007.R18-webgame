export const answerLetters = ["A", "B", "C", "D"] as const;

export type AnswerLetter = (typeof answerLetters)[number];

export type QuizQuestion = {
  readonly number: number;
  readonly prompt: string;
  readonly choices: Readonly<Record<AnswerLetter, string>>;
  readonly answer: AnswerLetter;
  readonly explanation: string;
};

export const questions: readonly QuizQuestion[] = [
  {
    number: 1,
    prompt:
      "Yếu tố nào dưới đây KHÔNG thuộc nhóm nguyên nhân khách quan khiến EVN thua lỗ giai đoạn 2022–2023?",
    choices: {
      A: "Giá than, khí tự nhiên và dầu thế giới tăng phi mã do chuỗi cung ứng toàn cầu đứt gãy",
      B: "Hạn hán kéo dài do hiện tượng El Nino",
      C: "Giá bán lẻ điện bình quân chịu khống chế trần giá của Nhà nước",
      D: "Đồng USD tăng giá so với VND",
    },
    answer: "C",
    explanation:
      "Khống chế trần giá bán lẻ là đặc điểm của cơ chế giá trên thị trường nội địa (theo Quyết định 24/2017/QĐ-TTg), không phải nguyên nhân khách quan. Ba phương án còn lại là các nguyên nhân khách quan được nêu trong bài: khủng hoảng nhiên liệu, thời tiết cực đoan (El Nino) và biến động tỷ giá VND/USD.",
  },
  {
    number: 2,
    prompt: "Hiện tượng El Nino làm tăng chi phí của EVN theo cơ chế nào?",
    choices: {
      A: "Làm hư hỏng hệ thống đường dây truyền tải 500kV",
      B: "Làm nguồn thủy điện (nguồn giá rẻ nhất) sụt giảm, buộc EVN huy động nhiệt điện than, dầu và năng lượng tái tạo có giá thành cao hơn",
      C: "Làm nhu cầu sử dụng điện của người dân giảm mạnh",
      D: "Làm tăng nghĩa vụ trả nợ các khoản vay bằng ngoại tệ",
    },
    answer: "B",
    explanation:
      "Theo bài, hạn hán kéo dài do El Nino khiến nguồn thủy điện – nguồn có giá thành rẻ nhất – bị giảm sút; EVN phải bù đắp bằng nhiệt điện than, dầu và năng lượng tái tạo trong khi giá nhiên liệu hóa thạch đã rất đắt đỏ.",
  },
  {
    number: 3,
    prompt:
      'Theo cơ chế của Quyết định 24/2017/QĐ-TTg, vì sao EVN phải "gánh trọn" phần chênh lệch chi phí?',
    choices: {
      A: "Vì chi phí mua điện chịu ảnh hưởng của thị trường quốc tế, còn giá bán lẻ bình quân bị Nhà nước khống chế trần giá để giữ ổn định chỉ số giá tiêu dùng",
      B: "Vì EVN tự ý giảm giá bán điện để cạnh tranh với các đơn vị phát điện tư nhân",
      C: "Vì Nhà nước cấm EVN mua điện từ các nhà máy BOT và điện nhập khẩu",
      D: "Vì giá bán lẻ được thả nổi theo thị trường giao ngay",
    },
    answer: "A",
    explanation:
      "Tổng chi phí phát điện (mua điện từ thị trường, thủy điện đa mục tiêu, BOT, thủy điện nhỏ, năng lượng tái tạo, điện nhập khẩu) chịu tác động của thị trường quốc tế, trong khi giá bán lẻ bình quân bị khống chế trần giá để giữ vững chỉ số giá tiêu dùng và hỗ trợ chi phí sản xuất. Chênh lệch giữa hai mức giá này do EVN gánh.",
  },
  {
    number: 4,
    prompt:
      "Theo Điều 3 Khoản 1 Quyết định 05/2024/QĐ-TTg, chi phí của năm nào được kiểm toán, xem xét để đưa vào giá điện năm N?",
    choices: {
      A: "Năm N",
      B: "Năm N – 1",
      C: "Năm N + 1",
      D: "Năm N – 2",
    },
    answer: "D",
    explanation:
      "Chi phí của năm N – 2 được kiểm toán, xem xét để đưa vào giá điện năm N. Cơ chế này giúp EVN phục hồi tài chính trong dài hạn thay vì phải tăng giá ngay lập tức và gây sốc giá.",
  },
  {
    number: 5,
    prompt: "Trong ba khâu của ngành điện Việt Nam, EVN nắm giữ độc quyền tự nhiên ở khâu nào?",
    choices: {
      A: "Sản xuất (phát điện)",
      B: "Truyền tải điện",
      C: "Bán lẻ điện năng lượng tái tạo theo cơ chế DPPA",
      D: "Nhập khẩu nhiên liệu than, khí",
    },
    answer: "B",
    explanation:
      "Khâu truyền tải là mảng EVN độc quyền tự nhiên: mạng lưới đường dây 500kV, 220kV do Nhà nước quản lý, kiểm soát tuyệt đối; việc tư nhân xây hệ thống truyền tải song song gặp khó khăn về kinh tế, kỹ thuật và tạo nguy cơ về an ninh.",
  },
  {
    number: 6,
    prompt:
      "Tính đến cuối năm 2025, các doanh nghiệp sản xuất điện bên ngoài EVN chiếm bao nhiêu phần trăm sản lượng điện toàn quốc?",
    choices: {
      A: "17,7%",
      B: "24,2%",
      C: "58%",
      D: "100%",
    },
    answer: "C",
    explanation:
      "Các doanh nghiệp ngoài EVN chiếm 58%, EVNGENCO chiếm 24,2%, công ty mẹ EVN chiếm 17,7%. Từ đó bài kết luận EVN không còn nắm giữ độc quyền ở mảng sản xuất điện.",
  },
  {
    number: 7,
    prompt: "Nội dung nào dưới đây KHÔNG phải là sứ mệnh của EVN được nêu trong bài?",
    choices: {
      A: "Đảm bảo an ninh năng lượng quốc gia",
      B: "Thực hiện chính sách an sinh xã hội, mở rộng lưới điện phủ khắp mọi miền Tổ quốc",
      C: "Bình ổn kinh tế vĩ mô, là công cụ điều tiết giá cả của Nhà nước",
      D: "Tối đa hóa lợi nhuận độc quyền để nộp ngân sách Nhà nước",
    },
    answer: "D",
    explanation:
      "Bài nêu bốn sứ mệnh của EVN: đảm bảo an ninh năng lượng quốc gia; thực hiện chính sách an sinh xã hội; bảo vệ an ninh quốc phòng; bình ổn kinh tế vĩ mô. Tối đa hóa lợi nhuận độc quyền không phải sứ mệnh của EVN.",
  },
  {
    number: 8,
    prompt:
      'Ở khâu phân phối và bán lẻ, giá điện sinh hoạt được áp dụng theo bậc nhằm thực hiện nguyên tắc nào của cơ chế "bù trừ chéo"?',
    choices: {
      A: "Người dùng ít bù người dùng nhiều",
      B: "Người dùng nhiều bù người dùng ít",
      C: "Doanh nghiệp FDI bù cho doanh nghiệp trong nước",
      D: "Khu vực thành thị trả giá thấp hơn vùng sâu vùng xa",
    },
    answer: "B",
    explanation:
      'Điện dân dụng áp dụng theo các bậc để "người dùng nhiều bù người dùng ít", nâng cao ý thức tiết kiệm điện và trợ giá điện cho vùng sâu vùng xa.',
  },
  {
    number: 9,
    prompt: "Đặc trưng nào sau đây là đặc trưng của độc quyền tự nhiên?",
    choices: {
      A: "Chi phí đầu tư cố định ban đầu cực kỳ lớn, chu kỳ hoàn vốn dài, nhưng chi phí trung bình giảm dần theo quy mô sản lượng",
      B: "Chi phí đầu tư ban đầu thấp, nhiều doanh nghiệp dễ dàng gia nhập ngành",
      C: "Chi phí trung bình tăng dần khi quy mô sản lượng tăng",
      D: "Được hình thành do sự thỏa hiệp giữa các xí nghiệp nhỏ để phân chia thị trường",
    },
    answer: "A",
    explanation:
      "Độc quyền tự nhiên xuất hiện ở ngành đòi hỏi chi phí đầu tư cố định ban đầu cực lớn, hoàn vốn lâu, chi phí trung bình giảm theo quy mô; việc nhiều doanh nghiệp xây hạ tầng song song (như lưới 500kV, 220kV) gây lãng phí nguồn lực xã hội và mất an toàn kỹ thuật.",
  },
  {
    number: 10,
    prompt:
      "Trong nền kinh tế thị trường định hướng XHCN ở Việt Nam, độc quyền nhà nước ở các khâu trọng yếu của ngành điện nhằm mục đích chủ yếu nào?",
    choices: {
      A: "Thu lợi nhuận độc quyền thuần túy cho doanh nghiệp nhà nước",
      B: "Loại bỏ hoàn toàn sự tham gia của tư nhân và FDI trong ngành điện",
      C: "Là công cụ chính sách để bảo đảm an ninh năng lượng quốc gia, bình ổn kinh tế vĩ mô và trợ giá an sinh xã hội",
      D: "Bán đứt hạ tầng truyền tải cho tư nhân để thu hồi vốn",
    },
    answer: "C",
    explanation:
      "Độc quyền nhà nước ở các khâu trọng yếu của ngành điện không nhằm thu lợi nhuận độc quyền thuần túy, mà là công cụ chính sách để bảo đảm an ninh năng lượng quốc gia, bình ổn kinh tế vĩ mô và trợ giá an sinh xã hội cho nhân dân.",
  },
];
