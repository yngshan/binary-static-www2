var AccountOpening = (function(){
  function redirectCookie() {
    if (!$.cookie('login')) {
        window.location.href = page.url.url_for('login');
        return;
    }
    if (page.client.type !== 'virtual') {
      window.location.href = page.url.url_for('user/my_accountws');
      return;
    }
    for (i = 0; i < page.user.loginid_array.length; i++){
      if (page.user.loginid_array[i].real === true){
        window.location.href = page.url.url_for('user/my_accountws');
        return;
      }
    }
  }
  function handler(response, message) {
    if (response.error) {
      var errorMessage = response.error.message;
      if (errorMessage) {
        if (document.getElementById('real-form')) {
          $('#real-form').remove();
        } else if (document.getElementById('japan-form')) {
          $('#japan-form').remove();
        }
        var error = document.getElementsByClassName('notice-msg')[0];
        error.innerHTML = errorMessage;
        error.parentNode.parentNode.parentNode.setAttribute('style', 'display:block');
        return;
      }
    } else {
      var loginid = message.client_id;
      //set cookies
      var oldCookieValue = $.cookie('loginid_list');
      var cookie_domain = '.' + document.domain.split('.').slice(-2).join('.');
      $.cookie('loginid_list', loginid + ':R:E+' + oldCookieValue, {domain: cookie_domain, path:'/'});
      $.cookie('loginid', loginid, {domain: cookie_domain, path:'/'});
      //push to gtm
      var gtmDataLayer = document.getElementsByClassName('gtm_data_layer')[0];
      var age = new Date().getFullYear() - document.getElementById('dobyy').value;
      document.getElementById('event').innerHTML = 'new_account';
      dataLayer.push({
        'language': page.language(),
        'event': 'new_account',
        'visitorID': loginid,
        'bom_age': age,
        'bom_country': $('#residence-disabled option[value="' + page.client.residence + '"]').html(),
        'bom_today': Math.floor(Date.now() / 1000),
        'bom_email': page.user.email,
        'bom_firstname': document.getElementById('fname').value,
        'bom_lastname': document.getElementById('lname').value,
        'bom_phone': document.getElementById('tel').value
      });
      var affiliateToken = $.cookie('affiliate_tracking');
      if (affiliateToken) {
        dataLayer.push({'bom_affiliate_token': JSON.parse($.cookie('affiliate_tracking')).t});
      }
      //generate dropdown list and switch
      var option = new Option('Real Account (' + loginid + ')', loginid);
      document.getElementById('client_loginid').appendChild(option);
      $('#client_loginid option[value="' + page.client.loginid + '"]').removeAttr('selected');
      option.setAttribute('selected', 'selected');
      $('#loginid-switch-form').submit();
    }
  }
  var errorCounter = 0;
  var letters = Content.localize().textLetters,
      numbers = Content.localize().textNumbers,
      space   = Content.localize().textSpace,
      hyphen  = Content.localize().textHyphen,
      period  = Content.localize().textPeriod,
      apost   = Content.localize().textApost;
  function checkFname(fname, errorFname) {
    if (Trim(fname.value).length < 2) {
      errorFname.innerHTML = Content.errorMessage('min', '2');
      Validate.displayErrorMessage(errorFname);
      errorCounter++;
    } else if (!/^[a-zA-Z\s-.']+$/.test(fname.value)){
      errorFname.innerHTML = Content.errorMessage('reg', [letters, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorFname);
      errorCounter++;
    }
    return errorCounter;
  }
  function checkLname(lname, errorLname) {
    if (Trim(lname.value).length < 2) {
      errorLname.innerHTML = Content.errorMessage('min', '2');
      Validate.displayErrorMessage(errorLname);
      errorCounter++;
    } else if (!/^[a-zA-Z\s-.']+$/.test(lname.value)){
      errorLname.innerHTML = Content.errorMessage('reg', [letters, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorLname);
      errorCounter++;
    }
    return errorCounter;
  }
  function checkDate(dobdd, dobmm, dobyy, errorDob) {
    if (!isValidDate(dobdd.value, dobmm.value, dobyy.value) || dobdd.value === '' || dobmm.value === '' || dobyy.value === '') {
      errorDob.innerHTML = Content.localize().textErrorBirthdate;
      Validate.displayErrorMessage(errorDob);
      errorCounter++;
    }
    return errorCounter;
  }
  function checkAddress(address1, errorAddress1, address2, errorAddress2) {
    if (!/^[a-zA-Z\d\s-.']+$/.test(address1.value)){
      errorAddress1.innerHTML = Content.errorMessage('reg', [letters, numbers, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorAddress1);
      errorCounter++;
    }
    if (address2.value !== ""){
      if (!/^[a-zA-Z\d\s-.']+$/.test(address2.value)){
        errorAddress2.innerHTML = Content.errorMessage('reg', [letters, numbers, space, hyphen, period, apost, ' ']);
        Validate.displayErrorMessage(errorAddress2);
        errorCounter++;
      }
    }
    return errorCounter;
  }
  function checkTown(town, errorTown) {
    if (!/^[a-zA-Z\s-.']+$/.test(town.value)){
      errorTown.innerHTML = Content.errorMessage('reg', [letters, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorTown);
      errorCounter++;
    }
    return errorCounter;
  }
  function checkPostcode(postcode, errorPostcode) {
    if (postcode.value !== '' && !/^[a-zA-Z\d-]+$/.test(postcode.value)){
      errorPostcode.innerHTML = Content.errorMessage('reg', [letters, numbers, hyphen, ' ']);
      Validate.displayErrorMessage(errorPostcode);
      errorCounter++;
    }
    return errorCounter;
  }
  function checkTel(tel, errorTel) {
    if (tel.value.replace(/\+| /g,'').length < 6) {
      errorTel.innerHTML = Content.errorMessage('min', 6);
      Validate.displayErrorMessage(errorTel);
      errorCounter++;
    } else if (!/^\+?[\d-\s]+$/.test(tel.value)){
      errorTel.innerHTML = Content.errorMessage('reg', [numbers, space, hyphen, ' ']);
      Validate.displayErrorMessage(errorTel);
      errorCounter++;
    }
    return errorCounter;
  }
  function checkAnswer(answer, errorAnswer) {
    if (answer.value.length < 4) {
      errorAnswer.innerHTML = Content.errorMessage('min', 4);
      Validate.displayErrorMessage(errorAnswer);
      errorCounter++;
    }
    return errorCounter;
  }
  return {
    redirectCookie: redirectCookie,
    handler: handler,
    checkFname: checkFname,
    checkLname: checkLname,
    checkDate: checkDate,
    checkAddress: checkAddress,
    checkTown: checkTown,
    checkPostcode: checkPostcode,
    checkTel: checkTel,
    checkAnswer: checkAnswer
  };
}());
