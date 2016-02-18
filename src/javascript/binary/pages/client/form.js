var ClientForm = function(init_params) {
    this.valid_loginids =  new RegExp("^(" + init_params['valid_loginids'] + ")[0-9]+$", "i");
};

ClientForm.prototype = {
    is_loginid_valid: function(login_id) {
        if (login_id.length > 0) {
            login_id = login_id.toUpperCase();
            return this.valid_loginids.test(login_id);
        }

        return true;
    },
    set_idd_for_residence: function(residence) {
        var tel = $('#Tel');
        if (!tel.val() || tel.val().length < 6) {
            var idd_code = idd_codes[residence];
            tel.val(idd_code ? '+' + idd_code : '');
        }
    },
    on_residence_change: function() {
        var that = this;
        $('#residence').on('change', function() {
            that.set_idd_for_residence($(this).val());
            var address_state = $('#AddressState');
            var current_state = address_state.length > 0 ? address_state.val() : '';

            var postcodeLabel = $('label[for=AddressPostcode]');
            if ($(this).val() == 'gb') {
                postcodeLabel.prepend('<em class="required_asterisk">* </em>');
            } else {
                postcodeLabel.find('em').remove();
            }
        });
    }
};
