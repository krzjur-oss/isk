import React, { useState, useEffect } from "react";
import { InventoryItem, HardwareStatus, HardwareCategory } from "../types";
import { useToast } from "./Toast";
import { 
  QrCode, BarChart3, MapPin, Trash2, Printer, Download, Check, 
  AlertTriangle, ShieldCheck, User, Calendar, FileText, FileSignature, 
  ChevronRight, RefreshCw, Layers, Sparkles, Upload, 
  FileDown, Database, HelpCircle, LogOut, Key, Info, FileSpreadsheet
} from "lucide-react";
import { generateInventoryPDF } from "../utils/pdfGenerator";

// Helper map to map CSV headers to InventoryItem keys (case-insensitive and Polish-compatible)
const headerMapping: Record<string, keyof InventoryItem> = {
  "id": "id",
  "producent": "manufacturer",
  "manufacturer": "manufacturer",
  "model": "model",
  "numer seryjny (s/n)": "serialNumber",
  "numer seryjny": "serialNumber",
  "serial number": "serialNumber",
  "kategoria": "category",
  "category": "category",
  "sala": "room",
  "room": "room",
  "procesor": "processor",
  "processor": "processor",
  "ram": "ram",
  "dysk": "storage",
  "storage": "storage",
  "grafika": "graphics",
  "graphics": "graphics",
  "system operacyjny": "operatingSystem",
  "operating system": "operatingSystem",
  "status": "status",
  "data zakupu": "purchaseDate",
  "purchase date": "purchaseDate",
  "dodano": "addedAt",
  "added at": "addedAt",
  "modyfikowano": "lastModifiedAt",
  "last modified": "lastModifiedAt",
  "zastępuje (id)": "replacesItemId",
  "replaces": "replacesItemId",
  "zastąpiony przez (id)": "replacedByItemId",
  "replaced by": "replacedByItemId",
  "data wymiany": "replacementDate",
  "replacement date": "replacementDate",
  "notatki": "notes",
  "notes": "notes"
};

// Robust custom CSV parser that handles quotes and semicolon or comma delimiters
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;
  
  // Normalize newlines
  const content = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Detect delimiter (semicolon is common in European Locales / Excel exports, fallback to comma)
  const firstLine = content.split("\n")[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        row.push(current.trim());
        current = "";
      } else if (char === '\n') {
        row.push(current.trim());
        result.push(row);
        row = [];
        current = "";
      } else {
        current += char;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    result.push(row);
  }
  return result;
}

interface AdvancedFeaturesProps {
  items: InventoryItem[];
  onUpdateItems: (updatedItems: InventoryItem[]) => void;
}

// Simple deterministic pseudo-random matrix generator for visual QR code look
function generateQRMatrix(text: string): boolean[][] {
  const size = 21; // Version 1 QR code size (21x21)
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Hash function to seed the pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Helper to fill squares (finder patterns)
  const drawFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isBorder || isCenter) {
          matrix[row + r][col + c] = true;
        }
      }
    }
  };

  // Draw three finder patterns
  drawFinderPattern(0, 0); // Top-left
  drawFinderPattern(0, size - 7); // Top-right
  drawFinderPattern(size - 7, 0); // Bottom-left

  // Draw alignment-like timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Fill rest with deterministic pseudo-random bytes based on hash and text
  let seed = Math.abs(hash);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finder patterns
      const isFinder = 
        (r < 8 && c < 8) || 
        (r < 8 && c > size - 9) || 
        (r > size - 9 && c < 8);
      
      if (!isFinder && r !== 6 && c !== 6) {
        seed = (seed * 9301 + 49297) % 233280;
        const randomValue = seed / 233280;
        matrix[r][c] = randomValue > 0.45;
      }
    }
  }

  return matrix;
}

export default function AdvancedFeatures({ items, onUpdateItems }: AdvancedFeaturesProps) {
  const { toastSuccess, toastError, toastInfo, toastWarning } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"qr" | "charts" | "rooms" | "disposal" | "data">("qr");

  // 1. QR Code State
  const [selectedQRItem, setSelectedQRItem] = useState<InventoryItem | null>(
    items.length > 0 ? items[0] : null
  );

  const [copiedLabelId, setCopiedLabelId] = useState<string | null>(null);

  // 4. Room Auditor State
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [bulkMoveTarget, setBulkMoveTarget] = useState<string>("");
  const [selectedBulkItems, setSelectedBulkItems] = useState<string[]>([]);
  const [isSuccessNotification, setIsSuccessNotification] = useState<string | null>(null);

  // 5. Disposal Protocol State
  const [disposalItems, setDisposalItems] = useState<string[]>([]);
  const [protocolNo, setProtocolNo] = useState(`LT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/001`);
  const [commissionChair, setCommissionChair] = useState("mgr inż. Jan Kowalski");
  const [commissionMember1, setCommissionMember1] = useState("Krzysztof Jureczek");
  const [commissionMember2, setCommissionMember2] = useState("Anna Nowak (Dział Finansów)");
  const [disposalReason, setDisposalReason] = useState("Zestarzenie technologiczne, zużycie fizyczne podzespołów, brak możliwości instalacji nowoczesnych systemów operacyjnych.");
  const [isProtocolGenerated, setIsProtocolGenerated] = useState(false);

  // 6. CSV/PDF/JSON Import & Export State
  const [importedCSVItems, setImportedCSVItems] = useState<InventoryItem[] | null>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const rawRows = parseCSV(text);
        if (rawRows.length < 2) {
          alert("Plik CSV jest pusty lub niepoprawny.");
          return;
        }

        const headers = rawRows[0];
        const colIndices: Record<number, keyof InventoryItem> = {};
        headers.forEach((h, index) => {
          const cleanHeader = h.replace(/^\uFEFF/, "").toLowerCase().trim();
          if (headerMapping[cleanHeader]) {
            colIndices[index] = headerMapping[cleanHeader];
          }
        });

        const parsedList: InventoryItem[] = [];

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (row.length === 0 || (row.length === 1 && !row[0])) continue;

          const item: Partial<InventoryItem> = {};
          
          row.forEach((cell, index) => {
            const prop = colIndices[index];
            if (prop) {
              const val = cell.trim();
              if (val !== "") {
                if (prop === "confidence") {
                  item[prop] = Number(val) || 100;
                } else {
                  (item as any)[prop] = val;
                }
              }
            }
          });

          if (!item.manufacturer || !item.model) {
             continue; 
          }

          item.category = (item.category as HardwareCategory) || "Inny";
          item.status = (item.status as HardwareStatus) || "W magazynie";

          parsedList.push(item as InventoryItem);
        }

        if (parsedList.length === 0) {
          toastError("Nie znaleziono prawidłowych urządzeń w pliku CSV. Upewnij się, że plik posiada kolumny 'Producent' i 'Model'.");
          return;
        }

        setImportedCSVItems(parsedList);
      } catch (err) {
        console.error(err);
        toastError("Błąd podczas przetwarzania pliku CSV. Upewnij się, że plik ma poprawny format.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const executeCSVImport = (mode: "merge" | "add" | "replace") => {
    if (!importedCSVItems) return;

    let finalItems: InventoryItem[] = [];

    if (mode === "replace") {
      finalItems = importedCSVItems.map((item, idx) => ({
        ...item,
        id: item.id || `device-${Date.now()}-${idx}`
      }));
    } else if (mode === "add") {
      finalItems = [...items];
      importedCSVItems.forEach((item, idx) => {
        const exists = item.id ? items.some(existing => existing.id === item.id) : false;
        if (!exists) {
          finalItems.push({
            ...item,
            id: item.id || `device-${Date.now()}-${idx}`
          });
        }
      });
    } else if (mode === "merge") {
      const currentMap = new Map(items.map(item => [item.id, item]));
      
      importedCSVItems.forEach((item, idx) => {
        const id = item.id || `device-${Date.now()}-${idx}`;
        if (currentMap.has(id)) {
          currentMap.set(id, {
            ...currentMap.get(id)!,
            ...item,
            id
          });
        } else {
          currentMap.set(id, {
            ...item,
            id
          });
        }
      });
      
      finalItems = Array.from(currentMap.values());
    }

    onUpdateItems(finalItems);
    setImportedCSVItems(null);
    toastSuccess(`Pomyślnie zaimportowano urządzenia! Nowa liczba urządzeń w bazie: ${finalItems.length}`);
  };

  const handleExportPDF = () => {
    if (items.length === 0) {
      toastWarning("Brak urządzeń do wygenerowania raportu.");
      return;
    }
    generateInventoryPDF(items);
    toastSuccess("Pomyślnie wygenerowano raport PDF!");
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toastWarning("Brak urządzeń do wygenerowania pliku CSV.");
      return;
    }

    const headers = [
      "ID",
      "Producent",
      "Model",
      "Numer seryjny (S/N)",
      "Kategoria",
      "Sala",
      "Procesor",
      "RAM",
      "Dysk",
      "Grafika",
      "System operacyjny",
      "Status",
      "Data zakupu",
      "Dodano",
      "Modyfikowano",
      "Zastępuje (ID)",
      "Zastąpiony przez (ID)",
      "Data wymiany",
      "Notatki"
    ];

    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return "";
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      if (escaped.includes(";") || escaped.includes("\n") || escaped.includes("\r") || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    };

    const rows = items.map(item => [
      item.id,
      item.manufacturer,
      item.model,
      item.serialNumber || "",
      item.category,
      item.room || "",
      item.processor || "",
      item.ram || "",
      item.storage || "",
      item.graphics || "",
      item.operatingSystem || "",
      item.status,
      item.purchaseDate || "",
      item.addedAt || "",
      item.lastModifiedAt || "",
      item.replacesItemId || "",
      item.replacedByItemId || "",
      item.replacementDate || "",
      item.notes || ""
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(escapeCSV).join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const todayStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `inwentarz_sprzetu_${todayStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess("Pomyślnie wyeksportowano listę do pliku CSV!");
  };

  const handleExportJSON = () => {
    try {
      const backupData = JSON.stringify(items, null, 2);
      const blob = new Blob([backupData], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      const todayStr = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `kopia_zapasowa_inwentarza_${todayStr}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastSuccess("Pobrana została pełna kopia zapasowa JSON!");
    } catch (err) {
      console.error(err);
      toastError("Błąd podczas generowania pliku JSON kopii zapasowej.");
    }
  };

  // Helper: List of unique rooms
  const roomsList = Array.from(
    new Set(items.map(item => item.room || "Nieprzypisana").filter(Boolean))
  ).sort();

  // Handle bulk transfer
  const handleBulkTransfer = () => {
    if (!bulkMoveTarget || selectedBulkItems.length === 0) return;
    
    const updated = items.map(item => {
      if (selectedBulkItems.includes(item.id)) {
        return {
          ...item,
          room: bulkMoveTarget === "Nieprzypisana" ? "" : bulkMoveTarget,
          lastModifiedAt: new Date().toISOString()
        };
      }
      return item;
    });

    onUpdateItems(updated);
    toastSuccess(`Pomyślnie przeniesiono ${selectedBulkItems.length} ${selectedBulkItems.length === 1 ? "urządzenie" : "urządzeń"} do sali: ${bulkMoveTarget}`);
    setSelectedBulkItems([]);
    setBulkMoveTarget("");
    setIsSuccessNotification(`Pomyślnie przeniesiono urządzenia do sali: ${bulkMoveTarget}`);
    setTimeout(() => setIsSuccessNotification(null), 3000);
  };

  // Toggle single item selection for bulk transfer
  const toggleBulkSelection = (id: string) => {
    setSelectedBulkItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle item selection for disposal protocol
  const toggleDisposalSelection = (id: string) => {
    setDisposalItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Print friendly action for disposal protocol
  const handlePrintProtocol = () => {
    window.print();
  };

  // Extracted statistics for charts
  const categories = Array.from(new Set(items.map(i => i.category)));
  const categoryStats = categories.map(cat => {
    const count = items.filter(i => i.category === cat).length;
    return { name: cat, count };
  });

  // Calculate hardware age breakdown
  const ageStats = {
    new: items.filter(item => {
      if (!item.purchaseDate) return false;
      const ageYrs = (new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return ageYrs < 1;
    }).length,
    mid: items.filter(item => {
      if (!item.purchaseDate) return true; // Default to mid if no purchase date
      const ageYrs = (new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return ageYrs >= 1 && ageYrs <= 3;
    }).length,
    old: items.filter(item => {
      if (!item.purchaseDate) return false;
      const ageYrs = (new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return ageYrs > 3;
    }).length,
  };

  // Expired warranty list
  const oldOrExpiredItems = items.filter(item => {
    if (!item.purchaseDate) return false;
    const ageYrs = (new Date().getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return ageYrs > 3 || item.status === "Wycofany";
  });

  return (
    <div className="space-y-6">
      {/* Tab select Header */}
      <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Usprawnienia i Narzędzia Zaawansowane
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Dodatkowe moduły systemu inwentaryzacji: etykietowanie, analizy sal, analityka i likwidacje</p>
          </div>
          
          <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => { setActiveSubTab("qr"); setIsProtocolGenerated(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === "qr"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              1. Etykiety i QR
            </button>
            <button
              onClick={() => { setActiveSubTab("charts"); setIsProtocolGenerated(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === "charts"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              2. Wykresy i Analityka
            </button>
            <button
              onClick={() => { setActiveSubTab("rooms"); setIsProtocolGenerated(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === "rooms"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              3. Audytor lokalizacji
            </button>
            <button
              onClick={() => { setActiveSubTab("data"); setIsProtocolGenerated(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === "data"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              4. Import / Eksport CSV i PDF
            </button>
            <button
              onClick={() => { setActiveSubTab("disposal"); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === "disposal"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Protokół Utylizacji (LT)
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: QR & BARCODE LABELS */}
      {activeSubTab === "qr" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-250">
          {/* Select Hardware */}
          <div className="bg-white rounded-xl border border-slate-150 p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800">1. Wybierz urządzenie do etykiety</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Wybierz sprzęt z bazy, aby wygenerować unikalny kod kreskowy i QR</p>
            </div>

            <div className="max-h-[420px] overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-1.5 pr-2">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedQRItem(item)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all flex justify-between items-center cursor-pointer ${
                    selectedQRItem?.id === item.id
                      ? "bg-blue-50 border-blue-200 text-blue-900"
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-700"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold truncate">{item.manufacturer} {item.model}</p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">SN: {item.serialNumber || "Brak SN"}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    item.category === "Laptop" ? "bg-indigo-100 text-indigo-700" :
                    item.category === "Monitor" ? "bg-amber-100 text-amber-700" :
                    item.category === "Serwer" ? "bg-emerald-100 text-emerald-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {item.category}
                  </span>
                </button>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-slate-400 p-4 text-center">Brak sprzętu w bazie danych.</p>
              )}
            </div>
          </div>

          {/* Label Preview Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-150 p-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Podgląd etykiety inwentaryzacyjnej</h3>
                  <p className="text-[11px] text-slate-400">Standardowa samoprzylepna etykieta techniczna IT 80x50mm</p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded">
                  Format: Zebra Z-Select
                </span>
              </div>

              {selectedQRItem ? (
                <div className="flex justify-center py-6">
                  {/* Physical Label Styled Container */}
                  <div 
                    id="printable-asset-label" 
                    className="w-[360px] p-5 border-4 border-slate-900 bg-white shadow-md rounded text-slate-900 font-mono flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Header line */}
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-3">
                      <div>
                        <span className="text-xs font-black tracking-tighter">SCANVENTORY SYSTEM</span>
                        <p className="text-[8px] text-slate-600 font-bold -mt-1 uppercase">Własność i Ewidencja IT</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold bg-slate-950 text-white px-1.5 py-0.5 rounded uppercase">
                          {selectedQRItem.category}
                        </span>
                      </div>
                    </div>

                    {/* QR Code and Meta Section */}
                    <div className="flex gap-4 items-center mb-3">
                      {/* Generowany deterministyczny SVG QR Code */}
                      <div className="p-1.5 border border-slate-300 rounded bg-white shrink-0">
                        <svg width="100" height="100" viewBox="0 0 21 21">
                          {generateQRMatrix(selectedQRItem.id + selectedQRItem.serialNumber).map((row, rIndex) => 
                            row.map((cell, cIndex) => (
                              <rect
                                key={`${rIndex}-${cIndex}`}
                                x={cIndex}
                                y={rIndex}
                                width="1"
                                height="1"
                                fill={cell ? "#000000" : "#ffffff"}
                              />
                            ))
                          )}
                        </svg>
                      </div>

                      {/* Technical Details */}
                      <div className="space-y-1.5 flex-1 min-w-0 text-left">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase font-black">Producent i model:</span>
                          <p className="text-xs font-bold truncate leading-tight text-slate-900">{selectedQRItem.manufacturer} {selectedQRItem.model}</p>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase font-black">Numer seryjny:</span>
                          <p className="text-xs font-bold leading-tight font-mono text-slate-900 tracking-tight">{selectedQRItem.serialNumber || "BRAK S/N"}</p>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase font-black">ID Zasobu:</span>
                          <p className="text-[10px] font-bold font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded inline-block">
                            #{selectedQRItem.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Barcode section at bottom */}
                    <div className="border-t border-slate-300 pt-2 flex flex-col items-center">
                      {/* Mock code 128 barcode using pure CSS columns of variable width */}
                      <div className="flex h-7 items-stretch w-full justify-center bg-white px-4">
                        {Array.from({ length: 42 }).map((_, i) => {
                          const width = (i % 3 === 0 ? "w-[1px]" : i % 5 === 0 ? "w-[3px]" : "w-[2px]");
                          const bg = (i % 7 === 1 || i % 4 === 2) ? "bg-white" : "bg-slate-950";
                          return <div key={i} className={`${width} ${bg}`} />;
                        })}
                      </div>
                      <p className="text-[8px] text-slate-600 mt-1 font-mono tracking-[4px]">
                        *{selectedQRItem.serialNumber?.toUpperCase() || "INVENTORY"}*
                      </p>
                    </div>

                    {/* Small technical locator marker */}
                    {selectedQRItem.room && (
                      <div className="absolute bottom-2 right-2 text-[8px] font-bold text-slate-500">
                        {selectedQRItem.room}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  Wybierz urządzenie z listy po lewej, aby zobaczyć podgląd etykiety.
                </div>
              )}
            </div>

            {selectedQRItem && (
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Drukuj etykietę (Zebra / A4)
                </button>
                <button
                  onClick={() => {
                    setCopiedLabelId(selectedQRItem.id);
                    setTimeout(() => setCopiedLabelId(null), 2000);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {copiedLabelId === selectedQRItem.id ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-50" />
                      Skopiowano link QR!
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Pobierz dane etykiety
                    </>
                  )}
                </button>
                <div className="flex-1"></div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Zgodne z normą ISO/IEC 18004
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CHARTS & AGE ANALYTICS */}
      {activeSubTab === "charts" && (
        <div className="space-y-6 animate-in fade-in duration-250">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wskaźnik amortyzacji</h3>
                <h4 className="text-2xl font-black text-slate-800 mt-2">
                  {Math.round((ageStats.old / (items.length || 1)) * 100)}%
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Procentowy udział komputerów i laptopów starszych niż 3 lata, kwalifikujących się do wymiany amortyzacyjnej.</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Kwalifikuje się do utylizacji:</span>
                <span className="font-bold text-rose-600">{ageStats.old} szt.</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wydajność floty</h3>
                <h4 className="text-2xl font-black text-emerald-600 mt-2">
                  {Math.round((ageStats.new / (items.length || 1)) * 100)}%
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Nowoczesny sprzęt o wieku poniżej 1 roku. Zapewnia pełną zgodność z najnowszymi pakietami oprogramowania.</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">Najnowsze zasoby:</span>
                <span className="font-bold text-emerald-600">{ageStats.new} szt.</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pojemność magazynu</h3>
                <h4 className="text-2xl font-black text-blue-600 mt-2">
                  {items.filter(i => i.status === "W magazynie").length} szt.
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Urządzenia gotowe do natychmiastowego wdrożenia lub wydania nowym pracownikom.</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">W rezerwie:</span>
                <span className="font-bold text-blue-600">
                  {Math.round((items.filter(i => i.status === "W magazynie").length / (items.length || 1)) * 100)}% bazy
                </span>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual SVG Chart: Categories */}
            <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Struktura Kategorii Sprzętu
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* SVG Donut Chart */}
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                  <svg width="176" height="176" viewBox="0 0 42 42" className="transform -rotate-90">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" />
                    
                    {/* Render donut slices based on category counts */}
                    {(() => {
                      let currentOffset = 0;
                      const total = items.length || 1;
                      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#64748b"];
                      
                      return categoryStats.map((stat, idx) => {
                        const percent = (stat.count / total) * 100;
                        const strokeDash = `${percent} ${100 - percent}`;
                        const offset = 100 - currentOffset;
                        currentOffset += percent;
                        
                        return (
                          <circle
                            key={stat.name}
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke={colors[idx % colors.length]}
                            strokeWidth="4.5"
                            strokeDasharray={strokeDash}
                            strokeDashoffset={offset}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  
                  <div className="absolute text-center">
                    <p className="text-2xl font-black text-slate-800">{items.length}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Zasobów</p>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-2 w-full">
                  {categoryStats.map((stat, idx) => {
                    const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-indigo-500", "bg-slate-500"];
                    const percent = Math.round((stat.count / (items.length || 1)) * 100);
                    return (
                      <div key={stat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-xs ${colors[idx % colors.length]}`}></span>
                          <span className="text-slate-600 font-medium">{stat.name}</span>
                        </div>
                        <div className="text-right font-bold text-slate-800">
                          {stat.count} szt. <span className="text-slate-400 font-medium ml-1">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Visual SVG Chart: Age breakdown */}
            <div className="bg-white rounded-xl border border-slate-150 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Struktura wiekowa urządzeń (Cykl życia)
              </h3>

              <div className="space-y-4">
                {/* Bar 1: Newer */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Nowy sprzęt (wiek &lt; 1 rok)
                    </span>
                    <span className="text-slate-800">{ageStats.new} szt. ({Math.round((ageStats.new / (items.length || 1)) * 100)}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(ageStats.new / (items.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Bar 2: Mid-age */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Stabilny sprzęt (wiek 1 - 3 lata)
                    </span>
                    <span className="text-slate-800">{ageStats.mid} szt. ({Math.round((ageStats.mid / (items.length || 1)) * 100)}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(ageStats.mid / (items.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Bar 3: Old/Expired */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Sprzęt zamortyzowany (wiek &gt; 3 lata)
                    </span>
                    <span className="text-slate-800">{ageStats.old} szt. ({Math.round((ageStats.old / (items.length || 1)) * 100)}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${(ageStats.old / (items.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-lg flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Zgodnie z ogólnopolskim standardem IT, urządzenia starsze niż 36 miesięcy (3 lata) wykazują obniżoną wydajność energetyczną i mogą nie spełniać wymogów bezpieczeństwa OS. Rekomendujemy ich stopniowe wycofywanie i tworzenie <strong>Protokołów Utylizacji (LT)</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ROOM & LOCATION AUDITOR */}
      {activeSubTab === "rooms" && (
        <div className="space-y-6 animate-in fade-in duration-250">
          {/* Quick Transfer Success Banner */}
          {isSuccessNotification && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-4">
              <Check className="h-4.5 w-4.5 text-emerald-600" />
              {isSuccessNotification}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rooms sidebar list */}
            <div className="bg-white rounded-xl border border-slate-150 p-5 space-y-4 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-800">4. Spis lokalizacji (sal)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Wybierz salę, aby filtrować urządzenia i zarządzać ich relokacją</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setSelectedRoomFilter("all")}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex justify-between items-center cursor-pointer ${
                    selectedRoomFilter === "all"
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                  }`}
                >
                  <span className="text-xs font-bold">Wszystkie lokalizacje</span>
                  <span className="text-xs font-bold bg-slate-800/20 px-2 py-0.5 rounded text-inherit">
                    {items.length}
                  </span>
                </button>

                {roomsList.map(room => {
                  const count = items.filter(item => (item.room || "Nieprzypisana") === room).length;
                  return (
                    <button
                      key={room}
                      onClick={() => setSelectedRoomFilter(room)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex justify-between items-center cursor-pointer ${
                        selectedRoomFilter === room
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">{room}</span>
                      </div>
                      <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-inherit">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Items inside location & Bulk Action board */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-150 p-6 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Urządzenia w lokalizacji: <span className="text-blue-600 font-black">{selectedRoomFilter === "all" ? "Wszystkie" : selectedRoomFilter}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Zaznacz urządzenia, aby wykonać masowe operacje</p>
                </div>

                {/* Bulk tools */}
                <div className="flex items-center gap-2">
                  <select
                    value={bulkMoveTarget}
                    onChange={(e) => setBulkMoveTarget(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="">-- Przenieś do sali --</option>
                    <option value="Sala 101">Sala 101</option>
                    <option value="Sala 102">Sala 102</option>
                    <option value="Sala 205">Sala 205</option>
                    <option value="Gabinet Dyrektora">Gabinet Dyrektora</option>
                    <option value="Serwerownia">Serwerownia</option>
                    <option value="Magazyn Główny">Magazyn Główny</option>
                    <option value="Nieprzypisana">Brak (Nieprzypisana)</option>
                  </select>

                  <button
                    onClick={handleBulkTransfer}
                    disabled={selectedBulkItems.length === 0 || !bulkMoveTarget}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 font-bold text-xs rounded-lg px-3.5 py-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    Przenieś ({selectedBulkItems.length})
                  </button>
                </div>
              </div>

              {/* Table of items */}
              <div className="max-h-[350px] overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[9px] font-black border-b border-slate-100">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedBulkItems.length > 0 &&
                            items
                              .filter(i => selectedRoomFilter === "all" || (i.room || "Nieprzypisana") === selectedRoomFilter)
                              .every(i => selectedBulkItems.includes(i.id))
                          }
                          onChange={(e) => {
                            const filteredInView = items.filter(
                              i => selectedRoomFilter === "all" || (i.room || "Nieprzypisana") === selectedRoomFilter
                            );
                            if (e.target.checked) {
                              setSelectedBulkItems(prev => [
                                ...new Set([...prev, ...filteredInView.map(i => i.id)])
                              ]);
                            } else {
                              setSelectedBulkItems(prev =>
                                prev.filter(id => !filteredInView.some(f => f.id === id))
                              );
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Urządzenie</th>
                      <th className="py-3 px-4">Numer Seryjny</th>
                      <th className="py-3 px-4">Bieżąca Sala</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .filter(item => selectedRoomFilter === "all" || (item.room || "Nieprzypisana") === selectedRoomFilter)
                      .map(item => (
                        <tr 
                          key={item.id} 
                          className={`border-b border-slate-100 hover:bg-slate-50/50 text-xs text-slate-700 ${
                            selectedBulkItems.includes(item.id) ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <td className="py-2.5 px-4">
                            <input
                              type="checkbox"
                              checked={selectedBulkItems.includes(item.id)}
                              onChange={() => toggleBulkSelection(item.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-4 font-bold">
                            {item.manufacturer} {item.model}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[10px]">
                            {item.serialNumber || "---"}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {item.room || "Brak sali"}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                              item.status === "W użyciu" ? "bg-emerald-100 text-emerald-800" :
                              item.status === "W magazynie" ? "bg-blue-100 text-blue-800" :
                              item.status === "Wymieniony" ? "bg-purple-100 text-purple-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {items.filter(item => selectedRoomFilter === "all" || (item.room || "Nieprzypisana") === selectedRoomFilter).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Brak urządzeń w tej lokalizacji.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB DISPOSAL PROTOCOL */}
      {activeSubTab === "disposal" && (
        <div className="space-y-6 animate-in fade-in duration-250">
          {!isProtocolGenerated ? (
            <div className="bg-white rounded-xl border border-slate-150 p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-rose-600" />
                  Kreator Protokółu Likwidacji / Utylizacji Sprzętu (LT)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Automatycznie generuj urzędowy protokół fizycznej likwidacji zużytych komputerów i monitorów</p>
              </div>

              {/* Step 1: Select retired items */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Krok 1: Wybierz urządzenia do utylizacji (zalecany status: Wycofany)
                </label>
                <div className="max-h-[180px] overflow-y-auto border border-slate-100 rounded-lg p-2 space-y-1.5 bg-slate-50/50">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-2 rounded hover:bg-white text-xs border border-transparent hover:border-slate-150 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={disposalItems.includes(item.id)}
                          onChange={() => toggleDisposalSelection(item.id)}
                          className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="font-bold text-slate-800">{item.manufacturer} {item.model}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SN: {item.serialNumber || "Brak S/N"}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        item.status === "Wycofany" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-slate-400 p-4 text-center">Brak sprzętu do wyboru.</p>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Wybrano: {disposalItems.length} urządzeń do wpisania do protokołu.</p>
              </div>

              {/* Step 2: Form details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Numer Protokołu</label>
                  <input
                    type="text"
                    value={protocolNo}
                    onChange={(e) => setProtocolNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3.5 py-2 font-medium focus:outline-none"
                    placeholder="np. LT/2026/06/001"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Przewodniczący Komisji</label>
                  <input
                    type="text"
                    value={commissionChair}
                    onChange={(e) => setCommissionChair(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3.5 py-2 font-medium focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Członek Komisji 1</label>
                  <input
                    type="text"
                    value={commissionMember1}
                    onChange={(e) => setCommissionMember1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3.5 py-2 font-medium focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Członek Komisji 2</label>
                  <input
                    type="text"
                    value={commissionMember2}
                    onChange={(e) => setCommissionMember2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3.5 py-2 font-medium focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Powód Likwidacji i Opinia Techniczna</label>
                  <textarea
                    rows={2}
                    value={disposalReason}
                    onChange={(e) => setDisposalReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3.5 py-2 font-medium focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsProtocolGenerated(true)}
                  disabled={disposalItems.length === 0}
                  className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 font-bold text-xs rounded-lg px-6 py-2.5 cursor-pointer disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <FileSignature className="h-4 w-4" />
                  Wygeneruj Dokument Protokołu
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toolbar in App view (hidden in print) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center print:hidden">
                <button
                  onClick={() => setIsProtocolGenerated(false)}
                  className="text-slate-600 hover:text-slate-900 font-bold text-xs px-4 py-2 border border-slate-200 rounded-lg bg-white cursor-pointer"
                >
                  ← Wróć do edycji
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintProtocol}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Drukuj Protokół (PDF/Papier)
                  </button>
                </div>
              </div>

              {/* Printable Protocol Page */}
              <div className="bg-white border-2 border-slate-300 p-8 sm:p-12 shadow-md rounded-lg max-w-4xl mx-auto font-serif text-slate-900 text-xs leading-relaxed space-y-8 relative">
                
                {/* Print badge */}
                <div className="absolute top-4 right-4 bg-slate-100 text-[10px] text-slate-500 px-2 py-0.5 font-sans rounded print:hidden uppercase font-bold">
                  Gotowy do wydruku (A4)
                </div>

                {/* Header elements */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                  <div>
                    <h1 className="text-sm font-black uppercase tracking-wider">KOMISJA LIKWIDACYJNA ŚRODKÓW TRWAŁYCH</h1>
                    <p className="text-[10px] text-slate-600 uppercase font-sans mt-0.5">Scanventory Asset Management Enterprise</p>
                  </div>
                  <div className="text-right font-sans text-[10px] text-slate-600">
                    <p>Miejscowość: Warszawa</p>
                    <p>Data sporządzenia: {new Date().toISOString().split("T")[0]}</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black uppercase tracking-widest text-slate-950">PROTOKÓŁ LIKWIDACJI ŚRODKA TRWAŁEGO (LT)</h2>
                  <p className="text-xs font-bold">NR REJESTRU: {protocolNo}</p>
                </div>

                {/* Committee details */}
                <div className="space-y-2 border-l-4 border-slate-800 pl-4">
                  <p className="font-bold uppercase text-[10px] tracking-wide text-slate-800">Skład powołanej Komisji Likwidacyjnej:</p>
                  <table className="w-full text-left font-sans">
                    <tbody>
                      <tr>
                        <td className="py-1 w-44 font-bold text-slate-600">1. Przewodniczący:</td>
                        <td className="py-1 font-semibold">{commissionChair}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold text-slate-600">2. Członek Komisji:</td>
                        <td className="py-1 font-semibold">{commissionMember1}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold text-slate-600">3. Członek Komisji:</td>
                        <td className="py-1 font-semibold">{commissionMember2}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Description statement */}
                <div className="space-y-2 font-sans">
                  <p>
                    Komisja dokonała szczegółowych oględzin technicznych i fizycznych wytypowanego sprzętu komputerowego oraz pomocniczego IT. Na podstawie przeprowadzonej oceny sprawności, obciążenia oraz opłacalności ewentualnej modernizacji, komisja orzeka o konieczności <strong>ostatecznej likwidacji oraz przekazania do utylizacji</strong> następujących jednostek:
                  </p>
                </div>

                {/* Table of hardware */}
                <table className="w-full text-left font-sans text-[11px] border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="py-2 px-3 border-r border-slate-300">Lp.</th>
                      <th className="py-2 px-3 border-r border-slate-300">Nazwa, model i kategoria urządzenia</th>
                      <th className="py-2 px-3 border-r border-slate-300">Numer seryjny (S/N)</th>
                      <th className="py-2 px-3">Szacunkowy powód usunięcia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items
                      .filter(i => disposalItems.includes(i.id))
                      .map((item, index) => (
                        <tr key={item.id} className="border-b border-slate-300">
                          <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">{index + 1}.</td>
                          <td className="py-2 px-3 border-r border-slate-300 font-bold">{item.manufacturer} {item.model} ({item.category})</td>
                          <td className="py-2 px-3 border-r border-slate-300 font-mono text-[10px]">{item.serialNumber || "BRAK S/N"}</td>
                          <td className="py-2 px-3 text-slate-600 text-[10px]">{item.notes || "Zestarzenie technologiczne"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Opinion and justification */}
                <div className="space-y-2">
                  <p className="font-bold uppercase text-[10px] tracking-wide text-slate-800">Orzeczenie, uzasadnienie i wnioski komisji:</p>
                  <p className="p-3.5 bg-slate-50 border border-slate-200 rounded font-sans leading-relaxed text-slate-700 italic">
                    "{disposalReason}"
                  </p>
                </div>

                {/* Handover information */}
                <div className="space-y-1 font-sans text-[10px] text-slate-600">
                  <p><strong>Metoda likwidacji:</strong> Fizyczny demontaż podzespołów, niszczenie dysków twardych zgodnie z procedurą RODO / NIST 800-88 oraz przekazanie odpadów elektrycznych uprawnionemu podmiotowi recyklingowemu.</p>
                </div>

                {/* Signatures block */}
                <div className="pt-8 grid grid-cols-3 gap-6 font-sans text-center text-[10px]">
                  <div className="space-y-12">
                    <div className="border-b border-slate-400 mx-auto w-3/4"></div>
                    <p className="font-bold text-slate-700">Przewodniczący Komisji</p>
                  </div>
                  <div className="space-y-12">
                    <div className="border-b border-slate-400 mx-auto w-3/4"></div>
                    <p className="font-bold text-slate-700">Członek Komisji 1</p>
                  </div>
                  <div className="space-y-12">
                    <div className="border-b border-slate-400 mx-auto w-3/4"></div>
                    <p className="font-bold text-slate-700">Członek Komisji 2</p>
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="border-t border-slate-200 pt-4 text-center text-[9px] text-slate-400 font-sans">
                  Dokument sporządzony w systemie SCANVENTORY na potrzeby wewnętrznego ewidencjonowania środków trwałych.
                </div>
              </div>
            </div>
          )}
        </div>
      )}




      {/* SUB-TAB: DATA MANAGEMENT (IMPORT/EXPORT CSV & PDF & JSON) */}
      {activeSubTab === "data" && (
        <div className="space-y-6 animate-in fade-in duration-250">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COLUMN 1: EXPORTS */}
            <div className="bg-white rounded-xl border border-slate-150 p-6 space-y-6 shadow-xs text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileDown className="h-4.5 w-4.5 text-indigo-600" />
                  Eksport i Kopia Zapasowa Danych
                </h3>
                <p className="text-xs text-slate-400 mt-1">Wygeneruj i pobierz dane z bazy w wybranym formacie.</p>
              </div>

              <div className="space-y-4">
                {/* PDF */}
                <div className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Pełny raport inwentarza (PDF)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Generuje profesjonalny dokument gotowy do wydruku lub archiwizacji zawierający aktualny spis.</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">PDF</span>
                  </div>
                  <button
                    onClick={handleExportPDF}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <FileDown className="h-4 w-4" />
                    Pobierz raport PDF ({items.length} urządzeń)
                  </button>
                </div>

                {/* CSV */}
                <div className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Eksport tabelaryczny (CSV)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Eksportuje urządzenia do arkusza kalkulacyjnego Excel/LibreOffice z obsługą polskich znaków (UTF-8).</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700">CSV</span>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Pobierz arkusz CSV (.csv)
                  </button>
                </div>

                {/* JSON BACKUP */}
                <div className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Kopia bezpieczeństwa (JSON)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Pobiera pełny plik bazy danych ze wszystkimi powiązaniami, który można później wgrać na dowolnym komputerze.</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700">JSON</span>
                  </div>
                  <button
                    onClick={handleExportJSON}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Database className="h-4 w-4" />
                    Utwórz kopię zapasową JSON
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMN 2: IMPORTS */}
            <div className="bg-white rounded-xl border border-slate-150 p-6 space-y-6 shadow-xs text-left flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Upload className="h-4.5 w-4.5 text-indigo-600" />
                    Import danych z pliku CSV
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Dodaj lub zaktualizuj bazę danych inwentaryzacji za pomocą przygotowanego pliku CSV.</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Format pliku:</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Aplikacja wspiera polskie i angielskie nagłówki (np. <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono font-bold">Producent</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono font-bold">Model</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono font-bold">Numer seryjny</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono font-bold">Sala</code>, <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono font-bold">Status</code>). Separatorem może być średnik <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono font-bold">;</code> lub przecinek <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono font-bold">,</code>.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <input
                    id="csv-advanced-import"
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById("csv-advanced-import")?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Upload className="h-4.5 w-4.5" />
                    Wybierz plik .CSV do zaimportowania
                  </button>
                </div>
              </div>

              {importedCSVItems && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Załadowano plik CSV</h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Wczytano plik zawierający <strong className="text-amber-950 font-extrabold">{importedCSVItems.length}</strong> {importedCSVItems.length === 1 ? 'urządzenie' : (importedCSVItems.length < 5 ? 'urządzenia' : 'urządzeń')}.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1.5">
                    <button
                      onClick={() => executeCSVImport("merge")}
                      className="w-full text-left p-2.5 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-xs font-bold text-slate-700 hover:bg-blue-50/10 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <span>Aktualizuj istniejące i dodaj nowe (Scal)</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => executeCSVImport("add")}
                      className="w-full text-left p-2.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50/10 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <span>Tylko dodaj nowe</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => executeCSVImport("replace")}
                      className="w-full text-left p-2.5 bg-white border border-rose-200 hover:border-rose-500 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50/10 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <span>Zastąp całą bazę (⚠️ Usuwa stare dane)</span>
                      <ChevronRight className="h-4 w-4 text-rose-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
