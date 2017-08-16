/**
 * transporters
 *
 * @ignore
 */

import * as createDebug from 'debug';
import * as request from 'request-promise-native';

const debug = createDebug('sskts-api:apiRequest');
// tslint:disable-next-line
const pkg = require('../package.json');

export interface ITransporter {
    request(options: any, callback?: IBodyResponseCallback): any;
}

export type IBodyResponseCallback = Promise<any>;

/**
 * RequestError
 */
export class RequestError extends Error {
    public code: number;
    public errors: Error[];
}

/**
 * DefaultTransporter
 */
export class DefaultTransporter {
    /**
     * Default user agent.
     */
    public static readonly USER_AGENT: string = `sskts-api-nodejs-client/${pkg.version}`;

    public expectedStatusCodes: number[];

    constructor(expectedStatusCodes: number[]) {
        this.expectedStatusCodes = expectedStatusCodes;
    }

    /**
     * Configures request options before making a request.
     */
    public static CONFIGURE(options: request.OptionsWithUri): request.OptionsWithUri {
        // set transporter user agent
        options.headers = (options.headers !== undefined) ? options.headers : {};
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = DefaultTransporter.USER_AGENT;
        } else if (options.headers['User-Agent'].indexOf(DefaultTransporter.USER_AGENT) === -1) {
            options.headers['User-Agent'] = `${options.headers['User-Agent']} ${DefaultTransporter.USER_AGENT}`;
        }

        return options;
    }

    /**
     * Makes a request with given options and invokes callback.
     */
    public async request(options: request.OptionsWithUri) {
        const requestOptions = DefaultTransporter.CONFIGURE(options);

        return await request(requestOptions)
            .then((res) => this.wrapCallback(res));
    }

    /**
     * Wraps the response callback.
     */
    private wrapCallback(res: request.FullResponse): any {
        let err: RequestError = new RequestError('An unexpected error occurred');

        debug('request processed', res.statusCode, res.body);
        if (res.statusCode !== undefined) {
            if (this.expectedStatusCodes.indexOf(res.statusCode) < 0) {
                if (typeof res.body === 'string') {
                    // Consider all 4xx and 5xx responses errors.
                    err = new RequestError(res.body);
                    err.code = res.statusCode;
                }

                if (typeof res.body === 'object' && res.body.errors !== undefined) {
                    err = new RequestError((<any[]>res.body.errors).map((error) => `${error.title}:${error.detail}`).join('\n'));
                    err.code = res.statusCode;
                    err.errors = res.body.errors;
                }
            }

            if (res.body !== undefined && res.body.data !== undefined) {
                // consider 200,201,404
                return res.body.data;
            } else {
                // consider 204
                return;
            }
        }

        throw err;
    }
}
