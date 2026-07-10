import React, { useState } from "react";
import { Shield, Lock, Eye, Key, Check, Camera, Database, HelpCircle, FileText } from "lucide-react";

interface ConsentModalProps {
  onAccept: () => void;
}

export default function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checkedStorage, setCheckedStorage] = useState(true);
  const [checkedAi, setCheckedAi] = useState(true);
  const [checkedCamera, setCheckedCamera] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      setHasScrolled(true);
    }
  };

  const isAcceptEnabled = checkedStorage && checkedAi && checkedCamera;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 text-white flex items-center gap-3 border-b border-indigo-900">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Shield className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Polityka Bezpieczeństwa i Zgoda Użytkownika</h2>
            <p className="text-[11px] text-indigo-200">Zanim rozpoczniesz korzystanie z programu SCANVENTORY</p>
          </div>
        </div>

        {/* Modal Content / Terms */}
        <div 
          className="p-6 max-h-[380px] overflow-y-auto space-y-4 border-b border-slate-100 bg-slate-50/50"
          onScroll={handleScroll}
        >
          <div className="space-y-2 text-slate-600 text-xs leading-relaxed">
            <p className="font-semibold text-slate-800 text-[13px]">
              Szanowny Użytkowniku,
            </p>
            <p>
              Program <strong>SCANVENTORY</strong> został zaprojektowany z myślą o pełnej prywatności i maksymalnym bezpieczeństwie Twoich danych. Przed pierwszym uruchomieniem prosimy o zapoznanie się z poniższymi zasadami przetwarzania danych:
            </p>
          </div>

          {/* Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2.5 items-start">
              <Database className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">100% Dane Lokalne (Offline-First)</h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Wszystkie wprowadzane dane o sprzęcie komputerowym (modele, numery seryjne, sale) są zapisywane <strong>wyłącznie w pamięci Twojej przeglądarki (LocalStorage)</strong>. Nigdy nie są one wysyłane na nasze serwery ani gromadzone w chmurze bez Twojej wyraźnej wiedzy (np. manualny eksport do pliku).
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2.5 items-start">
              <Key className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Bezpieczeństwo Klucza API</h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Jeżeli zdecydujesz się na bezpłatny „Tryb Bezpośredni (Client-Side)” i podasz własny klucz <strong>Gemini API</strong>, klucz ten zostanie zapisany bezpiecznie i lokalnie w Twojej przeglądarce. Zapytania OCR AI są wysyłane <strong>bezpośrednio do oficjalnych serwerów Google</strong>. Nie ma żadnego serwera pośredniczącego, który mógłby przechwycić Twój klucz lub przesyłane zdjęcia.
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2.5 items-start">
              <Camera className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Dostęp do Kamery i Zdjęcia</h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Aplikacja wymaga dostępu do aparatu/kamery urządzenia wyłącznie w celu wykonania zdjęcia naklejki znamionowej lub zeskanowania kodu QR. Strumień wideo z kamery jest przetwarzany lokalnie w Twoim urządzeniu. Zdjęcie wysyłane jest do Google Gemini API w celu odczytu OCR tylko po kliknięciu przycisku skanowania.
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2.5 items-start">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Brak Śledzenia i Reklam</h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Aplikacja nie posiada skryptów śledzących, analitycznych ani telemetrycznych stron trzecich. Cenimy Twoją prywatność – Twoja praca z inwentarzem pozostaje całkowicie Twoją sprawą.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px] leading-relaxed flex gap-2">
            <Eye className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Ważna informacja o Gemini API:</strong> Usługi Google AI przetwarzają przesyłane zdjęcia zgodnie z Regulaminem Google AI Studio. Korzystając z darmowych kluczy Google AI, Twoje dane mogą podlegać standardowym procedurom optymalizacyjnym określonym w polityce prywatności Google dla programistów. Nigdy nie skanuj dokumentów zawierających poufne dane osobowe (np. dowody osobiste, hasła).
            </div>
          </div>
        </div>

        {/* User Acknowledgements Checkboxes */}
        <div className="p-6 bg-slate-50 border-b border-slate-150 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={checkedStorage}
              onChange={(e) => setCheckedStorage(e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900 select-none">
              Rozumiem, że moje dane inwentaryzacyjne są przechowywane lokalnie w pamięci mojej przeglądarki (<span className="font-mono">LocalStorage</span>) i wyczyszczenie pamięci podręcznej przeglądarki usunie dane. Będę regularnie pobierać kopie zapasowe JSON/CSV.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={checkedAi}
              onChange={(e) => setCheckedAi(e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900 select-none">
              Akceptuję warunki korzystania ze Skanera OCR AI i rozumiem, że podając mój klucz Gemini API, dane ze zdjęć naklejek będą przesyłane bezpośrednio do serwerów Google w celu odczytu parametrów.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={checkedCamera}
              onChange={(e) => setCheckedCamera(e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900 select-none">
              Wyrażam zgodę na tymczasowe użycie aparatu/kamery urządzenia w celu wykonywania zdjęć tabliczek znamionowych i skanowania kodów QR.
            </span>
          </label>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-[10px] text-slate-400 font-medium">
            Wymagane zaznaczenie wszystkich zgód do uruchomienia aplikacji.
          </span>
          <button
            type="button"
            disabled={!isAcceptEnabled}
            onClick={onAccept}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              isAcceptEnabled
                ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
          >
            <Check className="h-4 w-4" />
            Akceptuję i przechodzę do programu
          </button>
        </div>

      </div>
    </div>
  );
}
