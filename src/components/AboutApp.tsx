import React, { useState } from "react";
import { Info, User, FileText, Shield, CheckCircle, ExternalLink, AlertCircle, Terminal, HelpCircle } from "lucide-react";

export default function AboutApp() {
  const [activeSection, setActiveSection] = useState<"info" | "author" | "terms" | "license">("info");

  const sections = [
    { id: "info", label: "O Programie", icon: Info },
    { id: "author", label: "O Autorze", icon: User },
    { id: "terms", label: "Regulamin", icon: FileText },
    { id: "license", label: "Licencja", icon: Shield },
  ] as const;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Tab Header for About Section */}
      <div className="border-b border-slate-150 bg-slate-50/50 p-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Informacje o Systemie</h2>
            <p className="text-xs text-slate-500">Wersja aplikacji, dane autorskie, warunki użytkowania oraz licencjonowanie</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeSection === id
                    ? "bg-white text-blue-600 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* SECTION 1: O PROGRAMIE */}
        {activeSection === "info" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Inteligentny System Inwentaryzacji — SCANVENTORY (v1.2.0)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aplikacja <strong>SCANVENTORY</strong> została stworzona z myślą o maksymalnym uproszczeniu i przyspieszeniu procesu inwentaryzacji sprzętu IT oraz innych zasobów firmowych. Wykorzystuje zaawansowane technologie webowe i algorytmy sztucznej inteligencji, pozwalając na sprawną ewidencję bezpośrednio z urządzeń mobilnych oraz łatwe zarządzanie na stacjach roboczych.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Skanowanie i Odczyt OCR AI
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Szybkie wprowadzanie sprzętu przez robienie zdjęć naklejek znamionowych i inteligentne rozpoznawanie modeli, producentów i procesorów przez model Gemini.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Inwentaryzacja Rozproszona
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Możliwość jednoczesnej pracy wielu operatorów na smartfonach, a następnie bezproblemowe scalanie i aktualizacja danych za pomocą wbudowanego silnika importu CSV.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Kopie Zapasowe i Eksport
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Błyskawiczne generowanie dokumentacji inwentaryzacyjnej w profesjonalnym formacie PDF, eksport tabelaryczny do CSV oraz pełne zabezpieczenie bazy w postaci pliku JSON.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Wymiany i Powiązania
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Śledzenie historycznych powiązań między wycofywanymi urządzeniami a ich następcami, wspierając płynną rotację sprzętową w organizacji.
                    </p>
                  </div>
                </div>
              </div>

              {/* Side Tech Info */}
              <div className="w-full lg:w-72 p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-slate-600" />
                  Specyfikacja Techniczna
                </h4>
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-medium">Technologia</span>
                    <span className="text-slate-800 font-bold">React 18 + TS + Vite</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-medium">Baza danych</span>
                    <span className="text-slate-800 font-bold">LocalStorage (Szyfrowana)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-medium">Model AI</span>
                    <span className="text-slate-800 font-bold">Gemini-3.5-Flash</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-medium">Responsywność</span>
                    <span className="text-slate-800 font-bold">Tak (Mobile First)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Instalacja PWA</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">Kompatybilny</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA Section */}
            <div className="p-5 bg-blue-50/40 rounded-xl border border-blue-100 flex gap-4 items-start">
              <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600 shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-blue-900">Dlaczego nie widzę opcji „Zainstaluj jako aplikację PWA”?</h4>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Aplikacja posiada pełną konfigurację jako <strong>PWA (Progressive Web App)</strong> – w tym zaktualizowany plik manifestu oraz skrypt Service Worker (sw.js). Jeśli na Twoim komputerze lub tablecie nie pojawia się ikona instalacji (plus w pasku adresu przeglądarki), najczęstszą przyczyną są restrykcje środowiska:
                </p>
                <ul className="list-disc pl-4 text-[10px] text-blue-800 space-y-1 mt-1 leading-relaxed">
                  <li><strong>Połączenie nieszyfrowane (HTTP):</strong> Przeglądarki wymagają protokołu <strong>HTTPS</strong> do instalacji aplikacji PWA. Wyjątkiem jest adres <code>localhost</code> (używany lokalnie podczas programowania).</li>
                  <li><strong>Środowisko podglądu (iFrame):</strong> Aplikacje uruchomione w ramkach podglądu (np. w oknach testowych AI Studio) mają zablokowaną możliwość instalacji bezpośredniej przez przeglądarkę.</li>
                  <li><strong>Zabezpieczenia przeglądarki:</strong> Niektóre przeglądarki lub ich ustawienia prywatności (np. tryb Incognito) blokują rejestrację skryptów Service Worker.</li>
                </ul>
                <p className="text-[10px] text-blue-900 font-medium mt-1">
                  💡 <strong>Rozwiązanie:</strong> Skopiuj adres URL aplikacji i otwórz go w nowej, czystej karcie przeglądarki (poza ramką testową) z włączonym protokołem HTTPS. Wtedy w przeglądarkach Chrome, Edge, Safari lub Opera pojawi się opcja „Dodaj do ekranu głównego” lub ikona instalacji na pasku adresu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: AUTOR */}
        {activeSection === "author" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-3xl shrink-0 border border-blue-200">
                KJ
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-base font-bold text-slate-900">Krzysztof Jureczek</h3>
                <p className="text-xs text-slate-500 font-medium -mt-2">Projektant Oprogramowania & Specjalista ds. IT</p>
                
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jestem pasjonatem nowoczesnych narzędzi IT i usprawniania procesów administracyjnych. Program SCANVENTORY powstał z potrzeby stworzenia intuicyjnego, niezawodnego i uniwersalnego systemu ewidencji sprzętu, który eliminuje tradycyjne, papierowe arkusze i mozolne, ręczne przepisywanie danych.
                </p>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Rola w projekcie</span>
                    <span className="text-slate-800 font-semibold mt-0.5 block">Główny Autor i Koordynator ds. Standardu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: REGULAMIN */}
        {activeSection === "terms" && (
          <div className="space-y-4 text-slate-600 text-xs leading-relaxed animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Regulamin Użytkowania Systemu</h3>
            
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-2">
              <div>
                <h4 className="font-bold text-slate-800 mb-1">§1 Postanowienia ogólne</h4>
                <p>Niniejszy regulamin określa zasady korzystania z systemu SCANVENTORY, służącego do inwentaryzacji i ewidencjonowania zasobów sprzętowych.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">§2 Odpowiedzialność za dane i kopie zapasowe</h4>
                <p>
                  Dane inwentaryzacyjne są domyślnie zapisywane w lokalnej pamięci podręcznej przeglądarki użytkownika (LocalStorage). 
                  W przypadku wyczyszczenia pamięci podręcznej przeglądarki lub awarii systemu na danym urządzeniu, istnieje ryzyko utraty niezapisanych lokalnie zmian.
                  Użytkownik jest zobowiązany do systematycznego wykonywania kopii zapasowych poprzez pobranie danych za pomocą wbudowanej funkcji <strong>„Kopia zapasowa (JSON)”</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">§3 Praca wielourządzeniowa i scalanie</h4>
                <p>
                  System umożliwia jednoczesną inwentaryzację przy użyciu wielu niezależnych urządzeń (np. smartfonów). 
                  Do poprawnego scalenia danych na komputerze nadrzędnym zaleca się wyeksportowanie danych z telefonów w formacie CSV, 
                  a następnie wgranie ich za pomocą modułu „Importuj CSV” na stacji głównej z opcją <strong>„Aktualizuj istniejące i dodaj nowe”</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">§4 Ochrona prywatności i AI</h4>
                <p>
                  Funkcja automatycznego odczytu specyfikacji z naklejek (OCR) przetwarza jedynie przesyłane zdjęcia tabliczek znamionowych w celu ekstrakcji parametrów technicznych. 
                  Zdjęcia te nie są trwale archiwizowane ani wykorzystywane do celów marketingowych.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: LICENCJA */}
        {activeSection === "license" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Informacje Licencyjne</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Program <strong>SCANVENTORY</strong> jest rozpowszechniany na warunkach otwartej licencji <strong>MIT</strong>, umożliwiającej darmowe i elastyczne dostosowanie w strukturach firmowych i edukacyjnych.
            </p>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto select-all">
              <p className="font-bold text-white mb-2">MIT LICENSE</p>
              <p className="mb-2">Copyright (c) 2026 Krzysztof Jureczek</p>
              <p className="mb-2">
                Permission is hereby granted, free of charge, to any person obtaining a copy
                of this software and associated documentation files (the "Software"), to deal
                in the Software without restriction, including without limitation the rights
                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                copies of the Software, and to permit persons to whom the Software is
                furnished to do so, subject to the following conditions:
              </p>
              <p className="mb-2">
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </p>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                SOFTWARE.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
