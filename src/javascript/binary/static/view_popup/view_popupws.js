var ViewPopupWS = (function() {
    "use strict";

    var contractID,
        contract,
        history,
        proposal;
    var $Container,
        $loading,
        btnView;
    var popupboxID,
        wrapperID,
        winStatusID,
        hiddenClass;

    var init = function(button) {
        btnView = button;
        contractID = $(btnView).attr('contract_id');
        contract   = {};
        history    = {};
        proposal   = {};
        $Container = '';
        popupboxID = 'inpage_popup_content_box';
        wrapperID  = 'sell_content_wrapper';
        winStatusID= 'contract_win_status';
        hiddenClass= 'hidden';

        if (btnView) {
            ViewPopupUI.disable_button($(btnView));
        }

        $loading = $('#trading_init_progress');
        if($loading.length){
            $loading.show();
        }

        BinarySocket.send(addDispatch({"proposal_open_contract": 1, "contract_id": contractID, "subscribe": 1}));
    };

    var responseContract = function(response) {
        contract = response.proposal_open_contract;

        if(contract && contract.type) {
            ViewPopupWS[contract.type + 'Update']();
            return;
        }

        // ----- Tick -----
        if(contract.hasOwnProperty('tick_count')) {
            contract.type = 'tick';
            getTickHistory(contract.underlying, contract.date_start - 60, contract.date_start - 1, 1, {'tick': 1});
        }
        // ----- Spread -----
        else if(contract.shortcode.indexOf('SPREAD') === 0) {
            contract.type = 'spread';
            getTickHistory(contract.underlying, contract.date_start - 60, contract.date_start + 1, 1, {'spread': 1});

            var shortcode = contract.shortcode.toUpperCase(); // "spreadd_r_100_1_1453874907_20_40_point"
            var details   = shortcode.replace(contract.underlying.toUpperCase() + '_', '').split('_');
            contract.per_point   = details[1];
            contract.stop_loss   = details[3];
            contract.stop_profit = details[4];
            contract.is_point    = details[5] === 'POINT';

            getProposal({
                "symbol"          : contract.underlying,
                "stop_profit"     : contract.stop_profit,
                "currency"        : contract.currency,
                "stop_type"       : details[5].toLowerCase(),
                "proposal"        : 1,
                "amount_per_point": contract.per_point,
                "contract_type"   : details[0],
                "stop_loss"       : contract.stop_loss,
                "passthrough"     : {'spread': 1}
            });
        }
        // ----- Normal -----
        else {
            contract.type = 'normal';
            getTickHistory(contract.underlying, contract.date_start + 1, contract.date_start + 60, 0, {'next_tick': 1});
            getTickHistory(contract.underlying, contract.date_start, contract.date_expiry, 1, {'normal': 1}, contract.date_expiry - contract.date_start);
            showContractNormal();
        }

        if($loading.length) {
            $loading.hide();
        }
        if (btnView) {
            ViewPopupUI.enable_button($(btnView));
        }
    };

    // ===== Contract: Tick =====
    var showContractTick = function() {
        ViewPopupUI.show_inpage_popup(
            $('<div/>', {id: wrapperID, class: popupboxID})
                .append($('<div/>', {class: 'popup_bet_desc drag-handle', text: contract.longcode}))
                .append($('<div/>', {id: 'tick_chart'}))
                .append($('<div/>', {id: winStatusID, class: hiddenClass}))
        );

        var data = { 
            "symbol"              : contract.underlying,
            "number_of_ticks"     : contract.tick_count - (/DIGIT|ASIAN/.test(contract.shortcode) ? 1 : 0),
            "previous_tick_epoch" : history.times[0],
            "contract_category"   : (/ASIAN/.test(contract.shortcode) ? 'asian' : 'callput'),
            "longcode"            : contract.longcode,
            "display_decimals"    : 2, // TODO?
            "display_symbol"      : contract.underlying, // TODO? (display_name: "Random 100 Index")
            "contract_start"      : contract.date_start,
            "show_contract_result": 0
        };
        TickDisplay.initialize(data);

        if(contract.is_expired) {
            $Container = $('#' + wrapperID);
            showWinLostStatus((contract.sell_price || contract.bid_price) > 0);
        }
    };

    // ===== Contract: Spread =====
    var showContractSpread = function() {
        if(Object.keys(history).length === 0 || Object.keys(proposal).length === 0) {
            return;
        }

        if(!$Container) {
            $Container = makeTemplateSpread();
        }

        contract.is_up     = contract.shortcode['spread'.length] === 'U';
        contract.direction = contract.is_up ? 1 : -1;
        contract.spread    = proposal.spread;
        contract.decPlaces = ((/^\d+(\.\d+)?$/).exec(history.prices[0])[1] || '-').length - 1;

        contract.entry_level  = parseFloat(history.prices[0] * 1 + contract.direction * contract.spread / 2);
        $Container.find('#entry_level').text(contract.entry_level.toFixed(contract.decPlaces));
        $Container.find('#per_point').text((contract.is_up ? '+' : '-') + contract.per_point);

        spreadUpdate();
    };

    var spreadUpdate = function() {
        contract.status = text.localize(contract.is_expired ? 'Closed' : 'Open');
      
        contract.profit = contract.sell_price ? parseFloat(contract.sell_price) - parseFloat(contract.buy_price) : parseFloat(contract.bid_price);
        contract.profit_point = (contract.sell_price ? contract.profit : contract.payout) / contract.per_point;

        contract.stop_loss_level   = contract.entry_level + contract.stop_loss * (- contract.direction);
        contract.stop_profit_level = contract.entry_level + contract.stop_profit * contract.direction;
        if(contract.is_expired) {
            contract.exit_level = contract.entry_level + contract.profit * contract.direction;
        }
        else {
            contract.sell_level = contract.entry_level + contract.profit * contract.direction; //TODO: to be changed
        }

        containerSetText('status', contract.status, {'class': contract.is_expired ? 'loss' : 'profit'});
        containerSetText('stop_loss_level', contract.stop_loss_level.toFixed(contract.decPlaces));
        containerSetText('stop_profit_level', contract.stop_profit_level.toFixed(contract.decPlaces));
        if(!contract.is_expired) {
            containerSetText('sell_level', contract.sell_level.toFixed(contract.decPlaces));
        }
        else {
            $Container.find('#sell_level').parent('tr').addClass(hiddenClass);
            $Container.find('#exit_level').text(contract.exit_level.toFixed(contract.decPlaces)).parent('tr').removeClass(hiddenClass);
            showWinLostStatus(contract.profit > 0);
        }
        containerSetText('pnl_value', contract.profit.toFixed(2), {'class': contract.profit >= 0 ? 'profit' : 'loss'});
        containerSetText('pnl_point', contract.profit_point.toFixed(2));
    };

    var makeTemplateSpread = function() {
        $Container = $('<div/>');//.append($('<div/>', {id: 'is_spread_contract'}));

        var $table = $('<table><thead><th>' + text.localize('Contract Information') + '</th><th></th></thead><tbody></tbody></table>');
        var tbody = spreadRow('Status'              , 'status', (contract.is_expired ? 'loss' : 'profit')) + 
                    spreadRow('Entry Level'         , 'entry_level') +
                    spreadRow('Exit Level'          , 'exit_level', '', '', !contract.is_expired) +
                    spreadRow('Stop Loss Level'     , 'stop_loss_level') +
                    spreadRow('Stop Profit Level'   , 'stop_profit_level') +
                    spreadRow('Current Level'       , 'sell_level', '', '', contract.is_expired) +
                    spreadRow('Amount Per Point'    , 'per_point') +
                    spreadRow('Profit/Loss'         , 'pnl_value', (contract.profit >= 0 ? 'profit' : 'loss'), ' (' + contract.currency + ')') +
                    spreadRow('Profit/Loss (points)', 'pnl_point');

        $table.find('tbody').append(tbody);
        $Container.append(
            $('<div/>', {id: wrapperID})
                .append($('<div/>', {id: 'spread_table'}).append($table))
                .append($('<div/>', {id: 'errMsg', class: 'notice-msg ' + hiddenClass}))
                .append($('<div/>', {id: 'contract_win_status', class: hiddenClass}))
        );

        if(!contract.is_expired) {
            $Container.append(
                $('<div/>', {class: 'button'})
                    .append($('<button/>', {id: 'spread_sell', class: 'button', text: text.localize('Sell')}))
            );
            $Container.click('spread_sell', function(e){
                e.preventDefault();
                e.stopPropagation();
                sellContract(contract.contract_id, 0, {"spread": 1});
            });
        }

        ViewPopupUI.show_spread_popup($Container.html());

        return $('#' + wrapperID);
    };

    var spreadRow = function(label, id, classname, label_no_localize, isHidden) {
        return '<tr' + (isHidden ? ' class="' + hiddenClass + '"' : '') + '><td>' + text.localize(label) + (label_no_localize || '') + '</td><td' + (id ? ' id="' + id + '"' : '') + (classname ? ' class="' + classname + '"' : '') + '></td></tr>';
    };

    // ===== Contract: Normal =====
    var showContractNormal = function() {
        if(Object.keys(history).length === 0 || !contract.hasOwnProperty('next_tick_epoch')) {
            return;
        }

        if(!$Container) {
            $Container = makeTemplateNormal();
        }

        var entrySpotTime = contract.next_tick_epoch;

        $Container.find('#trade_details_start_date').text(epochToDateTime(contract.date_start)).attr('epoch_time', contract.date_start);
        containerSetText('trade_details_entry_spot', makeTooltip(contract.entry_spot, epochToDateTime(entrySpotTime), {id: 'trade_details_entry_spot_time', epoch_time: entrySpotTime}));
        containerSetText('trade_details_purchase_price', contract.currency + ' ' + parseFloat(contract.buy_price).toFixed(2));

        normalUpdate();
    };

    var normalUpdate = function() {
        var finalPrice = contract.sell_price || contract.bid_price;

        if(contract.is_expired) {
            $Container.find('.details_live').addClass(hiddenClass);
            showWinLostStatus(parseFloat(finalPrice) > 0);
        }
        else {
            $Container.find('.details_live').removeClass(hiddenClass);
            containerSetText('trade_details_current_date', epochToDateTime(contract.current_spot_time));
            containerSetText('trade_details_current_spot', contract.current_spot);
            containerSetText('trade_details_indicative_price', contract.currency + ' ' + parseFloat(contract.bid_price).toFixed(2));
        }

        containerSetText('trade_details_end_date', epochToDateTime(contract.date_expiry), {'epoch_time': contract.date_expiry});
        containerSetText('trade_details_exit_spot', makeTooltip(history[0].close, text.localize('High') + ': ' + history[0].high + ' ' + text.localize('Low') + ': ' + history[0].low));

        containerSetText('trade_details_final_price', contract.currency + ' ' + parseFloat(finalPrice).toFixed(2));
        containerSetText('trade_details_final_price_desc', makeTooltip(((finalPrice - contract.buy_price) * 100 / contract.buy_price).toFixed(2) + '%', text.localize('return')));

        $Container.find('a[href="#sell_details_chart"]').attr({
            'href'             : window.location.protocol + '//' + window.location.hostname + '/c/trade_livechart.cgi?require_duration=0&contract_analysis=1&l=EN',
            'load_live_chart'  : '1',
            'underlying_symbol': contract.underlying,
            'role'             : 'presentation'
        });

        containerSetText('sell_extra_info_data', '', {
            'barrier'            : contract.barrier || contract.high_barrier,
            'barrier2'           : contract.low_barrier,
            'path_dependent'     : contract.is_path_dependent,
            'is_forward_starting': contract.is_forward_starting,
            'purchase_price'     : contract.buy_price,
            'shortcode'          : contract.shortcode,
            'payout'             : contract.payout,
            'currency'           : contract.currency,
            'contract_id'        : contract.contract_id
        });

        var tooltip = new ToolTip();
        tooltip.attach();

        ViewPopupUI.sell_at_market($Container);
    };

    var makeTemplateNormal = function() {
        $Container = $('<div/>').append($('<div/>', {id: wrapperID}));
        $Container.prepend($('<div/>', {id: 'sell_bet_desc', class: 'popup_bet_desc drag-handle', text: contract.longcode}));
        var $tabs = 
            $('<div class="has-tabs tab_menu_container">' +
                '<ul>' +
                    '<li><a href="#sell_details_table">'   + text.localize('Table')       + '</a></li>' +
                    '<li><a href="#sell_details_chart">'   + text.localize('Chart')       + '</a></li>' +
                    '<li><a href="#sell_details_explain">' + text.localize('Explanation') + '</a></li>' +
                '</ul>' +
                '<div id="sell_details_table"></div>'   + 
                '<div id="sell_details_chart"></div>'   +
                '<div id="sell_details_explain"></div>' +
            '</div>');

        $tabs.find('#sell_details_table').html(
            '<div class="grd-grid-12 grd-row-padding contract_table">' +
                '<table>' +
                    '<tr><th>' + text.localize('Start Time')     + '</th>' + '<th class="details_live">' + text.localize('Current Spot Time') + '</th>' + '<th>' + text.localize('End Time')    + '</th></tr>' +
                    '<tr><td id="trade_details_start_date"></td>'          + '<td id="trade_details_current_date" class="details_live"></td>'           + '<td id="trade_details_end_date"></td></tr>' +
                    '<tr class="extra-info">' +
                        '<td id="trade_details_start_date_desc"></td>'     + '<td id="trade_details_current_date_desc" class="details_live"></td>'      + '<td id="trade_details_end_date_desc"></td></tr>' +
                    '<tr><th>' + text.localize('Entry Spot')     + '</th>' + '<th class="details_live">' + text.localize('Current Spot')      + '</th>' + '<th>' + text.localize('Exit Spot')   + '</th></tr>' +
                    '<tr><td id="trade_details_entry_spot"></td>'          + '<td id="trade_details_current_spot" class="details_live"></td>'           + '<td id="trade_details_exit_spot"></td></tr>' +
                    '<tr class="extra-info">' +
                        '<td id="trade_details_entry_spot_desc"></td>'     + '<td id="trade_details_current_spot_desc" class="details_live"></td>'      + '<td id="trade_details_exit_spot_desc"></td></tr>' +
                    '<tr><th>' + text.localize('Purchase Price') + '</th>' + '<th class="details_live">' + text.localize('Indicative Price')  + '</th>' + '<th>' + text.localize('Final Price') + '</th></tr>' +
                    '<tr><td id="trade_details_purchase_price"></td>'      + '<td id="trade_details_indicative_price" class="details_live"></td>'       + '<td id="trade_details_final_price"></td></tr>' +
                    '<tr class="extra-info">' +
                        '<td id="trade_details_purchase_price_desc"></td>' + '<td id="trade_details_indicative_price_desc" class="details_live"></td>'  + '<td id="trade_details_final_price_desc"></td></tr>' +
                '</table>' +
            '</div>');

        var explanation = 
            '<h3>' + text.localize('Entry spot') + '</h3>' +
            '<p>' + text.localize('If you select a <strong>start time</strong> of "Now", the <strong>start time</strong> is when the contract is processed by our servers and the <strong>entry spot</strong> is the <strong>next tick</strong> thereafter.') +
                '<br />' + text.localize('If you select a <strong>start time</strong> in the future, the <strong>start time</strong> is that which is selected and the <strong>entry spot</strong> is the price in effect at that time.') +
            '</p><br />' +
            '<h3>' + text.localize('Exit spot') + '</h3>' +
            '<p>' + text.localize('The <strong>exit spot</strong> is the spot at the <strong>end time</strong>.') +
                '<br />' + text.localize('If you select a <strong>start time</strong> of "Now", the <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).') +
                '<br />' + text.localize('If you select a specific <strong>end time</strong>, the <strong>end time</strong> is the selected time.') +
            '</p>';
        if(/EXPIRY/.test(contract.shortcode)) {
            explanation = 
                '<h3>' + text.localize('Exit spot') + '</h3>' +
                '<p>' + text.localize('The <strong>exit spot</strong> is the spot at the <strong>end time</strong>.') +
                '<p>' + text.localize('The <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).') + '</p>' +
                '<p>' + text.localize('The <strong>start time</strong> is when the contract is processed by our servers.') + '</p>';
        }
        else if(/TOUCH|UPORDOWN|RANGE/.test(contract.shortcode)) {
            explanation = 
                '<h3>' + text.localize('Contract period') + '</h3>' +
                '<p>' + text.localize('The <strong>contract period</strong> is the period between the <strong>next tick</strong> after the <strong>start time</strong> and the <strong>end time</strong>.') + '</p>' +
                '<p>' + text.localize('The <strong>start time</strong> is when the contract is processed by our servers.') + '</p>' +
                '<p>' + text.localize('The <strong>end time</strong> is the selected number of minutes/hours after the <strong>start time</strong> (if less than one day in duration), or at the end of the trading day (if one day or more in duration).') + '</p>';
        }

        $tabs.find('#sell_details_explain').html('<div id="explanation-content" class="grd-grid-12">' + explanation + '</div>');

        $Container.find('#' + wrapperID)
            .append($tabs)
            .append($('<div class="sell_bottom_content"><p class="comment">' + text.localize('This contract has expired.') + '</p><div id="contract_win_status" class="' + hiddenClass + '"></div></div>'))
            .append($('<div/>', {id: 'sell_extra_info_data', class: hiddenClass}))
            .append($('<div/>', {id: 'errMsg', class: 'notice-msg ' + hiddenClass}));

        $Container.find('.details_live').addClass(hiddenClass);

        ViewPopupUI.show_inpage_popup('<div class="' + popupboxID + '">' + $Container.html() + '</div>');

        return $('#' + wrapperID);
    };

    var epochToDateTime = function(epoch) {
        return moment.utc(epoch * 1000).format('YYYY-MM-DD HH:mm:ss');
    };

    var makeTooltip = function(value, tooltip, attributes) {
        var attrs = '';
        if(attributes && Object.keys(attributes).length > 0) {
            $.each(attributes, function(prop, value){
                attrs += ' ' + prop + '="' + value + '"';
            });
        }
        return '<abbr rel="tooltip" title="' + tooltip + '"' + attrs + '>' + value + '</abbr>';
    };

    // ===== Tools =====
    var containerSetText = function(id, text, attributes) {
        if(attributes && Object.keys(attributes).length > 0) {
            $Container.find('#' + id).html(text).attr(attributes);
        }
        else {
            $Container.find('#' + id).html(text);
        }
    };

    var showWinLostStatus = function(isWin) {
        containerSetText(
            winStatusID,
            text.localize('This contract has ' + (isWin ? 'WON' : 'LOST')),
            {class: isWin ? 'won' : 'lost'}
        );
    };

    // ===== Requests & Responses =====
    // ----- Sell Contract -----
    var sellContract = function(contract_id, price, passthrough) {
        var req = {"sell": contract_id, "price": price, passthrough: {}};
        if(passthrough && Object.keys(passthrough).length > 0) {
            req.passthrough = passthrough;
        }
        BinarySocket.send(addDispatch(req));
    };

    var responseSell = function(response) {
        if(response.hasOwnProperty('error')) {
            $Container.find('#errMsg').text(response.error.message).removeClass(hiddenClass);
            return;
        }
        if(response.echo_req.hasOwnProperty('passthrough')) {
            if(response.echo_req.passthrough.hasOwnProperty('spread')) {
                $Container.find('#spread_sell').hide();
            }
        }
    };

    // ----- Tick History -----
    var getTickHistory = function(symbol, start, end, count, passthrough, granularity) {
        var req = {"ticks_history": symbol, "end": end, "count": count, passthrough: {}};
        if(start && start > 0) {
            req.start = start;
        }
        if(passthrough && Object.keys(passthrough).length > 0) {
            req.passthrough = passthrough;
        }
        if(granularity > 0) {
            req.style = 'candles';
            req.granularity = granularity;
        }
        BinarySocket.send(addDispatch(req));
    };

    var responseHistory = function(response) {
        if(response.hasOwnProperty('error')) {
            $Container.find('#errMsg').text(response.error.message).removeClass(hiddenClass);
            return;
        }
        if(response.echo_req.hasOwnProperty('passthrough')) {
            if(response.echo_req.passthrough.hasOwnProperty('tick')) {
                history = response.history;
                showContractTick();
            }
            else if(response.echo_req.passthrough.hasOwnProperty('spread')) {
                history = response.history;
                showContractSpread();
            }
            else if(response.echo_req.passthrough.hasOwnProperty('normal')) {
                history = response.candles;
                showContractNormal();
            }
            else if(response.echo_req.passthrough.hasOwnProperty('next_tick')) {
                contract.next_tick_epoch = response.history.times[0];
                showContractNormal();
            }
        }
    };

    // ----- Proposal -----
    var getProposal = function(req) {
        BinarySocket.send(addDispatch(req));
    };

    var responseProposal = function(response) {
        // if(response.hasOwnProperty('error')) {
        //     $Container.find('#errMsg').text(response.error.message).removeClass(hiddenClass);
        //     return;
        // }
        if(response.echo_req.hasOwnProperty('passthrough')) {
            if(response.echo_req.passthrough.hasOwnProperty('spread') && Object.keys(proposal).length === 0) {
                proposal = response.proposal;
                showContractSpread();
            }
        }
    };

    // ===== Dispatch =====
    var addDispatch = function(req) {
        if(!req.hasOwnProperty('passthrough')) {
            req.passthrough = {};
        }
        req.passthrough['dispatch_to'] = 'ViewPopupWS';
        return req;
    };

    var dispatch = function(response) {
        switch(response.msg_type) {
            case 'proposal_open_contract':
                responseContract(response);
                break;
            case 'history':
            case 'candles':
                responseHistory(response);
                break;
            case 'proposal':
                responseProposal(response);
                break;
            case 'sell':
                responseSell(response);
                break;
            default:
                break;
        }
    };

    return {
        init     : init,
        dispatch : dispatch
    };
}());


pjax_config_page("profit_tablews|statementws|openpositionsws|trading", function() {
    return {
        onLoad: function() {
            $('#profit-table-ws-container, #statement-ws-container, #portfolio-table, #contract_confirmation_container')
                .on('click', '.open_contract_detailsws', function (e) {
                    e.preventDefault();
                    ViewPopupWS.init(this);
                });
        }
    };
});
