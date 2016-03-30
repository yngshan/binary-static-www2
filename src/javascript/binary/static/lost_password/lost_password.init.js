var LostPassword = (function() {
    "use strict";

    var hiddenClass = "invisible";

    function submitEmail() {
        var emailInput = $('#lp_email').val();

        if (emailInput === '') {
            $("#email_error").removeClass(hiddenClass);
        } else {
            BinarySocket.send({verify_email: emailInput, type: 'reset_password'});
        }
    }

    function onEmailInput(input) {
        if (input) {
            $("#email_error").addClass(hiddenClass);
        }
    }
    
    function lostPasswordWSHandler(msg) {
        var response = JSON.parse(msg.data);
        var type = response.msg_type;
        switch (type) {
            case 'verify_email': if (response.verify_email === 1) {
                load_with_pjax('lost_passwordws_email_sent');
            } else if (response.error) {
                $("#email_error").removeClass(hiddenClass).text(text.localize('Invalid email format'));
            }
                break;
            default: return;
        }
    }

    function init() {
        $('#submit').click(function() {
            submitEmail();
        });

        $('#lp_email').change(function(ev) {
            onEmailInput(ev.target.value);
        });
    }

    return {
        lostPasswordWSHandler: lostPasswordWSHandler,
        init: init
    };
}());
