pjax_config_page("new_account/realws", function(){

  return {
    onLoad: function() {
      Content.populate();
      AccountOpening.redirectCookie();
      if (page.client.residence) {
        BinarySocket.send({landing_company: page.client.residence});
      }
      handle_residence_state_ws();
      getSettings();
      setResidenceWs();
      $('#real-form').submit(function(evt) {
        evt.preventDefault();
        if (RealAccOpeningUI.checkValidity()){
          BinarySocket.init({
            onmessage: function(msg){
              var response = JSON.parse(msg.data);
              if (response) {
                if (response.msg_type === 'new_account_real'){
                  AccountOpening.handler(response, response.new_account_real);
                }
              }
            }
          });
        }
      });
    }
  };
});
