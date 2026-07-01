import React, { useState, useEffect } from "react";
import { InventoryItem, HardwareCategory, HardwareStatus } from "../types";
import { Search, Filter, Trash2, Edit, FileDown, FileSpreadsheet, Upload, Laptop, Monitor, Server, HardDrive, Cpu, AlertCircle, HelpCircle, AlertTriangle, Clock, Calendar, Database, QrCode, Printer, Download, Copy, Check, X } from "lucide-react";
import { generateInventoryPDF } from "../utils/pdfGenerator";
import QRCode from "qrcode";

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

// Helper function to calculate usage duration from purchase date to today
const calculateUsageYears = (purchaseDateStr: string | undefined): { years: number; text: string; isOver3Years: boolean } | null => {
  if (!purchaseDateStr) return null;
  const purchaseDate = new Date(purchaseDateStr);
  if (isNaN(purchaseDate.getTime())) return null;
  
  const today = new Date();
  const diffTime = today.getTime() - purchaseDate.getTime();
  if (diffTime < 0) return { years: 0, text: "0 dni", isOver3Years: false };
  
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  
  let text = "";
  if (years >= 1) {
    const fullYears = Math.floor(years);
    const months = Math.floor((years - fullYears) * 12);
    if (months > 0) {
      text = `${fullYears} ${fullYears === 1 ? 'rok' : (fullYears < 5 ? 'lata' : 'lat')} i ${months} ${months === 1 ? 'miesiąc' : (months < 5 ? 'miesiące' : 'miesięcy')}`;
    } else {
      text = `${fullYears} ${fullYears === 1 ? 'rok' : (fullYears < 5 ? 'lata' : 'lat')}`;
    }
  } else {
    const months = Math.floor(diffDays / 30.44);
    if (months >= 1) {
      text = `${months} ${months === 1 ? 'miesiąc' : (months < 5 ? 'miesiące' : 'miesięcy')}`;
    } else {
      text = `${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'}`;
    }
  }
  
  return {
    years,
    text,
    isOver3Years: years >= 3
  };
};

interface HardwareListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export default function HardwareList({ items, onEdit, onDelete }: HardwareListProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [onlyOver3Years, setOnlyOver3Years] = useState(false);

  // QR Code states
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrContentType, setQrContentType] = useState<"standard" | "sn" | "id">("standard");
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    if (!qrItem) {
      setQrCodeUrl("");
      return;
    }
    
    let text = "";
    if (qrContentType === "standard") {
      text = `SKANWENTARZ IT\nID: ${qrItem.id}\nSprzęt: ${qrItem.manufacturer} ${qrItem.model}\nS/N: ${qrItem.serialNumber || 'brak'}\nKategoria: ${qrItem.category}\nSala: ${qrItem.room || 'brak'}`;
    } else if (qrContentType === "sn") {
      text = qrItem.serialNumber || qrItem.id;
    } else if (qrContentType === "id") {
      text = qrItem.id;
    }
    
    QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1e293b", // Slate 800
        light: "#ffffff"
      }
    })
    .then(url => {
      setQrCodeUrl(url);
    })
    .catch(err => {
      console.error("Błąd generowania kodu QR:", err);
    });
  }, [qrItem, qrContentType]);

  const handleCopyText = () => {
    if (!qrItem) return;
    let text = "";
    if (qrContentType === "standard") {
      text = `SKANWENTARZ IT\nID: ${qrItem.id}\nSprzęt: ${qrItem.manufacturer} ${qrItem.model}\nS/N: ${qrItem.serialNumber || 'brak'}\nKategoria: ${qrItem.category}\nSala: ${qrItem.room || 'brak'}`;
    } else if (qrContentType === "sn") {
      text = qrItem.serialNumber || qrItem.id;
    } else if (qrContentType === "id") {
      text = qrItem.id;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      })
      .catch(err => {
        console.error("Błąd kopiowania:", err);
      });
  };

  const handleDownloadQr = () => {
    if (!qrItem || !qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qr_${qrItem.manufacturer.toLowerCase()}_${qrItem.model.toLowerCase()}_${qrItem.serialNumber || qrItem.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLabel = () => {
    if (!qrItem || !qrCodeUrl) return;
    
    const printWindow = window.open("", "_blank", "width=600,height=400");
    if (!printWindow) {
      alert("Wyskakujące okno zostało zablokowane! Zezwól na wyskakujące okna dla tej witryny.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Drukuj Etykietę - ${qrItem.manufacturer} ${qrItem.model}</title>
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 15px;
              background-color: white;
              color: #1e293b;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              box-sizing: border-box;
            }
            .label-container {
              border: 2px solid #e2e8f0;
              padding: 15px;
              border-radius: 8px;
              width: 380px;
              background: white;
              display: flex;
              gap: 15px;
              align-items: center;
              box-sizing: border-box;
            }
            .qr-img {
              width: 120px;
              height: 120px;
              display: block;
            }
            .details {
              display: flex;
              flex-direction: column;
              gap: 4px;
              font-size: 11px;
              line-height: 1.3;
              overflow: hidden;
            }
            .title {
              font-weight: bold;
              font-size: 13px;
              color: #0f172a;
              margin-bottom: 2px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 3px;
            }
            .bold {
              font-weight: bold;
              color: #334155;
            }
            .tag {
              background-color: #f1f5f9;
              padding: 1px 4px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 10px;
            }
            .footer {
              font-size: 8px;
              color: #94a3b8;
              margin-top: 5px;
              font-family: monospace;
            }
            @media print {
              body {
                padding: 0;
              }
              .label-container {
                border: none;
                width: 100%;
                max-width: 100%;
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div>
              <img class="qr-img" src="${qrCodeUrl}" />
            </div>
            <div class="details">
              <div class="title">SKANWENTARZ IT</div>
              <div><span class="bold">Sprzęt:</span> ${qrItem.manufacturer} ${qrItem.model}</div>
              <div><span class="bold">S/N:</span> <span class="tag">${qrItem.serialNumber || 'brak'}</span></div>
              <div><span class="bold">Kategoria:</span> ${qrItem.category}</div>
              <div><span class="bold">Sala:</span> ${qrItem.room || 'brak'}</div>
              <div class="footer">ID: ${qrItem.id}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter items based on criteria
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      item.model.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.processor.toLowerCase().includes(search.toLowerCase()) ||
      item.notes.toLowerCase().includes(search.toLowerCase()) ||
      (item.room && item.room.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;

    let matchesOver3Years = true;
    if (onlyOver3Years) {
      const usage = calculateUsageYears(item.purchaseDate);
      matchesOver3Years = item.status === "W użyciu" && (usage?.isOver3Years ?? false);
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesOver3Years;
  });

  const over3YearsItemsCount = items.filter(item => {
    if (item.status !== "W użyciu") return false;
    const usage = calculateUsageYears(item.purchaseDate);
    return usage?.isOver3Years ?? false;
  }).length;

  const getCategoryIcon = (category: HardwareCategory) => {
    switch (category) {
      case "Laptop":
        return Laptop;
      case "Monitor":
        return Monitor;
      case "Serwer":
        return Server;
      case "Komputer Stacjonarny":
        return HardDrive;
      default:
        return HelpCircle;
    }
  };

  const getStatusBadgeStyles = (status: HardwareStatus) => {
    switch (status) {
      case "W użyciu":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "W magazynie":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "Wymieniony":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "Wycofany":
        return "bg-slate-50 border-slate-200 text-slate-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-600";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Search & Filters Bar */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Wyszukaj sprzęt (model, producent, S/N...)"
              className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-800 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 transition-colors"
            />
          </div>

          {/* Category filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-slate-700 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="All">Wszystkie kategorie</option>
              <option value="Laptop">Laptop</option>
              <option value="Komputer Stacjonarny">Stacjonarny</option>
              <option value="Serwer">Serwer</option>
              <option value="Monitor">Monitor</option>
              <option value="Inny">Inny</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-slate-700 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="All">Wszystkie statusy</option>
              <option value="W użyciu">W użyciu</option>
              <option value="W magazynie">W magazynie</option>
              <option value="Wymieniony">Wymieniony</option>
              <option value="Wycofany">Wycofany</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Warning banner for devices > 3 years in use */}
      {over3YearsItemsCount > 0 && (
        <div className="mx-4 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-bold text-amber-900">Zasoby powyżej 3 lat w użyciu</p>
              <p className="text-amber-700/90 mt-0.5">Wykryto <strong className="text-amber-950 font-extrabold">{over3YearsItemsCount}</strong> {over3YearsItemsCount === 1 ? 'urządzenie' : (over3YearsItemsCount < 5 ? 'urządzenia' : 'urządzeń')} o statusie "W użyciu" użytkowane dłużej niż 3 lata. Zalecamy audyt techniczny lub zaplanowanie wymiany.</p>
            </div>
          </div>
          <button
            onClick={() => setOnlyOver3Years(!onlyOver3Years)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              onlyOver3Years 
                ? "bg-amber-600 text-white hover:bg-amber-700 shadow-xs" 
                : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200"
            }`}
          >
            {onlyOver3Years ? "Pokaż wszystkie urządzenia" : "Filtruj stary sprzęt"}
          </button>
        </div>
      )}

      {/* Main List Table */}
      <div className="overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white">
            <Search className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Brak pasujących urządzeń</p>
            <p className="text-xs text-slate-400 mt-1">Dostosuj kryteria wyszukiwania lub dodaj nowy sprzęt.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4 w-12">Podgląd</th>
                <th className="py-3.5 px-4">Urządzenie</th>
                <th className="py-3.5 px-4">Numer seryjny (S/N)</th>
                <th className="py-3.5 px-4">Specyfikacja</th>
                <th className="py-3.5 px-4">Relacja wymiany</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right w-24">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {filteredItems.map((item) => {
                const IconComponent = getCategoryIcon(item.category);
                
                // Get name of replaced/replacing device
                let relationText = "";
                if (item.replacesItemId) {
                  const oldItem = items.find(i => i.id === item.replacesItemId);
                  relationText = oldItem 
                    ? `Zastępuje: ${oldItem.manufacturer} ${oldItem.model}` 
                    : "Zastępuje starsze urządzenie";
                } else if (item.replacedByItemId) {
                  const newItem = items.find(i => i.id === item.replacedByItemId);
                  relationText = newItem 
                    ? `Wymieniony na: ${newItem.manufacturer} ${newItem.model}` 
                    : "Wymieniony na nowszy";
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Thumbnail / Icon column */}
                    <td className="py-3 px-4">
                      {item.photoUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-150 shadow-xs shrink-0 bg-slate-100">
                          <img 
                            src={item.photoUrl} 
                            alt={`${item.manufacturer} ${item.model}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      )}
                    </td>

                    {/* Hardware Info column */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {item.manufacturer} {item.model}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 uppercase">
                          {item.category}
                        </span>
                        {item.room && (
                          <span className="font-medium bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] text-blue-700">
                            Sala: {item.room}
                          </span>
                        )}
                        {item.operatingSystem && (
                          <span className="text-[11px] truncate max-w-[120px]" title={item.operatingSystem}>
                            {item.operatingSystem}
                          </span>
                        )}
                        {item.purchaseDate && (() => {
                          const usage = calculateUsageYears(item.purchaseDate);
                          if (!usage) return null;
                          const isWarning = item.status === "W użyciu" && usage.isOver3Years;
                          return (
                            <span 
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                isWarning 
                                  ? "bg-amber-50 border-amber-200 text-amber-800 font-bold" 
                                  : "bg-slate-50 border-slate-150 text-slate-600"
                              }`}
                              title={`Data zakupu: ${item.purchaseDate}`}
                            >
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              {isWarning ? "⚠️ Wiek: " : "Wiek: "}{usage.text}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Serial number column */}
                    <td className="py-3 px-4">
                      {item.serialNumber ? (
                        <span className="font-mono text-xs bg-slate-100/70 border border-slate-200 px-2 py-1 rounded text-slate-700">
                          {item.serialNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">brak</span>
                      )}
                      {item.confidence < 100 && item.confidence > 0 && (
                        <div className="text-[10px] text-amber-500 font-medium mt-1">
                          Dokładność OCR: {item.confidence}%
                        </div>
                      )}
                    </td>

                    {/* Spec details column */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-xs text-slate-500">
                        {item.processor && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Cpu className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{item.processor}</span>
                          </div>
                        )}
                        {(item.ram || item.storage) && (
                          <div className="font-mono text-[10px] text-slate-400 pl-4">
                            {item.ram || "---"} RAM / {item.storage || "---"} Dysk
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Replacement relationship column */}
                    <td className="py-3 px-4">
                      {relationText ? (
                        <div className="text-xs">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                            item.replacesItemId 
                              ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
                              : "bg-amber-50 border-amber-150 text-amber-800"
                          }`}>
                            {relationText}
                          </span>
                          {item.replacementDate && (
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">Dnia: {item.replacementDate}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>

                    {/* Status column */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeStyles(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions column */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setQrItem(item); setQrContentType("standard"); }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-colors cursor-pointer"
                          title="Etykieta i Kod QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Edytuj sprzęt"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Usuń sprzęt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* QR Code and Asset Label Modal */}
      {qrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 relative">
            
            {/* Close button */}
            <button
              onClick={() => setQrItem(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Etykieta i Kod QR Zasobu</h3>
                <p className="text-xs text-slate-500">Generuj unikalny kod do szybkiego skanowania w biurze/szkole</p>
              </div>
            </div>

            {/* Selector for QR Code Content */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Treść kodu QR</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setQrContentType("standard")}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    qrContentType === "standard"
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Pełna specyfikacja
                </button>
                <button
                  onClick={() => setQrContentType("sn")}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    qrContentType === "sn"
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Tylko S/N
                </button>
                <button
                  onClick={() => setQrContentType("id")}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    qrContentType === "id"
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Tylko ID zasobu
                </button>
              </div>
            </div>

            {/* Asset Label Card (Printable Layout Preview) */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 mb-5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Podgląd etykiety środka trwałego</label>
              
              <div id="asset-label-preview" className="bg-white border-2 border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-center shadow-sm select-none">
                {/* QR Code Container */}
                <div className="w-32 h-32 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-300">Generowanie...</span>
                  )}
                </div>

                {/* Detail Section */}
                <div className="flex-1 text-xs text-slate-600 space-y-1.5 w-full">
                  <div className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
                    <span>SKANWENTARZ IT</span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1 rounded uppercase">Etykieta</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Sprzęt: </span>
                    <span className="text-slate-800 font-semibold">{qrItem.manufacturer} {qrItem.model}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">S/N: </span>
                    <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-semibold">{qrItem.serialNumber || "brak"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Kategoria: </span>
                    <span className="text-slate-700 font-medium">{qrItem.category}</span>
                  </div>
                  {qrItem.room && (
                    <div>
                      <span className="font-bold text-slate-500">Sala: </span>
                      <span className="text-blue-700 font-semibold">{qrItem.room}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    ID: {qrItem.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={handleCopyText}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedText ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copiedText ? "Skopiowano!" : "Kopiuj tekst kodu"}
              </button>
              
              <button
                onClick={handleDownloadQr}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Pobierz PNG
              </button>

              <button
                onClick={handlePrintLabel}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Drukuj etykietę
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
