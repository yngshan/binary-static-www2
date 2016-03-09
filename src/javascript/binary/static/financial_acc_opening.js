pjax_config_page("new_account/maltainvestws", function(){
  return {
    onLoad: function() {
      Content.populate();
      if (page.client.redirect_if_logout()) {
          return;
      }
      if (page.client.redirect_if_is_virtual('user/my_accountws')) {
        return;
      }
      for (i = 0; i < page.user.loginid_array.length; i++){
        if (page.user.loginid_array[i].hasOwnProperty('non_financial') && page.user.loginid_array[i].non_financial === false){
          window.location.href = page.url.url_for('user/my_accountws');
          return;
        }
      }
      handle_residence_state_ws();
      BinarySocket.send({residence_list:1});
      BinarySocket.send({get_settings:1});
      $('#financial-form').submit(function(evt) {
        evt.preventDefault();
        if (FinancialAccOpeningUI.checkValidity()){
          BinarySocket.init({
            onmessage: function(msg){
              var response = JSON.parse(msg.data);
              if (response) {
                if (response.msg_type === 'new_account_maltainvest'){
                  ValidAccountOpening.handler(response, response.new_account_maltainvest);
                }
              }
            }
          });
        }
      });
    }
  };
});
