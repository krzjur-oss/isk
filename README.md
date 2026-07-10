# Inwentaryzacja Sprzętu Komputerowego dla Szkół i Placówek Oświatowych

Nowoczesny, intuicyjny system wspierający proces ewidencji i inwentaryzacji sprzętu komputerowego, zaprojektowany z myślą o specyfice szkół i placówek oświatowych w Polsce. Aplikacja pozwala w łatwy i szybki sposób zarządzać sprzętem IT, salami/klasami lekcyjnymi oraz kontrolować proces wymiany i wycofania starych urządzeń na nowe, generując profesjonalne protokoły i raporty PDF.

## 🚀 Główne Funkcje Systemu

- **Automatyczne odczytywanie danych (OCR) z Gemini AI (wersja 3.5-Flash):** Szybkie dodawanie sprzętu poprzez wykonanie zdjęcia lub wgranie zdjęcia tabliczki znamionowej bądź naklejki seryjnej. Sztuczna inteligencja automatycznie wyodrębnia producenta, model, numer seryjny, system operacyjny oraz specyfikację sprzętową (procesor, RAM, dysk).
- **Bezpośrednia obsługa aparatu (Wideo/Foto):** Integracja z kamerą telefonu, tabletu lub komputera pozwala na natychmiastowe wykonanie zdjęcia tabliczki znamionowej na miejscu w sali lekcyjnej i automatyczne uzupełnienie danych.
- **Ewidencja Sal i Lokalizacji:** Każde urządzenie ma przypisaną konkretną salę (np. *Sala 102*, *Pracownia Informatyczna*, *Sekretariat*), co pozwala na natychmiastowe zlokalizowanie sprzętu w placówce.
- **Zarządzanie Łańcuchem Wymian:** Rejestracja procesu zastępowania wyeksploatowanego sprzętu nowym. System śledzi, które urządzenie zostało zastąpione przez które, zachowując historię i automatycznie aktualizując statusy (np. zmiana starego na *Wycofany*, a nowego na *W użyciu*).
- **Profesjonalne Raporty i Protokoły PDF:** Generowanie gotowych do wydruku zestawień inwentaryzacyjnych oraz szczegółowych protokołów wymiany sprzętu komputerowego (np. dla dyrekcji lub kuratorium), w pełni obsługujących polskie znaki diakrytyczne.
- **Filtrowanie, wyszukiwanie i dynamiczne sortowanie:** Błyskawiczne filtrowanie sprzętu po kategorii i statusie, zaawansowane wyszukiwanie tekstowe oraz natychmiastowe sortowanie listy według producenta alfabetycznie lub chronologicznie według daty zakupu.
- **System Kontroli Limitów OCR:** Konfigurowalny próg ostrzeżeń przed nadmiernym zużyciem darmowego limitu API OCR. Gdy liczba wykonanych skanowań przekroczy wskazany limit, system natychmiast wyświetli czytelne ostrzeżenie.

## ⚖️ Zgodność z Przepisami Prawnymi w Polsce

Program został zaprojektowany w taki sposób, aby ułatwić placówkom oświatowym spełnienie obowiązków nałożonych przez polskie ustawodawstwo:
1. **Ustawa o rachunkowości (Dz.U. z 2023 r. poz. 120 z późn. zm.):** Ułatwia systematyczne przeprowadzanie inwentaryzacji (spisu z natury) drogą weryfikacji oraz ewidencjonowanie dokładnego stanu ilościowo-wartościowego/tożsamościowego środków trwałych oraz pozostałych środków trwałych.
2. **Standardy Kontroli Zarządczej w jednostkach sektora finansów publicznych:** Narzędzie wspiera realizację rzetelnej ewidencji i ochronę zasobów przed zniszczeniem lub kradzieżą.
3. **Rozporządzenia oświatowe oraz wymogi RODO (ochrona danych):** Narzędzie działa w pełni lokalnie po stronie przeglądarki i serwera w bezpiecznym środowisku (nie wymaga przesyłania danych osobowych uczniów ani nauczycieli na zewnętrzne serwery).

## 📄 Licencja

Projekt objęty jest specjalną, dedykowaną **Licencją Użytkownika Końcowego (EULA)**, która:
- Zezwala na **całkowicie bezpłatne korzystanie** z programu przez publiczne i niepubliczne szkoły oraz placówki oświatowe na terenie Rzeczypospolitej Polskiej.
- Wprowadza **bezwzględny zakaz kopiowania kodu źródłowego**, modyfikowania go, komercjalizacji (zarabiania na nim) oraz redystrybuowania bez pisemnej zgody autora.

Pełna treść licencji znajduje się w pliku [LICENSE.md](LICENSE.md).

## 🛠️ Uruchomienie i Instalacja

Aplikacja oparta jest na nowoczesnym stosie technologicznym **React + TypeScript + Vite + Tailwind CSS** z backendem **Express** integrującym model Gemini.

### Wymagania wstępne
- Zainstalowane środowisko **Node.js** (w wersji 18 lub nowszej)

### Klonowanie i uruchomienie lokalne

1. Zainstaluj zależności:
   ```bash
   npm install
   ```

2. Skonfiguruj klucz API dla sztucznej inteligencji (Gemini). Utwórz plik `.env` w głównym katalogu i dodaj klucz:
   ```env
   GEMINI_API_KEY=twój_klucz_api_gemini
   ```
   *(Klucz Gemini możesz wygenerować bezpłatnie w Google AI Studio)*

3. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```
   Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

### Budowanie wersji produkcyjnej
Aby zbudować zoptymalizowaną wersję produkcyjną aplikacji, uruchom:
```bash
npm run build
```
Zbudowany serwer i pliki statyczne znajdą się w katalogu `/dist`. Uruchomienie wersji produkcyjnej:
```bash
npm start
```
