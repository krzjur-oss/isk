import React, { useState, useEffect } from "react";
import { Info, User, FileText, Shield, CheckCircle, ExternalLink, AlertCircle, Terminal, HelpCircle, BookOpen, PlusCircle, Camera, FileDown, Sparkles, ArrowRight, CheckSquare, Square, History, Clock } from "lucide-react";

export default function AboutApp() {
  const [activeSection, setActiveSection] = useState<"info" | "guide" | "changelog" | "author" | "terms" | "license">("info");
  const [buildInfo, setBuildInfo] = useState<{ version: string; lastModified: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    step1: false,
    step2: false,
    step3: false,
  });
  const [ocrCallsCount, setOcrCallsCount] = useState(0);

  useEffect(() => {
    // Load checklist from localStorage for interactive onboarding feel
    try {
      const saved = localStorage.getItem("onboarding_guide_steps");
      if (saved) {
        setCompletedSteps(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }

    // Load OCR calls count
    try {
      const stored = localStorage.getItem("scanventory_gemini_ocr_calls");
      if (stored) {
        setOcrCallsCount(parseInt(stored, 10));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleResetOcrCounter = () => {
    if (confirm("Czy na pewno chcesz zresetować lokalny licznik operacji OCR?")) {
      try {
        localStorage.setItem("scanventory_gemini_ocr_calls", "0");
        setOcrCallsCount(0);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleStep = (stepId: string) => {
    const updated = { ...completedSteps, [stepId]: !completedSteps[stepId] };
    setCompletedSteps(updated);
    try {
      localStorage.setItem("onboarding_guide_steps", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetch("/api/build-info")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setBuildInfo(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Błąd podczas pobierania informacji o wersji:", err);
        setIsLoading(false);
      });
  }, []);

  const formatBuildDate = (isoString?: string) => {
    if (!isoString) return "brak danych";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const sections = [
    { id: "info", label: "O Programie", icon: Info },
    { id: "guide", label: "Przewodnik", icon: BookOpen },
    { id: "changelog", label: "Historia zmian", icon: History },
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
                  <h3 className="text-base font-bold text-slate-900 mb-1 flex flex-wrap items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Inteligentny System Inwentaryzacji — SCANVENTORY (v{buildInfo?.version || "1.2.0"})
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-150 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      Ostatnia kompilacja / edycja: {isLoading ? "pobieranie..." : formatBuildDate(buildInfo?.lastModified)}
                    </span>
                  </div>
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
                    <span className="text-slate-500 font-medium">Wersja systemu</span>
                    <span className="text-blue-600 font-bold">{buildInfo?.version || "1.2.0"}</span>
                  </div>
                  <div className="flex flex-col border-b border-slate-200 pb-1.5 gap-0.5">
                    <span className="text-slate-500 font-medium">Ostatnia edycja plików</span>
                    <span className="text-slate-800 font-bold text-[9px] truncate" title={formatBuildDate(buildInfo?.lastModified)}>
                      {isLoading ? "pobieranie..." : formatBuildDate(buildInfo?.lastModified)}
                    </span>
                  </div>
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

            {/* Gemini API Free Quota Tracker */}
            <div className="p-5 bg-indigo-50/30 rounded-xl border border-indigo-100/80 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-indigo-100/60 rounded-xl text-indigo-600 shrink-0 shadow-xs">
                  <Sparkles className="h-5.5 w-5.5 animate-pulse" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-bold text-slate-800">Monitor Darmowego Limitu Gemini API</h4>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                      AI Studio Free Tier
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Każdy darmowy klucz API wygenerowany w Google AI Studio posiada bezpłatny limit wynoszący <strong>1500 zapytań na dobę</strong> (oraz do 15 zapytań na minutę). Poniższy pasek postępu szacuje dzienne zużycie na podstawie udanych operacji OCR AI zarejestrowanych w tej przeglądarce.
                  </p>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Wykorzystany limit dobowy</span>
                  <span className={`${ocrCallsCount > 1200 ? "text-rose-600" : ocrCallsCount > 750 ? "text-amber-600" : "text-blue-600"}`}>
                    {ocrCallsCount} / 1500 ({Math.min(100, (ocrCallsCount / 1500) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      ocrCallsCount > 1200 
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" 
                        : ocrCallsCount > 750 
                          ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                          : "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                    }`}
                    style={{ width: `${Math.min(100, (ocrCallsCount / 1500) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold px-0.5">
                  <span>0 (Start)</span>
                  <span>750 (50%)</span>
                  <span>1500 (Darmowy limit dobowy)</span>
                </div>
              </div>

              {/* Mini Stats and Action Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-slate-150 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Wykonane skany AI:</span>
                  <span className="text-base font-extrabold text-slate-700 mt-0.5">{ocrCallsCount}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-150 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Szacunkowo pozostało:</span>
                  <span className="text-base font-extrabold text-slate-700 mt-0.5">{Math.max(0, 1500 - ocrCallsCount)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-150 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Akcja:</span>
                  <button
                    onClick={handleResetOcrCounter}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer text-left self-start mt-1.5 flex items-center gap-1 hover:underline"
                  >
                    Resetuj licznik ↺
                  </button>
                </div>
              </div>

              {/* Step-by-step Guide to Get Key */}
              <div className="bg-white/60 rounded-xl p-4 border border-indigo-100/50 space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs pb-1 border-b border-indigo-100/45">
                  <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>Szybki poradnik: Jak uzyskać bezpłatny klucz Gemini API?</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px] text-slate-600 leading-relaxed">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="flex items-center justify-center h-4.5 w-4.5 bg-indigo-150 text-indigo-700 rounded-full font-extrabold text-[9px] shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        Otwórz platformę deweloperską <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-bold">
                          Google AI Studio <ExternalLink className="h-3 w-3" />
                        </a> i zaloguj się swoim kontem Google.
                      </div>
                    </div>
                    
                    <div className="flex gap-2 items-start">
                      <span className="flex items-center justify-center h-4.5 w-4.5 bg-indigo-150 text-indigo-700 rounded-full font-extrabold text-[9px] shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        W lewym górnym rogu ekranu (lub na pasku bocznym) kliknij wyróżniony, niebieski przycisk <strong>„Get API key”</strong> (Pobierz klucz API).
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="flex items-center justify-center h-4.5 w-4.5 bg-indigo-150 text-indigo-700 rounded-full font-extrabold text-[9px] shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        Kliknij przycisk <strong>„Create API key”</strong>, zaakceptuj regulamin usługi darmowej i skopiuj nowo wygenerowany ciąg znaków klucza.
                      </div>
                    </div>
                    
                    <div className="flex gap-2 items-start">
                      <span className="flex items-center justify-center h-4.5 w-4.5 bg-indigo-150 text-indigo-700 rounded-full font-extrabold text-[9px] shrink-0 mt-0.5">
                        4
                      </span>
                      <div>
                        Wprowadź klucz w ustawieniach środowiskowych tej aplikacji jako zmienną <code>GEMINI_API_KEY</code> (sekcja <strong>Settings</strong> w panelu bocznym AI Studio Build).
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[9.5px] text-slate-400 leading-normal italic bg-white/45 p-2 rounded-md border border-slate-100">
                * Rzeczywisty darmowy limit odnawia się automatycznie w Google AI Studio. Licznik ma charakter wyłącznie orientacyjny dla celów testowych i weryfikacji liczby zapytań z bieżącej przeglądarki.
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

        {/* SECTION: PRZEWODNIK UŻYTKOWNIKA */}
        {activeSection === "guide" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-5 rounded-2xl border border-blue-150 flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-bold text-slate-900">Podręcznik wdrożeniowy dla nowego członka zespołu</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Witaj w zespole administratorów <strong>SCANVENTORY</strong>! Przeczytaj poniższy przewodnik krok po kroku, aby sprawnie poznać podstawowe funkcjonalności systemu i natychmiast rozpocząć inwentaryzację.
                </p>
              </div>
            </div>

            {/* Steps Container */}
            <div className="relative border-l border-slate-200 ml-4 pl-8 space-y-8 py-2">
              
              {/* Step 1 */}
              <div className="relative">
                {/* Number / Icon element on the timeline line */}
                <span className="absolute -left-[45px] top-0 flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-800 shadow-xs">
                  <PlusCircle className="h-4 w-4 text-blue-600" />
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-semibold">
                      Krok 1: Dodanie pierwszego sprzętu do bazy
                      {completedSteps.step1 && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-150">Wykonano</span>
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleStep("step1")}
                      className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {completedSteps.step1 ? <CheckSquare className="h-3.5 w-3.5 text-emerald-600" /> : <Square className="h-3.5 w-3.5" />}
                      {completedSteps.step1 ? "Oznacz jako niewykonane" : "Oznacz jako zrobione"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Każdy inwentarz zaczyna się od pierwszego rekordu. Aby dodać nowe urządzenie ręcznie, przejdź do głównego widoku <strong className="text-slate-800">„Zasoby i Ewidencja”</strong> i uzupełnij pola w sekcji wprowadzania danych:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs text-slate-600 space-y-1.5">
                    <p>• <strong>Wymagane parametry:</strong> Wpisz nazwę producenta, model, kategorię (np. laptop, monitor, serwer, przełącznik) oraz przypisz status (np. w użyciu, magazyn, uszkodzony).</p>
                    <p>• <strong>Identyfikacja zasobu:</strong> Podaj unikalny numer seryjny (S/N) urządzenia. System automatycznie sprawdzi, czy dany numer nie widnieje już w bazie, chroniąc przed duplikatami.</p>
                    <p>• <strong>Historia rotacji (Wymiany):</strong> Jeśli wprowadzany sprzęt bezpośrednio zastępuje starszy komputer (np. podczas modernizacji stanowiska), wybierz stare urządzenie z listy powiązań. Pozwoli to zachować pełną ciągłość historyczną!</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-[45px] top-0 flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-800 shadow-xs">
                  <Camera className="h-4 w-4 text-purple-600" />
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-semibold">
                      Krok 2: Błyskawiczna inwentaryzacja z użyciem OCR AI
                      {completedSteps.step2 && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-150">Wykonano</span>
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleStep("step2")}
                      className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {completedSteps.step2 ? <CheckSquare className="h-3.5 w-3.5 text-emerald-600" /> : <Square className="h-3.5 w-3.5" />}
                      {completedSteps.step2 ? "Oznacz jako niewykonane" : "Oznacz jako zrobione"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nie musisz przepisywać skomplikowanych specyfikacji z małych naklejek znamionowych komputerów! Użyj wbudowanego systemu skanowania opartego na sztucznej inteligencji:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs text-slate-600 space-y-1.5">
                    <p>• <strong>Uruchom aparat:</strong> W formularzu ewidencji (podzakładka „Skaner AI (OCR)”) kliknij przycisk „Zrób zdjęcie aparatem” lub przeciągnij gotowy plik graficzny bezpośrednio na pole wyboru.</p>
                    <p>• <strong>Automatyczny odczyt Gemini:</strong> Po wykonaniu lub załadowaniu zdjęcia naklejki znamionowej, zintegrowany model <strong>Gemini-3.5-Flash</strong> przeanalizuje obraz, odczyta numer seryjny, nazwę producenta oraz kluczowe parametry techniczne (procesor, pamięć RAM, typ dysku twardego, grafikę, system operacyjny).</p>
                    <p>• <strong>Weryfikacja:</strong> Odczytane dane zostaną natychmiast uzupełnione w polach formularza. Sprawdź poprawność, dodaj opcjonalne notatki (np. nazwę pokoju), po czym zatwierdź wpis jednym przyciskiem.</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span className="absolute -left-[45px] top-0 flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-800 shadow-xs">
                  <FileDown className="h-4 w-4 text-indigo-600" />
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-semibold">
                      Krok 3: Generowanie raportu PDF dla zarządu lub audytu
                      {completedSteps.step3 && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-150">Wykonano</span>
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleStep("step3")}
                      className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {completedSteps.step3 ? <CheckSquare className="h-3.5 w-3.5 text-emerald-600" /> : <Square className="h-3.5 w-3.5" />}
                      {completedSteps.step3 ? "Oznacz jako niewykonane" : "Oznacz jako zrobione"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gdy zbierzesz dane sprzętowe, możesz szybko wygenerować przejrzyste dokumenty i zestawienia raportowe gotowe do wydruku lub wysyłki:
                  </p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs text-slate-600 space-y-1.5">
                    <p>• <strong>Filtrowanie i agregacja:</strong> Przejdź do zakładki <strong className="text-slate-800">„Usprawnienia i Raporty”</strong>. Tam zobaczysz m.in. podsumowanie liczby sprzętu, statystyki kategorii oraz rozkład stanu urządzeń.</p>
                    <p>• <strong>Pobieranie dokumentacji:</strong> W sekcji generatora raportów znajdziesz opcję eksportu. Kliknięcie przycisku <strong>„Generuj raport PDF”</strong> natychmiast skompiluje eleganckie zestawienie inwentaryzacyjne w formacie gotowym do druku (zawierające zestawienie tabelaryczne, statystyki ilościowe, dane o rotacji urządzeń oraz sekcję na podpisy komisji inwentaryzacyjnej).</p>
                    <p>• <strong>Eksport CSV i Kopia bezpieczeństwa:</strong> Pamiętaj, że dane są zapisywane lokalnie. Użyj opcji eksportu do CSV lub JSON na dole strony, aby zapisać kompletną kopię zapasową bazy danych na dysku zewnętrznym lub serwerze firmowym.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Summary Tip Box */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Złota zasada inwentaryzacji:
              </h4>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Przed każdym wyjściem w teren (np. skanowanie komputerów w oddziale firmy na smartfonie), wyczyść formularz i upewnij się, że masz naładowaną baterię. Po powrocie do stacji nadrzędnej wyeksportuj plik CSV ze smartfona, zaimportuj go na głównym komputerze i natychmiast wykonaj zapasową kopię bazową (plik JSON). Bezpieczeństwo danych to podstawa!
              </p>
            </div>
          </div>
        )}

        {/* SECTION: HISTORIA ZMIAN */}
        {activeSection === "changelog" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white flex flex-col md:flex-row items-center gap-4 border border-indigo-950 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-bold text-slate-100">Karta Ewolucji Systemu i Historia Zmian</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Przejrzysty przegląd zmian wprowadzanych w kolejnych kompilacjach oprogramowania <strong>SCANVENTORY</strong>. Śledź na bieżąco rozwój funkcji inwentaryzacyjnych.
                </p>
              </div>
            </div>

            {/* Timeline Wrapper */}
            <div className="relative border-l-2 border-indigo-100 ml-4 pl-8 space-y-8 py-4">

              {/* Version 1.2.0 */}
              <div className="relative">
                {/* Visual marker on the line */}
                <div className="absolute -left-[41px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-blue-500 bg-white shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">v1.2.0</span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 10 lipca 2026 r. (Aktualne wydanie)
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 ml-auto">Najnowsza</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Uproszczony Tryb Terenowy i Interaktywny Onboarding</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dostosowanie architektury pod inwentaryzatorów pracujących w terenie. Wprowadzono automatyczne przełączanie interfejsów w zależności od rozmiaru urządzenia użytkownika.
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">NOWOŚĆ</span>
                      <span><strong>Zoptymalizowany widok mobilny:</strong> Automatyczny uproszczony interfejs na smartfonach, blokujący ciężkie panele ewidencji i wyświetlający wyłącznie skaner OCR AI, formularz zapisu oraz szybki eksport baz danych.</span>
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">NOWOŚĆ</span>
                      <span><strong>Interaktywny Przewodnik:</strong> Dodanie podsekcji „Przewodnik użytkownika” dla nowych członków zespołu z systemem interaktywnej checklisty wdrożeniowej (zapamiętywanej lokalnie).</span>
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-150 mt-0.5 shrink-0">ULEPSZENIE</span>
                      <span>Wzbogacenie meta-sekcji informacyjnych i ulepszenie responsywności pasków bocznych ewidencji na tabletach.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Version 1.1.0 */}
              <div className="relative">
                <div className="absolute -left-[41px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-indigo-300 bg-white shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">v1.1.0</span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 20 czerwca 2026 r.
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Sztuczna Inteligencja OCR i Automatyczne Raportowanie PDF</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Wprowadzenie kluczowej integracji z zaawansowanym modelem językowym w celu przyspieszenia wpisywania sprzętu.
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">NOWOŚĆ</span>
                      <span><strong>Silnik Skanera OCR AI:</strong> Integracja z modelem <strong>Gemini-3.5-Flash</strong>. Użytkownicy mogą teraz zrobić zdjęcie naklejki znamionowej aparatem, a AI automatycznie uzupełni specyfikację (procesor, RAM, dysk, model, producenta i numer seryjny).</span>
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">NOWOŚĆ</span>
                      <span><strong>Generator Dokumentów PDF:</strong> Wprowadzenie modułu eksportu raportów inwentaryzacyjnych do formatu PDF o profesjonalnym layoucie biurowym (z podziałami stron, tabelą podsumowującą i polami podpisu).</span>
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-150 mt-0.5 shrink-0">ZMIANA</span>
                      <span>Przemodelowanie zakładki „Zaawansowane” na nowoczesny kokpit „Usprawnienia i Raporty” ze statystykami i wizualizacjami podziału sprzętu.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Version 1.0.5 */}
              <div className="relative">
                <div className="absolute -left-[41px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-300 bg-white shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 font-mono bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">v1.0.5</span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 18 maja 2026 r.
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Menadżer Rotacji Urządzeń i Walidacja Bazy</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Skupiono się na utrzymaniu spójności ewidencji podczas modernizacji stanowisk komputerowych.
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">NOWOŚĆ</span>
                      <span><strong>System Rotacji i Wymian:</strong> Nowa sekcja dedykowana powiązaniom między starymi a nowymi urządzeniami. Każde dodawane urządzenie może zastąpić inne w bazie, tworząc historię rotacji stanowiskowej.</span>
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-150 mt-0.5 shrink-0">POPRAWKA</span>
                      <span><strong>Blokada Duplikatów S/N:</strong> Dodano ostrzeżenia o próbie zarejestrowania sprzętu z numerem seryjnym, który już istnieje w bazie danych.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Version 1.0.0 */}
              <div className="relative">
                <div className="absolute -left-[41px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-200 bg-white shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 font-mono bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">v1.0.0</span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 14 kwietnia 2026 r.
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Pierwsza Stabilna Wersja Produkcyjna (Wydanie Główne)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Uruchomienie oprogramowania SCANVENTORY. Stabilny silnik lokalnego przechowywania danych z zaawansowanym filtrowaniem i kartami zasobów.
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">WBUDOWANE</span>
                      <span>Lokalna baza danych ewidencji sprzętowej działająca w standardzie offline-first oparta na <strong>LocalStorage</strong>.</span>
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">WBUDOWANE</span>
                      <span>Możliwość pełnego eksportu i importu danych w formatach pliku <strong>CSV</strong> (kompatybilnym z Excel) oraz kopii zapasowych <strong>JSON</strong>.</span>
                    </li>
                    <li className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150 mt-0.5 shrink-0">WBUDOWANE</span>
                      <span>Inteligentne przeszukiwanie ewidencji według fraz tekstowych oraz filtrowanie po statusie urządzenia, salach i kategoriach sprzętu.</span>
                    </li>
                  </ul>
                </div>
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
                <div className="space-y-2">
                  <p>
                    Funkcja automatycznego odczytu specyfikacji z naklejek (OCR) przetwarza jedynie przesyłane zdjęcia tabliczek znamionowych w celu ekstrakcji parametrów technicznych przy użyciu technologii sztucznej inteligencji. 
                  </p>
                  <p>
                    <strong>Bezpieczeństwo kluczy API:</strong> W darmowym „Trybie Bezpośrednim (Client-Side)”, Twój klucz Gemini API podawany w ustawieniach formularza jest przechowywany bezpiecznie wyłącznie w lokalnej pamięci Twojej przeglądarki (<span className="font-mono">localStorage</span>). Zapytania i zdjęcia są przekazywane bezpośrednio z Twojego urządzenia do oficjalnych i bezpiecznych serwerów Google (Google AI Studio) przy użyciu szyfrowanego połączenia HTTPS. Nie uczestniczą w tym żadne serwery pośredniczące.
                  </p>
                  <p>
                    <strong>Przetwarzanie zdjęć:</strong> Zdjęcia robione aparatem lub wgrywane z dysku są przesyłane jako dane binarne wyłącznie w celu odczytu parametrów i natychmiast po zwróceniu wyniku OCR przez AI są usuwane z pamięci podręcznej aplikacji. SCANVENTORY nie archiwizuje Twoich zdjęć na żadnych zewnętrznych hostingach.
                  </p>
                  <p>
                    <strong>Regulacje Google AI:</strong> Korzystając z bezpłatnego klucza API, przesyłane dane podlegają postanowieniom dotyczącym polityki prywatności platformy Google AI Studio. Aby uniknąć naruszeń prywatności, surowo zabrania się skanowania dokumentów zawierających dane osobowe, dowody tożsamości lub poufne dane firmowe – program przeznaczony jest wyłącznie do skanowania oznaczeń fabrycznych sprzętu IT.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: LICENCJA */}
        {activeSection === "license" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Informacje Licencyjne (EULA)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Program <strong>SCANVENTORY</strong> udostępniany jest do bezpłatnego użytku (zarówno prywatnego, edukacyjnego, jak i administracyjnego), lecz z zachowaniem ścisłych ograniczeń dotyczących praw autorskich, kopiowania, modyfikowania oraz odsprzedaży.
            </p>

            <div className="p-5 bg-slate-50 border border-slate-150 rounded-xl space-y-4 max-h-[400px] overflow-y-auto text-left">
              <div className="border-b border-slate-150 pb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Typ licencji</span>
                <p className="text-xs font-bold text-slate-800">Darmowy użytek (zastrzeżony) / Proprietary EULA</p>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">1. Dozwolony użytek</h4>
                  <p>Licencja zezwala na bezpłatne korzystanie, uruchamianie i instalowanie programu na dowolnej liczbie urządzeń do celów prywatnych, oświatowych, administracyjnych i operacyjnych.</p>
                </div>

                <div className="p-3.5 bg-rose-50/70 border border-rose-150 rounded-lg space-y-2 text-rose-950">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-rose-600 shrink-0" />
                    Czego absolutnie zabrania się bez pisemnej zgody właściciela:
                  </p>
                  <ul className="list-disc pl-4 text-[11px] space-y-1 text-rose-900">
                    <li><strong>Kopiowania i rozpowszechniania</strong> kodu źródłowego, plików wykonywalnych lub skompilowanego Programu osobom trzecim.</li>
                    <li><strong>Modyfikowania i wprowadzania zmian</strong> w kodzie źródłowym, adaptacji, tłumaczenia, inżynierii wstecznej (reverse engineering), dekompilacji lub tworzenia utworów zależnych.</li>
                    <li><strong>Komercjalizacji i wykorzystania komercyjnego</strong> Programu do celów zarobkowych lub świadczenia płatnych usług osobom trzecim.</li>
                    <li><strong>Sprzedaży, wynajmu i licencjonowania</strong> Programu, oferowania go jako płatnego oprogramowania lub dołączania jako element pakietów handlowych.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">2. Własność intelektualna</h4>
                  <p>Wszystkie prawa autorskie do Programu oraz nazwy SCANVENTORY należą wyłącznie do autora: <strong>Krzysztof Jureczek</strong>. Oprogramowanie nie jest sprzedawane, lecz licencjonowane.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">3. Wyłączenie odpowiedzialności</h4>
                  <p>Oprogramowanie dostarczane jest w stanie, w jakim się znajduje („AS IS”), bez jakiejkolwiek gwarancji. Autor nie ponosi odpowiedzialności za ewentualną utratę danych lub szkody powstałe w wyniku korzystania z programu.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
