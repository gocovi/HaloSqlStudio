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

export interface AuthConfig {
    authServer: string;
    clientId: string;
    redirectUri: string;
}
