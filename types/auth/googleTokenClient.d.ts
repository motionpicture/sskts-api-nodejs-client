import ICredentials from './credentials';
import OAuth2client from './oAuth2client';
/**
 * GooleサインインOAuthクライアント
 */
export default class GoogleTokenClient extends OAuth2client {
    static SSKTS_OAUTH2_TOKEN_GOOGLE_URL: string;
    idToken: string;
    constructor(idToken: string, clientId: string, state: string, scopes: string[]);
    getToken(): Promise<ICredentials>;
    /**
     * Refreshes the access token.
     */
    protected refreshToken(__: string): Promise<ICredentials>;
}
