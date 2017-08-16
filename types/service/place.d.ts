/**
 * 場所サービス
 *
 * @namespace service.place
 */
import * as sskts from '@motionpicture/sskts-domain';
import OAuth2client from '../auth/oAuth2client';
/**
 * 劇場検索
 */
export declare function searchMovieTheaters(args: {
    auth: OAuth2client;
    /**
     * 検索条件
     */
    searchConditions?: sskts.service.place.ISearchMovieTheatersConditions;
}): Promise<sskts.service.place.ISearchMovieTheaterResult[]>;
/**
 * 劇場情報取得
 */
export declare function findMovieTheater(args: {
    auth: OAuth2client;
    /**
     * 枝番号
     */
    branchCode: string;
}): Promise<sskts.factory.place.movieTheater.IPlace | null>;
