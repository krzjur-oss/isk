import React, { useState, useEffect, useRef } from "react";
import { QrCode, Camera, AlertCircle, Check, Info, X, Volume2, Search, Smartphone } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { InventoryItem } from "../types";

interface MobileQrScannerProps {
  items: InventoryItem[];
  onSelectForEdit: (item: InventoryItem) => void;
  onScannedNoMatch?: (scannedText: string) => void;
}

export default function MobileQrScanner({ items, onSelectForEdit, onScannedNoMatch }: MobileQrScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [lastScannedText, setLastScannedText] = useState("");
  const [noMatchFound, setNoMatchFound] = useState(false);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const QR_ELEMENT_ID = "mobile-quick-qr-scanner-container";

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 1000; // slightly higher pitch for mobile quick scan
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (err) {
      console.warn("Could not play scan beep:", err);
    }
  };

  const findItemFromQrCode = (decodedText: string): InventoryItem | null => {
    const cleanText = decodedText.trim();
    if (!cleanText) return null;

    // Load company settings to read potential prefix
    let prefix = "";
    try {
      const stored = localStorage.getItem("scanventory_company_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        prefix = parsed.inventoryPrefix || "";
      }
    } catch (_) {}

    // 1. Direct match by ID (case insensitive)
    let matched = items.find(item => item.id.toLowerCase() === cleanText.toLowerCase());
    if (matched) return matched;

    // 2. Direct match by Serial Number (case insensitive)
    matched = items.find(
      item => item.serialNumber && item.serialNumber.trim().toLowerCase() === cleanText.toLowerCase()
    );
    if (matched) return matched;

    // 3. Robust parser for multi-line sticker texts
    const lines = cleanText.split(/\r?\n/);
    let parsedSn = "";
    let parsedId = "";

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Look for S/N or Serial number lines
      if (lowerLine.includes("s/n:") || lowerLine.includes("sn:") || lowerLine.includes("serial:")) {
        const parts = line.split(":");
        if (parts.length > 1) {
          parsedSn = parts.slice(1).join(":").trim();
        }
      }
      
      // Look for Inventory ID or ID lines
      if (lowerLine.includes("inwentarz:") || lowerLine.includes("id:")) {
        const parts = line.split(":");
        if (parts.length > 1) {
          parsedId = parts.slice(1).join(":").trim();
        }
      }
    }

    // Match with parsed S/N
    if (parsedSn) {
      const cleanSn = parsedSn.toLowerCase();
      matched = items.find(item => item.serialNumber && item.serialNumber.trim().toLowerCase() === cleanSn);
      if (matched) return matched;
    }

    // Match with parsed ID
    if (parsedId) {
      const cleanId = parsedId.toLowerCase();
      // Direct
      matched = items.find(item => item.id.toLowerCase() === cleanId);
      if (matched) return matched;

      // Match stripping custom prefix
      if (prefix) {
        const prefixLower = prefix.toLowerCase();
        if (cleanId.startsWith(prefixLower)) {
          const idWithoutPrefix = cleanId.substring(prefixLower.length).trim();
          matched = items.find(item => item.id.toLowerCase() === idWithoutPrefix);
          if (matched) return matched;
        }
      }

      // Suffix check as fallback
      matched = items.find(item => cleanId.endsWith(item.id.toLowerCase()));
      if (matched) return matched;
    }

    // Try a broad search check: check if any item id or serial number is present inside the QR text
    // (useful if they scanned a raw sticker text with no formatting but carrying the identifier)
    for (const item of items) {
      if (item.serialNumber && cleanText.toLowerCase().includes(item.serialNumber.trim().toLowerCase())) {
        return item;
      }
      if (cleanText.toLowerCase().includes(item.id.toLowerCase())) {
        return item;
      }
    }

    return null;
  };

  const startScanner = async () => {
    setError("");
    setNoMatchFound(false);
    setLastScannedText("");
    setIsActive(true);
    setStatusMessage("Uruchamianie aparatu...");

    // Slight delay to ensure DOM element is mounted
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(QR_ELEMENT_ID);
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.75;
              return { width: size, height: size };
            }
          },
          async (decodedText) => {
            // Success callback!
            playBeep();
            const matchedItem = findItemFromQrCode(decodedText);
            
            if (matchedItem) {
              setStatusMessage("Znaleziono urządzenie! Przekierowanie...");
              await stopScanner();
              onSelectForEdit(matchedItem);
            } else {
              // No match found in DB
              setLastScannedText(decodedText);
              setNoMatchFound(true);
              setStatusMessage("Zeskanowano pomyślnie, ale brak w bazie.");
              await stopScanner();
              if (onScannedNoMatch) {
                onScannedNoMatch(decodedText);
              }
            }
          },
          () => {
            // Ignore scan frame failures
          }
        );
        setStatusMessage("Skieruj aparat na kod QR na naklejce...");
      } catch (err: any) {
        console.error("Quick QR scanner launch error:", err);
        setError("Nie udało się otworzyć aparatu. Sprawdź, czy udzielono uprawnień do kamery w przeglądarce.");
        setIsActive(false);
      }
    }, 150);
  };

  const stopScanner = async () => {
    if (qrScannerRef.current) {
      if (qrScannerRef.current.isScanning) {
        try {
          await qrScannerRef.current.stop();
        } catch (err) {
          console.error("Failed to stop camera:", err);
        }
      }
      qrScannerRef.current = null;
    }
    setIsActive(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <QrCode className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Szybki Skaner Naklejek</h3>
            <p className="text-[10px] text-slate-400 font-medium">Aparat • Natychmiastowa edycja sprzętu</p>
          </div>
        </div>
        
        {isActive && (
          <button
            onClick={stopScanner}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isActive ? (
        <div className="space-y-3">
          {/* Real-time Status Overlay Indicator */}
          <div className="bg-slate-900 text-white p-2 rounded-lg text-center text-[11px] font-medium flex items-center justify-center gap-1.5 shadow-sm">
            <Smartphone className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            <span>{statusMessage}</span>
          </div>

          {/* Scanner Container Box */}
          <div className="border border-slate-300 rounded-xl p-2 bg-slate-950 text-center relative overflow-hidden shadow-inner">
            <div id={QR_ELEMENT_ID} className="w-full h-56 rounded-lg overflow-hidden bg-black relative" />
            
            {/* Visual Pulsating Laser Line */}
            <div className="absolute inset-x-2 top-2 bottom-2 pointer-events-none flex items-center justify-center">
              <div className="w-[190px] h-[130px] border-2 border-dashed border-blue-500/60 rounded-md flex items-center justify-center relative">
                <div className="absolute w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9)] animate-bounce" />
              </div>
            </div>
          </div>

          <button
            onClick={stopScanner}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Anuluj skanowanie
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {noMatchFound ? (
            <div className="p-3.5 bg-amber-50 border border-amber-150 rounded-lg space-y-2 text-left animate-in fade-in duration-200">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Brak urządzenia w bazie danych</h4>
                  <p className="text-[10.5px] text-slate-600 mt-0.5 leading-normal">
                    Zeskanowano pomyślnie kod: <strong className="font-mono text-slate-800 bg-amber-100 px-1 py-0.5 rounded break-all">{lastScannedText}</strong>. Żadne urządzenie nie posiada takiego identyfikatora ani numeru seryjnego.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-amber-100/50">
                <button
                  onClick={startScanner}
                  className="flex-1 py-1.5 bg-white border border-amber-350 hover:bg-amber-100 text-amber-800 font-bold text-[10.5px] rounded-md transition-colors"
                >
                  Spróbuj ponownie
                </button>
                <button
                  onClick={() => setNoMatchFound(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10.5px] rounded-md transition-colors"
                >
                  Ukryj
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startScanner}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group active:scale-[0.99]"
            >
              <Camera className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
              Skanuj kod QR aparatem
            </button>
          )}

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-lg text-[10.5px] text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center leading-relaxed font-medium">
            Zeskanuj kod standardowy lub z numerem seryjnym. System automatycznie wyszuka powiązany sprzęt i otworzy go do szybkiej edycji, ułatwiając pracę w terenie.
          </p>
        </div>
      )}
    </div>
  );
}
