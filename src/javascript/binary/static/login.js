var Login = (function() {
    "use strict";

    var redirect_to_login = function() {
        if (!page.client.is_logged_in && !is_login_pages()) {
            sessionStorage.setItem('redirect_url', window.location.href);
            window.location.href = page.url.url_for('oauth2/authorize', 'app_id=id-NMEEIoF2heJ8f87rHpRwYw14Mqxzk'); // should be changed to binarycom
        }
    };

    var is_login_pages = function() {
        return /logged_inws|oauth2/.test(document.URL);
    };

    return {
        redirect_to_login: redirect_to_login,
        is_login_pages   : is_login_pages,
    };
}());
