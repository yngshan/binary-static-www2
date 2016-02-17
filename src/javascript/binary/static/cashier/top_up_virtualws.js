var TopUpVirtualWS = (function() {
	"use strict";

    var containerID,
        viewIDs,
        hiddenClass,
        $views,
        loginID;

    var init = function() {
        containerID = '#topup_virtual';
        hiddenClass = 'hidden';
        $views      = $(containerID + ' .viewItem');
        viewIDs = {
            error   : '#viewError',
            success : '#viewSuccess'
        };
        loginID = getCookieItem('loginid');

        $views.addClass('hidden');

        if(page.client.is_real) {
            showMessage(text.localize('Sorry, this feature is available to virtual accounts only.'), false);
        }
        else {
            BinarySocket.send({"topup_virtual": "1"});
        }
    };

    var responseHandler = function(response) {
    	var str, amt , currType;
	 	if('error' in response) {
            if('message' in response.error) {
                showMessage(text.localize(response.error.message), false);
            }
        }
        else{
            showMessage(
                text.localize('%1 %2 has been credited to your Virtual money account %3')
                    .replace('%1', response.topup_virtual.currency)
                    .replace('%2', response.topup_virtual.amount)
                    .replace('%3', loginID),
                true);
        }
    };

    var showMessage = function(message, isSuccess) {
        var viewID = isSuccess ? viewIDs.success : viewIDs.error;
        setActiveView(viewID);
        $(viewID + ' > p').html(message);
    };

    var setActiveView = function(viewID) {
        $views.addClass(hiddenClass);
        $(viewID).removeClass(hiddenClass);
    };


    return {
    	init: init,
    	responseHandler: responseHandler
    };
}());


pjax_config_page("top_up_virtualws", function() {
    return {
        onLoad: function() {
            if (!page.client.is_logged_in) {
                window.location.href = page.url.url_for('login');
                return;
            }

        	BinarySocket.init({
                onmessage: function(msg){
                    var response = JSON.parse(msg.data);
                    if (response) {
                        if (response.msg_type === "topup_virtual") {
                            TopUpVirtualWS.responseHandler(response);
                        }
                    }
                    else {
                        console.log('some error occured');
                    }
                }
            });

            Content.populate();
            TopUpVirtualWS.init();
        }
    };
});
