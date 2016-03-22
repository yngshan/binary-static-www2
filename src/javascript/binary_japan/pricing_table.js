var PricingTable = (function() {

  var prev_prices = {};
  var current_prices = {};
  var multiplier = {};

  var ContractDescription = React.createClass({
    displayName: 'ContractDescription',

    render: function render() {

      var values = this.props.longCode.values;
      var longCode = this.props.longCode.mask;

      Object.keys(values).forEach(function(key) {
        longCode = longCode.replace('{' + key + '}', values[key]);
      });

      return React.createElement(
        'div', { className: 'contract_description' },
        React.createElement(
          'h4', { 'className': 'contract_heading ' + this.props.type },
          this.props.contractName
        ),
        React.createElement(
          'div', { 'className': 'contract_longcode' },
          longCode
        )
      );
    }
  });

  var PricingTableCell = React.createClass({
    displayName: "PricingTableCell",

    render: function render() {
      var price = parseInt(this.props.price);
      var inactive = price !== 1000 && price !== 0 ? '' : ' inactive';
      return React.createElement(
        "div", {
          "className": "pricing_table_cell col row " +
            this.props.type + "_cell" +
            (this.props.dyn > 0 ? " price_rise" : (this.props.dyn < 0 ? " price_fall" : '')) +
            (inactive ? inactive : '')
        },
        (this.props.empty ? undefined : [
          React.createElement(
            "div", { "className": "price", "key": "price" },
            price
          ),
          React.createElement(
            "div", { "className": "col button", "key": "button" },
            Content.localize()['text' + (this.props.type === 'buy' ? 'Buy' : 'Sell')]
          ),
          React.createElement(
            "div", { "className": "col multiplier1", "key": "multiplier1" },
            "x"
          ),
          React.createElement(
            "div", { "className": "col multiplier2", "key": "multiplier2" },
            React.createElement("input", { defaultValue: "1" })
          )
        ])
      );
    }

  });

  var PricingTableRow = React.createClass({
    displayName: "PricingTableRow",

    render: function render() {
      var types = Object.keys(this.props.values);
      var buy1 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "buy", is_active: 0, price: 1000 });
      var sell1 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "sell", is_active: 0, price: 0 });
      var buy2 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "buy", is_active: 0, price: 1000 });
      var sell2 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "sell", is_active: 0, price: 0 });

      for (var i = 0; i < types.length; i++) {
        var type = types[i];
        var position = contractTypeDisplayMapping(type);
        var dyn = 0;
        if (this.props.prev_values !== undefined && this.props.prev_values[type] !== undefined) {
          if (this.props.values[type] > this.props.prev_values[type]) {
            dyn = 1;
          } else if (this.props.values[type] < this.props.prev_values[type]) {
            dyn = -1;
          }
        }

        if (position === 'top') {
          buy1 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "buy", is_active: 1, price: this.props.values[type], dyn: dyn });
          sell1 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "sell", is_active: 1, price: 1000 - this.props.values[type], dyn: dyn });
        } else {
          buy2 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "buy", is_active: 1, price: this.props.values[type], dyn: dyn });
          sell2 = React.createElement(PricingTableCell, { multiplier: (multiplier ? multiplier : undefined), type: "sell", is_active: 1, price: 1000 - this.props.values[type], dyn: dyn });
        }
      }

      return React.createElement(
        "div", { "className": "pricing_table_row row" },
        // React.createElement(
        //     "div", { "className": "col exercise_price" },
        //     Content.localize().textExercisePrice
        // ),
        React.createElement(
          "div", { "className": "col barrier" },
          this.props.barrier
        ),
        buy1,
        sell1,
        buy2,
        sell2
      );
    }
  });


  var PricingTable = React.createClass({
    displayName: "PricingTable",

    render: function render() {
      var rows = [];
      var barriers = Object.keys(this.props.prices).sort();
      for (var i = 0; i < barriers.length; i++) {
        var barrier = barriers[i];
        rows.push(React.createElement(PricingTableRow, {
          key: i,
          barrier: barrier,
          multiplier: this.props.multiplier,
          values: this.props.prices[barrier],
          prev_values: (this.props.prev_prices !== undefined ? this.props.prev_prices[barrier] : undefined)
        }));
      }
      return React.createElement(
        "div", { "className": "pricing_table" },
        rows
      );
    }
  });

  function sendRequest(form) {
    if (form.contract_category && form.date_expiry && form.symbol) {
      $('#pricing_table').hide();
      $('#contract_description1').hide();
      $('#contract_description2').hide();
      prev_prices = {};
      BinarySocket.send({
        pricing_table: 1,
        properties: form
      });
    }
  }

  function handleResponse(res) {
    var echo_req = res.echo_req;
    // if (_getStoredCategory() === echo_req.contract_category &&
    //     sessionStorage.getItem('underlying') === echo_req.symbol &&
    //     sessionStorage.getItem('expiry_date') === echo_req.expiry_date
    // ) {


    var formName = sessionStorage.getItem('formname');
    var category = formName === 'higherlower' ? 'callput' : formName;
    var contractTypes = Contract.contractType()[category];

    var symbol = $('#underlying').val();
    var close = $("#period option:selected").text();
    close = close.replace(/\s+\(.+$/, '');

    if (contractTypes) {

      Object.keys(contractTypes).forEach(function(type) {
        var contractName = contractTypes[type];
        var longCode = {
          mask: Content.localize()['text' + type],
          values: {
            currency: 'JPY',
            sum: 1000,
            symbol: symbol,
            close: close,
          },
        };

        var position = contractTypeDisplayMapping(type);
        var positionIndex = position === 'top' ? 1 : 2;

        ReactDOM.render(
          React.createElement(ContractDescription, {
            longCode: longCode,
            type: type,
            contractName: contractName,
          }),
          document.getElementById('contract_description' + positionIndex)
        );
        $('#contract_description' + positionIndex).css('display', 'flex');
      });
    }

    ReactDOM.render(
      React.createElement(PricingTable, {
        prices: res.pricing_table.prices,
        prev_prices: prev_prices,
        multiplier: multiplier,
      }),
      document.getElementById('pricing_table')
    );

    $('#pricing_table').show();

    prev_prices = res.pricing_table.prices;

    // }
  }

  function _getStoredCategory() {
    var contract_category = sessionStorage.getItem('formname');
    if (sessionStorage.getItem('formname') === 'risefall' || sessionStorage.getItem('formname') === 'higherlower') {
      contract_category = 'callput';
    }
    return contract_category;
  }

  return {
    sendRequest: sendRequest,
    handleResponse: handleResponse,
  };
})();
