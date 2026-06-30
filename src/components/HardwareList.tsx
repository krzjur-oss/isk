import React, { useState } from "react";
import { InventoryItem, HardwareCategory, HardwareStatus } from "../types";
import { Search, Filter, Trash2, Edit, FileDown, FileSpreadsheet, Upload, Laptop, Monitor, Server, HardDrive, Cpu, AlertCircle, HelpCircle, AlertTriangle, Clock, Calendar } from "lucide-react";
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
  onImportItems?: (items: InventoryItem[]) => void;
}

export default function HardwareList({ items, onEdit, onDelete, onImportItems }: HardwareListProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [onlyOver3Years, setOnlyOver3Years] = useState(false);
  const [importedItems, setImportedItems] = useState<InventoryItem[] | null>(null);

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

  const handleExportPDF = () => {
    if (filteredItems.length === 0) {
      alert("Brak urządzeń do wygenerowania raportu.");
      return;
    }
    generateInventoryPDF(filteredItems);
  };

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      alert("Brak urządzeń do wygenerowania pliku CSV.");
      return;
    }

    // Header row (semicolon is standard for European/Polish Excel versions)
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

    const rows = filteredItems.map(item => [
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

    // Use BOM \uFEFF to preserve Polish characters in Excel
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
  };

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
        
        // Find property mappings from headers
        const colIndices: Record<number, keyof InventoryItem> = {};
        headers.forEach((h, index) => {
          const cleanHeader = h.replace(/^\uFEFF/, "").toLowerCase().trim();
          if (headerMapping[cleanHeader]) {
            colIndices[index] = headerMapping[cleanHeader];
          }
        });

        const parsedList: InventoryItem[] = [];

        // Parse data rows
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
          alert("Nie znaleziono prawidłowych urządzeń w pliku CSV. Upewnij się, że plik posiada kolumny 'Producent' i 'Model'.");
          return;
        }

        setImportedItems(parsedList);
      } catch (err) {
        console.error(err);
        alert("Błąd podczas przetwarzania pliku CSV. Upewnij się, że plik ma poprawny format.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const executeImport = (mode: "merge" | "add" | "replace") => {
    if (!importedItems || !onImportItems) return;

    let finalItems: InventoryItem[] = [];

    if (mode === "replace") {
      finalItems = importedItems.map((item, idx) => ({
        ...item,
        id: item.id || `device-${Date.now()}-${idx}`
      }));
    } else if (mode === "add") {
      finalItems = [...items];
      importedItems.forEach((item, idx) => {
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
      
      importedItems.forEach((item, idx) => {
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

    onImportItems(finalItems);
    setImportedItems(null);
    alert(`Pomyślnie zaimportowano urządzenia! Nowa liczba urządzeń w bazie: ${finalItems.length}`);
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

        {/* Action Buttons: Import/Export CSV & PDF */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => document.getElementById("csv-import-input")?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-sm"
            title="Importuj i scal dane z pliku CSV"
          >
            <Upload className="h-4.5 w-4.5" />
            Importuj CSV
          </button>
          <input
            id="csv-import-input"
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-sm"
            title="Eksportuj listę do pliku CSV (arkusz kalkulacyjny)"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            Eksportuj CSV
          </button>
          
          <button
            onClick={handleExportPDF}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-sm"
            title="Pobierz protokół PDF"
          >
            <FileDown className="h-4.5 w-4.5" />
            Eksportuj PDF ({filteredItems.length})
          </button>
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

      {/* Warning/Action modal for CSV imports */}
      {importedItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-150 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-full text-blue-600 shrink-0">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Importowanie danych z pliku CSV</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Wczytano plik CSV zawierający <strong className="text-slate-800">{importedItems.length}</strong> {importedItems.length === 1 ? 'urządzenie' : (importedItems.length < 5 ? 'urządzenia' : 'urządzeń')}. Wybierz sposób scalenia z obecnym inwentarzem ({items.length} urządzeń):
                </p>
              </div>
            </div>

            <div className="space-y-2.5 my-5">
              {/* Option 1: Merge and update */}
              <button
                type="button"
                onClick={() => executeImport("merge")}
                className="w-full text-left p-3 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg transition-all cursor-pointer group flex gap-3 items-start"
              >
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-blue-200">1</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Aktualizuj istniejące i dodaj nowe (Zalecane)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Aktualizuje istniejące urządzenia (znajduje po ID) oraz dodaje nowe wpisy. Pozwala to na scalenie inwentaryzacji przeprowadzonej na wielu telefonach.</p>
                </div>
              </button>

              {/* Option 2: Add only */}
              <button
                type="button"
                onClick={() => executeImport("add")}
                className="w-full text-left p-3 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-lg transition-all cursor-pointer group flex gap-3 items-start"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-emerald-200">2</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Tylko dodaj nowe</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Ignoruje wszelkie urządzenia o identyfikatorach ID już istniejących w bazie i importuje tylko nowe urządzenia.</p>
                </div>
              </button>

              {/* Option 3: Replace all */}
              <button
                type="button"
                onClick={() => executeImport("replace")}
                className="w-full text-left p-3 border border-slate-200 hover:border-rose-500 hover:bg-rose-50/20 rounded-lg transition-all cursor-pointer group flex gap-3 items-start"
              >
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-rose-200">3</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Zastąp całą ewidencję</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 text-rose-600 font-medium leading-relaxed">⚠️ Uwaga: Zastępuje cały obecny inwentarz zawartością z pliku CSV (wszystkie aktualne dane zostaną usunięte).</p>
                </div>
              </button>
            </div>
            
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setImportedItems(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
