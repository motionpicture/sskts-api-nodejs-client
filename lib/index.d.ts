/**
 * sasaki API Node.js Client
 *
 * @ignore
 */
import * as sasaki from '@motionpicture/sasaki-api-abstract';
import ClientCredentialsClient from './auth/clientCredentialsClient';
import OAuth2client from './auth/oAuth2client';
/**
 * factory
 * All object interfaces are here.
 * 全てのオブジェクトのインターフェースはここに含まれます。
 * @export
 */
export import factory = sasaki.factory;
export import service = sasaki.service;
export import transporters = sasaki.transporters;
/**
 * each OAuth2 clients
 */
export declare namespace auth {
    /**
     * OAuth2 client using grant type 'client_credentials'
     */
    class ClientCredentials extends ClientCredentialsClient {
    }
    /**
     * OAuth2 client using grant type 'authorization_code'
     */
    class OAuth2 extends OAuth2client {
    }
}
