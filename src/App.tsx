import { useState, useEffect } from "react";
import { InventoryItem, HardwareCategory, HardwareStatus } from "./types";
import DashboardStats from "./components/DashboardStats";
import HardwareForm from "./components/HardwareForm";
import HardwareList from "./components/HardwareList";
import ReplacementManager from "./components/ReplacementManager";
import AboutApp from "./components/AboutApp";
import AdvancedFeatures from "./components/AdvancedFeatures";
import { Laptop, Cpu, RotateCw, Database, Layers, RefreshCw, Sparkles, Info, Cloud, LogIn, LogOut, AlertTriangle } from "lucide-react";
import { ToastProvider, useToast } from "./components/Toast";

const LOCAL_STORAGE_KEY = "it_inventory_items_v1";

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: "device-1",
    manufacturer: "Dell",
    model: "Latitude 5410",
    serialNumber: "DELL-5410-X",
    processor: "Intel Core i5-10210U",
    ram: "8 GB",
    storage: "256 GB SSD",
    graphics: "Intel UHD Graphics",
    operatingSystem: "Windows 10 Pro",
    category: "Laptop",
    confidence: 100,
    notes: "Stary laptop wycofany po wymianie na nowszy model Lenovo T14.",
    status: "Wycofany",
    purchaseDate: "2020-03-15",
    addedAt: "2024-01-15",
    lastModifiedAt: "2026-06-30",
    replacedByItemId: "device-3",
    replacementDate: "2026-06-30"
  },
  {
    id: "device-2",
    manufacturer: "HP",
    model: "ProBook 450 G8",
    serialNumber: "HP-450G8-ABC",
    processor: "Intel Core i5-1135G7",
    ram: "16 GB",
    storage: "512 GB NVMe",
    graphics: "Intel Iris Xe",
    operatingSystem: "Windows 11 Pro",
    category: "Laptop",
    confidence: 95,
    notes: "Nowy laptop przygotowany w magazynie dla nowego pracownika.",
    status: "W magazynie",
    purchaseDate: "2022-05-10",
    addedAt: "2026-03-10",
    lastModifiedAt: "2026-03-10"
  },
  {
    id: "device-3",
    manufacturer: "Lenovo",
    model: "ThinkPad T14 Gen 2",
    serialNumber: "LNV-T14G2-XYZ",
    processor: "AMD Ryzen 5 PRO 5650U",
    ram: "16 GB",
    storage: "512 GB SSD",
    graphics: "AMD Radeon Graphics",
    operatingSystem: "Windows 11 Pro",
    category: "Laptop",
    confidence: 99,
    notes: "Wprowadzony jako następca dla wycofanego Della Latitude 5410.",
    status: "W użyciu",
    purchaseDate: "2026-06-30",
    addedAt: "2026-06-30",
    lastModifiedAt: "2026-06-30",
    replacesItemId: "device-1",
    replacementDate: "2026-06-30"
  },
  {
    id: "device-4",
    manufacturer: "Dell",
    model: "UltraSharp U2720Q",
    serialNumber: "CN-0U2720Q-12345",
    processor: "---",
    ram: "---",
    storage: "---",
    graphics: "---",
    operatingSystem: "---",
    category: "Monitor",
    confidence: 100,
    notes: "Monitor 27 cali 4K IPS z hubem USB-C.",
    status: "W użyciu",
    purchaseDate: "2021-02-14",
    addedAt: "2025-05-20",
    lastModifiedAt: "2025-05-20"
  },
  {
    id: "device-5",
    manufacturer: "HP",
    model: "EliteDesk 800 G5",
    serialNumber: "HP-800G5-ST",
    processor: "Intel Core i7-9700",
    ram: "16 GB",
    storage: "512 GB SSD",
    graphics: "Intel UHD Graphics 630",
    operatingSystem: "Windows 10 Pro",
    category: "Komputer Stacjonarny",
    confidence: 100,
    notes: "Komputer stacjonarny w pracowni komputerowej nr 12.",
    status: "W użyciu",
    purchaseDate: "2020-11-20",
    addedAt: "2024-02-10",
    lastModifiedAt: "2024-02-10"
  }
];

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const { toastSuccess, toastError, toastInfo, toastWarning } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"inventory" | "replacements" | "about" | "improvements">("inventory");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [onedriveUser, setOnedriveUser] = useState<any>(() => {
    const stored = localStorage.getItem("onedrive_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [oneDriveLastSync, setOneDriveLastSync] = useState<string | null>(() => {
    return localStorage.getItem("onedrive_last_sync");
  });
  const [oneDriveSyncError, setOneDriveSyncError] = useState<boolean>(() => {
    return localStorage.getItem("onedrive_sync_error") === "true";
  });

  // Check for client-side custom OneDrive OAuth token redirect hash
  useEffect(() => {
    const handleHashAuth = async () => {
      const hash = window.location.hash;
      if (!hash) return;
      
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const state = params.get("state");
      
      if (accessToken && (state === "onedrive-custom-sync" || state === "onedrive-sync")) {
        // Clear hash immediately so URL looks clean
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        
        try {
          // Fetch user details from Microsoft Graph using the access token
          const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          
          if (userRes.ok) {
            const profile = await userRes.json();
            const user = {
              displayName: profile.displayName || "Użytkownik Microsoft 365",
              principalName: profile.userPrincipalName || profile.mail || "szkola@onedrive.com"
            };
            
            const expires_in = params.get("expires_in") || "3600";
            const expiresAt = Date.now() + parseInt(expires_in) * 1000;
            
            const tokens = {
              access_token: accessToken,
              expires_at: expiresAt,
              is_custom: true
            };
            
            localStorage.setItem("onedrive_tokens", JSON.stringify(tokens));
            localStorage.setItem("onedrive_user", JSON.stringify(user));
            localStorage.setItem("onedrive_sync_error", "false");
            
            const targetWindow = window.opener || window;
            targetWindow.postMessage({ 
              type: 'MS_AUTH_SUCCESS', 
              tokens, 
              user 
            }, '*');

            if (window.opener) {
              setTimeout(() => {
                window.close();
              }, 1000);
            }
          }
        } catch (err) {
          console.error("Failed to parse custom OAuth token:", err);
        }
      }
    };
    
    handleHashAuth();
  }, []);

  // Track OneDrive profile changes in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("onedrive_user");
      setOnedriveUser(stored ? JSON.parse(stored) : null);
      setOneDriveLastSync(localStorage.getItem("onedrive_last_sync"));
      setOneDriveSyncError(localStorage.getItem("onedrive_sync_error") === "true");
    };

    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (origin !== window.location.origin && !origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("3000")) {
        return;
      }
      if (event.data?.type === "MS_AUTH_SUCCESS") {
        const { tokens, user } = event.data;
        setOnedriveUser(user);
        localStorage.setItem("onedrive_tokens", JSON.stringify(tokens));
        localStorage.setItem("onedrive_user", JSON.stringify(user));
        localStorage.setItem("onedrive_sync_error", "false");
        setOneDriveSyncError(false);
      } else if (event.data?.type === "MS_AUTH_LOGOUT") {
        setOnedriveUser(null);
        setOneDriveLastSync(null);
        setOneDriveSyncError(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("message", handleOAuthMessage);
    
    // Periodically poll for local storage changes from child components
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("message", handleOAuthMessage);
      clearInterval(interval);
    };
  }, []);

  const handleConnectOneDrive = async () => {
    try {
      const useCustom = localStorage.getItem("onedrive_use_custom") === "true";
      let url = "";
      
      if (useCustom) {
        const customClientId = localStorage.getItem("onedrive_custom_client_id") || "";
        const customTenantId = localStorage.getItem("onedrive_custom_tenant_id") || "common";
        if (!customClientId.trim()) {
          alert("Wpisz najpierw swój szkolny Client ID w zakładce 'Usprawnienia i raporty' -> 'Chmura OneDrive'!");
          return;
        }
        const params = new URLSearchParams({
          client_id: customClientId.trim(),
          response_type: "token",
          redirect_uri: window.location.origin + window.location.pathname,
          scope: "files.readwrite User.Read",
          state: "onedrive-custom-sync"
        });
        url = `https://login.microsoftonline.com/${customTenantId}/oauth2/v2.0/authorize?${params.toString()}`;
      } else {
        const origin = window.location.origin;
        const response = await fetch(`/api/auth/microsoft/url?origin=${encodeURIComponent(origin)}`);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Nie udało się uzyskać URL autoryzacji.");
        }
        const { url: apiConfiguredUrl } = await response.json();
        url = apiConfiguredUrl;
      }
      
      const width = 600;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        "microsoft_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
      );
      
      if (!popup) {
        alert("Wyskakujące okno zostało zablokowane przez przeglądarkę! Zezwól na wyskakujące okna dla tej witryny.");
      }
    } catch (err: any) {
      alert(`Błąd inicjalizacji: ${err.message || err}`);
    }
  };

  const handleOneDriveLogout = () => {
    localStorage.removeItem("onedrive_tokens");
    localStorage.removeItem("onedrive_user");
    localStorage.removeItem("onedrive_last_sync");
    localStorage.removeItem("onedrive_auto_sync");
    localStorage.removeItem("onedrive_sync_error");
    setOnedriveUser(null);
    setOneDriveSyncError(false);
    window.postMessage({ type: "MS_AUTH_LOGOUT" }, "*");
  };

  // Load items from local storage or use initial dataset
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse stored inventory items:", err);
        setItems(INITIAL_ITEMS);
      }
    } else {
      setItems(INITIAL_ITEMS);
    }
  }, []);

  // Save items to local storage on any update
  const saveItemsToDatabase = (newItems: InventoryItem[]) => {
    setItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));

    // Optional background auto-sync to Microsoft OneDrive
    if (localStorage.getItem("onedrive_auto_sync") === "true") {
      const storedTokens = localStorage.getItem("onedrive_tokens");
      if (storedTokens) {
        try {
          const { access_token } = JSON.parse(storedTokens);
          if (access_token) {
            fetch("https://graph.microsoft.com/v1.0/me/drive/root:/Scanventory/inventory.json:/content", {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(newItems)
            })
            .then(res => {
              if (res.ok) {
                const nowStr = new Date().toLocaleString("pl-PL");
                localStorage.setItem("onedrive_last_sync", nowStr);
                localStorage.setItem("onedrive_sync_error", "false");
                setOneDriveLastSync(nowStr);
                setOneDriveSyncError(false);
                console.log("Automatic OneDrive synchronization succeeded at " + nowStr);
                toastSuccess("Zsynchronizowano bazę danych z OneDrive!");
              } else {
                localStorage.setItem("onedrive_sync_error", "true");
                setOneDriveSyncError(true);
                console.warn("Automatic OneDrive sync returned status " + res.status);
                toastWarning("Automatyczny zapis kopii na OneDrive nie powiódł się.");
              }
            })
            .catch(err => {
              localStorage.setItem("onedrive_sync_error", "true");
              setOneDriveSyncError(true);
              console.error("Automatic OneDrive sync failed:", err);
              toastError("Błąd automatycznej synchronizacji z OneDrive.");
            });
          }
        } catch (e) {
          console.error("Error parsing OneDrive tokens for auto-sync:", e);
        }
      }
    }
  };

  const handleSaveItem = (itemData: Omit<InventoryItem, "id" | "addedAt" | "lastModifiedAt"> & { id?: string }) => {
    const todayStr = new Date().toISOString().split("T")[0];

    if (itemData.id) {
      // Editing existing item
      const updated = items.map(item => {
        if (item.id === itemData.id) {
          return {
            ...item,
            ...itemData,
            lastModifiedAt: todayStr
          } as InventoryItem;
        }
        return item;
      });

      // Special handling: if we set a replaces relationship in the manual form, update the replaced item as well
      if (itemData.replacesItemId) {
        const replacesIdx = updated.findIndex(i => i.id === itemData.replacesItemId);
        if (replacesIdx !== -1) {
          updated[replacesIdx].status = "Wycofany";
          updated[replacesIdx].replacedByItemId = itemData.id;
          updated[replacesIdx].replacementDate = todayStr;
        }
      }

      saveItemsToDatabase(updated);
      setEditingItem(null);
      toastSuccess(`Zapisano zmiany dla urządzenia ${itemData.manufacturer} ${itemData.model}!`);
    } else {
      // Creating new item
      const newId = `device-${Date.now()}`;
      const newItem: InventoryItem = {
        ...itemData,
        id: newId,
        addedAt: todayStr,
        lastModifiedAt: todayStr
      };

      const updated = [...items, newItem];

      // If this new item replaces another, update the old item's status & pointer
      if (itemData.replacesItemId) {
        const replacesIdx = updated.findIndex(i => i.id === itemData.replacesItemId);
        if (replacesIdx !== -1) {
          updated[replacesIdx].status = "Wycofany";
          updated[replacesIdx].replacedByItemId = newId;
          updated[replacesIdx].replacementDate = todayStr;
        }
      }

      saveItemsToDatabase(updated);
      toastSuccess(`Pomyślnie dodano urządzenie ${itemData.manufacturer} ${itemData.model}!`);
    }
  };

  const handleDeleteItem = (id: string) => {
    const targetItem = items.find(item => item.id === id);
    const label = targetItem ? `${targetItem.manufacturer} ${targetItem.model}` : "Urządzenie";

    if (!confirm(`Czy na pewno chcesz usunąć urządzenie "${label}" z inwentarza?`)) {
      return;
    }

    // Filter out item
    let updated = items.filter(item => item.id !== id);

    // Maintain relationships safety: if the deleted item was replacing or replaced by another, clear those references
    updated = updated.map(item => {
      const cloned = { ...item };
      if (cloned.replacesItemId === id) {
        delete cloned.replacesItemId;
        delete cloned.replacementDate;
      }
      if (cloned.replacedByItemId === id) {
        delete cloned.replacedByItemId;
        delete cloned.replacementDate;
      }
      return cloned;
    });

    saveItemsToDatabase(updated);

    if (editingItem?.id === id) {
      setEditingItem(null);
    }
    
    toastInfo(`Usunięto urządzenie ${label} z inwentarza.`);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    // Scroll smoothly to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar - Geometric Balance Design Element */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center font-bold text-white text-lg italic">S</div>
          <span className="font-bold tracking-tight text-slate-100 text-xl italic">SCANVENTORY</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-6">
          <button
            onClick={() => {
              setActiveTab("inventory");
              setEditingItem(null);
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 rounded transition-all text-left text-sm font-semibold cursor-pointer ${
              activeTab === "inventory"
                ? "bg-blue-600/20 border-r-4 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
            }`}
          >
            <Database className="w-5 h-5" />
            <span>Zasoby i Ewidencja</span>
          </button>
          
          <button
            onClick={() => setActiveTab("replacements")}
            className={`w-full px-4 py-3 flex items-center gap-3 rounded transition-all text-left text-sm font-semibold cursor-pointer ${
              activeTab === "replacements"
                ? "bg-blue-600/20 border-r-4 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
            }`}
          >
            <RotateCw className="w-5 h-5" />
            <span>Procedury Wymiany</span>
          </button>

          <button
            onClick={() => setActiveTab("improvements")}
            className={`w-full px-4 py-3 flex items-center gap-3 rounded transition-all text-left text-sm font-semibold cursor-pointer ${
              activeTab === "improvements"
                ? "bg-blue-600/20 border-r-4 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Usprawnienia i Raporty</span>
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`w-full px-4 py-3 flex items-center gap-3 rounded transition-all text-left text-sm font-semibold cursor-pointer ${
              activeTab === "about"
                ? "bg-blue-600/20 border-r-4 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
            }`}
          >
            <Info className="w-5 h-5" />
            <span>O programie i licencja</span>
          </button>
        </nav>

        {/* System status display at bottom */}
        <div className="p-6 bg-slate-800/50 border-t border-slate-800">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Status Systemu</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
            <span className="text-xs text-slate-300">OCR Engine Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header - Geometric Balance Styling */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {activeTab === "inventory" ? "Ewidencja Urządzeń" : activeTab === "replacements" ? "Rotacja i Wymiany" : activeTab === "improvements" ? "Usprawnienia i Raporty" : "O Programie i Regulamin"}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Aktualizacja: Dzisiaj • {items.length} zarejestrowanych zasobów komputerowych
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Mobile Tab Toggles (hidden on desktop) */}
            <div className="md:hidden flex items-center bg-slate-900/10 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => {
                  setActiveTab("inventory");
                  setEditingItem(null);
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                  activeTab === "inventory" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
                }`}
              >
                Inwentarz
              </button>
              <button
                onClick={() => setActiveTab("replacements")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                  activeTab === "replacements" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
                }`}
              >
                Wymiany
              </button>
              <button
                onClick={() => setActiveTab("improvements")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                  activeTab === "improvements" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
                }`}
              >
                Usprawnienia
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                  activeTab === "about" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
                }`}
              >
                O programie
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              {onedriveUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-150 rounded-lg px-3 py-1.5 text-xs shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse shrink-0"></div>
                    <span className="font-bold text-slate-700 max-w-[150px] truncate">{onedriveUser.displayName}</span>
                    <span className="text-[9px] text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                      <Cloud className="h-2.5 w-2.5" />
                      OneDrive
                    </span>
                    {oneDriveLastSync && (
                      <span 
                        className="text-[10px] text-emerald-700 border-l border-emerald-200 pl-2 ml-1 font-semibold shrink-0"
                        title={`Pełna data ostatniej synchronizacji: ${oneDriveLastSync}`}
                      >
                        Zapis: {oneDriveLastSync.split(", ")[1] || oneDriveLastSync}
                      </span>
                    )}
                    {oneDriveSyncError && (
                      <button 
                        onClick={() => setActiveTab("improvements")}
                        className="flex items-center gap-1 text-[9px] sm:text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse cursor-pointer shrink-0 ml-1.5 font-bold"
                        title="Ostatni auto-zapis nie powiódł się! Dane lokalne uległy zmianie. Kliknij tutaj, aby przejść do zakładki OneDrive i ponowić synchronizację ręcznie."
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>Błąd zapisu</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleOneDriveLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-150 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                    title="Wyloguj się z OneDrive"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Wyloguj</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></div>
                    <span className="text-slate-500 font-semibold text-[11px]">Baza Lokalna (Offline)</span>
                  </div>
                  <button
                    onClick={handleConnectOneDrive}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
                    title="Połącz ze szkolnym OneDrive"
                  >
                    <LogIn className="h-3 w-3" />
                    <span>Zaloguj OneDrive</span>
                  </button>
                </div>
              )}
              <div className="flex -space-x-1.5 shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">KJ</div>
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">AI</div>
              </div>
            </div>
          </div>
        </header>

        {/* Inner Content Scroller */}
        <div className="flex-1 p-8">
          {/* Top Info Showcase with Gradient */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-950 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <h2 className="text-base font-bold flex items-center gap-2 text-blue-100">
                <Sparkles className="h-4 w-4 text-amber-400 animate-bounce" />
                Inteligentny odczyt specyfikacji z naklejki
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Wgraj zdjęcie naklejki znamionowej lub tabliczki. Model Gemini zidentyfikuje model, producenta, numer seryjny, procesor i pamięć, automatycznie wypełniając ewidencję sprzętu.
              </p>
            </div>
          </div>

          {/* Core Stats Widget */}
          <DashboardStats items={items} />

          {/* Grid View Content */}
          {activeTab === "inventory" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Ewidencja Urządzeń (List) - Occupies 8/12 on desktop */}
              <div className="lg:col-span-8 order-2 lg:order-1">
                <HardwareList
                  items={items}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              </div>

              {/* Skanowanie OCR / Intake Form - Occupies 4/12 on desktop */}
              <div className="lg:col-span-4 order-1 lg:order-2">
                <div className="sticky top-24">
                  <HardwareForm
                    onSave={handleSaveItem}
                    editingItem={editingItem}
                    onCancelEdit={() => setEditingItem(null)}
                    items={items}
                  />
                </div>
              </div>
            </div>
          ) : activeTab === "replacements" ? (
            <ReplacementManager
              items={items}
              onUpdateItems={saveItemsToDatabase}
            />
          ) : activeTab === "improvements" ? (
            <AdvancedFeatures
              items={items}
              onUpdateItems={saveItemsToDatabase}
            />
          ) : (
            <AboutApp />
          )}
        </div>
      </main>
    </div>
  );
}
