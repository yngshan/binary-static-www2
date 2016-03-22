if (typeof is_japan === 'function') {

  var processPricingTableRequest = function() {
    var symbol = $('#underlying').val();
    var period = $('#period').val();
    var res = period.split('_');
    var date_expiry = res[1];
    var formName = sessionStorage.getItem('formname');
    var category = formName === 'higherlower' ? 'callput' : formName;

    PricingTable.sendRequest({
      symbol: symbol,
      date_expiry: date_expiry,
      contract_category: category,
    });
  };

  var processContractForm = function() {

    Contract.details(sessionStorage.getItem('formname'));

    StartDates.display();

    if (Periods) {
      Periods.displayPeriods();
    }

    displayPrediction();

    displaySpreads();

    if (sessionStorage.getItem('amount')) $('#amount').val(sessionStorage.getItem('amount'));
    if (sessionStorage.getItem('currency')) selectOption(sessionStorage.getItem('currency'), document.getElementById('currency'));

    Durations.display();

    processPricingTableRequest();

  };
}
