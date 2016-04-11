var PricingTable = (function() {

  var state = {
    prev_prices: {},
    prices: {},
    multiplier: {},
  };

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
      var inactive = this.props.is_active && price !== 1000 && price !== 0 ? '' : 'inactive';
      var multiplier = this.props.type === 'buy' ? React.createElement(
        "div", { "className": "col multiplier2", "key": "multiplier2" },
        React.createElement("input", {
          defaultValue: "1",
          onChange: handleMultiplierChange({
            value: event.target.value,
            barrier: this.props.barrier,
            symbol: this.props.symbol,
            category: this.props.category,
            date_expiry: this.props.date_expiry,
          })
        })
      ) : React.createElement("div", { "className": "col multiplier2", "key": "multiplier2", text: 1 });

      return React.createElement(
        "div", {
          key: 'inactive',
          "className": "pricing_table_cell col row " +
            this.props.type + "_cell" +
            (this.props.dyn > 0 ? " price_rise" : (this.props.dyn < 0 ? " price_fall" : ''))
        },
        (this.props.empty ? undefined : [
          React.createElement(
            "div", { "className": inactive }
          ),
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
          multiplier
        ])
      );
    }

  });

  var PricingTableHeader = React.createClass({
    displayName: "PricingTableHeader",
    render: function render() {
      var exercisePriceLabel = Content.localize().textExercisePrice;
      var pricesLabel = Content.localize().textPrices;
      var lotsLabel = Content.localize().textLots;

      return React.createElement(
        'div', { 'className': 'pricing_table_row row heading' },
        React.createElement(
          'div', { 'className': 'col' },
          exercisePriceLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          pricesLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          lotsLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          pricesLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          lotsLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          pricesLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          lotsLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          pricesLabel
        ),
        React.createElement(
          'div', { 'className': 'col' },
          lotsLabel
        )
      );
    }
  });

  var PricingTableRow = React.createClass({
    displayName: "PricingTableRow",

    render: function render() {
      var types = Object.keys(this.props.values);
      var buy1 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "buy", is_active: 0, price: 1000 });
      var sell1 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "sell", is_active: 0, price: 0 });
      var buy2 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "buy", is_active: 0, price: 1000 });
      var sell2 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "sell", is_active: 0, price: 0 });

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
          buy1 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "buy", is_active: 1, price: this.props.values[type], dyn: dyn });
          sell2 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "sell", is_active: 1, price: 1000 - this.props.values[type], dyn: dyn });
        } else {
          buy2 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "buy", is_active: 1, price: this.props.values[type], dyn: dyn });
          sell1 = React.createElement(PricingTableCell, { multiplier: this.props.multiplier, type: "sell", is_active: 1, price: 1000 - this.props.values[type], dyn: dyn });
        }
      }

      var barrier = this.props.barrier.replace(/_/, ' - ');
      return React.createElement(
        "div", { "className": "pricing_table_row row" },
        React.createElement(
          "div", { "className": "col barrier" },
          barrier
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
      var rows = [
        React.createElement(PricingTableHeader, { key: 0 })
      ];

      var barriers = Object.keys(this.props.prices).sort(function(a, b) {
        return b - a;
      });

      for (var i = 1; i <= barriers.length; i++) {
        var barrier = barriers[i - 1];
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
      state.prev_prices = {};
      state.prices = {};
      state.category = form.contract_category;
      state.date_expiry = form.date_expiry;
      state.symbol = form.symbol;
      BinarySocket.send({
        pricing_table: 1,
        contract_category: form.contract_category,
        date_expiry: form.date_expiry,
        symbol: form.symbol,
        type: 'japan',
      });
    }
  }

  function handleMultiplierChange(props) {
    if (!state[props.symbol]) {
      state[props.symbol] = {};
    }
    if (!state[props.symbol][props.category]) {
      state[props.symbol][props.category] = {};
    }
    if (!state[props.symbol][props.category]) {
      state[props.symbol][props.category] = {};
    }
    if (!state[props.symbol][props.category][props.date_expiry]) {
      state[props.symbol][props.category][props.date_expiry] = {};
    }
    state[props.symbol][props.category][props.date_expiry][props.barrier] = props.value;
  }

  function handleResponse(res) {
    var echo_req = res.echo_req;

    if (state.category === echo_req.contract_category &&
      state.date_expiry === echo_req.date_expiry &&
      state.symbol === echo_req.symbol) {

      state.prev_prices = state.prices;
      state.prices = res.pricing_table.prices;

      var contractTypes = Contract.contractType()[state.category];
      var close = $("#period option:selected").text();
      close = close.replace(/\s+\(.+$/, '');

      if (contractTypes) {

        Object.keys(contractTypes).forEach(function(type) {
          var contractName = contractTypes[type];
          var mask = Content.localize()['text' + type];
          if (mask) {
            var longCode = {
              mask: mask,
              values: {
                currency: 'JPY',
                sum: 1000,
                symbol: state.symbol,
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
          }
        });
      }

      ReactDOM.render(
        React.createElement(PricingTable, state),
        document.getElementById('pricing_table')
      );

      $('#pricing_table').show();
    }

  }

  return {
    sendRequest: sendRequest,
    handleResponse: handleResponse,
    state: state,
  };
})();
