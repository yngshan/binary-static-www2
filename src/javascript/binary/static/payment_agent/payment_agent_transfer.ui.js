var PaymentAgentTransferUI = (function () {
    "use strict";
    var hiddenClass = 'invisible';
    var $paymentagentTransfer = $('#paymentagent_transfer');
    var $paConfirmTransfer = $('#pa_confirm_transfer');
    var $paTransferDone = $('#pa_transfer_done');
    var $paymentagentTransferNotes = $('#paymentagent_transfer_notes');
    var $paTransferDoneConfirmMsg = $('#pa_transfer_done > #confirm-msg');

    function hideForm() {
        $paymentagentTransfer.addClass(hiddenClass);
    }
    function showForm() {
        $paymentagentTransfer.removeClass(hiddenClass);
    }

    function hideConfirmation() {
        $paConfirmTransfer.addClass(hiddenClass);
    }
    function showConfirmation() {
        $paConfirmTransfer.removeClass(hiddenClass);
    }

    function hideDone() {
        $paTransferDone.addClass(hiddenClass);
    }
    function showDone() {
        $paTransferDone.removeClass(hiddenClass);
    }

    function hideNotes() {
        $paymentagentTransferNotes.addClass(hiddenClass);
    }
    function showNotes() {
        $paymentagentTransferNotes.removeClass(hiddenClass);
    }
    function updateFormView(currency) {
        $('#paymentagent_transfer label[for="amount"]').text(text.localize('Amount') + ' ' + currency);
    }

    function updateConfirmView(username, loginid, amount, currency) {
        $('#pa_confirm_transfer td#user-name').html(username);
        $('#pa_confirm_transfer td#login-id').html(loginid);
        $('#pa_confirm_transfer td#amount').html(currency + ' ' + amount);
    }

    function updateDoneView(fromID, toID, amount, currency) {
        var templateString = "Your request to transfer [_1] [_2] from [_3] to [_4] has been successfully processed.";
        var translated = text.localize(templateString);
        var confirmMsg = translated
            .replace('[_1]', amount)
            .replace('[_2]', currency)
            .replace('[_3]', fromID)
            .replace('[_4]', toID);

        $paTransferDoneConfirmMsg.text(confirmMsg);
        $paTransferDoneConfirmMsg.removeClass(hiddenClass);
    }

    return {
        hideForm: hideForm,
        showForm: showForm,
        hideConfirmation: hideConfirmation,
        showConfirmation: showConfirmation,
        hideDone: hideDone,
        showDone: showDone,
        hideNotes: hideNotes,
        showNotes: showNotes,
        updateFormView: updateFormView,
        updateConfirmView: updateConfirmView,
        updateDoneView: updateDoneView
    };
}());
