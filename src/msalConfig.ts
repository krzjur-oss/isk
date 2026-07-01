import * as msal from "@azure/msal-browser";

export const msalConfig = {
    auth: {
        clientId: "TU_WKLEJ_APPLICATION_CLIENT_ID",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "https://krzjur-oss.github.io/isk/"
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
    }
};

export const msalInstance = new msal.PublicClientApplication(msalConfig);

let msalInitPromise: Promise<void> | null = null;

export function ensureMsalInit(): Promise<void> {
    if (!msalInitPromise) {
        msalInitPromise = msalInstance.initialize().catch(err => {
            msalInitPromise = null;
            throw err;
        });
    }
    return msalInitPromise;
}

export async function getToken() {
    await ensureMsalInit();
    const account = msalInstance.getAllAccounts()[0];
    if (!account) {
        throw new Error("Brak zalogowanego konta Microsoft 365 (MSAL).");
    }

    const tokenRequest = {
        scopes: ["Files.ReadWrite", "Files.ReadWrite.All"],
        account
    };

    const tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
    return tokenResponse.accessToken;
}

export async function saveJsonToOneDrive(data: any) {
    const token = await getToken();

    const url = "https://graph.microsoft.com/v1.0/me/drive/root:/isk-data.json:/content";

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
