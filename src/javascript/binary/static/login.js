var Login = (function() {
    "use strict";

    var make_login_popup = function() {
        var $contents = $('<div/>')
            .append($('<iframe/>', {src: page.url.url_for('oauth2/authorize', 'app_id=id-FDM59leEPafaMa7CntLZV6rliEyCE'),  // TODO: replace with 'binarycom' for production
                style: 'background: url("' + page.url.url_for_static('/images/common/hourglass_1.gif') + '") no-repeat center;',
                'onload': 'this.style.background="none"'}))
            .append($('<a/>', {href: page.url.url_for('user/lost_password'), text: text.localize('Lost password?'), id: 'popup_lost_password'}));
        var popup = new InPagePopup({content: $contents.html(), container_class: 'login_popup', page_overlay: true, modal: true});
        return popup;
    };

    var show_login_popup = function() {
        if (!page.client.is_logged_in && !is_login_popup()) {
            var login_popup = make_login_popup();
            login_popup.show();
        }
    };

    var is_login_popup = function() {
        return /logged_inws/.test(document.URL) || $('.login_popup').length > 0;
    };

    return {
        make_login_popup: make_login_popup,
        show_login_popup: show_login_popup,
        is_login_popup  : is_login_popup,
    };
}());
