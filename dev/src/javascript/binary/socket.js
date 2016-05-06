/*
 * It provides a abstraction layer over native javascript Websocket.
 *
 * Provide additional functionality like if connection is close, open
 * it again and process the buffered requests
 *
 *
 * Usage:
 *
 * `BinarySocket.init()` to initiate the connection
 * `BinarySocket.send({contracts_for : 1})` to send message to server
 */
function BinarySocketClass() {
    'use strict';

    var binarySocket,
        bufferedSends = [],
        manualClosed = false,
        events = {},
        authorized = false,
        timeouts = {},
        req_number = 0,
        socketUrl;
        if(window.location.host == 'www.binary.com'){
          socketUrl = "wss://ws.binaryws.com/websockets/v3";
        } else{
          socketUrl = "wss://"+window.location.host+"/websockets/v3";
        }

    if (page.language()) {
        socketUrl += '?l=' + page.language();
    }

    var clearTimeouts = function(){
        for(var k in timeouts){
            if(timeouts.hasOwnProperty(k)){
                clearTimeout(timeouts[k]);
                delete timeouts[k];
            }
        }
    };

    var status = function () {
        return binarySocket && binarySocket.readyState;
    };

    var isReady = function () {
        return binarySocket && binarySocket.readyState === 1;
    };

    var isClose = function () {
        return !binarySocket || binarySocket.readyState === 2 || binarySocket.readyState === 3;
    };

    var sendBufferedSends = function () {
        while (bufferedSends.length > 0) {
            binarySocket.send(JSON.stringify(bufferedSends.shift()));
        }
    };

    var send = function(data) {
        if (isClose()) {
            bufferedSends.push(data);
            init(1);
        } else if (isReady()) {
            if(!data.hasOwnProperty('passthrough') && !data.hasOwnProperty('verify_email')){
                data.passthrough = {};
            }
            // temporary check
            if((data.contracts_for || data.proposal) && !data.passthrough.hasOwnProperty('dispatch_to')){
                data.passthrough.req_number = ++req_number;
                timeouts[req_number] = setTimeout(function(){
                    if(typeof reloadPage === 'function' && data.contracts_for){
                        alert("The server didn't respond to the request:\n\n"+JSON.stringify(data)+"\n\n");
                        reloadPage();
                    }
                    else{
                        $('.price_container').hide();
                    }
                }, 60*1000);
            }

            binarySocket.send(JSON.stringify(data));
        } else {
            bufferedSends.push(data);
        }
    };

    var init = function (es) {
        if(!es){
            events = {};
        }
        if(typeof es === 'object'){
            bufferedSends = [];
            manualClosed = false;
            events = es;
            clearTimeouts();
        }

        if(isClose()){
            binarySocket = new WebSocket(socketUrl);
        }

        binarySocket.onopen = function (){
            var loginToken = getCookieItem('login');
            if(loginToken && !authorized) {
                binarySocket.send(JSON.stringify({authorize: loginToken}));
            }
            else {
                sendBufferedSends();
            }

            if(typeof events.onopen === 'function'){
                events.onopen();
            }

            if(isReady()=== true){
                page.header.validate_cookies();
                if (clock_started === false) {
                    page.header.start_clock_ws();
                }
            }
        };

        binarySocket.onmessage = function (msg){
            var response = JSON.parse(msg.data);
            if (response) {
                if(response.hasOwnProperty('echo_req') && response.echo_req.hasOwnProperty('passthrough')) {
                    var passthrough = response.echo_req.passthrough;
                    if(passthrough.hasOwnProperty('req_number')) {
                        clearInterval(timeouts[response.echo_req.passthrough.req_number]);
                        delete timeouts[response.echo_req.passthrough.req_number];
                    }
                    else if (passthrough.hasOwnProperty('dispatch_to')) {
                      if (passthrough.dispatch_to === 'ViewPopupWS') {
                        ViewPopupWS.dispatch(response);
                      } else if (passthrough.dispatch_to === 'ViewChartWS') {
                        Highchart.dispatch(response);
                      } else if (passthrough.dispatch_to === 'ViewTickDisplayWS') {
                        WSTickDisplay.dispatch(response);
                      }
                    }
                }
                var type = response.msg_type;
                if (type === 'authorize') {
                    if(response.hasOwnProperty('error')) {
                        LocalStore.set('reality_check.ack', 0);
                       send({'logout': '1', passthrough: {'redirect': 'login'}});
                    }
                    else {
                        authorized = true;
                        page.client.response_authorize(response);
                        if(typeof events.onauth === 'function'){
                            events.onauth();
                        }
                        send({balance:1, subscribe: 1});
                        send({landing_company_details: TUser.get().landing_company_name});
                        send({get_settings: 1});
                        sendBufferedSends();
                    }
                } else if (type === 'balance') {
                    ViewBalanceUI.updateBalances(response);
                } else if (type === 'time') {
                    page.header.time_counter(response);
                } else if (type === 'logout') {
                    localStorage.removeItem('jp_test_allowed');
                    RealityCheckData.clear();
                    page.header.do_logout(response);
                } else if (type === 'landing_company_details') {
                    page.client.response_landing_company_details(response);
                    RealityCheck.init();
                } else if (type === 'payout_currencies' && response.echo_req.hasOwnProperty('passthrough') && response.echo_req.passthrough.handler === 'page.client') {
                    page.client.response_payout_currencies(response);
                } else if (type === 'get_settings') {
                    var jpStatus = response.get_settings.jp_account_status;

                    if (jpStatus) {
                        switch (jpStatus.status) {
                            case 'jp_knowledge_test_pending': localStorage.setItem('jp_test_allowed', 1);
                                break;
                            case 'jp_knowledge_test_fail':
                                if (Date.now() >= (jpStatus.next_test_epoch * 1000)) {
                                    localStorage.setItem('jp_test_allowed', 1);
                                } else {
                                    localStorage.setItem('jp_test_allowed', 0);
                                }
                                break;
                            default: localStorage.setItem('jp_test_allowed', 0);
                        }

                        KnowledgeTest.showKnowledgeTestTopBarIfValid(jpStatus);
                    } else {
                        localStorage.removeItem('jp_test_allowed');
                    }
                } else if (type === 'website_status') {
                  if (response.website_status.clients_country) {
                    localStorage.setItem('clients_country', response.website_status.clients_country);
                    if (isNotBackoffice()) {
                      checkClientsCountry();
                    }
                  }
                } else if (type === 'reality_check') {
                    RealityCheck.realityCheckWSHandler(response);
                }
                if (response.hasOwnProperty('error')) {
                    if(response.error && response.error.code) {
                      if (response.error.code === 'RateLimit') {
                        $('#ratelimit-error-message')
                            .css('display', 'block')
                            .on('click', '#ratelimit-refresh-link', function () {
                                window.location.reload();
                            });
                      } else if (response.error.code === 'InvalidToken' &&
                          type !== 'reset_password' &&
                          type !== 'new_account_virtual' &&
                          type !== 'paymentagent_withdraw') {
                        BinarySocket.send({'logout': '1'});
                      }
                    }
                }
                if(typeof events.onmessage === 'function'){
                    events.onmessage(msg);
                }
            }
        };

        binarySocket.onclose = function (e) {
            authorized = false;
            clearTimeouts();

            if(!manualClosed){
                init(1);
            }
            if(typeof events.onclose === 'function'){
                events.onclose();
            }
        };

        binarySocket.onerror = function (error) {
            console.log('socket error', error);
        };
    };

    var close = function () {
        manualClosed = true;
        bufferedSends = [];
        events = {};
        if (binarySocket) {
            binarySocket.close();
        }
    };

    var clear = function(){
        bufferedSends = [];
        manualClosed = false;
        events = {};
    };

    return {
        init: init,
        send: send,
        close: close,
        socket: function () { return binarySocket; },
        clear: clear,
        clearTimeouts: clearTimeouts
    };

}

var BinarySocket = new BinarySocketClass();
