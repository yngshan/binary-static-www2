var SettingsWS = (function() {
    "use strict";

    var init = function() {
        var classHidden = 'invisible',
            classReal   = '.real';

        if(!TUser.get().is_virtual) {
            $(classReal).removeClass(classHidden);
        }
        else {
            $(classReal).addClass(classHidden);
        }

        $('#settingsContainer').removeClass(classHidden);
    };

    return {
        init: init
    };
}());


pjax_config_page("settingsws", function() {
    return {
        onLoad: function() {
            if (page.client.redirect_if_logout()) {
                return;
            }

            if(!TUser.get().hasOwnProperty('is_virtual')) {
                BinarySocket.init({
                    onmessage: function(msg) {
                        var response = JSON.parse(msg.data);
                        if (response && response.msg_type === 'authorize') {
                            SettingsWS.init();
                        }
                    }
                });
            }
            else {
                SettingsWS.init();
            }
        }
    };
});
