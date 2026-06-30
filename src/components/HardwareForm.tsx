import React, { useState, useEffect, useRef } from "react";
import { InventoryItem, HardwareCategory, HardwareStatus } from "../types";
import { Camera, Upload, AlertCircle, Loader2, Sparkles, Check, RefreshCw, Undo } from "lucide-react";

interface HardwareFormProps {
  onSave: (item: Omit<InventoryItem, "id" | "addedAt" | "lastModifiedAt"> & { id?: string }) => void;
  editingItem: InventoryItem | null;
  onCancelEdit: () => void;
  items: InventoryItem[];
}

// Preset samples for fast and easy testing
const PRESET_SAMPLES = [
  {
    name: "Dell Latitude Sticker (Sample)",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=60",
    description: "Laptop Dell z naklejką Service Tag (S/N: 7X8Y9Z2), Core i7, 16GB RAM",
    // We can simulate an API post or let Gemini extract from actual online assets, or embed a real base64 image
    // For Unsplash images, we can fetch them and send to OCR.
    // Let's provide a pre-set helper that does a fetch-and-convert or pre-baked mockup if they prefer
  },
  {
    name: "Lenovo ThinkPad Serial (Sample)",
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&auto=format&fit=crop&q=60",
    description: "Komputer Lenovo ThinkPad (S/N: PF23X4Z), AMD Ryzen, 512GB SSD"
  }
];

export default function HardwareForm({ onSave, editingItem, onCancelEdit, items }: HardwareFormProps) {
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [processor, setProcessor] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [graphics, setGraphics] = useState("");
  const [operatingSystem, setOperatingSystem] = useState("");
  const [category, setCategory] = useState<HardwareCategory>("Laptop");
  const [status, setStatus] = useState<HardwareStatus>("W użyciu");
  const [notes, setNotes] = useState("");
  const [confidence, setConfidence] = useState(100);
  const [replacesItemId, setReplacesItemId] = useState("");
  const [room, setRoom] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError("");
    setIsCameraActive(true);
    setOcrSuccess(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Nie można uzyskać dostępu do aparatu. Upewnij się, że udzieliłeś uprawnień w przeglądarce.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        stopCamera();
        handleImageUpload(dataUrl);
      }
    }
  };

  // Load editing item values if present
  useEffect(() => {
    if (editingItem) {
      setManufacturer(editingItem.manufacturer);
      setModel(editingItem.model);
      setSerialNumber(editingItem.serialNumber);
      setProcessor(editingItem.processor);
      setRam(editingItem.ram);
      setStorage(editingItem.storage);
      setGraphics(editingItem.graphics);
      setOperatingSystem(editingItem.operatingSystem);
      setCategory(editingItem.category);
      setStatus(editingItem.status);
      setNotes(editingItem.notes);
      setConfidence(editingItem.confidence);
      setPhotoUrl(editingItem.photoUrl);
      setReplacesItemId(editingItem.replacesItemId || "");
      setRoom(editingItem.room || "");
      setOcrSuccess(false);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setManufacturer("");
    setModel("");
    setSerialNumber("");
    setProcessor("");
    setRam("");
    setStorage("");
    setGraphics("");
    setOperatingSystem("");
    setCategory("Laptop");
    setStatus("W użyciu");
    setNotes("");
    setConfidence(100);
    setPhotoUrl(undefined);
    setReplacesItemId("");
    setRoom("");
    setOcrSuccess(false);
    setApiError("");
  };

  const handleImageUpload = (base64Str: string) => {
    setPhotoUrl(base64Str);
    setApiError("");
    setOcrSuccess(false);
    analyzeImage(base64Str);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleImageUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setApiError("");

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: base64Image,
          additionalContext: "Dokładnie odczytaj S/N (numer seryjny) oraz model urządzenia."
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Serwer zwrócił błąd podczas analizy OCR.");
      }

      const data = await response.json();
      
      // Auto-fill form fields from Gemini response
      setManufacturer(data.manufacturer || "");
      setModel(data.model || "");
      setSerialNumber(data.serialNumber || "");
      setProcessor(data.processor || "");
      setRam(data.ram || "");
      setStorage(data.storage || "");
      setGraphics(data.graphics || "");
      setOperatingSystem(data.operatingSystem || "");
      if (["Laptop", "Komputer Stacjonarny", "Serwer", "Monitor", "Inny"].includes(data.category)) {
        setCategory(data.category as HardwareCategory);
      }
      setConfidence(data.confidence || 85);
      
      const newNotes = data.notes 
        ? `[Automatyczny odczyt OCR - Pewność: ${data.confidence}%]\n${data.notes}`
        : `[Automatyczny odczyt OCR - Pewność: ${data.confidence}%]`;
      setNotes(newNotes);
      setOcrSuccess(true);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Wystąpił problem z połączeniem z modułem AI OCR. Spróbuj ponownie lub uzupełnij pola ręcznie.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleImageUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!manufacturer.trim() || !model.trim()) {
      setApiError("Pola Producent oraz Model są wymagane.");
      return;
    }

    onSave({
      id: editingItem?.id,
      manufacturer,
      model,
      serialNumber,
      processor,
      ram,
      storage,
      graphics,
      operatingSystem,
      category,
      status,
      notes,
      confidence,
      photoUrl,
      room: room || undefined,
      replacesItemId: replacesItemId || undefined
    });

    resetForm();
  };

  // Preset tester generator (mock/load image and trigger analyze)
  const triggerSampleImage = async (preset: typeof PRESET_SAMPLES[0]) => {
    setIsAnalyzing(true);
    setApiError("");
    setOcrSuccess(false);

    try {
      // Fetch sample image and convert to Base64 to run standard real backend OCR API
      const response = await fetch(preset.image);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setPhotoUrl(base64data);
        analyzeImage(base64data);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      // Fallback data if Unsplash fetch fails (excellent offline/sandbox resiliency!)
      console.warn("Could not fetch preset from internet, using pre-baked fallback...", error);
      setTimeout(() => {
        if (preset.name.includes("Dell")) {
          setManufacturer("Dell");
          setModel("Latitude 5420");
          setSerialNumber("DELL-7X8Y9Z2");
          setProcessor("Intel Core i7-1185G7");
          setRam("16 GB");
          setStorage("512 GB NVMe SSD");
          setGraphics("Intel Iris Xe Graphics");
          setOperatingSystem("Windows 10 Pro");
          setCategory("Laptop");
          setConfidence(98);
          setNotes("[Tryb demo - brak połączenia Unsplash]\nS/N: DELL-7X8Y9Z2\nService Tag: 7X8Y9Z2\nZasilanie: 19.5V 3.34A");
        } else {
          setManufacturer("Lenovo");
          setModel("ThinkPad T14 Gen 2");
          setSerialNumber("LNV-PF23X4Z");
          setProcessor("AMD Ryzen 5 Pro 5650U");
          setRam("16 GB");
          setStorage("512 GB SSD");
          setGraphics("AMD Radeon Graphics");
          setOperatingSystem("Windows 11 Pro");
          setCategory("Laptop");
          setConfidence(95);
          setNotes("[Tryb demo - brak połączenia Unsplash]\nS/N: LNV-PF23X4Z\nType: 20XK-S01200\nMAC: 00:23:45:67:89:AB");
        }
        setOcrSuccess(true);
        setIsAnalyzing(false);
      }, 1000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {editingItem ? (
            <>
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Edytuj urządzenie
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              Szybkie wprowadzanie (AI OCR)
            </>
          )}
        </h2>
        {editingItem && (
          <button
            onClick={onCancelEdit}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <Undo className="h-3.5 w-3.5" /> Anuluj edycję
          </button>
        )}
      </div>

      {!editingItem && (
        <div className="mb-6">
          {isCameraActive ? (
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-950 text-center relative overflow-hidden shadow-inner">
              <div className="absolute top-2 right-2 z-10">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-2 py-1 bg-black/60 hover:bg-black/90 text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                >
                  Zamknij X
                </button>
              </div>
              <video
                ref={videoRef}
                className="w-full h-48 object-cover rounded-lg bg-black"
                playsInline
                muted
              />
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  Zrób zdjęcie (OCR)
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-blue-500 bg-blue-50/50" 
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Analizowanie zdjęcia przez AI...</p>
                  <p className="text-xs text-slate-400 mt-1">Używamy technologii OCR i klasyfikacji Gemini</p>
                </div>
              ) : photoUrl ? (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 mb-2">
                    <img src={photoUrl} alt="Podgląd" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Zdjęcie wczytane
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Kliknij, aby zmienić zdjęcie</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    className="mt-3 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[10px] font-bold text-slate-700 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Camera className="h-3 w-3" />
                    Użyj aparatu zamiast pliku
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-3">
                  <div className="p-2 bg-white rounded-full shadow-sm border border-slate-100 mb-2">
                    <Upload className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Wgraj zdjęcie naklejki znamionowej</p>
                  <p className="text-xs text-slate-400 mt-0.5">Przeciągnij i upuść zdjęcie lub kliknij, aby wybrać</p>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    className="mt-3.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Zrób zdjęcie aparatem (telefon/PC)
                  </button>
                </div>
              )}
            </div>
          )}

          {cameraError && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Preset templates for easy testing */}
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Szybkie demo (wybierz naklejkę testową):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SAMPLES.map((preset, idx) => (
                <button
                  key={`preset-${idx}`}
                  type="button"
                  onClick={() => triggerSampleImage(preset)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-semibold text-slate-700 truncate">{preset.name}</p>
                  <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notifications */}
      {ocrSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Odczyt OCR ukończony!</span> AI automatycznie wypełniło dane z naklejki z pewnością <span className="font-bold">{confidence}%</span>. Przejrzyj je poniżej i zapisz.
          </div>
        </div>
      )}

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Hardware Details Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Producent *</label>
            <input
              type="text"
              required
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="np. Dell, HP, Lenovo"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Model *</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="np. Latitude 5420"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Numer seryjny (S/N)</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="np. MXL84120X4"
              className="w-full text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Procesor (CPU)</label>
            <input
              type="text"
              value={processor}
              onChange={(e) => setProcessor(e.target.value)}
              placeholder="np. Intel i5-1145G7"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pamięć RAM</label>
            <input
              type="text"
              value={ram}
              onChange={(e) => setRam(e.target.value)}
              placeholder="np. 16 GB"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dysk (Storage)</label>
            <input
              type="text"
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              placeholder="np. 512 GB SSD"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Karta Graficzna</label>
            <input
              type="text"
              value={graphics}
              onChange={(e) => setGraphics(e.target.value)}
              placeholder="np. Intel Iris Xe"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">System operacyjny</label>
            <input
              type="text"
              value={operatingSystem}
              onChange={(e) => setOperatingSystem(e.target.value)}
              placeholder="np. Windows 11 Pro"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kategoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as HardwareCategory)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            >
              <option value="Laptop">Laptop</option>
              <option value="Komputer Stacjonarny">Komputer Stacjonarny</option>
              <option value="Serwer">Serwer</option>
              <option value="Monitor">Monitor</option>
              <option value="Inny">Inny</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sala / Lokalizacja</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="np. Sala 102, Dyrekcja"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HardwareStatus)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            >
              <option value="W użyciu">W użyciu</option>
              <option value="W magazynie">W magazynie</option>
              <option value="Wymieniony">Wymieniony</option>
              <option value="Wycofany">Wycofany</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zastępuje urządzenie (opcjonalnie)</label>
            <select
              value={replacesItemId}
              onChange={(e) => setReplacesItemId(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            >
              <option value="">-- brak --</option>
              {items
                .filter(i => i.id !== editingItem?.id)
                .map(i => (
                  <option key={i.id} value={i.id}>
                    {i.manufacturer} {i.model} ({i.serialNumber || "brak S/N"})
                  </option>
                ))
              }
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notatki / Dane z naklejki</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Wpisz dowolne dodatkowe dane techniczne, adresy MAC, zasilanie itp."
            rows={3}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {editingItem ? "Zatwierdź zmiany" : "Zapisz do bazy danych"}
        </button>
      </form>
    </div>
  );
}
