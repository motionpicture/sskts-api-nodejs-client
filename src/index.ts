// tslint:disable:max-classes-per-file

/**
 * sasaki API Node.js Client
 *
 * @ignore
 */

import * as factory from '@motionpicture/sskts-factory';

import ClientCredentialsClient from './auth/clientCredentialsClient';
import OAuth2client from './auth/oAuth2client';

import { IOptions } from './service';
import { EventService } from './service/event';
import { OrderService } from './service/order';
import { OrganizationService } from './service/organization';
import { PersonService } from './service/person';
import { PlaceService } from './service/place';
import { PlaceOrderTransactionService } from './service/transaction/placeOrder';

/**
 * factory
 * All object interfaces are here.
 * 全てのオブジェクトのインターフェースはここに含まれます。
 * @export
 */
export import factory = factory;

/**
 * each OAuth2 clients
 */
export namespace auth {
    /**
     * OAuth2 client using grant type 'client_credentials'
     */
    export class ClientCredentials extends ClientCredentialsClient { }
    /**
     * OAuth2 client using grant type 'authorization_code'
     */
    export class OAuth2 extends OAuth2client { }
}

/**
 * each API services
 */
export namespace service {
    export class Event extends EventService { }
    export class Order extends OrderService { }
    export class Organization extends OrganizationService { }
    export class Person extends PersonService { }
    export class Place extends PlaceService { }

    /**
     * event service
     * @param {IOptions} options service configurations
     */
    export function event(options: IOptions) {
        return new EventService(options);
    }
    /**
     * order service
     * @param {IOptions} options service configurations
     */
    export function order(options: IOptions) {
        return new OrderService(options);
    }
    /**
     * organization service
     * @param {IOptions} options service configurations
     */
    export function organization(options: IOptions) {
        return new OrganizationService(options);
    }
    /**
     * person service
     * @param {IOptions} options service configurations
     */
    export function person(options: IOptions) {
        return new PersonService(options);
    }
    /**
     * place service
     * @param {IOptions} options service configurations
     */
    export function place(options: IOptions) {
        return new PlaceService(options);
    }

    export namespace transaction {
        export class PlaceOrder extends PlaceOrderTransactionService { }

        /**
         * placeOrder transaction service
         * @param {IOptions} options service configurations
         */
        export function placeOrder(options: IOptions) {
            return new PlaceOrderTransactionService(options);
        }
    }
}
