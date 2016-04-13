var RealityCheckData = (function () {
    'use strict';

    var defaultInterval = 60000;
    var durationTemplateString = '[_1] days [_2] hours [_3] minutes';
    var tradingTimeTemplate = 'Your trading statistics since [_1].';

    function getSummaryAsync() {
        BinarySocket.send({reality_check: 1});
    }

    function getAck() {
        return LocalStore.get('reality_check.ack');
    }

    function resetCloseValue() {
        LocalStore.set('reality_check.close', 0);
    }

    function triggerCloseEvent() {
        LocalStore.set('reality_check.close', 1);
    }
    
    function updateAck() {
        LocalStore.set('reality_check.ack', 1);
    }

    function getInterval() {
        return LocalStore.get('reality_check.interval');
    }

    function updateInterval(ms) {
        LocalStore.set('reality_check.interval', ms);
    }

    function clear() {
        LocalStore.remove('reality_check.ack');
        LocalStore.remove('reality_check.interval');
    }

    function resetInvalid() {
        var ack = LocalStore.get('reality_check.ack');
        var interval = +(LocalStore.get('reality_check.interval'));
        if (ack !== '0' && ack !== '1') {
            LocalStore.set('reality_check.ack', 0);
        }

        if (!interval) {
            LocalStore.set('reality_check.interval', defaultInterval);
        }
    }

    function summaryData(wsData) {
        var loginTime = moment(new Date(wsData.start_time * 1000));
        var currentTime = moment();

        var sessionDuration = moment.duration(currentTime.diff(loginTime));
        var durationD = sessionDuration.get('days');
        var durationH = sessionDuration.get('hours');
        var durationM = sessionDuration.get('minutes');

        var durationString = durationTemplateString
            .replace('[_1]', durationD)
            .replace('[_2]', durationH)
            .replace('[_3]', durationM);

        var turnover = wsData.buy_amount + wsData.sell_amount;
        var profitLoss = wsData.sell_amount - wsData.buy_amount;

        var startTimeString = tradingTimeTemplate.replace('[_1]', loginTime.format('YYYY-MM-DD HH:mm:ss GMT'));
        return {
            startTimeString: startTimeString,
            loginTime: loginTime.format('YYYY-MM-DD HH:mm:ss GMT'),
            currentTime: currentTime.format('YYYY-MM-DD HH:mm:ss GMT'),
            sessionDuration: durationString,
            loginId: wsData.loginid,
            currency: wsData.currency,
            turnover: turnover,
            profitLoss: profitLoss,
            contractsBought: wsData.buy_count,
            contractsSold: wsData.sell_count,
            openContracts: wsData.open_contract_count,
            potentialProfit: wsData.potential_profit
        };
    }

    return {
        getSummaryAsync: getSummaryAsync,
        getAck: getAck,
        resetCloseValue: resetCloseValue,
        updateAck: updateAck,
        getInterval: getInterval,
        updateInterval: updateInterval,
        clear: clear,
        resetInvalid: resetInvalid,
        summaryData: summaryData,
        triggerCloseEvent: triggerCloseEvent
    };
}());
