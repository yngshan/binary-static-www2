var LimitsWS = (function(){
    "use strict";

    function limitsHandler(response){
        var limits = response.get_limits;
        LimitsUI.fillLimitsTable(limits);

        var withdrawal_limit = document.getElementById("withdrawal-limit");
        var already_withdraw = document.getElementById("already-withdraw");
        var withdrawal_limit_aggregate = document.getElementById("withdrawal-limit-aggregate");

        if(limits['lifetime_limit'] === 99999999 && limits['num_of_days_limit'] === 99999999) {
            withdrawal_limit.textContent = Content.localize().textAuthenticatedWithdrawal;
        } else if(limits['num_of_days_limit'] === limits['lifetime_limit']) {
            var client_currency = (/^(iom|malta|maltainvest)$/i).test(TUser.get().landing_company_name) ? 'EUR' : TUser.get().currency || page.client.get_storage_value('currencies');
            withdrawal_limit.textContent = Content.localize().textWithdrawalLimits.replace('[_1]', client_currency).replace('[_2]', addComma(limits['num_of_days_limit']));
            already_withdraw.textContent = Content.localize().textWithrawalAmount.replace('[_1]', addComma(limits["withdrawal_since_inception_monetary"])) + '.';
        } else {
            withdrawal_limit.textContent = Content.localize().textDayWithdrawalLimit.replace('[_1]', limits['num_of_days']).replace('[_2]', addComma(limits['num_of_days_limit']));
            already_withdraw.textContent = Content.localize().textWithrawalAmount.replace('[_1]', limits['withdrawal_for_x_days_monetary']) + " " + Content.localize().textAggregateOverLast + " " + limits['num_of_days'] + " " + Content.localize().textDurationDays;
            if(limits["lifetime_limit"] < 99999999) {
                withdrawal_limit_aggregate.textContent = Content.localize().textWithdrawalForEntireDuration.replace('[_1]', addComma(limits["lifetime_limit"]));
                document.getElementById("already-withdraw-aggregate").textContent = Content.localize().textWithrawalAmount.replace('[_1]', addComma(limits["withdrawal_since_inception_monetary"])) + " " + Content.localize().textInAggregateOverLifetime;
            }
            if(limits['remainder'] === 0) {
                withdrawal_limit_aggregate.textContent = Content.localize().textNotAllowedToWithdraw;
            } else if (limits['remainder'] !== 0) {
                withdrawal_limit_aggregate.textContent = Content.localize().textCurrentMaxWithdrawal.replace('[_1]', addComma(limits['remainder']));
            }

        }
    }

    function limitsError(){
        document.getElementById('limits-title').setAttribute('style', 'display:none');
        document.getElementsByClassName('notice-msg')[0].innerHTML = Content.localize().textFeatureUnavailable;
        document.getElementById('client_message').setAttribute('style', 'display:block');
    }

    function initTable(){
        document.getElementById('client_message').setAttribute('style', 'display:none');
        LimitsUI.clearTableContent();
    }

    return {
        limitsHandler: limitsHandler,
        limitsError: limitsError,
        clean: initTable
    };
}());
