import type { HaloTokens, HaloUser, AuthConfig } from "./types";

// Token storage keys
const TOKEN_STORAGE_KEY = "halo-tokens";

// Track processed authorization codes to prevent duplicates
const processedCodes = new Set<string>();

// Clean up old processed codes periodically (every 5 minutes)
setInterval(() => {
    if (processedCodes.size > 100) {
        console.log("Cleaning up processed authorization codes");
        processedCodes.clear();
    }
}, 5 * 60 * 1000);

export function loadTokens(): HaloTokens | null {
    try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error("Failed to parse stored tokens:", error);
        clearTokens();
    }
    return null;
}

export function saveTokens(tokens: HaloTokens): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearProcessedCodes(): void {
    processedCodes.clear();
}

export function getCurrentUser(): HaloUser | null {
    const tokens = loadTokens();
    if (tokens) {
        return {
            id: "user",
            username: "user",
        };
    }
    return null;
}

export function isAuthenticated(): boolean {
    const tokens = loadTokens();
    if (!tokens) return false;

    // Check if token is expired
    const now = Date.now();
    const expiresAt = now + tokens.expires_in * 1000;
    return now < expiresAt;
}

export function startAuth(config: AuthConfig): void {
    // Validate required fields
    if (!config.authServer || !config.clientId || !config.redirectUri) {
        throw new Error(
            "Missing required configuration: authServer, clientId, or redirectUri"
        );
    }

    const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: "code",
        scope: "read:reporting edit:reporting offline_access",
        redirect_uri: config.redirectUri,
    });

    const authUrl = `${config.authServer}/authorize?${params.toString()}`;
    window.location.href = authUrl;
}

export async function handleCallback(
    config: AuthConfig,
    code: string
): Promise<boolean> {
    try {
        // Check if this code has already been processed
        if (processedCodes.has(code)) {
            console.warn(
                "Authorization code already processed, skipping:",
                code
            );
            return false;
        }

        // Mark this code as being processed
        processedCodes.add(code);

        // Validate required fields
        if (!config.authServer || !config.clientId || !config.redirectUri) {
            throw new Error(
                "Missing required configuration: authServer, clientId, or redirectUri"
            );
        }

        const tokenParams = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            code: code,
            scope: "read:reporting edit:reporting offline_access",
        });

        const tokenResponse = await fetch(`${config.authServer}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: tokenParams,
        });

        if (!tokenResponse.ok) {
            let errorMessage = `Token request failed: ${tokenResponse.statusText}`;

            try {
                const errorData = await tokenResponse.text();
                console.error("Token request error response:", errorData);
                if (errorData) {
                    errorMessage += ` - ${errorData}`;
                }
            } catch (e) {
                console.error("Could not read error response:", e);
            }

            throw new Error(errorMessage);
        }

        const tokens: HaloTokens = await tokenResponse.json();
        saveTokens(tokens);

        return true;
    } catch (error) {
        console.error("OAuth callback error:", error);
        return false;
    }
}

export async function refreshToken(config: AuthConfig): Promise<boolean> {
    try {
        const tokens = loadTokens();
        if (!tokens?.refresh_token) {
            console.warn("No refresh token available");
            return false;
        }

        const response = await fetch(`${config.authServer}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: config.clientId,
                refresh_token: tokens.refresh_token,
                scope: "read:reporting edit:reporting offline_access",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Token refresh failed:", response.status, errorText);

            // If refresh token is invalid/expired, clear everything
            if (response.status === 400 || response.status === 401) {
                console.warn(
                    "Refresh token is invalid/expired, clearing authentication"
                );
                clearTokens();
                return false;
            }

            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        const newTokens: HaloTokens = await response.json();
        saveTokens(newTokens);
        return true;
    } catch (error) {
        console.error("Token refresh error:", error);
        clearTokens();
        return false;
    }
}

export function logout(): void {
    clearTokens();
    // Clear processed codes on logout
    processedCodes.clear();
    // Redirect to login page
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}
