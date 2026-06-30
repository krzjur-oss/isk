import React, { useState, useEffect } from "react";
import { InventoryItem } from "../types";
import { ArrowRight, RotateCw, Trash2, Laptop, RefreshCw, AlertCircle, Calendar, History, Plus, CheckCircle2, GitPullRequest } from "lucide-react";

interface ReplacementManagerProps {
  items: InventoryItem[];
  onUpdateItems: (updatedItems: InventoryItem[]) => void;
}

export default function ReplacementManager({ items, onUpdateItems }: ReplacementManagerProps) {
  const [oldItemId, setOldItemId] = useState("");
  const [newItemId, setNewItemId] = useState("");
  const [replacementNotes, setReplacementNotes] = useState("");
  const [replacementRoom, setReplacementRoom] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [onlyMultiple, setOnlyMultiple] = useState(true);

  // Auto-fill room based on selected old item
  useEffect(() => {
    if (oldItemId) {
      const selectedOldItem = items.find(i => i.id === oldItemId);
      if (selectedOldItem && selectedOldItem.room) {
        setReplacementRoom(selectedOldItem.room);
      } else {
        setReplacementRoom("");
      }
    } else {
      setReplacementRoom("");
    }
  }, [oldItemId, items]);

  // Generate a multi-step replacement demo chain
  const handleGenerateDemoChain = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const prevYearStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const prevTwoYearsStr = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const item1Id = `demo-t1-${Math.random().toString(36).substring(2, 9)}`;
    const item2Id = `demo-t2-${Math.random().toString(36).substring(2, 9)}`;
    const item3Id = `demo-t3-${Math.random().toString(36).substring(2, 9)}`;

    const demoItems: InventoryItem[] = [
      {
        id: item1Id,
        manufacturer: "Dell",
        model: "Latitude 5410 (Intel)",
        serialNumber: "DL-DEMO-5410-X",
        processor: "Intel Core i5-10210U",
        ram: "8 GB",
        storage: "256 GB SSD",
        graphics: "Intel UHD Graphics",
        operatingSystem: "Windows 10 Pro",
        category: "Laptop",
        confidence: 96,
        notes: "Pierwotny laptop zakupiony dla działu HR w 2021 roku.",
        status: "Wycofany",
        addedAt: prevTwoYearsStr,
        lastModifiedAt: prevYearStr,
        replacedByItemId: item2Id,
        replacementDate: prevYearStr,
        room: "Gabinet HR",
      },
      {
        id: item2Id,
        manufacturer: "Dell",
        model: "Latitude 5430 (Intel Gen 12)",
        serialNumber: "DL-DEMO-5430-Y",
        processor: "Intel Core i5-1235U",
        ram: "16 GB",
        storage: "512 GB SSD",
        graphics: "Intel Iris Xe",
        operatingSystem: "Windows 11 Pro",
        category: "Laptop",
        confidence: 95,
        notes: "Pierwsza wymiana sprzętu. Poprzedni uległ uszkodzeniu mechanicznemu (zalanie).",
        status: "Wycofany",
        addedAt: prevYearStr,
        lastModifiedAt: todayStr,
        replacesItemId: item1Id,
        replacedByItemId: item3Id,
        replacementDate: todayStr,
        room: "Pracownia 102",
      },
      {
        id: item3Id,
        manufacturer: "Dell",
        model: "Latitude 5440 (Intel Gen 13)",
        serialNumber: "DL-DEMO-5440-Z",
        processor: "Intel Core i7-1355U",
        ram: "32 GB",
        storage: "1 TB SSD",
        graphics: "Intel Iris Xe",
        operatingSystem: "Windows 11 Pro",
        category: "Laptop",
        confidence: 99,
        notes: "Aktualny, nowoczesny laptop służbowy o zwiększonej pamięci RAM.",
        status: "W użyciu",
        addedAt: todayStr,
        lastModifiedAt: todayStr,
        replacesItemId: item2Id,
        room: "Pracownia 102",
      }
    ];

    onUpdateItems([...items, ...demoItems]);
    setSuccess("Wygenerowano przykładową ścieżkę wielokrotnej wymiany (Dell 5410 ➔ 5430 ➔ 5440).");
  };

  // Filter candidates for replacement:
  // - Old item: any active item (in use or in stock) that hasn't been replaced yet
  const oldItemCandidates = items.filter(item => 
    item.status !== "Wycofany" && 
    item.status !== "Wymieniony" && 
    !item.replacedByItemId
  );

  // - New item: any item that is in stock or in use, but is not the same as old item,
  //   and is not already replacing something or being replaced
  const newItemCandidates = items.filter(item => 
    item.id !== oldItemId &&
    item.status !== "Wycofany" &&
    !item.replacesItemId
  );

  const handleCreateReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldItemId || !newItemId) {
      setError("Proszę wybrać oba urządzenia (stare i nowe) do dokonania wymiany.");
      return;
    }

    // Clone items
    const updatedItems = items.map(item => ({ ...item }));

    // Find index of old and new items
    const oldIndex = updatedItems.findIndex(item => item.id === oldItemId);
    const newIndex = updatedItems.findIndex(item => item.id === newItemId);

    if (oldIndex === -1 || newIndex === -1) {
      setError("Nie znaleziono wybranych urządzeń.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Update old item status & relationship
    updatedItems[oldIndex].status = "Wycofany";
    updatedItems[oldIndex].replacedByItemId = newItemId;
    updatedItems[oldIndex].replacementDate = todayStr;
    if (replacementNotes) {
      updatedItems[oldIndex].notes = updatedItems[oldIndex].notes 
        ? `${updatedItems[oldIndex].notes}\n[Wymiana - uwagi]: ${replacementNotes}`
        : `[Wymiana - uwagi]: ${replacementNotes}`;
    }
    if (replacementRoom) {
      updatedItems[oldIndex].notes = updatedItems[oldIndex].notes 
        ? `${updatedItems[oldIndex].notes}\n[Wymiana - Sala]: Dotyczy sali ${replacementRoom}`
        : `[Wymiana - Sala]: Dotyczy sali ${replacementRoom}`;
    }

    // Update new item status & relationship
    updatedItems[newIndex].status = "W użyciu";
    updatedItems[newIndex].replacesItemId = oldItemId;
    updatedItems[newIndex].replacementDate = todayStr;
    if (replacementRoom) {
      updatedItems[newIndex].room = replacementRoom;
      updatedItems[newIndex].notes = updatedItems[newIndex].notes 
        ? `${updatedItems[newIndex].notes}\n[Wymiana - Sala]: Przeniesiono do sali ${replacementRoom}`
        : `[Wymiana - Sala]: Przeniesiono do sali ${replacementRoom}`;
    }

    onUpdateItems(updatedItems);
    setOldItemId("");
    setNewItemId("");
    setReplacementNotes("");
    setReplacementRoom("");
    setSuccess("Pomyślnie zarejestrowano wymianę sprzętu! Statusy komputerów zostały zaktualizowane.");
  };

  const handleCancelReplacement = (newId: string, oldId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to powiązanie wymiany? Statusy obu komputerów zostaną przywrócone.")) {
      return;
    }

    const updatedItems = items.map(item => {
      const cloned = { ...item };
      if (cloned.id === newId) {
        // Clear replaces relation
        delete cloned.replacesItemId;
        delete cloned.replacementDate;
        cloned.status = "W magazynie"; // revert to stock
      }
      if (cloned.id === oldId) {
        // Clear replacedBy relation
        delete cloned.replacedByItemId;
        delete cloned.replacementDate;
        cloned.status = "W użyciu"; // revert to in use
      }
      return cloned;
    });

    onUpdateItems(updatedItems);
    setSuccess("Usunięto powiązanie wymiany sprzętu.");
  };

  // Get active replacement pairs
  const replacementPairs = items.filter(item => item.replacesItemId).map(newItem => {
    const oldItem = items.find(i => i.id === newItem.replacesItemId);
    return {
      newItem,
      oldItem,
      date: newItem.replacementDate || "Brak daty"
    };
  });

  // Extract all lifecycle chains
  const getChains = (): InventoryItem[][] => {
    const visited = new Set<string>();
    const allChains: InventoryItem[][] = [];

    // Find all items that are part of any replacement relationship
    const potentialNodes = items.filter(item => item.replacedByItemId || item.replacesItemId);
    
    // For each node, find its ultimate ancestor root (the item with no replacesItemId)
    const rootIds = new Set<string>();
    potentialNodes.forEach(item => {
      let current = item;
      const localVisited = new Set<string>([current.id]);
      while (current.replacesItemId) {
        const prev = items.find(i => i.id === current.replacesItemId);
        if (prev && !localVisited.has(prev.id)) {
          current = prev;
          localVisited.add(prev.id);
        } else {
          break;
        }
      }
      rootIds.add(current.id);
    });

    // Trace forward from each unique root
    rootIds.forEach(rootId => {
      const rootItem = items.find(i => i.id === rootId);
      if (!rootItem || visited.has(rootId)) return;

      const chain: InventoryItem[] = [rootItem];
      let current = rootItem;
      visited.add(current.id);

      while (current.replacedByItemId) {
        const nextId = current.replacedByItemId;
        const next = items.find(i => i.id === nextId);
        if (next && !visited.has(next.id)) {
          chain.push(next);
          visited.add(next.id);
          current = next;
        } else {
          break;
        }
      }

      if (chain.length >= 2) {
        allChains.push(chain);
      }
    });

    return allChains;
  };

  const chains = getChains();
  const displayChains = onlyMultiple ? chains.filter(c => c.length >= 3) : chains;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Replacement Form Card */}
      <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-800">
          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin-slow" />
          <h2 className="text-lg font-bold">Zarejestruj nową wymianę</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Wybierz starsze urządzenie wycofywane z użytku oraz nowe urządzenie, które przejmuje jego rolę.
        </p>

        <form onSubmit={handleCreateReplacement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Wybierz stare urządzenie (do wycofania)
            </label>
            <select
              value={oldItemId}
              onChange={(e) => setOldItemId(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- Wybierz urządzenie --</option>
              {oldItemCandidates.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.category}] {item.manufacturer} {item.model} (S/N: {item.serialNumber || "brak"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center my-1">
            <div className="bg-blue-50 p-1.5 rounded-full border border-blue-100">
              <ArrowRight className="h-4 w-4 text-blue-500 rotate-90 lg:rotate-0" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Wybierz nowe urządzenie (wprowadzane)
            </label>
            <select
              value={newItemId}
              onChange={(e) => setNewItemId(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- Wybierz urządzenie --</option>
              {newItemCandidates.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.category}] {item.manufacturer} {item.model} (S/N: {item.serialNumber || "brak"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Sala / Klasa, której dotyczy wymiana (opcjonalnie)
            </label>
            <input
              type="text"
              value={replacementRoom}
              onChange={(e) => setReplacementRoom(e.target.value)}
              placeholder="np. Sala 102, Pracownia fizyczna"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Uwagi do wymiany (opcjonalnie)
            </label>
            <textarea
              value={replacementNotes}
              onChange={(e) => setReplacementNotes(e.target.value)}
              placeholder="np. Przeniesienie licencji OEM, powód wymiany: uszkodzenie matrycy, itp."
              rows={2}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="h-4 w-4" />
            Zatwierdź wymianę
          </button>
        </form>
      </div>

      {/* Visual Replacements Pipeline Card */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Mapa i historia wymian</h2>
        <p className="text-sm text-slate-500 mb-4">
          Wizualne przedstawienie komputerów wycofanych i zastąpionych nowym sprzętem komputerowym.
        </p>

        <div className="space-y-4 overflow-y-auto max-h-[360px] flex-1 pr-1">
          {replacementPairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <RefreshCw className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Brak zarejestrowanych wymian</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] text-center">
                Skorzystaj z formularza obok, aby powiązać stare urządzenie z nowym.
              </p>
            </div>
          ) : (
            replacementPairs.map(({ newItem, oldItem, date }) => {
              if (!oldItem) return null;
              return (
                <div 
                  key={`pair-${newItem.id}`} 
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all hover:border-blue-200"
                >
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
                    {/* Old computer - Out of service */}
                    <div className="bg-white p-3 rounded-lg border border-slate-150 flex-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-red-400"></div>
                      <div className="flex items-center gap-2 mb-1">
                        <Laptop className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase">Wycofany</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {oldItem.manufacturer} {oldItem.model}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">S/N: {oldItem.serialNumber || "brak"}</p>
                    </div>

                    {/* Arrow / Connection */}
                    <div className="flex flex-col items-center justify-center shrink-0 text-blue-500 px-1 py-1">
                      <ArrowRight className="h-5 w-5 hidden md:block" />
                      <div className="flex items-center gap-1.5 text-slate-400 my-1 md:my-0">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-semibold">{date}</span>
                      </div>
                    </div>

                    {/* New computer - In use */}
                    <div className="bg-white p-3 rounded-lg border border-slate-150 flex-1 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400"></div>
                      <div className="flex items-center gap-2 mb-1">
                        <Laptop className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">W użyciu</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {newItem.manufacturer} {newItem.model}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">S/N: {newItem.serialNumber || "brak"}</p>
                    </div>
                  </div>

                  {/* Disconnect button */}
                  <button
                    onClick={() => handleCancelReplacement(newItem.id, oldItem.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 self-center md:self-auto cursor-pointer"
                    title="Usuń relację wymiany"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

      {/* Sekcja Osi Czasu Cyklu Życia Sprzętu */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Oś czasu i ścieżka życia sprzętu</h3>
              <p className="text-xs text-slate-500">
                Pełny cykl życia urządzeń w organizacji, w tym łańcuchy wielokrotnych wymian
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
              <input
                type="checkbox"
                checked={onlyMultiple}
                onChange={(e) => setOnlyMultiple(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span>Pokaż tylko wielokrotne wymiany (3+ urządzenia)</span>
            </label>

            <button
              type="button"
              onClick={handleGenerateDemoChain}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Dodaj 3 połączone laptopy Dell do bazy danych, aby przetestować oś czasu"
            >
              <Plus className="h-3.5 w-3.5" />
              Generuj demo 3+ wymian
            </button>
          </div>
        </div>

        {displayChains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <GitPullRequest className="h-10 w-10 text-slate-300 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-700">Brak dopasowanych ścieżek cyklu życia</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md text-center">
              {onlyMultiple 
                ? "Nie znaleziono w bazie urządzeń z wielokrotną wymianą (min. 3 powiązane urządzenia). Użyj przycisku po prawej, aby automatycznie dodać przykładową ścieżkę demonstracyjną."
                : "Nie zarejestrowano jeszcze żadnych ścieżek wymiany."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {displayChains.map((chain, chainIdx) => {
              const firstItem = chain[0];
              const lastItem = chain[chain.length - 1];
              const isMultiple = chain.length >= 3;

              return (
                <div key={`chain-${chainIdx}`} className="p-5 border border-slate-100 rounded-xl bg-slate-50/20">
                  {/* Chain Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3 mb-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-bold">
                        ŚCIEŻKA #{chainIdx + 1}
                      </span>
                      {isMultiple && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          Wielokrotna Wymiana
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-800">
                        {firstItem.manufacturer} {firstItem.model} ➔ {lastItem.manufacturer} {lastItem.model}
                      </h4>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Liczba urządzeń w łańcuchu: <span className="font-bold text-slate-900">{chain.length}</span>
                    </div>
                  </div>

                  {/* Vertical Timeline container */}
                  <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 ml-3.5 space-y-6 pb-2">
                    {chain.map((item, itemIdx) => {
                      const isFirst = itemIdx === 0;
                      const isLast = itemIdx === chain.length - 1;

                      // Status styles
                      let statusBg = "bg-slate-100 text-slate-700 border border-slate-200";
                      if (item.status === "W użyciu") statusBg = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                      else if (item.status === "Wycofany") statusBg = "bg-red-50 text-red-600 border border-red-150";
                      else if (item.status === "W magazynie") statusBg = "bg-blue-50 text-blue-700 border border-blue-150";
                      else if (item.status === "Wymieniony") statusBg = "bg-amber-50 text-amber-700 border border-amber-200";

                      return (
                        <div key={`node-${item.id}`} className="relative">
                          {/* Timeline Circle */}
                          <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 flex items-center justify-center">
                            {isLast ? (
                              <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow flex items-center justify-center text-white">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </div>
                            ) : isFirst ? (
                              <div className="w-6 h-6 rounded-full bg-slate-400 border-4 border-white shadow flex items-center justify-center text-white text-[10px] font-bold">
                                1
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow flex items-center justify-center text-white text-[10px] font-bold">
                                {itemIdx + 1}
                              </div>
                            )}
                          </div>

                          {/* Node Card */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all">
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Laptop className="h-4 w-4 text-slate-400" />
                                  <span className="text-sm font-bold text-slate-800">
                                    {item.manufacturer} {item.model}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBg}`}>
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                                  <span>Kategoria: {item.category}</span>
                                  <span>•</span>
                                  <span>Wprowadzono: {item.addedAt}</span>
                                  {item.room && (
                                    <>
                                      <span>•</span>
                                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                        Sala: {item.room}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>

                              <div className="sm:text-right">
                                <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                  ID: {item.id.substring(0, 8)}
                                </span>
                              </div>
                            </div>

                            {/* Specifications block */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 font-medium">Procesor:</span>{" "}
                                <span className="font-semibold text-slate-700">{item.processor || "Brak"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">RAM:</span>{" "}
                                <span className="font-semibold text-slate-700">{item.ram || "Brak"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">Dysk:</span>{" "}
                                <span className="font-semibold text-slate-700">{item.storage || "Brak"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">S/N:</span>{" "}
                                <span className="font-mono text-slate-700">{item.serialNumber || "Brak"}</span>
                              </div>
                            </div>

                            {/* Node Notes */}
                            {item.notes && (
                              <div className="mt-2.5 text-xs text-slate-500 italic bg-blue-50/10 border-l-2 border-blue-400 p-2 rounded-r-lg">
                                <span className="font-bold not-italic text-slate-700 text-[10px] uppercase block mb-0.5">
                                  Notatki sprzętowe:
                                </span>
                                {item.notes}
                              </div>
                            )}

                            {/* Link to next */}
                            {!isLast && (
                              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
                                <ArrowRight className="h-4 w-4 text-blue-500 animate-pulse" />
                                <span>Zastąpiono przez model wyżej dnia:</span>
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {item.replacementDate || "Brak daty"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
