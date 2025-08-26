import { getHaloConfig } from "./halo-config";

export interface HaloTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface HaloUser {
    id: string;
    username: string;
    email?: string;
}

class HaloAuthService {
    private tokens: HaloTokens | null = null;
    private user: HaloUser | null = null;
    private refreshPromise: Promise<boolean> | null = null;

    constructor() {
        this.loadTokens();
    }

    private loadTokens() {
        const stored = localStorage.getItem("halo-tokens");
        if (stored) {
            try {
                this.tokens = JSON.parse(stored);
            } catch (error) {
                console.error("Failed to parse stored tokens:", error);
                this.clearTokens();
            }
        }
    }

    private saveTokens(tokens: HaloTokens) {
        this.tokens = tokens;
        localStorage.setItem("halo-tokens", JSON.stringify(tokens));
    }

    private clearTokens() {
        this.tokens = null;
        this.user = null;
        localStorage.removeItem("halo-tokens");
        localStorage.removeItem("halo-code-verifier");
    }

    // Start OAuth flow
    async startAuth(): Promise<void> {
        const config = getHaloConfig();

        // Validate required fields
        if (!config.authServer || !config.clientId || !config.redirectUri) {
            throw new Error(
                "Missing required configuration: authServer, clientId, or redirectUri"
            );
        }

        const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: "code",
            scope: "all offline_access",
            redirect_uri: config.redirectUri,
        });

        // Log the exact scope being sent
        const authUrl = `${config.authServer}/authorize?${params.toString()}`;
        window.location.href = authUrl;
    }

    // Handle OAuth callback
    async handleCallback(code: string): Promise<boolean> {
        try {
            const config = getHaloConfig();

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
                scope: "all offline_access",
            });

            // Log the exact scope being sent
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
            this.saveTokens(tokens);

            // Clean up
            localStorage.removeItem("halo-code-verifier");

            return true;
        } catch (error) {
            console.error("OAuth callback error:", error);
            return false;
        }
    }

    // Refresh access token with deduplication
    async refreshToken(): Promise<boolean> {
        // If a refresh is already in progress, wait for it
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        // Create new refresh promise
        this.refreshPromise = this._performRefresh();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.refreshPromise = null;
        }
    }

    private async _performRefresh(): Promise<boolean> {
        try {
            if (!this.tokens?.refresh_token) {
                console.warn("No refresh token available");
                return false;
            }

            const config = getHaloConfig();
            const response = await fetch(`${config.authServer}/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    client_id: config.clientId,
                    refresh_token: this.tokens.refresh_token,
                    scope: "all offline_access",
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Token refresh failed:",
                    response.status,
                    errorText
                );

                // If refresh token is invalid/expired, clear everything
                if (response.status === 400 || response.status === 401) {
                    console.warn(
                        "Refresh token is invalid/expired, clearing authentication"
                    );
                    this.clearTokens();
                    this.redirectToLogin();
                    return false;
                }

                throw new Error(`Token refresh failed: ${response.statusText}`);
            }

            const newTokens: HaloTokens = await response.json();
            this.saveTokens(newTokens);
            return true;
        } catch (error) {
            console.error("Token refresh error:", error);
            this.clearTokens();
            this.redirectToLogin();
            return false;
        }
    }

    // Get access token (with refresh if needed)
    async getAccessToken(): Promise<string | null> {
        if (!this.tokens) {
            return null;
        }

        // Check if token is expired (with 5 minute buffer)
        const expiresAt = this.tokens.expires_in * 1000 + Date.now();
        if (Date.now() > expiresAt - 300000) {
            const refreshed = await this.refreshToken();
            if (!refreshed) {
                return null;
            }
        }

        return this.tokens.access_token;
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.tokens !== null;
    }

    // Logout and redirect to login
    logout() {
        console.log("Logging out user");
        this.clearTokens();
        this.user = null;
        this.redirectToLogin();
    }

    // Redirect to login page
    private redirectToLogin() {
        // Clear any stored auth state
        sessionStorage.clear();

        // Redirect to login page
        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
    }

    // Get current user info
    getCurrentUser(): HaloUser | null {
        return this.user;
    }

    // Force clear tokens (useful for testing or manual logout)
    forceLogout() {
        this.clearTokens();
        this.user = null;
        this.redirectToLogin();
    }
}

export const haloAuthService = new HaloAuthService();
