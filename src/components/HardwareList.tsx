import { useState } from "react";
import { InventoryItem, HardwareCategory, HardwareStatus } from "../types";
import { Search, Filter, Trash2, Edit, FileDown, Laptop, Monitor, Server, HardDrive, Cpu, AlertCircle, HelpCircle } from "lucide-react";
import { generateInventoryPDF } from "../utils/pdfGenerator";

interface HardwareListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export default function HardwareList({ items, onEdit, onDelete }: HardwareListProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

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

    return matchesSearch && matchesCategory && matchesStatus;
  });

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

        {/* Action Button: Export PDF */}
        <button
          onClick={handleExportPDF}
          className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-sm"
        >
          <FileDown className="h-4.5 w-4.5" />
          Eksportuj PDF ({filteredItems.length})
        </button>
      </div>

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
    </div>
  );
}
