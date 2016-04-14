if (typeof is_japan === 'function') {

  var processForgetTables = function() {
    BinarySocket.send({
      forget_all: 'pricing_table',
    });
  };

  var processPricingTableRequest = function() {
    processForgetTables();
    var symbol = $('#underlying').val();
    var period = $('#period').val();
    var res = period.split('_');
    var date_expiry = res[1];
    var formName = sessionStorage.getItem('formname');
    var units = Math.abs(parseInt($('#japan_unit').val(), 10)) || 1;
    var amount = units*1000;
    var category = formName === 'higherlower' ? 'callput' : formName;

    PricingTable.sendRequest({
      symbol: symbol,
      date_expiry: date_expiry,
      contract_category: category,
      amount: amount,
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
