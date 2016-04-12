var RealityCheck = (function () {
    'use strict';
    var hiddenClass = 'invisible';
    var loginTime;

    function realityCheckWSHandler(response) {
        if ($.isEmptyObject(response.reality_check)) {
            // not required for reality check
            return;
        }
        var summary = RealityCheckData.summaryData(response.reality_check);
        RealityCheckUI.renderSummaryPopUp(summary);
    }

    function computeIntervalForNextPopup(loginTime, interval) {
        var currentTime = Date.now();
        var timeLeft = interval - ((currentTime - loginTime) % interval);
        return timeLeft;
    }

    function startSummaryTimer() {
        var interval = RealityCheckData.getInterval();
        var toWait = computeIntervalForNextPopup(loginTime, interval);
        window.setTimeout(function () {
            RealityCheckData.resetCloseValue();
            RealityCheckData.getSummaryAsync();
        }, toWait);
    }

    function realityStorageEventHandler(ev) {
        if (ev.key === 'reality_check.ack' && ev.newValue === '1') {
            RealityCheckUI.closePopUp();
            startSummaryTimer();
        } else if (ev.key === 'reality_check.close' && ev.newValue === '1') {
            RealityCheckUI.closePopUp();
            startSummaryTimer();
        }
    }

    function onContinueClick() {
        var intervalMinute = $('#realityDuration').val();

        if (intervalMinute < 10 || intervalMinute > 120) {
            var minimumValueMsg = Content.errorMessage('number_should_between', '10 to 120');
            $('p.error-msg').text(minimumValueMsg);
            $('p.error-msg').removeClass(hiddenClass);
            return;
        }
        
        var intervalMs = intervalMinute * 60 * 1000;
        RealityCheckData.updateInterval(intervalMs);
        RealityCheckData.triggerCloseEvent();
        RealityCheckData.updateAck();
        RealityCheckUI.closePopUp();
    }

    function onLogoutClick() {
        logout();
    }

    function logout() {
        RealityCheckData.clear();
        BinarySocket.send({"logout": "1"});
    }

    function init() {
        if (!page.client.require_reality_check()) {
            return;
        }

        var rcCookie = getCookieItem('reality_check');
        loginTime = rcCookie && rcCookie.split(',')[1] * 1000;

        RealityCheckData.resetInvalid();
        window.addEventListener('storage', realityStorageEventHandler, false);

        if (RealityCheckData.getAck() !== '1') {
            RealityCheckUI.renderFrequencyPopUp();
        } else {
            startSummaryTimer();
        }
    }
    
    return {
        init: init,
        onContinueClick: onContinueClick,
        onLogoutClick: onLogoutClick,
        realityCheckWSHandler: realityCheckWSHandler
    };
}());
