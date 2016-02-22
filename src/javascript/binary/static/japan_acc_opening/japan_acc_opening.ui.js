var JapanAccOpeningUI = (function(){
  "use strict";

  function showError(opt){
    $('#japan-form').remove();
    var error = document.getElementsByClassName('notice-msg')[0];
    if (opt === 'duplicate') {
      error.innerHTML = text.localize("Sorry, you seem to already have a real money account with us. Perhaps you have used a different email address when you registered it. For legal reasons we are not allowed to open multiple real money accounts per person. If you do not remember your account with us, please") + " " + "<a href='" + page.url.url_for('contact') + "'>" + text.localize("contact us") + "</a>" + ".";
    } else {
      error.innerHTML = opt;
    }
    error.parentNode.parentNode.parentNode.setAttribute('style', 'display:block');
    return;
  }

  function checkValidity(){
    var errorCounter = 0;

    var letters = Content.localize().textLetters,
        numbers = Content.localize().textNumbers,
        space   = Content.localize().textSpace,
        hyphen  = Content.localize().textHyphen,
        period  = Content.localize().textPeriod,
        apost   = Content.localize().textApost;

    var elementObj = {
        gender      : document.getElementById('gender'),
        fname       : document.getElementById('fname'),
        lname       : document.getElementById('lname'),
        dobdd       : document.getElementById('dobdd'),
        dobmm       : document.getElementById('dobmm'),
        dobyy       : document.getElementById('dobyy'),
        occupation  : document.getElementById('occupation'),
        address1    : document.getElementById('address1'),
        address2    : document.getElementById('address2'),
        town        : document.getElementById('address-town'),
        state       : document.getElementById('address-state'),
        postcode    : document.getElementById('address-postcode'),
        tel         : document.getElementById('tel'),
        question    : document.getElementById('secret-question'),
        answer      : document.getElementById('secret-answer'),
        fatca       : document.getElementById('fatca'),
        income      : document.getElementById('annual-income'),
        asset       : document.getElementById('financial-asset'),
        limit       : document.getElementById('daily-loss-limit'),
        equities    : document.getElementById('equities'),
        commodities : document.getElementById('commodities'),
        deposit     : document.getElementById('foreign-currency-deposit'),
        margin      : document.getElementById('margin-fx'),
        trust       : document.getElementById('investment-trust'),
        bond        : document.getElementById('public-and-corporation-bond'),
        otc         : document.getElementById('otc-derivative-trading'),
        purpose     : document.getElementById('trading-purpose'),
        hedge       : document.getElementById('hedge-asset'),
        amount      : document.getElementById('hedge-asset-amount'),
        electronic  : document.getElementById('use-electronic-doc'),
        policies    : document.getElementById('warnings-and-policies'),
        judgement   : document.getElementById('own-judgment'),
        mechanism   : document.getElementById('trading-mechanism'),
        time        : document.getElementById('judgment-time'),
        total       : document.getElementById('total-loss'),
        sellback    : document.getElementById('sellback-loss'),
        shortsell   : document.getElementById('shortsell-loss'),
        profit      : document.getElementById('company-profit'),
        knowledge   : document.getElementById('expert-knowledge')
    };

    var errorObj = {
        gender      : document.getElementById('error-gender'),
        fname       : document.getElementById('error-fname'),
        lname       : document.getElementById('error-lname'),
        dobdd       : document.getElementById('error-birthdate'),
        dobmm       : document.getElementById('error-birthdate'),
        dobyy       : document.getElementById('error-birthdate'),
        occupation  : document.getElementById('error-occupation'),
        address1    : document.getElementById('error-address1'),
        address2    : document.getElementById('error-address2'),
        town        : document.getElementById('error-town'),
        state       : document.getElementById('error-state'),
        postcode    : document.getElementById('error-postcode'),
        tel         : document.getElementById('error-tel'),
        question    : document.getElementById('error-question'),
        answer      : document.getElementById('error-answer'),
        fatca       : document.getElementById('error-fatca'),
        income      : document.getElementById('error-annual-income'),
        asset       : document.getElementById('error-financial-asset'),
        limit       : document.getElementById('error-daily-loss-limit'),
        equities    : document.getElementById('error-equities'),
        commodities : document.getElementById('error-commodities'),
        deposit     : document.getElementById('error-foreign-currency-deposit'),
        margin      : document.getElementById('error-margin-fx'),
        trust       : document.getElementById('error-investment-trust'),
        bond        : document.getElementById('error-public-and-corporation-bond'),
        otc         : document.getElementById('error-otc-derivative-trading'),
        purpose     : document.getElementById('error-trading-purpose'),
        hedge       : document.getElementById('error-hedge-asset'),
        amount      : document.getElementById('error-hedge-asset-amount'),
        electronic  : document.getElementById('error-use-electronic-doc'),
        policies    : document.getElementById('error-warnings-and-policies'),
        judgement   : document.getElementById('error-own-judgment'),
        mechanism   : document.getElementById('error-trading-mechanism'),
        time        : document.getElementById('error-judgment-time'),
        total       : document.getElementById('error-total-loss'),
        sellback    : document.getElementById('error-sellback-loss'),
        shortsell   : document.getElementById('error-shortsell-loss'),
        profit      : document.getElementById('error-company-profit'),
        knowledge   : document.getElementById('error-expert-knowledge')
    };
    var key;
    for (key in errorObj) {
      if (errorObj[key].offsetParent !== null) {
        errorObj[key].setAttribute('style', 'display:none');
      }
    }

    if (Trim(elementObj['fname'].value).length < 2) {
      errorObj['fname'].innerHTML = Content.errorMessage('min', '2');
      Validate.displayErrorMessage(errorObj['fname']);
      errorCounter++;
    } else if (!/^[a-zA-Z\s-.']+$/.test(elementObj['fname'].value)){
      errorObj['fname'].innerHTML = Content.errorMessage('reg', [letters, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorObj['fname']);
      errorCounter++;
    }

    if (Trim(elementObj['lname'].value).length < 2) {
      errorObj['lname'].innerHTML = Content.errorMessage('min', '2');
      Validate.displayErrorMessage(errorObj['lname']);
      errorCounter++;
    } else if (!/^[a-zA-Z\s-.']+$/.test(elementObj['lname'].value)){
      errorObj['lname'].innerHTML = Content.errorMessage('reg', [letters, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorObj['lname']);
      errorCounter++;
    }

    if (!isValidDate(elementObj['dobdd'].value, elementObj['dobmm'].value, elementObj['dobyy'].value) || elementObj['dobdd'].value === '' || elementObj['dobmm'].value === '' || elementObj['dobyy'].value === '') {
      errorObj['dobdd'].innerHTML = Content.localize().textErrorBirthdate;
      Validate.displayErrorMessage(errorObj['dobdd']);
      errorCounter++;
    }

    if (!/^[a-zA-Z\d\s-.']+$/.test(elementObj['address1'].value)){
      errorObj['address1'].innerHTML = Content.errorMessage('reg', [letters, numbers, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorObj['address1']);
      errorCounter++;
    }

    if (elementObj['address2'].value !== "" && !/^[a-zA-Z\d\s-.']+$/.test(elementObj['address2'].value)){
      errorObj['address2'].innerHTML = Content.errorMessage('reg', [letters, numbers, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorObj['address2']);
      errorCounter++;
    }

    if (!/^[a-zA-Z\s-.']+$/.test(elementObj['town'].value)){
      errorObj['town'].innerHTML = Content.errorMessage('reg', [letters, space, hyphen, period, apost, ' ']);
      Validate.displayErrorMessage(errorObj['town']);
      errorCounter++;
    }

    if (elementObj['postcode'].value !== '' && !/^[a-zA-Z\d-]+$/.test(elementObj['postcode'].value)){
      errorObj['postcode'].innerHTML = Content.errorMessage('reg', [letters, numbers, hyphen, ' ']);
      Validate.displayErrorMessage(errorObj['postcode']);
      errorCounter++;
    }

    if (elementObj['tel'].value.replace(/\+| /g,'').length < 6) {
      errorObj['tel'].innerHTML = Content.errorMessage('min', 6);
      Validate.displayErrorMessage(errorObj['tel']);
      errorCounter++;
    } else if (!/^\+?[\d-\s]+$/.test(elementObj['tel'].value)){
      errorObj['tel'].innerHTML = Content.errorMessage('reg', [numbers, space, hyphen, ' ']);
      Validate.displayErrorMessage(errorObj['tel']);
      errorCounter++;
    }

    if (elementObj['answer'].value.length < 4) {
      errorObj['answer'].innerHTML = Content.errorMessage('min', 4);
      Validate.displayErrorMessage(errorObj['answer']);
      errorCounter++;
    }

    if (!/^\d+$/.test(elementObj['limit'].value)){
      errorObj['limit'].innerHTML = Content.errorMessage('reg', [numbers, '']);
      Validate.displayErrorMessage(errorObj['limit']);
      errorCounter++;
    }

    if (elementObj['amount'].offsetParent !== null && !/^\d+$/.test(elementObj['amount'].value)){
      errorObj['amount'].innerHTML = Content.errorMessage('reg', [numbers, '']);
      Validate.displayErrorMessage(errorObj['amount']);
      errorCounter++;
    }

    for (key in elementObj){
      if (elementObj[key].offsetParent !== null && key !== 'address2' && key !== 'postcode') {
        if (/^$/.test(Trim(elementObj[key].value)) && elementObj[key].type !== 'checkbox'){
          errorObj[key].innerHTML = Content.errorMessage('req');
          Validate.displayErrorMessage(errorObj[key]);
          errorCounter++;
        }
        if (elementObj[key].type === 'checkbox' && !elementObj[key].checked){
          errorObj[key].innerHTML = Content.errorMessage('req');
          Validate.displayErrorMessage(errorObj[key]);
          errorCounter++;
        }
      }
    }

    if (errorCounter === 0) {
      JapanAccOpeningData.getJapanAcc(elementObj);
      for (key in errorObj) {
        if (errorObj[key].offsetParent !== null) {
          errorObj[key].setAttribute('style', 'display:none');
        }
      }
      return 1;
    }
    return 0;
  }

  return {
    showError: showError,
    checkValidity: checkValidity
  };
})();
