import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// Robust wrapper for calling Gemini API with automatic exponential backoff retries and fallback model support
async function callGeminiWithRetry(options: {
  model: string;
  contents: any;
  config?: any;
  maxRetries?: number;
}) {
  const { model, contents, config, maxRetries = 3 } = options;
  const modelsToTry = [model, "gemini-3.1-flash-lite", "gemini-flash-latest"];
  
  // Filter out duplicates in case the requested model is already one of the fallbacks
  const uniqueModels = Array.from(new Set(modelsToTry));
  
  let lastError: any = null;

  for (let mIndex = 0; mIndex < uniqueModels.length; mIndex++) {
    const currentModel = uniqueModels[mIndex];
    let delay = 1000; // start with 1s delay
    const isLastModel = mIndex === uniqueModels.length - 1;
    const currentModelMaxRetries = currentModel === model ? maxRetries : 2;

    for (let attempt = 1; attempt <= currentModelMaxRetries; attempt++) {
      try {
        console.log(`[Gemini Request] Trying model: ${currentModel} (Attempt ${attempt}/${currentModelMaxRetries})`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        console.warn(`[Gemini Attempt ${attempt}/${currentModelMaxRetries} Failed] Model: ${currentModel}. Error: ${errMsg}`);
        
        // Check if it's a transient rate limit (429) or overloaded/unavailable server (503)
        const isTransient = errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("overloaded");
        
        // If the current model is overloaded/unavailable and we have fallback models left,
        // we should IMMEDIATELY failover to the next model without waiting/delaying.
        if (isTransient && !isLastModel && (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("overloaded"))) {
          console.warn(`[Gemini Overloaded] Model ${currentModel} is overloaded/unavailable. Switching immediately to fallback model to avoid delay.`);
          break; // break the attempt loop of the current model and proceed to the next model
        }

        if (isTransient && attempt < currentModelMaxRetries) {
          console.log(`Waiting ${delay}ms before retrying model ${currentModel} due to transient error...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          // If it's not a transient error, or we've exhausted retries, break and let the next model try (or throw)
          break;
        }
      }
    }
  }

  throw lastError || new Error("Gagal terhubung dengan layanan AI. Harap coba lagi beberapa saat lagi.");
}

// API: Search drug endpoint using structured JSON schema
app.post("/api/search-drug", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Nama obat wajib diisi." });
    }

    const drugName = name.trim();

    const drugSchema = {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Standard drug/generic/brand name, capitalized correctly (e.g., 'Amlodipine')" },
        class: { type: "STRING", description: "Indonesian BPOM drug classification. MUST be one of: 'bebas', 'bebas_terbatas', 'keras', 'narkotika'" },
        className: { type: "STRING", description: "Indonesian class label (e.g. 'Obat Keras (Resep)', 'Obat Bebas Terbatas', 'Obat Bebas')" },
        indications: { type: "STRING", description: "Main medical indications in Indonesian. Concise and directly readable." },
        dosage: { type: "STRING", description: "Standard adult dosage in Indonesian. Highlighting standard doses like '5 mg - 10 mg'." },
        instructions: { type: "STRING", description: "Specific administration instructions in Indonesian (e.g., 'Diminum sebelum makan', 'Wajib dihabiskan')." },
        sideEffects: { type: "STRING", description: "Common side effects in Indonesian, formatted nicely with scannable descriptions." },
        interactions: { type: "STRING", description: "Potential interactions with other drugs, alcohol, or food in Indonesian. Highlight critical interactions." },
        warnings: { type: "STRING", description: "Critical safety warnings in Indonesian (e.g., 'Tidak untuk wanita hamil')." }
      },
      required: ["name", "class", "className", "indications", "dosage", "instructions", "sideEffects", "interactions", "warnings"]
    };

    const prompt = `Berikan informasi medis resmi, akurat, dan terpercaya mengenai obat berikut berdasarkan BPOM Indonesia & MIMS: "${drugName}".
Pastikan seluruh informasi ditulis dalam Bahasa Indonesia yang santai, sopan, dan profesional khas Apoteker Zuzun.

Gunakan format teks yang mudah dipindai (scannable) oleh pasien:
- Gunakan tanda bintang ganda (**) untuk menebalkan (bold) poin dosis penting, nama obat, atau bahaya fatal.
- Jelaskan efek samping dan interaksi obat secara terperinci tetapi ringkas dan padat.
`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah Apoteker Zuzun, asisten apoteker virtual Indonesia yang sangat presisi dalam memberikan info obat.",
        responseMimeType: "application/json",
        responseSchema: drugSchema,
        temperature: 0.2,
      }
    });

    if (!response || !response.text) {
      throw new Error("Gagal menerima respons informasi obat.");
    }

    const drugData = JSON.parse(response.text);
    res.json(drugData);
  } catch (error: any) {
    console.error("Search Drug API Error:", error);
    res.status(500).json({ error: "Gagal mendapatkan informasi obat secara online. Pastikan nama obat ditulis dengan benar atau coba lagi nanti." });
  }
});

// API: Consultation chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request. 'messages' array is required." });
    }

    // Format chat history for Google GenAI SDK
    // SDK expects: contents: [{ role: 'user' | 'model', parts: [{ text: string }] }]
    const formattedContents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `
Kamu adalah Apoteker Zuzun, seorang Apoteker Virtual yang profesional, berempati, dan dapat dipercaya.
Tujuan utama kamu adalah memberikan informasi terkait obat-obatan, suplemen, efek samping, dosis umum, dan interaksi obat kepada pengguna.
Saat menyapa atau menjawab, kamu wajib menyebut diri sebagai "Apoteker Zuzun".

ATURAN FORMATTING WAJIB (SANGAT PENTING - MOBILE-ORIENTED):
Karena pengguna membaca dari layar handphone, kamu WAJIB mematuhi aturan format berikut:
1. Ringkas & Langsung: Jangan bertele-tele. Langsung berikan jawaban di kalimat pertama.
2. Paragraf Pendek: Maksimal 2-3 kalimat per paragraf.
3. Gunakan Poin-poin (Bullet/Numbered Lists): Gunakan bullet points atau daftar bernomor untuk menyebutkan efek samping, cara pakai, atau daftar obat.
4. Bold Teks Penting: Gunakan huruf tebal (**teks**) pada nama obat, dosis, dan peringatan bahaya agar mudah dipindai oleh mata (scannable).
5. Spasi: Berikan jarak satu baris kosong antar paragraf atau daftar agar tidak terlihat padat.

BATASAN MEDIS & KEAMANAN (SANGAT PENTING):
- Kamu adalah Apoteker Zuzun, BUKAN dokter. Kamu tidak boleh mendiagnosis penyakit medis secara pasti atau meresepkan obat keras (obat resep) tanpa anjuran dokter.
- Selalu sisipkan disclaimer singkat di akhir percakapan jika membahas gejala penyakit serius atau obat resep. Contoh: "Catatan: Informasi ini tidak menggantikan diagnosis dokter. Segera konsultasikan ke dokter jika keluhan berlanjut."
- Jika pengguna menanyakan dosis anak/bayi atau ibu hamil/menyusui, berikan peringatan ekstra untuk berhati-hati dan menyarankan konsultasi langsung dengan dokter kandungan atau dokter anak.

GAYA KOMUNIKASI:
- Bahasa: Gunakan bahasa Indonesia yang santai tapi sopan.
- Empati: Tunjukkan simpati jika pengguna sedang sakit (Contoh: "Semoga cepat sembuh ya. Untuk keluhan batuknya...").
- Jelas: Hindari jargon medis yang terlalu rumit, atau jelaskan dengan bahasa awam jika harus menggunakannya.
`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    if (!response || !response.text) {
      throw new Error("Gagal menerima respons dari Apoteker Zuzun.");
    }

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gagal terhubung dengan Apoteker Zuzun. Layanan sedang padat, silakan coba kirim pesan lagi." });
  }
});

// Serve assets and handle single-page routing in production/development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
