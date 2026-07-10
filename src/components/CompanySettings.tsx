import React, { useState, useEffect } from "react";
import { Building2, MapPin, Hash, User, ShieldCheck, Printer, Check, Landmark, Tag } from "lucide-react";
import QRCode from "qrcode";

interface CompanySettingsData {
  companyName: string;
  department: string;
  address: string;
  taxId: string;
  contactPerson: string;
  inventoryPrefix: string;
}

const DEFAULT_SETTINGS: CompanySettingsData = {
  companyName: "Szkoła Podstawowa nr 5",
  department: "Pracownia Informatyczna",
  address: "ul. Szkolna 12, 00-001 Warszawa",
  taxId: "NIP: 123-456-78-90",
  contactPerson: "mgr Jan Kowalski (it@szkola.edu.pl)",
  inventoryPrefix: "SP5/IT/",
};

interface CompanySettingsProps {
  onSaveSuccess?: () => void;
}

export default function CompanySettings({ onSaveSuccess }: CompanySettingsProps) {
  const [settings, setSettings] = useState<CompanySettingsData>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [demoQrUrl, setDemoQrUrl] = useState("");

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem("scanventory_company_settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (err) {
        console.error("Błąd ładowania ustawień firmy:", err);
      }
    }
  }, []);

  // Update demo QR code preview
  useEffect(() => {
    const demoText = `${settings.companyName}\nDział: ${settings.department}\nID: DEV-2026\nS/N: DEMO-123456`;
    QRCode.toDataURL(demoText, {
      width: 150,
      margin: 1,
      color: {
        dark: "#1e293b",
        light: "#ffffff"
      }
    })
      .then(url => setDemoQrUrl(url))
      .catch(err => console.error("Error creating demo QR:", err));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("scanventory_company_settings", JSON.stringify(settings));
    setIsSaved(true);
    if (onSaveSuccess) {
      onSaveSuccess();
    }
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleResetToDefault = () => {
    if (confirm("Czy chcesz przywrócić domyślne przykładowe dane szkoły?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem("scanventory_company_settings", JSON.stringify(DEFAULT_SETTINGS));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-indigo-600 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Ustawienia Placówki / Firmy</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Wpisz dane swojej firmy, szkoły lub innej instytucji. Zdefiniowane tutaj informacje będą automatycznie drukowane jako nagłówek na naklejkach z kodami QR oraz uwzględniane w generowanych etykietach środków trwałych.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Przywróć wzorzec
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form panel - 7 columns */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wide flex items-center gap-2">
            <Landmark className="h-4.5 w-4.5 text-indigo-500" />
            Dane identyfikacyjne instytucji
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company / School Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Nazwa firmy / Szkoły / Instytucji
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="companyName"
                    value={settings.companyName}
                    onChange={handleChange}
                    placeholder="np. Szkoła Podstawowa nr 5"
                    required
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Department / Pracownia */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Dział / Pracownia / Lokalizacja
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="department"
                    value={settings.department}
                    onChange={handleChange}
                    placeholder="np. Pracownia Informatyczna"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Inventory ID prefix */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400" title="Używany przy opisywaniu lub drukowaniu">
                  Prefiks kodów inwentarzowych
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="inventoryPrefix"
                    value={settings.inventoryPrefix}
                    onChange={handleChange}
                    placeholder="np. SP5/IT/"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Adres / Siedziba
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    placeholder="np. ul. Szkolna 12, 00-001 Warszawa"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* NIP / REGON / RSPO */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Identyfikator (NIP / REGON / RSPO)
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="taxId"
                    value={settings.taxId}
                    onChange={handleChange}
                    placeholder="np. NIP: 123-456-78-90"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Osoba odpowiedzialna / Opiekun
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="contactPerson"
                    value={settings.contactPerson}
                    onChange={handleChange}
                    placeholder="np. mgr Jan Kowalski (it@szkola.edu.pl)"
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 mt-2 flex items-center justify-end gap-3">
              {isSaved && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1 animate-pulse">
                  <Check className="h-3.5 w-3.5" />
                  Ustawienia zapisane pomyślnie!
                </span>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Zapisz zmiany placówki
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview panel - 5 columns */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-md">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Printer className="h-3.5 w-3.5 text-blue-400" />
              Dynamiczny podgląd etykiety QR
            </h3>

            {/* Sticker Preview container */}
            <div className="bg-white border-2 border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center text-slate-700 select-none shadow-inner">
              {/* QR Image */}
              <div className="w-24 h-24 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                {demoQrUrl ? (
                  <img src={demoQrUrl} alt="Demo QR Code" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-300">QR</span>
                )}
              </div>

              {/* Label metadata */}
              <div className="flex-1 text-[10px] text-slate-500 space-y-1 w-full text-left">
                <div className="font-extrabold text-[11px] text-slate-900 border-b border-slate-150 pb-1 flex items-center justify-between">
                  <span className="uppercase truncate max-w-[130px]" title={settings.companyName}>
                    {settings.companyName || "SKANWENTARZ IT"}
                  </span>
                  <span className="text-[8px] bg-indigo-50 text-indigo-600 font-mono px-1 rounded font-extrabold uppercase shrink-0">
                    KOD QR
                  </span>
                </div>
                {settings.department && (
                  <div>
                    <span className="font-bold text-slate-400">Jednostka: </span>
                    <span className="text-slate-800 font-semibold">{settings.department}</span>
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-400">Sprzęt: </span>
                  <span className="text-slate-800 font-semibold">Komputer HP ProBook</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400">S/N: </span>
                  <span className="font-mono text-[9px] bg-slate-100 px-1 rounded text-slate-600">MXL432109X</span>
                </div>
                {settings.inventoryPrefix && (
                  <div>
                    <span className="font-bold text-slate-400">Inwentarz: </span>
                    <span className="font-semibold text-indigo-700">{settings.inventoryPrefix}device-1721</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed mt-4">
              Zauważ, że nazwa placówki (<strong>{settings.companyName || "brak"}</strong>) oraz opcjonalny prefiks inwentaryzacji (<strong>{settings.inventoryPrefix || "brak"}</strong>) zastąpiły standardowe oznaczenia. Od teraz każda drukowana etykieta będzie dostosowana do Twoich potrzeb!
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-500 text-xs space-y-2.5">
            <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Dlaczego warto wypełnić?</h4>
            <ul className="space-y-1 text-[11px] list-disc list-inside">
              <li>Ułatwia identyfikację własnościową przy audytach i kontrolach</li>
              <li>Pracownicy i uczniowie od razu widzą, do kogo należy sprzęt</li>
              <li>Własny prefiks (np. <span className="font-mono bg-slate-200 px-0.5 rounded">LO1/INF/</span>) przyspiesza wyszukiwanie po kodach kreskowych</li>
              <li>Wszystkie dane pozostają wyłącznie w pamięci Twojej przeglądarki!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
