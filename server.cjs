var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var ai = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
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
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/ocr", async (req, res) => {
    try {
      const { image, additionalContext } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }
      if (!ai) {
        return res.status(503).json({
          error: "API Gemini nie zosta\u0142o skonfigurowane. Brak klucza GEMINI_API_KEY."
        });
      }
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
      const systemInstruction = `Jeste\u015B ekspertem ds. inwentaryzacji sprz\u0119tu IT oraz profesjonalnym czytnikiem OCR. Twoim zadaniem jest analiza zdj\u0119\u0107 naklejek znamionowych, ty\u0142u urz\u0105dze\u0144, kod\xF3w kreskowych lub samych urz\u0105dze\u0144 komputerowych w celu dok\u0142adnego rozpoznania danych technicznych.
Zwr\xF3\u0107 wynik jako czysty JSON pasuj\u0105cy do okre\u015Blonego schematu. Pola nie powinny by\u0107 puste, je\u015Bli jeste\u015B w stanie je wywnioskowa\u0107 lub odczyta\u0107 z obrazka. Przeprowad\u017A dok\u0142adne OCR dla numeru seryjnego (S/N) i producenta.`;
      const prompt = `Zanalizuj to zdj\u0119cie sprz\u0119tu komputerowego lub jego tabliczki znamionowej.
Zidentyfikuj szczeg\xF3\u0142y sprz\u0119tu. Je\u015Bli u\u017Cytkownik poda\u0142 dodatkowy kontekst: "${additionalContext || "brak"}", we\u017A go pod uwag\u0119.

Zwr\xF3\u0107 szczeg\xF3\u0142owy obiekt JSON o nast\u0119puj\u0105cych polach:
- manufacturer: Producent (np. HP, Dell, Lenovo, Apple, Asus, Acer itp.)
- model: Dok\u0142adna nazwa modelu (np. Latitude 5420, ThinkPad T14, MacBook Pro 14)
- serialNumber: Numer seryjny komputera (S/N, Serial Number, Service Tag, Serial No). Wyci\u0105gnij go bez spacji, dok\u0142adnie tak jak jest na naklejce.
- processor: Model procesora (np. Intel Core i5-1145G7, AMD Ryzen 5 5600U, Apple M2), spr\xF3buj go odczyta\u0107 lub wydedukowa\u0107, je\u015Bli to mo\u017Cliwe.
- ram: Pojemno\u015B\u0107 pami\u0119ci RAM (np. 16 GB, 8 GB), je\u015Bli jest podana lub domy\u015Blna dla tego modelu.
- storage: Pojemno\u015B\u0107 i typ dysku (np. 512 GB SSD, 1 TB HDD, 256 GB NVMe), je\u015Bli s\u0105 podane lub domy\u015Blne.
- graphics: Karta graficzna (np. Intel Iris Xe, Nvidia RTX 3050, Apple GPU), je\u015Bli podana lub domy\u015Blna.
- operatingSystem: System operacyjny (np. Windows 11 Pro, macOS Sonoma, Windows 10 Home), je\u015Bli jest podany lub domy\u015Blny.
- category: Jedna z warto\u015Bci: "Laptop", "Komputer Stacjonarny", "Serwer", "Monitor", "Inny".
- confidence: Szacowana procentowa pewno\u015B\u0107 odczytu danych OCR (liczba ca\u0142kowita od 0 do 100).
- notes: Wszelkie inne przydatne informacje z naklejki, np. adres MAC (MAC ID), Express Service Code, data produkcji, parametry zasilania (np. 19.5V 3.34A), wersja BIOS, ID klienta, itp.

Zwr\xF3\u0107 dane w formacie JSON pasuj\u0105cym do tego schematu. Nie dodawaj \u017Cadnych znacznik\xF3w markdown typu \`\`\`json i \`\`\` wok\xF3\u0142 JSON-a. Zwr\xF3\u0107 tylko czysty ci\u0105g JSON.`;
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
            type: import_genai.Type.OBJECT,
            properties: {
              manufacturer: { type: import_genai.Type.STRING, description: "Producent sprz\u0119tu" },
              model: { type: import_genai.Type.STRING, description: "Model urz\u0105dzenia" },
              serialNumber: { type: import_genai.Type.STRING, description: "Numer seryjny (S/N)" },
              processor: { type: import_genai.Type.STRING, description: "Procesor" },
              ram: { type: import_genai.Type.STRING, description: "Pami\u0119\u0107 RAM" },
              storage: { type: import_genai.Type.STRING, description: "Pami\u0119\u0107 dyskowa" },
              graphics: { type: import_genai.Type.STRING, description: "Karta graficzna" },
              operatingSystem: { type: import_genai.Type.STRING, description: "System operacyjny" },
              category: {
                type: import_genai.Type.STRING,
                description: "Kategoria urz\u0105dzenia: Laptop, Komputer Stacjonarny, Serwer, Monitor, Inny"
              },
              confidence: { type: import_genai.Type.INTEGER, description: "Pewno\u015B\u0107 odczytu OCR w %" },
              notes: { type: import_genai.Type.STRING, description: "Dodatkowe uwagi, adresy MAC, zasilanie, kody kreskowe" }
            },
            required: ["manufacturer", "model", "serialNumber", "category", "confidence"]
          }
        }
      });
      const responseText = response.text;
      if (!responseText) {
        throw new Error("Pusta odpowied\u017A z modelu Gemini");
      }
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error) {
      console.error("B\u0142\u0105d podczas analizy obrazu przez Gemini:", error);
      res.status(500).json({
        error: "Nie uda\u0142o si\u0119 przeanalizowa\u0107 zdj\u0119cia. " + (error.message || "Wyst\u0105pi\u0142 nieznany b\u0142\u0105d.")
      });
    }
  });
  app.get("/api/build-info", (req, res) => {
    try {
      const filesToCheck = [
        import_path.default.join(process.cwd(), "src/App.tsx"),
        import_path.default.join(process.cwd(), "src/components/AboutApp.tsx"),
        import_path.default.join(process.cwd(), "src/components/HardwareList.tsx"),
        import_path.default.join(process.cwd(), "src/components/AdvancedFeatures.tsx"),
        import_path.default.join(process.cwd(), "server.ts"),
        import_path.default.join(process.cwd(), "package.json")
      ];
      let maxMtime = 0;
      filesToCheck.forEach((file) => {
        try {
          if (import_fs.default.existsSync(file)) {
            const stats = import_fs.default.statSync(file);
            if (stats.mtimeMs > maxMtime) {
              maxMtime = stats.mtimeMs;
            }
          }
        } catch (e) {
        }
      });
      const finalTime = maxMtime > 0 ? new Date(maxMtime) : /* @__PURE__ */ new Date();
      res.json({
        lastModified: finalTime.toISOString(),
        version: "1.2.0"
      });
    } catch (error) {
      res.json({
        lastModified: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.2.0"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serwer inwentaryzacji dzia\u0142a na porcie ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Inicjalizacja serwera nie powiod\u0142a si\u0119:", err);
});
//# sourceMappingURL=server.cjs.map
