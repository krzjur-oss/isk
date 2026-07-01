import * as msal from "@azure/msal-browser";

// Export a mock/empty msalInstance to satisfy static imports, but prefer loginMicrosoft()
export const msalInstance = {
    loginPopup: async () => {
        return loginMicrosoft();
    }
} as any;

let activeMsalInstance: msal.PublicClientApplication | null = null;
let activeMsalInitPromise: Promise<void> | null = null;

export function getMsalInstance(): msal.PublicClientApplication | null {
    const useCustom = localStorage.getItem("onedrive_use_custom") === "true";
    const customClientId = localStorage.getItem("onedrive_custom_client_id");
    
    if (useCustom && customClientId) {
        if (!activeMsalInstance) {
            const config = {
                auth: {
                    clientId: customClientId,
                    authority: `https://login.microsoftonline.com/${localStorage.getItem("onedrive_custom_tenant_id") || "common"}`,
                    redirectUri: window.location.origin + "/"
                },
                cache: {
                    cacheLocation: "localStorage",
                    storeAuthStateInCookie: false
                }
            };
            activeMsalInstance = new msal.PublicClientApplication(config);
            activeMsalInitPromise = null;
        }
        return activeMsalInstance;
    }
    
    return null;
}

export function resetMsalInstance() {
    activeMsalInstance = null;
    activeMsalInitPromise = null;
}

export function ensureMsalInit(): Promise<void> {
    const instance = getMsalInstance();
    if (!instance) {
        return Promise.resolve();
    }
    
    if (!activeMsalInitPromise) {
        activeMsalInitPromise = instance.initialize().catch(err => {
            activeMsalInitPromise = null;
            throw err;
        });
    }
    return activeMsalInitPromise;
}

export async function loginMicrosoft(): Promise<{ accessToken: string; account: any; expiresOn: Date | null }> {
    const useCustom = localStorage.getItem("onedrive_use_custom") === "true";
    
    if (useCustom) {
        const customClientId = localStorage.getItem("onedrive_custom_client_id");
        if (!customClientId) {
            throw new Error("Wprowadź własny Client ID w ustawieniach integracji.");
        }
        
        await ensureMsalInit();
        const instance = getMsalInstance();
        if (!instance) {
            throw new Error("Nie udało się utworzyć instancji MSAL.");
        }
        
        const loginRequest = {
            scopes: ["Files.ReadWrite", "Files.ReadWrite.All", "User.Read"]
        };
        
        const response = await instance.loginPopup(loginRequest);
        return {
            accessToken: response.accessToken,
            account: response.account,
            expiresOn: response.expiresOn
        };
    } else {
        // Backend-driven popup flow
        return new Promise(async (resolve, reject) => {
            try {
                const origin = encodeURIComponent(window.location.origin);
                const res = await fetch(`/api/auth/microsoft/url?origin=${origin}`);
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Serwer nie jest gotowy do obsługi połączenia Microsoft 365.");
                }
                
                const { url } = await res.json();
                
                const width = 600;
                const height = 650;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;
                
                const popup = window.open(
                    url,
                    "microsoft-oauth",
                    `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
                );
                
                if (!popup) {
                    throw new Error("Wyskakujące okno zostało zablokowane! Zezwól na wyskakujące okienka w przeglądarce.");
                }
                
                // Listen to oauth message callback from server
                const handleMessage = (event: MessageEvent) => {
                    const origin = event.origin;
                    if (origin !== window.location.origin && !origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("3000")) {
                        return;
                    }
                    
                    if (event.data?.type === "MS_AUTH_SUCCESS") {
                        window.removeEventListener("message", handleMessage);
                        const { tokens, user } = event.data;
                        resolve({
                            accessToken: tokens.access_token,
                            account: {
                                name: user.displayName,
                                username: user.principalName
                            },
                            expiresOn: tokens.expires_at ? new Date(tokens.expires_at) : null
                        });
                    } else if (event.data?.type === "MS_AUTH_ERROR") {
                        window.removeEventListener("message", handleMessage);
                        reject(new Error(event.data.error || "Autoryzacja zakończona błędem."));
                    }
                };
                
                window.addEventListener("message", handleMessage);
                
                // Popup closing checker
                const timer = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(timer);
                        window.removeEventListener("message", handleMessage);
                        reject(new Error("Okno logowania zostało zamknięte przed ukończeniem autoryzacji."));
                    }
                }, 1000);
            } catch (err) {
                reject(err);
            }
        });
    }
}

export async function getToken(): Promise<string> {
    const useCustom = localStorage.getItem("onedrive_use_custom") === "true";
    
    if (useCustom) {
        await ensureMsalInit();
        const instance = getMsalInstance();
        if (!instance) {
            throw new Error("Nie znaleziono instancji MSAL dla własnej konfiguracji.");
        }
        
        const account = instance.getAllAccounts()[0];
        if (!account) {
            throw new Error("Brak zalogowanego własnego konta Microsoft 365.");
        }
        
        const tokenRequest = {
            scopes: ["Files.ReadWrite", "Files.ReadWrite.All", "User.Read"],
            account
        };
        
        const tokenResponse = await instance.acquireTokenSilent(tokenRequest);
        return tokenResponse.accessToken;
    } else {
        // Backend-driven flow
        const tokensStr = localStorage.getItem("onedrive_tokens");
        if (!tokensStr) {
            throw new Error("Brak zalogowanego konta Microsoft 365.");
        }
        
        const tokens = JSON.parse(tokensStr);
        const now = Date.now();
        
        // Refresh token if close to expiry (5 mins)
        if (tokens.expires_at && now + 300000 >= tokens.expires_at) {
            if (tokens.refresh_token) {
                console.log("Access token expiring soon. Refreshing via backend API...");
                const response = await fetch("/api/auth/microsoft/refresh", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh_token: tokens.refresh_token })
                });
                
                if (!response.ok) {
                    throw new Error(`Błąd odświeżania tokenu przez serwer: ${response.statusText}`);
                }
                
                const tokenData = await response.json();
                const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
                
                const newTokens = {
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token || tokens.refresh_token,
                    expires_at: expiresAt,
                    is_custom: true
                };
                
                localStorage.setItem("onedrive_tokens", JSON.stringify(newTokens));
                return tokenData.access_token;
            } else {
                throw new Error("Token wygasł i brak tokenu odświeżania.");
            }
        }
        
        return tokens.access_token;
    }
}

export async function saveJsonToOneDrive(data: any) {
    const token = await getToken();
    const url = "https://graph.microsoft.com/v1.0/me/drive/root:/Scanventory/inventory.json:/content";

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        console.error("Błąd zapisu do OneDrive:", response.status, await response.text());
    } else {
        console.log("Plik zapisany poprawnie w OneDrive");
    }
}
