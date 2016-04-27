var LoggedInHandler = (function() {
    "use strict";

    var init = function() {
        parent.window['is_logging_in'] = 1; // this flag is used in base.js to prevent auto-reloading this page
        storeTokens();
        page.client.set_cookie('login', page.client.get_token(page.client.loginid));
        sessionStorage.setItem('check_tnc', '1');
        GTM.set_login_flag();

        // redirect back
        var redirect_url = sessionStorage.getItem('redirect_url') || page.url.url_for('trading');
        sessionStorage.removeItem('redirect_url');
        document.getElementById('loading_link').setAttribute('href', redirect_url);
        window.location.href = redirect_url;
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
