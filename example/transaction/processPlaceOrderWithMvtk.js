/**
 * ムビチケで購入するサンプル
 * @ignore
 */

const COA = require('@motionpicture/coa-service');
const GMO = require('@motionpicture/gmo-service');
const MVTK = require('@motionpicture/mvtk-service');
const debug = require('debug')('sskts-api-nodejs-client:samples');
const moment = require('moment');
const sasaki = require('../../');

// ムビチケサービス初期化
MVTK.initialize(
    process.env.TEST_MVTK_ENDPOINT_SERVICE_01,
    process.env.TEST_MVTK_ENDPOINT_SERVICE_02,
    process.env.TEST_MVTK_ENDPOINT_RESERVE_SERVICE
);

async function main(theaterCode) {
    const auth = new sasaki.auth.ClientCredentials({
        domain: process.env.TEST_AUTHORIZE_SERVER_DOMAIN,
        clientId: process.env.TEST_CLIENT_ID,
        clientSecret: process.env.TEST_CLIENT_SECRET,
        scopes: [
            process.env.TEST_RESOURCE_IDENTIFIER + '/transactions',
            process.env.TEST_RESOURCE_IDENTIFIER + '/events.read-only',
            process.env.TEST_RESOURCE_IDENTIFIER + '/organizations.read-only'
        ],
        state: 'teststate'
    });

    const events = sasaki.service.event({
        endpoint: process.env.SSKTS_API_ENDPOINT,
        auth: auth
    });

    const organizations = sasaki.service.organization({
        endpoint: process.env.SSKTS_API_ENDPOINT,
        auth: auth
    });

    const placeOrderTransactions = sasaki.service.transaction.placeOrder({
        endpoint: process.env.SSKTS_API_ENDPOINT,
        auth: auth
    });

    // ムビチケ使用可能なイベント詳細を取得
    const individualScreeningEvent = await events.findIndividualScreeningEvent({
        identifier: '11816221020171012301540'
    });
    if (individualScreeningEvent === null) {
        throw new Error('specified screening event not found');
    }

    // search movie theater organizations
    const movieTheaterOrganization = await organizations.findMovieTheaterByBranchCode({
        branchCode: individualScreeningEvent.coaInfo.theaterCode
    });
    if (movieTheaterOrganization === null) {
        throw new Error('movie theater shop not open');
    }

    const dateJouei = individualScreeningEvent.coaInfo.dateJouei;
    const titleCode = individualScreeningEvent.coaInfo.titleCode;
    const titleBranchNum = individualScreeningEvent.coaInfo.titleBranchNum;
    const timeBegin = individualScreeningEvent.coaInfo.timeBegin;
    const screenCode = individualScreeningEvent.coaInfo.screenCode;

    // start a transaction
    debug('starting a transaction...');
    const transaction = await placeOrderTransactions.start({
        expires: moment().add(10, 'minutes').toDate(),
        sellerId: movieTheaterOrganization.id
    });

    // 販売可能チケット検索
    const salesTicketResult = await COA.services.reserve.salesTicket({
        theaterCode: theaterCode,
        dateJouei: dateJouei,
        titleCode: titleCode,
        titleBranchNum: titleBranchNum,
        timeBegin: timeBegin,
        flgMember: COA.services.reserve.FlgMember.NonMember
    });
    debug('salesTicketResult:', salesTicketResult);

    // COA空席確認
    const getStateReserveSeatResult = await COA.services.reserve.stateReserveSeat({
        theaterCode: theaterCode,
        dateJouei: dateJouei,
        titleCode: titleCode,
        titleBranchNum: titleBranchNum,
        timeBegin: timeBegin,
        screenCode: screenCode
    });
    debug('getStateReserveSeatResult is', getStateReserveSeatResult);
    const sectionCode = getStateReserveSeatResult.listSeat[0].seatSection;
    const freeSeatCodes = getStateReserveSeatResult.listSeat[0].listFreeSeat.map((freeSeat) => {
        return freeSeat.seatNum;
    });
    debug('freeSeatCodes count', freeSeatCodes.length);
    if (getStateReserveSeatResult.cntReserveFree === 0) {
        throw new Error('no available seats.');
    }

    // const purchaseNumberAuthIn = {
    //     kgygishCd: 'SSK000', //興行会社コード
    //     jhshbtsCd: MVTK.PurchaseNumberAuthUtilities.INFORMATION_TYPE_CODE_VALID, //情報種別コード
    //     knyknrNoInfoIn: [{
    //         KNYKNR_NO: '3409717149', //購入管理番号
    //         PIN_CD: '3896' // PINコード
    //     }],
    //     skhnCd: `${titleCode}${`00${titleBranchNum}`.slice(-2)}`, // 作品コード
    //     stCd: `00${theaterCode}`.slice(-2), // サイトコード
    //     jeiYmd: moment(dateJouei, 'YYYYMMDD').format('YYYY/MM/DD') //上映年月日
    // };
    // const mvtkNumberAuthService = MVTK.createPurchaseNumberAuthService();
    // const purchaseNumberAuthResults = await mvtkNumberAuthService.purchaseNumberAuth(purchaseNumberAuthIn);
    // debug('purchaseNumberAuthResults:', purchaseNumberAuthResults);

    // ムビチケ購入管理番号認証結果がこんなだったとして...
    const purchaseNumberAuthResult = {
        knyknrNo: '3409717149',
        dnshKmTyp: '01',
        znkkkytsknGkjknTyp: '01',
        ykknmiNum: '10',
        ykknInfo: [{
            ykknshTyp: '01',
            eishhshkTyp: '01',
            ykknKnshbtsmiNum: '10',
            knshknhmbiUnip: '1400',
            kijUnip: '1200'
        }],
        mkknInfo: []
    }

    // ムビチケをCOA券種に変換
    const mvtkTicket = await COA.services.master.mvtkTicketcode({
        theaterCode: theaterCode,
        kbnDenshiken: purchaseNumberAuthResult.dnshKmTyp,
        kbnMaeuriken: purchaseNumberAuthResult.znkkkytsknGkjknTyp,
        kbnKensyu: purchaseNumberAuthResult.ykknInfo[0].ykknshTyp,
        salesPrice: parseInt(purchaseNumberAuthResult.ykknInfo[0].knshknhmbiUnip, 10),
        appPrice: parseInt(purchaseNumberAuthResult.ykknInfo[0].kijUnip, 10),
        kbnEisyahousiki: purchaseNumberAuthResult.ykknInfo[0].eishhshkTyp,
        titleCode: titleCode,
        titleBranchNum: titleBranchNum
    });
    debug('mvtkTicket:', mvtkTicket);

    // COAオーソリ追加
    debug('authorizing seat reservation...');
    const totalPrice = salesTicketResult[0].salePrice;

    const seatReservationAuthorization = await placeOrderTransactions.createSeatReservationAuthorization({
        transactionId: transaction.id,
        eventIdentifier: individualScreeningEvent.identifier,
        offers: [
            {
                seatSection: sectionCode,
                seatNumber: freeSeatCodes[0],
                ticketInfo: {
                    ticketCode: mvtkTicket.ticketCode,
                    ticketName: mvtkTicket.ticketName,
                    ticketNameEng: mvtkTicket.ticketNameEng,
                    ticketNameKana: mvtkTicket.ticketNameKana,
                    stdPrice: 0,
                    addPrice: mvtkTicket.addPrice,
                    disPrice: 0,
                    salePrice: mvtkTicket.addPrice,
                    mvtkAppPrice: parseInt(purchaseNumberAuthResult.ykknInfo[0].kijUnip, 10),
                    ticketCount: 1,
                    seatNum: freeSeatCodes[0],
                    addGlasses: mvtkTicket.addPriceGlasses,
                    kbnEisyahousiki: purchaseNumberAuthResult.ykknInfo[0].eishhshkTyp,
                    mvtkNum: purchaseNumberAuthResult.knyknrNo,
                    mvtkKbnDenshiken: purchaseNumberAuthResult.dnshKmTyp,
                    mvtkKbnMaeuriken: purchaseNumberAuthResult.znkkkytsknGkjknTyp,
                    mvtkKbnKensyu: purchaseNumberAuthResult.ykknInfo[0].ykknshTyp,
                    mvtkSalesPrice: parseInt(purchaseNumberAuthResult.ykknInfo[0].knshknhmbiUnip, 10)
                }
            }
        ]
    });
    debug('seatReservationAuthorization is', seatReservationAuthorization);

    // 本当はここでムビチケ着券処理

    // ムビチケ着券結果がこんなだったとして...
    const mvtkResult = {
        price: 1400,
        seatInfoSyncIn: {
            kgygishCd: 'SSK000',
            yykDvcTyp: '00',
            trkshFlg: '0',
            kgygishSstmZskyykNo: '118124',
            kgygishUsrZskyykNo: '124',
            jeiDt: '2017/03/02 10:00:00',
            kijYmd: '2017/03/02',
            stCd: theaterCode.slice(-2),
            screnCd: screenCode,
            knyknrNoInfo: [
                {
                    knyknrNo: purchaseNumberAuthResult.knyknrNo,
                    pinCd: '7648',
                    knshInfo: [
                        { knshTyp: purchaseNumberAuthResult.ykknInfo[0].ykknshTyp, miNum: 1 }
                    ]
                }
            ],
            zskInfo: seatReservationAuthorization.result.updTmpReserveSeatResult.listTmpReserve.map((tmpReserve) => {
                return { zskCd: tmpReserve.seatNum };
            }),
            skhnCd: `${titleCode}${`0${titleBranchNum}`.slice(-2)}`
        }
    };

    // ムビチケオーソリ追加(着券した体で) 値はほぼ適当です
    debug('adding authorizations mvtk...');
    let mvtkAuthorization = await placeOrderTransactions.createMvtkAuthorization({
        transactionId: transaction.id,
        mvtk: mvtkResult
    });
    debug('addMvtkAuthorization is', mvtkAuthorization);

    // ムビチケ取消
    await placeOrderTransactions.cancelMvtkAuthorization({
        transactionId: transaction.id,
        actionId: mvtkAuthorization.id
    });

    // 再度ムビチケ追加
    debug('adding authorizations mvtk...', theaterCode.slice(-2));
    mvtkAuthorization = await placeOrderTransactions.createMvtkAuthorization({
        transactionId: transaction.id,
        mvtk: mvtkResult
    });
    debug('addMvtkAuthorization is', mvtkAuthorization);
    debug('registering a customer contact...');
    const contact = {
        givenName: 'John',
        familyName: 'Smith',
        telephone: '09012345678',
        email: process.env.SSKTS_DEVELOPER_EMAIL
    };
    await placeOrderTransactions.setCustomerContact({
        transactionId: transaction.id,
        contact: contact
    });
    debug('customer contact registered');

    // 取引成立
    debug('confirming transaction...');
    const order = await placeOrderTransactions.confirm({
        transactionId: transaction.id
    });
    debug('your order is', order);
}

main('118').then(() => {
    debug('main processed.');
}).catch((err) => {
    console.error(err.message);
});