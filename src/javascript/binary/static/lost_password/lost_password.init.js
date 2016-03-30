var LostPassword = (function() {
    "use strict";

    var hiddenClass = "invisible";

    function submitEmail() {
        var emailInput = $('#lp_email').text();
        if (emailInput === '') {
            $(".email_error").removeClass(hiddenClass);
        } else {
            BinarySocket.send({verify_email: emailInput, type: 'reset_password'});
        }
    }

    function onEmailInput(input) {
        if (input) {
            $("#email_error").addClass(hiddenClass);
        }
    }
    
    function lostPasswordWSHandler(response) {
        var type = response.msg_type;
        switch (type) {
            case 'verify_email': if (response.verify_email === 1) {
                load_with_pjax('user/lost_passwordws_email_sent');
            }
                break;
            default: return;
        }
    }

    function init() {
        
    }
}());
