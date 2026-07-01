import express from "express";
import path from "path";
import fs from "fs";
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

  // Microsoft OneDrive OAuth Endpoints
  // 1. Generate Auth URL
  app.get("/api/auth/microsoft/url", (req, res) => {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({ 
        error: "Brak skonfigurowanego MICROSOFT_CLIENT_ID w sekretach aplikacji w AI Studio." 
      });
    }

    // Determine redirect URI
    const origin = (req.query.origin as string) || process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${origin.replace(/\/$/, "")}/api/auth/microsoft/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: "files.readwrite offline_access User.Read",
      state: "onedrive-sync"
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // 2. Auth Callback Handler
  app.get("/api/auth/microsoft/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!code || !clientId) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
            <h2 style="color: #ef4444;">Błąd Autoryzacji</h2>
            <p>Brak kodu autoryzacji lub Client ID.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; border: none; color: white; border-radius: 5px; cursor: pointer;">Zamknij</button>
          </body>
        </html>
      `);
    }

    try {
      // Reconstruct the exact redirect URI sent in the authorization request
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers["host"] || "localhost:3000";
      const redirectUri = `${protocol}://${host}/api/auth/microsoft/callback`;

      const tokenParams = new URLSearchParams({
        client_id: clientId,
        scope: "files.readwrite offline_access User.Read",
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      });

      if (clientSecret) {
        tokenParams.append("client_secret", clientSecret);
      }

      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString()
      });

      const tokenData: any = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Fetch user profile from Microsoft Graph
      let displayName = "Użytkownik Szkolny Microsoft 365";
      let principalName = "szkola@onedrive.com";
      try {
        const userProfileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        if (userProfileRes.ok) {
          const profile = await userProfileRes.json();
          displayName = profile.displayName || displayName;
          principalName = profile.userPrincipalName || profile.mail || principalName;
        }
      } catch (profileErr) {
        console.error("Nie udało się pobrać profilu użytkownika MS Graph:", profileErr);
      }

      // Return tokens and profile to frontend using postMessage
      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
            <div style="max-width: 400px; margin: 0 auto; border: 1px solid #334155; padding: 30px; border-radius: 12px; background: #1e293b; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
              <div style="font-size: 48px; margin-bottom: 20px;">☁️</div>
              <h2 style="color: #3b82f6; margin-top: 0;">Autoryzacja udana!</h2>
              <p style="color: #94a3b8; font-size: 14px;">Zalogowano pomyślnie jako:<br><strong style="color: #f1f5f9;">${displayName}</strong> (${principalName})</p>
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Trwa łączenie z panelem Scanventory. To okno zamknie się automatycznie.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'MS_AUTH_SUCCESS', 
                  tokens: ${JSON.stringify(tokenData)},
                  user: { displayName: ${JSON.stringify(displayName)}, principalName: ${JSON.stringify(principalName)} }
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Błąd wymiany tokenu Microsoft:", error);
      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
            <div style="max-width: 400px; margin: 0 auto; border: 1px solid #ef4444; padding: 30px; border-radius: 12px; background: #1e293b;">
              <div style="font-size: 48px; color: #ef4444; margin-bottom: 20px;">⚠️</div>
              <h2 style="color: #ef4444; margin-top: 0;">Błąd Autoryzacji Microsoft</h2>
              <p style="color: #94a3b8; font-size: 14px; text-align: left; background: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace;">${error.message || error}</p>
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #ef4444; border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer;">Zamknij okno</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'MS_AUTH_ERROR', error: ${JSON.stringify(error.message || error)} }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }
  });

  // 3. Token Refresh Handler
  app.post("/api/auth/microsoft/refresh", async (req, res) => {
    const { refresh_token } = req.body;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!refresh_token || !clientId) {
      return res.status(400).json({ error: "Brak tokenu odświeżania (refresh_token) lub Client ID." });
    }

    try {
      const tokenParams = new URLSearchParams({
        client_id: clientId,
        scope: "files.readwrite offline_access User.Read",
        refresh_token: refresh_token,
        grant_type: "refresh_token"
      });

      if (clientSecret) {
        tokenParams.append("client_secret", clientSecret);
      }

      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString()
      });

      const tokenData: any = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      res.json(tokenData);
    } catch (error: any) {
      console.error("Błąd odświeżania tokenu Microsoft:", error);
      res.status(500).json({ error: error.message || "Failed to refresh token" });
    }
  });

  // Dynamic build / file modification info endpoint
  app.get("/api/build-info", (req, res) => {
    try {
      const filesToCheck = [
        path.join(process.cwd(), "src/App.tsx"),
        path.join(process.cwd(), "src/components/AboutApp.tsx"),
        path.join(process.cwd(), "src/components/HardwareList.tsx"),
        path.join(process.cwd(), "src/components/AdvancedFeatures.tsx"),
        path.join(process.cwd(), "server.ts"),
        path.join(process.cwd(), "package.json")
      ];

      let maxMtime = 0;
      filesToCheck.forEach(file => {
        try {
          if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            if (stats.mtimeMs > maxMtime) {
              maxMtime = stats.mtimeMs;
            }
          }
        } catch (e) {
          // Ignore
        }
      });

      const finalTime = maxMtime > 0 ? new Date(maxMtime) : new Date();

      res.json({
        lastModified: finalTime.toISOString(),
        version: "1.2.0"
      });
    } catch (error: any) {
      res.json({
        lastModified: new Date().toISOString(),
        version: "1.2.0"
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
