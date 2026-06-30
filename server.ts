import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY is not defined in environment variables.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI client:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits for larger image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint for hardware image analysis using Gemini OCR
  app.post("/api/ocr", async (req, res) => {
    try {
      const { image, additionalContext } = req.body;

      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      if (!ai) {
        return res.status(503).json({ 
          error: "API Gemini nie zostało skonfigurowane. Brak klucza GEMINI_API_KEY." 
        });
      }

      // Parse the base64 image data
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = image;

      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };

      const systemInstruction = `Jesteś ekspertem ds. inwentaryzacji sprzętu IT oraz profesjonalnym czytnikiem OCR. Twoim zadaniem jest analiza zdjęć naklejek znamionowych, tyłu urządzeń, kodów kreskowych lub samych urządzeń komputerowych w celu dokładnego rozpoznania danych technicznych.
Zwróć wynik jako czysty JSON pasujący do określonego schematu. Pola nie powinny być puste, jeśli jesteś w stanie je wywnioskować lub odczytać z obrazka. Przeprowadź dokładne OCR dla numeru seryjnego (S/N) i producenta.`;

      const prompt = `Zanalizuj to zdjęcie sprzętu komputerowego lub jego tabliczki znamionowej.
Zidentyfikuj szczegóły sprzętu. Jeśli użytkownik podał dodatkowy kontekst: "${additionalContext || 'brak'}", weź go pod uwagę.

Zwróć szczegółowy obiekt JSON o następujących polach:
- manufacturer: Producent (np. HP, Dell, Lenovo, Apple, Asus, Acer itp.)
- model: Dokładna nazwa modelu (np. Latitude 5420, ThinkPad T14, MacBook Pro 14)
- serialNumber: Numer seryjny komputera (S/N, Serial Number, Service Tag, Serial No). Wyciągnij go bez spacji, dokładnie tak jak jest na naklejce.
- processor: Model procesora (np. Intel Core i5-1145G7, AMD Ryzen 5 5600U, Apple M2), spróbuj go odczytać lub wydedukować, jeśli to możliwe.
- ram: Pojemność pamięci RAM (np. 16 GB, 8 GB), jeśli jest podana lub domyślna dla tego modelu.
- storage: Pojemność i typ dysku (np. 512 GB SSD, 1 TB HDD, 256 GB NVMe), jeśli są podane lub domyślne.
- graphics: Karta graficzna (np. Intel Iris Xe, Nvidia RTX 3050, Apple GPU), jeśli podana lub domyślna.
- operatingSystem: System operacyjny (np. Windows 11 Pro, macOS Sonoma, Windows 10 Home), jeśli jest podany lub domyślny.
- category: Jedna z wartości: "Laptop", "Komputer Stacjonarny", "Serwer", "Monitor", "Inny".
- confidence: Szacowana procentowa pewność odczytu danych OCR (liczba całkowita od 0 do 100).
- notes: Wszelkie inne przydatne informacje z naklejki, np. adres MAC (MAC ID), Express Service Code, data produkcji, parametry zasilania (np. 19.5V 3.34A), wersja BIOS, ID klienta, itp.

Zwróć dane w formacie JSON pasującym do tego schematu. Nie dodawaj żadnych znaczników markdown typu \`\`\`json i \`\`\` wokół JSON-a. Zwróć tylko czysty ciąg JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          imagePart,
          { text: prompt }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              manufacturer: { type: Type.STRING, description: "Producent sprzętu" },
              model: { type: Type.STRING, description: "Model urządzenia" },
              serialNumber: { type: Type.STRING, description: "Numer seryjny (S/N)" },
              processor: { type: Type.STRING, description: "Procesor" },
              ram: { type: Type.STRING, description: "Pamięć RAM" },
              storage: { type: Type.STRING, description: "Pamięć dyskowa" },
              graphics: { type: Type.STRING, description: "Karta graficzna" },
              operatingSystem: { type: Type.STRING, description: "System operacyjny" },
              category: { 
                type: Type.STRING, 
                description: "Kategoria urządzenia: Laptop, Komputer Stacjonarny, Serwer, Monitor, Inny" 
              },
              confidence: { type: Type.INTEGER, description: "Pewność odczytu OCR w %" },
              notes: { type: Type.STRING, description: "Dodatkowe uwagi, adresy MAC, zasilanie, kody kreskowe" },
            },
            required: ["manufacturer", "model", "serialNumber", "category", "confidence"],
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Pusta odpowiedź z modelu Gemini");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Błąd podczas analizy obrazu przez Gemini:", error);
      res.status(500).json({ 
        error: "Nie udało się przeanalizować zdjęcia. " + (error.message || "Wystąpił nieznany błąd.") 
      });
    }
  });

  // Handle Vite Dev Server or Production Static Files
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serwer inwentaryzacji działa na porcie ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Inicjalizacja serwera nie powiodła się:", err);
});
