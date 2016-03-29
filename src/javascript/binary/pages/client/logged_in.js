var LoggedInHandler = (function() {
    "use strict";

    var init = function() {
        var $popup = window.parent.$('.login_popup');
        $popup.find('.close').hide();
        $popup.find('iframe').css({'background': ''});
        $popup.find('a#popup_lost_password').remove();
        page.client.check_storage_values();
        storeTokens();
        GTM.set_login_flag();
        parent.window.location.reload();
    };

    var storeTokens = function() {
        // Parse hash for loginids and tokens returned by OAuth
        var hash = window.location.hash.substr(1).split('&');
        var tokens = {};
        for(var i = 0; i < hash.length; i += 2) {
            var loginid = getHashValue(hash[i], 'acct');
            var token = getHashValue(hash[i+1], 'token');
            if(loginid && token) {
                tokens[loginid] = token;
            }
        }
        if(Object.keys(tokens).length > 0) {
            page.client.set_storage_value('tokens', JSON.stringify(tokens));
        }
    };

    var getHashValue = function(source, key) {
        var match = new RegExp('^' + key);
        return source && source.length > 0 ? (match.test(source.split('=')[0]) ? source.split('=')[1] : '') : '';
    };

    return {
        init: init,
    };
}());
