import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface DrugInteraction {
  severity: "Minor" | "Moderate" | "Major" | "Unknown";
  description: string;
  recommendation: string;
}

export interface InteractionResult {
  interactions: DrugInteraction[];
  summary: string;
}

export async function checkDrugInteractions(drugs: string[]): Promise<InteractionResult> {
  if (drugs.length < 2) {
    return { interactions: [], summary: "Silakan masukkan setidaknya dua obat untuk mengecek interaksi." };
  }

  const prompt = `Analisis interaksi obat antara obat-obat berikut: ${drugs.join(", ")}. 
  Berikan hasil dalam bahasa Indonesia. 
  Tentukan tingkat keparahan (Minor, Moderate, Major), deskripsi interaksi, dan rekomendasi.
  Sediakan juga ringkasan keseluruhan.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          interactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING, enum: ["Minor", "Moderate", "Major", "Unknown"] },
                description: { type: Type.STRING },
                recommendation: { type: Type.STRING },
              },
              required: ["severity", "description", "recommendation"],
            },
          },
          summary: { type: Type.STRING },
        },
        required: ["interactions", "summary"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as InteractionResult;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return { 
      interactions: [], 
      summary: "Terjadi kesalahan saat menganalisis interaksi obat. Silakan coba lagi." 
    };
  }
}

export async function searchDrugs(query: string): Promise<string[]> {
  if (!query) return [];

  const prompt = `Berikan daftar 5 nama obat yang umum di Indonesia yang diawali atau mengandung kata "${query}". Berikan hanya daftar nama obatnya saja dalam format JSON array of strings.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]") as string[];
  } catch (error) {
    console.error("Error searching drugs:", error);
    return [];
  }
}
