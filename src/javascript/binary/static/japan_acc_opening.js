pjax_config_page("new_account/japanws", function(){

  return {
    onLoad: function() {
      Content.populate();
      AccountOpening.redirectCookie();
      if (page.client.residence !== 'jp') {
        window.location.href = page.url.url_for('user/my_accountws');
        return;
      }
      handle_residence_state_ws();
      getSettings();
      var purpose = $('#trading-purpose'),
          hedging = $('.hedging-assets');
      purpose.change(function(evt) {
        if (purpose.val() === 'Hedging') {
          hedging.show();
        }
        else if (hedging.is(":visible")) {
          hedging.hide();
        }
        return;
      });
      $('#japan-form').submit(function(evt) {
        evt.preventDefault();
        if (JapanAccOpeningUI.checkValidity()){
          BinarySocket.init({
            onmessage: function(msg){
              var response = JSON.parse(msg.data);
              if (response) {
                if (response.msg_type === 'new_account_japan'){
                  AccountOpening.handler(response, response.new_account_japan);
                }
              }
            }
          });
        }
      });
    }
  };
});
