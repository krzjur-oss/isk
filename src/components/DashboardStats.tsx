import { InventoryItem } from "../types";
import { Laptop, Cpu, RotateCw, CheckCircle, Database } from "lucide-react";

interface DashboardStatsProps {
  items: InventoryItem[];
}

export default function DashboardStats({ items }: DashboardStatsProps) {
  const totalCount = items.length;
  const inUseCount = items.filter(item => item.status === "W użyciu").length;
  const inStockCount = items.filter(item => item.status === "W magazynie").length;
  const replacedCount = items.filter(item => item.replacesItemId).length;

  const ocrItems = items.filter(item => item.confidence > 0);
  const avgConfidence = ocrItems.length > 0 
    ? Math.round(ocrItems.reduce((acc, item) => acc + item.confidence, 0) / ocrItems.length)
    : 0;

  const stats = [
    {
      id: "stat-total",
      label: "Wszystkie urządzenia",
      value: totalCount,
      icon: Database,
      color: "text-slate-600 bg-slate-50 border-slate-200",
      description: "Zarejestrowane w bazie danych"
    },
    {
      id: "stat-in-use",
      label: "W użyciu",
      value: inUseCount,
      icon: Laptop,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      description: "Aktywnie działające komputery"
    },
    {
      id: "stat-replacements",
      label: "Wymiany sprzętu",
      value: replacedCount,
      icon: RotateCw,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      description: "Powiązane pary urządzeń (nowe/stare)"
    },
    {
      id: "stat-ocr-conf",
      label: "Średnia dokładność OCR",
      value: totalCount > 0 ? `${avgConfidence}%` : "---",
      icon: Cpu,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      description: "Z automatycznego odczytu zdjęć"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            id={stat.id}
            key={stat.id}
            className={`p-4 bg-white rounded-xl border flex items-start gap-4 transition-all hover:shadow-sm`}
          >
            <div className={`p-2.5 rounded-lg border ${stat.color} shrink-0`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{stat.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
