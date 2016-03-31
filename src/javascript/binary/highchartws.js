var Highchart = (function() {
  function init_chart(options) {
      var data = [];
      var type = '';
      if(options.history){
        type = 'line';
        var history = options.history;
        var times = history.times;
        var prices = history.prices;
        for(var i = 0; i < times.length; ++i) {
          data.push([times[i]*1000, prices[i]*1]);
        }
      }
      if(options.candles) {
        type = 'candlestick';
        data = options.candles.map(function(c){
          return [c.epoch*1000, c.open*1, c.high*1, c.low*1, c.close*1];
        });
      }
      var title = options.title;
      var el = document.getElementById('analysis_live_chart');

      options = {
        chart: {
          type: 'line',
          renderTo: el,
          backgroundColor: null, /* make background transparent */
          width: 0,
          height: 450
        },
        title:{
          text: title,
          style: { fontSize:'16px' }
        },
        credits:{
          enabled: false
        },
        tooltip:{ xDateFormat:'%A, %b %e, %H:%M:%S GMT' },
        xAxis: {
          type: 'datetime',
          categories:null,
          startOnTick: false,
          endOnTick: false,
          min: options.min ? options.min*1000 : null,
          max: window.max ? window.max*1000 : null,
          labels: { overflow:"justify", format:"{value:%H:%M:%S}" }
        },
        yAxis: {
          labels: { align: 'left', x: 0, y: -2 },
          title: '',
          // gridLineWidth: 0,
        },
        series: [{
          name: title,
          data: data,
          type: type,
        }],
        exporting: {enabled: false, enableImages: false},
        legend: {enabled: false},
        navigator: { enabled: true },
        plotOptions: {
          line: {
            marker: { radius: 2 }
          },
          candlestick: {
            lineColor: 'black',
            color: 'red',
            upColor: 'green',
            upLineColor: 'black',
            shadow: true
          },
        },
        rangeSelector: { enabled: false },
      };

      var chart = new Highcharts.Chart(options);

      chart.addPlotLineX = function(options) {
        chart.xAxis[0].addPlotLine({
           value: options.value,
           id: options.id || options.value,
           label: {text: options.label || 'label', x: options.text_left ? -15 : 5},
           color: options.color || '#e98024',
           zIndex: 4,
           width: options.width || 2,
        });
      };

      chart.addPlotLineY = function(options) {
        chart.yAxis[0].addPlotLine({
          id: options.id || options.label,
          value: options.value,
          label: {text: options.label, align: 'center'},
          color: options.color || 'green',
          zIndex: 4,
          width: 2,
        });
      };

      el.chart = chart;

      return el.chart;
  }

  function show_chart(contract, update) {
      var start_time    = contract.date_start,
          purchase_time = contract.purchase_time,
          now_time      = contract.current_spot_time,
          end_time      = contract.date_expiry;

      BinarySocket.init({
        onmessage: function(msg){
          var response = JSON.parse(msg.data);
          if (response) {
            var type = response.msg_type,
                error = response.error;

            if ((type === 'history' || type === 'candles' || type === 'tick' || type === 'ohlc') && response.echo_req.passthrough.hasOwnProperty('chart_tick') && !error){
                ViewPopupWS.storeSubscriptionID(response[type].id);
                window.responseID = response[type].id;
                var options = { 'title' : contract.underlying };
                if (response.history || response.candles && update !== 'update') {
                  if (response.history) {
                      options.history = response.history;
                      for (i = 0; i < response.history.times.length; i++) {
                          if (response.history.times[i] === contract.entry_tick_time.toString()) {
                              options.min = response.history.times[i-2];
                              break;
                          }
                      }
                      if (contract.is_sold && contract.sell_time < end_time) {get_max_history(contract, response, contract.sell_spot_time);}
                      else if (contract.is_expired && contract.exit_tick_time) {get_max_history(contract, response, contract.exit_tick_time);}
                      else {get_max_history(contract, response, end_time);}
                  } else if (response.candles) {
                      options.candles = response.candles;
                      for (i = 0; i < response.candles.length; i++) {
                          if (response.candles[i].epoch < contract.entry_tick_time && response.candles[i+1].epoch > contract.entry_tick_time) {
                              options.min = response.candles[i-1].epoch;
                              break;
                          }
                      }
                      if (contract.is_sold && contract.sell_time < end_time) {get_max_candle(contract, response, contract.sell_spot_time);}
                      else {get_max_candle(contract, response, end_time);}
                  }
                  window.chart = init_chart(options);

                  if (purchase_time !== start_time) {
                      window.chart.addPlotLineX({ value: purchase_time*1000, label: 'Purchase Time'});
                  }

                  window.chart.addPlotLineX({ value: start_time*1000, label: 'Start Time', text_left: true });
                  if (contract.entry_tick_time) window.chart.addPlotLineX({ value: contract.entry_tick_time*1000, label: 'Entry Spot' });


                  if (contract.barrier) {
                      window.chart.addPlotLineY({value: contract.barrier*1, label: 'Barrier (' + contract.barrier + ')'});
                  } else if (contract.high_barrier && contract.low_barrier) {
                      window.chart.addPlotLineY({value: contract.high_barrier*1, label: 'High Barrier (' + contract.high_barrier + ')'});
                      window.chart.addPlotLineY({value: contract.low_barrier*1, label: 'Low Barrier (' + contract.low_barrier + ')', color: 'red'});
                  }
                } else if (response.tick || response.ohlc) {
                  if (response.tick) {
                    options.tick = response.tick;
                  } else if (response.ohlc) {
                    options.ohlc = response.ohlc;
                  }
                  update_chart(contract, options);
                }
                if (contract.is_sold || contract.is_expired) {
                  end_contract(contract);
                  if (window.responseID) {
                      BinarySocket.send({'forget':window.responseID});
                  }
                }
            } else if (type === 'ticks_history' && error) {
                document.getElementById('analysis_live_chart').innerHTML = '<p class="error-msg">' + error.message + '</p>';
            }
          }
        }
      });

      if (update === 'update' && (contract.is_expired || contract.is_sold)) {
        end_contract(contract);
      } else {
        var exitTime;
        if (contract.is_sold) {
          exitTime = contract.sell_spot_time;
        } else {
          exitTime = end_time;
        }
        var calculateGranularity = calculate_granularity(exitTime, now_time, purchase_time, start_time);
        var granularity = calculateGranularity[0];
        var duration = calculateGranularity[1];
        margin = granularity === 0 ? Math.max(3, 30*duration/(60*60) || 0) : 3*granularity;

        var request = {
          ticks_history: contract.underlying,
          start: ((purchase_time || start_time)*1 - margin).toFixed(0), /* load around 2 more ticks before start */
          end: end_time ? (end_time*1 + margin).toFixed(0) : 'latest',
          style: 'ticks',
          count: 4999, /* maximum number of ticks possible */
          passthrough: {'chart_tick': 1},
        };

        if (contract.is_sold) {
          request.end = contract.sell_spot_time ? (contract.sell_spot_time*1 + margin).toFixed(0) : 'latest';
        }

        if(granularity !== 0) {
          request.granularity = granularity;
          request.style = 'candles';
        }

        if(!contract.is_expired) {
            request.subscribe = 1;
        }

        BinarySocket.send(request);
      }
  }

  function get_max_history(contract, response, end_time) {
    if (contract.is_expired || contract.is_sold) {
      for (i = response.history.times.length; i >= 0; i--) {
          if (response.history.times[i] === end_time.toString()) {
              window.max = response.history.times[i+1];
              break;
          }
      }
    } else {
      window.max = contract.current_spot_time.toString();
    }
    return;
  }

  function get_max_candle(contract, response, end_time) {
    if (contract.is_expired || contract.is_sold) {
      for (i = response.candles.length; i >= 0; i--) {
          if (response.candles[i].epoch > end_time && response.candles[i+1].epoch < end_time) {
              window.max = response.candles[i+1].epoch;
              break;
          }
      }
    } else {
      window.max = contract.current_spot_time.toString();
    }
    return;
  }

  function end_contract(contract) {
    if (window.chart) {
      if (contract.exit_tick_time && contract.sell_time > contract.date_expiry) window.chart.addPlotLineX({ value: contract.exit_tick_time*1000, label: 'Exit Spot', text_left: true });
      if (contract.is_expired && contract.sell_time > contract.date_expiry) window.chart.addPlotLineX({ value: contract.date_expiry*1000, label: 'End Time'});
      if (contract.is_sold && contract.date_expiry && contract.sell_time && contract.sell_time < contract.date_expiry) {
        window.chart.addPlotLineX({ value: contract.sell_time*1000, label: 'Sell Time', text_left: true});
      }
    }
  }

  function calculate_granularity(end_time, now_time, purchase_time, start_time) {
    var duration = Math.min(end_time*1, now_time) - (purchase_time || start_time);
    var granularity = 0;
    var margin = 0; // time margin
    if(duration <= 60*60) { granularity = 0; } // 1 hour
    else if(duration <= 2*60*60) { granularity = 120; } // 2 hours
    else if(duration <= 6*60*60) { granularity = 900; } // 6 hours
    else if(duration <= 24*60*60) { granularity = 3600; } // 1 day
    else { granularity = 86400; } // more than 1 day
    window.granularity = granularity;
    return [granularity, duration];
  }

  function update_chart(contract, options){
    var start_time    = contract.date_start,
        purchase_time = contract.purchase_time,
        now_time      = contract.current_spot_time,
        end_time      = contract.date_expiry;
    var exitTime;
    if (contract.is_sold) {
      exitTime = contract.sell_spot_time;
    } else {
      exitTime = end_time;
    }
    var granularity = calculate_granularity(exitTime, now_time, purchase_time, start_time)[0];

    if(granularity === 0) {
      window.chart.series[0].addPoint([options.tick.epoch*1000, options.tick.quote*1]);
    } else {
      var series = window.chart.series[0];
      var last = series.data[series.data.length - 1];

      var c = options.ohlc;
      var ohlc = [c.open_time*1000, c.open*1, c.high*1, c.low*1, c.close*1];

      if(last.x !== ohlc[0]) {
        series.addPoint(ohlc, true, true);
      }
      else {
        last.update(ohlc,true);
      }
    }

    if (contract.exit_tick_time) window.chart.addPlotLineX({ value: contract.exit_tick_time*1000, label: 'Exit Spot', text_left: true });
    if (contract.is_expired) window.chart.addPlotLineX({ value: end_time*1000, label: 'End Time'});
    if (contract.is_sold && end_time && contract.sell_time && contract.sell_time < end_time) {
      window.chart.addPlotLineX({ value: contract.sell_time*1000, label: 'Sell Time', text_left: true});
    }

  }

  return {
    show_chart: show_chart
  };
}());
