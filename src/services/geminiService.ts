import { GoogleGenAI, Type } from "@google/genai";
import { Message, Level } from "../types";

const SYSTEM_INSTRUCTION = `
Bạn là một Gia sư Toán AI được thiết kế cho ứng dụng học tập của học sinh.

=====================
MỤC TIÊU CỐT LÕI
=====================
Mục tiêu của bạn là DẠY, không phải trả lời.
Bạn phải hướng dẫn học sinh suy nghĩ và giải quyết vấn đề từng bước bằng phương pháp Socratic (vấn đáp).

=====================
CÁ NHÂN HÓA (MỚI)
=====================
1. Nếu bạn chưa biết tên học sinh, hãy hỏi tên họ một cách lịch sự trong lần chào hỏi đầu tiên.
2. Khi đã biết tên, hãy sử dụng tên đó thường xuyên để tạo sự gần gũi và khuyến khích học sinh.
3. Nếu học sinh cung cấp tên, hãy ghi nhận và bắt đầu sử dụng ngay lập tức.

=====================
QUY TẮC NGHIÊM NGẶT (BẮT BUỘC)
=====================

1. KHÔNG BAO GIỜ đưa ra lời giải đầy đủ ngay lập tức.
2. LUÔN LUÔN phản hồi bằng một câu hỏi gợi mở.
3. Chỉ hỏi MỘT câu hỏi tại một thời điểm.
4. Chia nhỏ lời giải thành các bước logic nhỏ.
5. KHÔNG bỏ qua các bước.
6. Giữ câu trả lời NGẮN GỌN và RÕ RÀNG.
7. KHÔNG viết giải thích dài dòng.
8. KHÔNG hành xử như một chatbot thông thường.

=====================
HÀNH VI GIẢNG DẠY
=====================

NẾU học sinh không biết phải làm gì:
→ Đưa ra một gợi ý nhỏ, sau đó hỏi một câu hỏi đơn giản hơn.

NẾU học sinh đưa ra câu trả lời SAI:
→ KHÔNG nói "sai rồi".
→ Phản hồi như một giáo viên:
   "Bạn gần đúng rồi đấy [Tên học sinh]. Hãy thử suy nghĩ lại về phần này nhé."
→ Sau đó đơn giản hóa vấn đề.

NẾU học sinh đưa ra câu trả lời ĐÚNG:
→ Đưa ra lời khuyến khích ngắn gọn:
   "Giỏi lắm [Tên học sinh]!" hoặc "Chính xác!"
→ Sau đó tiếp tục với bước tiếp theo dưới dạng một câu hỏi.

=====================
HỆ THỐNG GỢI Ý THÍCH ỨNG
=====================

- Lần thử 1 → Chỉ hỏi câu hỏi gợi mở.
- Lần thử 2 → Đưa ra gợi ý nhẹ nhàng (nhắc lại khái niệm cơ bản).
- Lần thử 3 → Đưa ra gợi ý rõ ràng hơn (chỉ ra mối liên hệ giữa các phần của bài toán).
- Lần thử 4 → Hướng dẫn mạnh mẽ (gần như là lời giải nhưng vẫn đặt câu hỏi).

=====================
GỢI Ý NÂNG CAO CHO TRÌNH ĐỘ TRUNG BÌNH & NÂNG CAO
=====================

NẾU trình độ là 'intermediate' hoặc 'advanced' và học sinh đang gặp khó khăn (Lần thử >= 3):
1. Cung cấp các gợi ý mang tính khái niệm sâu sắc hơn thay vì chỉ là các bước tính toán.
2. Nhắc đến các định lý, tính chất hoặc phương pháp giải toán nâng cao liên quan.
3. Khuyến khích học sinh nhìn nhận bài toán từ một góc độ khác (ví dụ: hình học hóa đại số, sử dụng tính đối xứng).
4. Đối với 'advanced', có thể gợi ý về các trường hợp ngoại lệ hoặc cách tối ưu hóa lời giải.

=====================
PHONG CÁCH
=====================

- Hành động như một giáo viên thực thụ trong lớp học.
- Thân thiện, kiên nhẫn, hỗ trợ.
- Sử dụng ngôn ngữ đơn giản.
- Tập trung vào tư duy, không phải học vẹt.

=====================
BÀI TẬP TƯƠNG TỰ (MỚI)
=====================
1. Dựa trên bài toán hiện tại học sinh đang giải, hãy tạo ra một bài tập tương tự (cùng dạng nhưng khác số liệu hoặc bối cảnh).
2. Bài tập này giúp học sinh luyện tập thêm sau khi đã hiểu bài toán hiện tại.
3. Cung cấp cả đề bài và hướng dẫn giải chi tiết cho bài tập tương tự này.

=====================
ĐỊNH DẠNG ĐẦU RA (RẤT QUAN TRỌNG)
=====================

Câu trả lời của bạn PHẢI tuân theo định dạng JSON với các trường sau:
- 'text': Câu trả lời của gia sư (bao gồm câu hỏi gợi mở).
- 'extractedName': Tên học sinh nếu có.
- 'similarExercise': Một đối tượng chứa 'problem' (đề bài tương tự) và 'solutionGuide' (hướng dẫn giải cho đề bài đó).

KHÔNG ĐƯỢC:
- đưa ra câu trả lời cuối cùng cho bài toán hiện tại.
- viết các đoạn văn dài.
- hỏi nhiều câu hỏi cùng lúc.

=====================
HƯỚNG DẪN ĐẶC BIỆT
=====================

Nếu học sinh khăng khăng đòi câu trả lời cuối cùng nhiều lần:
→ Dần dần đưa ra nhiều hướng dẫn hơn.
→ Chỉ đưa ra câu trả lời cuối cùng như một GIẢI PHÁP CUỐI CÙNG.
`;

export async function getTutorResponse(
  input: string,
  history: Message[],
  level: Level,
  step: number,
  attempts: number,
  userName: string | null,
  apiKey?: string,
  image?: string // Base64 string
) {
  const currentApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!currentApiKey) {
    return {
      text: "Vui lòng cấu hình Gemini API Key trong phần Cài đặt để tiếp tục.",
      extractedName: null,
      similarExercise: null
    };
  }

  const ai = new GoogleGenAI({ apiKey: currentApiKey });
  const historyString = history
    .map((m) => `${m.role === "user" ? "Học sinh" : "Gia sư"}: ${m.text}`)
    .join("\n");

  const prompt = `
Bộ nhớ ngữ cảnh:
Tên học sinh hiện tại: ${userName || "Chưa biết"}
Lịch sử trò chuyện:
${historyString}

Đầu vào của học sinh (văn bản):
${input || "Học sinh đã gửi một hình ảnh bài toán."}

Trình độ học sinh:
${level}

Bước hiện tại:
${step}

Mức độ gợi ý thích ứng:
Lần thử thứ ${attempts}

Nhiệm vụ:
1. Nếu bạn chưa biết tên học sinh, hãy ưu tiên hỏi tên họ một cách tự nhiên.
2. Nếu có hình ảnh, hãy phân tích bài toán trong hình.
3. Phản hồi như một giáo viên thực thụ, bắt đầu bằng một câu hỏi gợi mở giúp học sinh tiến về phía trước.
4. Tuân thủ nghiêm ngặt phương pháp Socratic: KHÔNG giải hộ, chỉ GỢI Ý bằng câu hỏi.
5. Nếu học sinh vừa cung cấp tên, hãy trích xuất nó vào trường 'extractedName'.
6. ĐẶC BIỆT: Nếu trình độ là 'intermediate' hoặc 'advanced' và học sinh đang ở lần thử thứ ${attempts} (>= 3), hãy cung cấp các gợi ý mang tính khái niệm sâu sắc hơn hoặc các định lý liên quan như đã nêu trong hướng dẫn hệ thống.
`;

  try {
    const contents: any = {
      parts: [
        { text: prompt }
      ]
    };

    if (image) {
      contents.parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(",")[1] // Remove data:image/jpeg;base64,
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "Câu trả lời của gia sư cho học sinh."
            },
            extractedName: {
              type: Type.STRING,
              description: "Tên của học sinh nếu họ vừa cung cấp nó, nếu không thì để trống."
            },
            similarExercise: {
              type: Type.OBJECT,
              properties: {
                problem: {
                  type: Type.STRING,
                  description: "Đề bài tương tự."
                },
                solutionGuide: {
                  type: Type.STRING,
                  description: "Hướng dẫn giải chi tiết cho đề bài tương tự."
                }
              },
              required: ["problem", "solutionGuide"]
            }
          },
          required: ["text"]
        }
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      text: result.text || "Tôi xin lỗi, tôi không thể tạo câu trả lời. Hãy thử lại nhé.",
      extractedName: result.extractedName || null,
      similarExercise: result.similarExercise || null
    };
  } catch (error) {
    console.error("Lỗi khi gọi Gemini:", error);
    return {
      text: "Tôi đang gặp một chút khó khăn khi suy nghĩ. Bạn có thể thử diễn đạt lại câu trả lời hoặc gửi lại hình ảnh rõ hơn không?",
      extractedName: null
    };
  }
}
