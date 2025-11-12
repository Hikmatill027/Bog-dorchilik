import { GoogleGenAI, Part, Chat, Content } from "@google/genai";
import { ChatMessage } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

export const fileToGenerativePart = (base64: string, mimeType: string): Part => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

const dataUrlToGenerativePart = (url: string): Part | null => {
    const match = url.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        console.error("Invalid data URL format");
        return null;
    }
    const mimeType = match[1];
    const base64 = match[2];
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};


export const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // remove the "data:mime/type;base64," part
      };
      reader.onerror = (error) => reject(error);
    });

export const analyzePlantImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = fileToGenerativePart(base64Image, mimeType);
    const prompt = `
      Siz botanik va bog'dorchilik bo'yicha mutaxassissiz. Ushbu rasmdagi o'simlikni aniqlang.
      Quyidagi ma'lumotlarni tushunarli, oson o'qiladigan markdown formatida taqdim eting:
      - **Umumiy Nom(lar)i:**
      - **Ilmiy Nomi:**
      - **Tavsifi:** O'simlik haqida qisqacha ma'lumot.
      - **Parvarishlash Yo'riqnomasi:**
        - **Quyosh Nuri:** (masalan, Yorqin, bilvosita yorug'lik)
        - **Sug'orish:** (masalan, Tuproqning yuqori qatlami quriganda sug'oring)
        - **Tuproq:** (masalan, Yaxshi drenajlangan tuproq aralashmasi)
        - **Harorat va Namlik:**
        - **O'g'it:**
      - **Zaharliligi:** Uy hayvonlari yoki odamlar uchun zaharli-mi?
    `;
    
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing plant image:", error);
    return "Kechirasiz, o'simlikni aniqlay olmadim. Iltimos, boshqa rasm bilan urinib ko'ring yoki ulanishingizni tekshiring.";
  }
};


const chatSystemInstruction = "Siz samimiy va bilimdon bog'dorchilik yordamchisisiz. Sizning ismingiz 'Bloom'. O'simliklar, bog'dorchilik usullari, zararkunandalarga qarshi kurash va bog'dorchilikka oid barcha savollarga javob bering. Javoblaringizni qisqa, foydali qiling va kerak bo'lganda formatlash uchun markdown-dan foydalaning.";

export const createChatSession = (history: ChatMessage[] = []): Chat => {
    const geminiHistory: Content[] = history
      .map(msg => {
        const parts: Part[] = [];
        // Image part should come first if it exists
        if (msg.imageUrl) {
          const imagePart = dataUrlToGenerativePart(msg.imageUrl);
          if (imagePart) parts.push(imagePart);
        }
        // Then the text part
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        return {
          role: msg.role,
          parts: parts,
        };
      })
      .filter(content => content.parts.length > 0);

    const chat: Chat = ai.chats.create({
        model,
        history: geminiHistory,
        config: {
            systemInstruction: chatSystemInstruction
        },
    });
    return chat;
};
