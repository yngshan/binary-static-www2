var ViewPopupWS = (function() {
    "use strict";

    var contractID,
        contract,
        contractType,
        history,
        proposal,
        isSold,
        chartStarted;
    var $Container,
        $loading,
        btnView,
        popupboxID,
        wrapperID,
        winStatusID,
        hiddenClass;

    var init = function(button) {
        btnView      = button;
        contractID   = $(btnView).attr('contract_id');
        contractType = '';
        contract     = {};
        history      = {};
        proposal     = {};
        $Container   = '';
        popupboxID   = 'inpage_popup_content_box';
        wrapperID    = 'sell_content_wrapper';
        winStatusID  = 'contract_win_status';
        hiddenClass  = 'hidden';
        isSold       = false;
        chartStarted = false;

        if (btnView) {
            ViewPopupUI.disable_button($(btnView));
            ViewPopupUI.cleanup(true);
        }

        socketSend({"proposal_open_contract": 1, "contract_id": contractID, "subscribe": 1});

        setLoadingState(true);
    };

    var responseContract = function(response) {
        contract = response.proposal_open_contract;

        if(contract && contractType) {
            ViewPopupWS[contractType + 'Update']();
            return;
        }

        // ----- Tick -----
        if(contract.hasOwnProperty('tick_count')) {
            contractType = 'tick';
            getTickHistory(contract.underlying, contract.date_start - 60, contract.date_start - 1, 1, {'tick': 1});
        }
        // ----- Spread -----
        else if(contract.shortcode.indexOf('SPREAD') === 0) {
            contractType = 'spread';
            getTickHistory(contract.underlying, contract.date_start + 1, contract.date_start + 60, 0, {'spread': 1});

            var shortcode = contract.shortcode.toUpperCase();
            var details   = shortcode.replace(contract.underlying.toUpperCase() + '_', '').split('_');
            contract.per_point   = details[1];
            contract.stop_loss   = details[3];
            contract.stop_profit = details[4];
            contract.is_point    = details[5] === 'POINT';

            socketSend({
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
            contractType = 'normal';
            if(Object.keys(history).length === 0) {
                getTickHistory(contract.underlying, contract.date_start + 1, contract.date_start + 60, 0, {'next_tick': 1});
                getTickHistory(contract.underlying, contract.date_start, contract.date_expiry, 1, {'normal': 1}, 60); //contract.date_expiry - contract.date_start);
            }
            showContractNormal();
        }
    };

    // ===== Contract: Tick =====
    var showContractTick = function() {
        setLoadingState(false);

        ViewPopupUI.show_inpage_popup(
            $('<div/>', {id: wrapperID, class: popupboxID})
                .append($('<div/>', {class: 'popup_bet_desc drag-handle', text: contract.longcode}))
                .append($('<div/>', {id: 'tick_chart'}))
                .append($('<div/>', {id: winStatusID, class: hiddenClass}))
        );

        TickDisplay.initialize({
            "symbol"              : contract.underlying,
            "number_of_ticks"     : contract.tick_count - (/ASIAN/.test(contract.shortcode) ? 1 : 0),
            "previous_tick_epoch" : history.times[0],
            "contract_category"   : (/ASIAN/.test(contract.shortcode) ? 'asian' : /DIGIT/.test(contract.shortcode) ? 'digits' : 'callput'),
            "longcode"            : contract.longcode,
            "display_decimals"    : history.prices[0].split('.')[1].length || 2,
            "display_symbol"      : contract.underlying,
            "contract_start"      : contract.date_start,
            "show_contract_result": 0
        });

        if(contract.is_expired) {
            showWinLossStatus((contract.sell_price || contract.bid_price) > 0);
        }
    };

    // ===== Contract: Spread =====
    var showContractSpread = function() {
        if(Object.keys(history).length === 0 || Object.keys(proposal).length === 0) {
            return;
        }

        setLoadingState(false);

        if(!$Container) {
            $Container = makeTemplateSpread();
        }

        spreadSetValues();

        $Container.find('#entry_level').text(contract.entry_level.toFixed(contract.decPlaces));
        $Container.find('#per_point').text((contract.is_up ? '+' : '-') + contract.per_point);

        spreadUpdate();
    };

    var spreadUpdate = function() {
        spreadSetValues();

        containerSetText('status'           , contract.status, {'class': contract.is_ended ? 'loss' : 'profit'});
        containerSetText('stop_loss_level'  , contract.stop_loss_level.toFixed(contract.decPlaces));
        containerSetText('stop_profit_level', contract.stop_profit_level.toFixed(contract.decPlaces));
        containerSetText('pnl_value'        , contract.profit.toFixed(2), {'class': contract.profit >= 0 ? 'profit' : 'loss'});
        containerSetText('pnl_point'        , contract.profit_point.toFixed(2));

        if(!contract.is_ended) {
            contract.sell_level = contract.entry_level + contract.profit * contract.direction; //TODO: to be changed
            containerSetText('sell_level', contract.sell_level.toFixed(contract.decPlaces));
        }
        else {
            contract.exit_level = contract.entry_level + contract.profit_point * contract.direction;
            $Container.find('#sell_level').parent('tr').addClass(hiddenClass);
            $Container.find('#exit_level').text(contract.exit_level.toFixed(contract.decPlaces)).parent('tr').removeClass(hiddenClass);
            showWinLossStatus(contract.profit > 0);
            $Container.find('div.button').addClass(hiddenClass);
        }
    };

    var makeTemplateSpread = function() {
        $Container = $('<div/>');//.append($('<div/>', {id: 'is_spread_contract'}));
        $Container.prepend($('<div/>', {id: 'sell_bet_desc', class: 'popup_bet_desc drag-handle', text: text.localize('Contract Information')}));

        var $table = $('<table><tbody></tbody></table>');
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

        if(!contract.is_expired && !contract.is_sold) {
            $Container.append(
                $('<div/>', {class: 'button'})
                    .append($('<button/>', {id: 'spread_sell', class: 'button', text: text.localize('Sell')}))
            );
            $Container.click('spread_sell', function(e) {
                e.preventDefault();
                e.stopPropagation();
                socketSend({"sell": contractID, "price": 0});
            });
        }

        ViewPopupUI.show_spread_popup($Container.html());

        return $('#' + wrapperID);
    };

    var spreadRow = function(label, id, classname, label_no_localize, isHidden) {
        return '<tr' + (isHidden ? ' class="' + hiddenClass + '"' : '') + '><td>' + text.localize(label) + (label_no_localize || '') + '</td><td' + (id ? ' id="' + id + '"' : '') + (classname ? ' class="' + classname + '"' : '') + '></td></tr>';
    };

    var spreadSetValues = function() {
        contract.is_up        = contract.shortcode['spread'.length] === 'U';
        contract.direction    = contract.is_up ? 1 : -1;
        contract.spread       = proposal.spread;
        contract.decPlaces    = ((/^\d+(\.\d+)?$/).exec(history.prices[0])[1] || '-').length - 1;
        contract.entry_level  = parseFloat(history.prices[0] * 1 + contract.direction * contract.spread / 2);
        // values needed for spreadUpdate()
        contract.is_ended          = contract.is_expired || contract.is_sold;
        contract.status            = text.localize(contract.is_ended ? 'Closed' : 'Open');
        contract.profit            = contract.sell_price ? parseFloat(contract.sell_price) - parseFloat(contract.buy_price) : parseFloat(contract.bid_price);
        contract.profit_point      = (contract.sell_price ? contract.profit : contract.payout) / contract.per_point;
        contract.stop_loss_level   = contract.entry_level + contract.stop_loss * (- contract.direction);
        contract.stop_profit_level = contract.entry_level + contract.stop_profit * contract.direction;
    };

    // ===== Contract: Normal =====
    var showContractNormal = function() {
        if(Object.keys(history).length === 0 || !contract.hasOwnProperty('next_tick_epoch')) {
            return;
        }

        setLoadingState(false);

        if(!$Container) {
            $Container = makeTemplateNormal();
        }


        containerSetText('trade_details_start_date'    , epochToDateTime(contract.date_start) , {'epoch_time': contract.date_start});
        containerSetText('trade_details_end_date'      , epochToDateTime(contract.date_expiry), {'epoch_time': contract.date_expiry});
        containerSetText('trade_details_purchase_price', contract.currency + ' ' + parseFloat(contract.buy_price).toFixed(2));

        normalUpdate();

        if(!chartStarted) {
            ViewPopupUI.sell_at_market($Container, contract.underlying);
            chartStarted = true;
        }
    };

    var normalUpdate = function() {
        var finalPrice = contract.sell_price || contract.bid_price,
            is_started = !contract.is_forward_starting || contract.current_spot_time > contract.date_start,
            just_sold  = contract.sell_spot_time && contract.sell_spot_time < contract.date_expiry,
            is_ended   = contract.is_expired || contract.is_sold || just_sold;

        containerSetText('trade_details_current_date'    , epochToDateTime(is_ended ? (contract.sell_time && contract.sell_time < contract.date_expiry ? contract.sell_time : contract.date_expiry) : contract.current_spot_time));
        containerSetText('trade_details_current_spot'    , is_ended ? contract.exit_tick || contract.sell_price : contract.current_spot);
        containerSetText('trade_details_indicative_price', contract.currency + ' ' + parseFloat(is_ended ? (contract.sell_price || contract.bid_price) : contract.bid_price).toFixed(2));
        containerSetText('trade_details_now_date'        , '' , {'epoch_time': contract.current_spot_time});

        var profit_loss = finalPrice - contract.buy_price;
        var percentage  = (profit_loss * 100 / contract.buy_price).toFixed(2);
        containerSetText('trade_details_profit_loss', contract.currency + ' ' + parseFloat(profit_loss).toFixed(2) + '<span>(' + (percentage > 0 ? '+' : '') + percentage + '%' + ')</span>');
        $Container.find('#trade_details_profit_loss').attr('class', profit_loss >= 0 ? 'profit' : 'loss');

        if(!is_started) {
            containerSetText('trade_details_purchase_date' , '', {'epoch_time': contract.purchase_time});
            containerSetText('trade_details_entry_spot'    , '-');
            containerSetText('trade_details_message'       , text.localize('Contract is not started yet'));
        }
        else{
            if(contract.entry_spot > 0) {
                var entrySpotTime = contract.is_forward_starting ? contract.date_start : contract.next_tick_epoch;
                containerSetText('trade_details_entry_spot'    , contract.entry_spot > 0 ? '<div id="trade_details_entry_spot_time" epoch_time="' + entrySpotTime + '">' + contract.entry_spot + '</div>' : '-');
            }
            containerSetText('trade_details_purchase_date' , '', {'epoch_time': ''});
            containerSetText('trade_details_message', contract.validation_error || '&nbsp;');
        }

        if(!isSold && just_sold) {
            isSold = true;
            containerSetText('trade_details_sold_date', '', {'epoch_time': contract.sell_spot_time});
            ViewPopupUI.sell_at_market($Container, contract.underlying);
        }
        if(is_ended) {
            contractEndedNormal(parseFloat(profit_loss) > 0);
            contract.validation_error = '';
        }

        normalSellSetVisible(+contract.is_valid_to_sell === 1 && !is_ended);
    };

    var contractEndedNormal = function(is_win) {
        containerSetText('trade_details_now_date'        , '', {'epoch_time': ''});
        containerSetText('trade_details_current_title'   , text.localize(contract.is_sold || isSold ? 'Sold' : 'Expired'));
        containerSetText('trade_details_indicative_label', text.localize('Price'));
        containerSetText('trade_details_message'         , '&nbsp;', {'epoch_time': ''});
        normalSellSetVisible(false);
        showWinLossStatus(is_win);
    };

    var makeTemplateNormal = function() {
        $Container = $('<div/>').append($('<div/>', {id: wrapperID}));
        $Container.prepend($('<div/>', {id: 'sell_bet_desc', class: 'popup_bet_desc drag-handle', text: contract.longcode}));
        var $sections = $('<div/>').append($('<div id="sell_details_chart_wrapper" class="grd-grid-8 grd-grid-mobile-12"></div><div id="sell_details_table" class="grd-grid-4 grd-grid-mobile-12 drag-handle"></div>'));

        $sections.find('#sell_details_table').append($(
            '<table>' +
                '<tr><th colspan="2">' + text.localize('Contract Information') + '</th></tr>' +
                    normalRow('Start Time',     '', 'trade_details_start_date') +
                    normalRow('End Time',       '', 'trade_details_end_date') +
                    normalRow('Entry Spot',     '', 'trade_details_entry_spot') +
                    normalRow('Purchase Price', '', 'trade_details_purchase_price') +
                '<tr><td colspan="2" class="last_cell" id="trade_details_contract_note">&nbsp;</td></tr>' +
                '<tr><th colspan="2" id="trade_details_current_title">' + text.localize('Current') + '</th></tr>' +
                    normalRow('Time',           '', 'trade_details_current_date') +
                    normalRow('Spot',           '', 'trade_details_current_spot') +
                    normalRow('Indicative',     'trade_details_indicative_label', 'trade_details_indicative_price') +
                    normalRow('Profit/Loss',    '', 'trade_details_profit_loss') +
                '<tr><td colspan="2" class="last_cell" id="trade_details_message">&nbsp;</td></tr>' +
            '</table>' +
            '<div id="trade_details_now_date"      class="' + hiddenClass + '"></div>' +
            '<div id="trade_details_purchase_date" class="' + hiddenClass + '"></div>' +
            '<div id="trade_details_sold_date"     class="' + hiddenClass + '"></div>' +
            '<div id="errMsg" class="notice-msg hidden"></div>' +
            '<div id="trade_details_bottom"><div id="contract_sell_wrapper" class="' + hiddenClass + '"></div><div id="contract_sell_message"></div><div id="contract_win_status" class="' + hiddenClass + '"></div></div>'
        ));

        $sections.find('#sell_details_chart_wrapper').html('<div id="live_chart_form_wrapper" class="grd-grid-12"></div>' +
            '<div class="chart-notice"><div class="notice" id="delayed_feed_notice" style="display: none;">Charting for this underlying is delayed</div><div class="notice" id="not_available_notice" style="display: none;">Charting is not available for this underlying</div></div>' +
            '<div id="analysis_live_chart" class="live_chart_wrapper grd-grid-12"><div>');

        $Container.find('#' + wrapperID)
            .append($sections.html())
            .append($('<div/>', {id: 'sell_extra_info_data', class: hiddenClass}))
            .append($('<div/>', {id: 'errMsg', class: 'notice-msg ' + hiddenClass}));

        containerSetText('sell_extra_info_data', '', {
            'barrier'            : contract.barrier || contract.high_barrier,
            'barrier2'           : contract.low_barrier || '',
            'path_dependent'     : contract.is_path_dependent > 0 ? '1' : '',
            'is_forward_starting': contract.is_forward_starting,
            'purchase_price'     : contract.buy_price,
            'shortcode'          : contract.shortcode,
            'payout'             : contract.payout,
            'currency'           : contract.currency,
            'contract_id'        : contract.contract_id,
            //'stream_url'         : 'https://www.binaryqa34.com/push/price/',
            //'sell_channel'       : 'P_CALL-1457076980_FRXAUDJPY_1457112980_S0P_0_c_USD_EN',
            //'error_message'      : 'Contract cannot be sold at this time.',
            //'submit_url'         : 'https://www.binaryqa34.com/d/trade.cgi?l=EN',
            'is_immediate'       : '0',
            'is_negative'        : '0',
            'trade_feed_delay'   : '60'
        });

        ViewPopupUI.show_inpage_popup('<div class="' + popupboxID + '">' + $Container.html() + '</div>');

        return $('#' + wrapperID);
    };

    var normalRow = function(label, label_id, value_id) {
        return '<tr><td' + (label_id ? ' id="' + label_id + '"' : '') + '>' + text.localize(label) + '</td><td' + (value_id ? ' id="' + value_id + '"' : '') + '></td></tr>';
    };

    var normalSellSetVisible = function(show) {
        var sellWrapperID = 'sell_at_market_wrapper';
        var isExist = $Container.find('#' + sellWrapperID).length > 0;
        if(show === true) {
            if(!isExist) {
                $Container.find('#contract_sell_wrapper').removeClass('hidden').append($('<div id="' + sellWrapperID + '"><span class="button"><button id="sell_at_market" class="button">' + text.localize('Sell at market') + '</button></span>' +
                    '<div class="note"><strong>' + text.localize('Note') + ':</strong> ' + text.localize('Contract will be sold at the prevailing market price when the request is received by our servers. This price may differ from the indicated price.') + '</div>'));
                $Container.find('#sell_at_market').unbind('click').click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    socketSend({"sell": contractID, "price": 0});
                    $(this).disable();
                });
            }
        }
        else {
            if(isExist) {
                $Container.find('#sell_at_market').unbind('click');
                $Container.find('#' + sellWrapperID).remove();
            }
        }
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
        // return '<div rel="tooltip" title="' + tooltip + '"' + attrs + '>' + value + '</div>';
        return '<div' + attrs + '>' + value + '</div>';
    };

    // ===== Tools =====
    var containerSetText = function(id, text, attributes) {
        if(!$Container || $Container.length === 0) {
            $Container = $('#' + wrapperID);
        }

        var $target = $Container.find('#' + id);
        if($target && $target.length > 0) {
            $target.html(text);
            if(attributes && Object.keys(attributes).length > 0) {
                $target.attr(attributes);
            }
        }
    };

    var showWinLossStatus = function(isWin) {
        containerSetText(
            winStatusID,
            text.localize('This contract has ' + (isWin ? 'WON' : 'LOST')),
            {class: isWin ? 'won' : 'lost'}
        );
    };

    var setLoadingState = function(isLoading) {
        if(isLoading) {
            $loading = $('#trading_init_progress');
            if($loading.length) {
                $loading.show();
            }
        }
        else {
            if($loading.length) {
                $loading.hide();
            }
            if (btnView) {
                ViewPopupUI.enable_button($(btnView));
            }
        }
    };

    // ===== Requests & Responses =====
    // ----- Sell Contract -----
    var sellContract = function(contract_id, price, passthrough) {
        var req = {"sell": contract_id, "price": price, passthrough: {}};
        if(passthrough && Object.keys(passthrough).length > 0) {
            req.passthrough = passthrough;
        }
        socketSend(req);
    };

    var responseSell = function(response) {
        if(response.hasOwnProperty('error')) {
            $Container.find('#errMsg').text(response.error.message).removeClass(hiddenClass);
            return;
        }
        // if(response.echo_req.hasOwnProperty('passthrough')) {
        //     if(response.echo_req.passthrough.hasOwnProperty('spread')) {
        if(contractType === 'spread') {
            $Container.find('#spread_sell').parent().addClass(hiddenClass);
        }
        else if(contractType === 'normal') {
            normalSellSetVisible(false);
            containerSetText('contract_sell_message',
                text.localize('You have sold this contract at [_1] [_2]').replace('[_1]', contract.currency).replace('[_2]', response.sell.sold_for) +
                '<br />' +
                text.localize('Your transaction reference number is [_1]').replace('[_1]', response.sell.transaction_id)
            );
            ViewPopupUI.sell_at_market($Container, contract.underlying);
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
        socketSend(req);
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
    var storeSubscriptionID = function(id) {
        if(!window.forget_ids) {
            window.forget_ids = [];
        }
        if(id && id.length > 0) {
            window.forget_ids.push(id);
        }
    };

    var socketSend = function(req) {
        if(!req.hasOwnProperty('passthrough')) {
            req.passthrough = {};
        }
        req.passthrough['dispatch_to'] = 'ViewPopupWS';
        BinarySocket.send(req);
    };

    var dispatch = function(response) {
        switch(response.msg_type) {
            case 'proposal_open_contract':
                storeSubscriptionID(response.proposal_open_contract.id);
                responseContract(response);
                break;
            case 'history':
            case 'candles':
                responseHistory(response);
                break;
            case 'proposal':
                storeSubscriptionID(response.proposal.id);
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
        dispatch : dispatch,
        normalUpdate : normalUpdate,
        spreadUpdate : spreadUpdate
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
