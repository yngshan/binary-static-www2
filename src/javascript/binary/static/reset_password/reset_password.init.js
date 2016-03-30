var ResetPassword = (function () {
    var hiddenClass = 'invisible';

    function submitResetPassword() {
        var token = $('#verification-code').val();
        var pw1 = $('#reset-password1').val();
        var pw2 = $('#reset-password2').val();
        var dob = $('#dob').val();

        if (token === '') {
            $('#reset-error').removeClass(hiddenClass).text(text.localize('Verification code is required.'));
            return;
        }

        // TODO: validate using validation.js
        if (pw1 === '' && pw1 !== pw2) {
            $('#reset-error').removeClass(hiddenClass).text(text.localize('Password does not match.'));
            return;
        }

        var dobDate = new Date(dob);
        if (dob === '' && dobDate === 'Invalid Date') {
            $('#reset-error').removeClass(hiddenClass).text(text.localize('Invalid date of birth.'));
            return;
        }

        BinarySocket.send({
            reset_password: 1,
            verification_code: token,
            new_password: pw1,
            date_of_birth: dob
        });
    }

    function onInput() {
        $('#reset-error').addClass(hiddenClass);
    }

    function resetPasswordWSHandler(msg) {
        var response = JSON.parse(msg.data);
        var type = response.msg_type;

        switch (type) {
            case 'reset_password': if (response.error) {
                $('#reset-error').removeClass(hiddenClass).text(response.error.message);
            } else {
                $('#reset-form').addClass(hiddenClass);
                $('p.notice-msg')
                    .text(text.localize('Your password has been successfully reset. ' +
                        'Please log into your account using your new password.'));
            }
                break;
            default: return;
        }
    }
    
    function init() {
        $('input').change(function () {
            onInput();
        });

        $('#reset').click(function () {
            submitResetPassword();
        });
    }

    return {
        resetPasswordWSHandler: resetPasswordWSHandler,
        init: init
    };
}());
