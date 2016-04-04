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

      var chartOptions = {
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

      var chart = new Highcharts.Chart(chartOptions);

      chart.addPlotLineX = function(chartOptions) {
        chart.xAxis[0].addPlotLine({
           value: chartOptions.value,
           id: chartOptions.id || chartOptions.value,
           label: {text: chartOptions.label || 'label', x: chartOptions.text_left ? -15 : 5},
           color: chartOptions.color || '#e98024',
           zIndex: 4,
           width: chartOptions.width || 2,
        });
      };

      chart.addPlotLineY = function(chartOptions) {
        chart.yAxis[0].addPlotLine({
          id: chartOptions.id || chartOptions.label,
          value: chartOptions.value,
          label: {text: chartOptions.label, align: 'center'},
          color: chartOptions.color || 'green',
          zIndex: 4,
          width: 2,
        });
      };

      el.chart = chart;

      return el.chart;
  }

  var start_time, purchase_time, now_time, end_time, entry_tick_time, is_sold, sell_time, sell_spot_time, is_expired, exit_tick_time, exitTime;

  function initialize_values(contract) {
    start_time      = contract.date_start;
    purchase_time   = contract.purchase_time;
    now_time        = contract.current_spot_time;
    end_time        = contract.date_expiry;
    entry_tick_time = contract.entry_tick_time;
    is_sold         = contract.is_sold;
    sell_time       = contract.sell_time;
    sell_spot_time  = contract.sell_spot_time;
    is_expired      = contract.is_expired;
    exit_tick_time  = contract.exit_tick_time;
    exitTime        = is_sold ? sell_spot_time : end_time;
  }

  function show_chart(contract, update) {
      initialize_values(contract);
      BinarySocket.init({
        onmessage: function(msg){
          var response = JSON.parse(msg.data);
          if (response) {
            var type = response.msg_type,
                error = response.error;

            if ((type === 'history' || type === 'candles' || type === 'tick' || type === 'ohlc') && response.echo_req.passthrough.hasOwnProperty('chart_tick') && !error){
                ViewPopupWS.storeSubscriptionID(response[type].id);
                var options = { 'title' : contract.underlying };
                if (response.history || response.candles && update !== 'update') {
                  if (response.history) {
                      options.history = response.history;
                      if (response.history.times) {
                        for (i = 0; i < response.history.times.length; i++) {
                            if (contract.entry_tick_time && response.history.times[i] === contract.entry_tick_time.toString()) {
                                options.min = response.history.times[i-2];
                                break;
                            } else if (contract.purchase_time && response.history.times[i] === contract.purchase_time.toString()) {
                                options.min = response.history.times[i-2] || response.history.times[i-1];
                                break;
                            }
                        }
                      }
                      if (is_sold && sell_time < end_time) {get_max_history(contract, response, sell_spot_time);}
                      else if (is_expired && exit_tick_time) {get_max_history(contract, response, exit_tick_time);}
                      else {get_max_history(contract, response, end_time);}
                  } else if (response.candles) {
                      options.candles = response.candles;
                      for (i = 0; i < response.candles.length; i++) {
                          if (contract.entry_tick_time && response.candles[i] && response.candles[i].epoch < contract.entry_tick_time && response.candles[i+1].epoch > entry_tick_time) {
                              options.min = response.candles[i-1].epoch;
                              break;
                          }
                      }
                      if (is_sold && sell_time < end_time) {get_max_candle(contract, response, sell_spot_time);}
                      else {get_max_candle(contract, response, end_time);}
                  }
                  window.chart = init_chart(options);

                  if (purchase_time !== start_time) draw_line_x(purchase_time, 'Purchase Time');

                  if (!is_sold || sell_time > start_time) {
                    draw_line_x(start_time, 'Start Time', 'textLeft');
                    if (contract.entry_tick_time) draw_line_x(contract.entry_tick_time, 'Entry Spot');
                  }

                  if (contract.barrier) {
                      window.chart.addPlotLineY({value: contract.barrier*1, label: 'Barrier (' + contract.barrier + ')'});
                  } else if (contract.high_barrier && contract.low_barrier) {
                      window.chart.addPlotLineY({value: contract.high_barrier*1, label: 'High Barrier (' + contract.high_barrier + ')'});
                      window.chart.addPlotLineY({value: contract.low_barrier*1, label: 'Low Barrier (' + contract.low_barrier + ')', color: 'red'});
                  }
                } else if (response.tick || response.ohlc) {
                  if (response.tick) {
                    options.tick = response.tick;
                    if (is_sold && sell_time < end_time) {get_max_history(contract, response, sell_spot_time);}
                    else if (is_expired && exit_tick_time) {get_max_history(contract, response, exit_tick_time);}
                    else {get_max_history(contract, response, end_time);}
                  } else if (response.ohlc) {
                    options.ohlc = response.ohlc;
                    if (is_sold && sell_time < end_time) {get_max_candle(contract, response, sell_spot_time);}
                    else {get_max_candle(contract, response, end_time);}
                  }
                  update_chart(contract, options);
                }
                if (is_sold || is_expired) {
                  end_contract(contract);
                  if (response[type].id) {
                      BinarySocket.send({'forget':response[type].id});
                  }
                }
            } else if (type === 'ticks_history' && error) {
                document.getElementById('analysis_live_chart').innerHTML = '<p class="error-msg">' + error.message + '</p>';
            }
          }
        }
      });

      if (update === 'update' && (is_expired || is_sold)) {
        end_contract(contract);
      } else {
        request_data(contract);
      }
  }

  function request_data(contract) {
    initialize_values(contract);
    var calculateGranularity = calculate_granularity(exitTime, now_time, purchase_time, start_time);
    var granularity = calculateGranularity[0],
        duration    = calculateGranularity[1],
        margin      = 0; // time margin
    margin = granularity === 0 ? Math.max(3, 30*duration/(60*60) || 0) : 3*granularity;

    var request = {
      ticks_history: contract.underlying,
      start: ((purchase_time || start_time)*1 - margin).toFixed(0), /* load around 2 more ticks before start */
      end: end_time ? (end_time*1 + margin).toFixed(0) : 'latest',
      style: 'ticks',
      count: 4999, /* maximum number of ticks possible */
      passthrough: {'chart_tick': 1},
    };

    if (is_sold) {
      request.end = sell_spot_time ? (sell_spot_time*1 + margin).toFixed(0) : 'latest';
    }

    if(granularity !== 0) {
      request.granularity = granularity;
      request.style = 'candles';
    }

    if(!contract.is_expired && !contract.is_sold) {
        request.subscribe = 1;
    }

    BinarySocket.send(request);
  }

  function get_max_history(contract, response, end_time) {
    if (response.history && response.history.times && (contract.is_expired || contract.is_sold)) {
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
      for (i = response.candles.length - 2; i >= 0; i--) {
          if (entry_tick_time && response.candles[i] && response.candles[i].epoch > end_time && response.candles[i+1].epoch < end_time) {
              window.max = response.candles[i+1].epoch;
              break;
          }
      }
    } else {
      window.max = contract.current_spot_time.toString();
    }
    return;
  }

  function draw_line_x(valueTime, labelName, textLeft) {
    var req = {
      value : valueTime*1000,
      label : labelName
    };
    if (textLeft === 'textLeft') req.text_left = true;
    window.chart.addPlotLineX(req);
  }

  function end_contract(contract) {
    initialize_values(contract);
    if (window.chart) {
      if (exit_tick_time || is_expired || is_sold) {
        if (sell_time && sell_time < end_time) {
          draw_line_x(sell_time, 'Sell Time', 'textLeft');
        } else if (!sell_time || sell_time >= end_time) {
          if (exit_tick_time) draw_line_x(exit_tick_time, 'Exit Spot', 'textLeft');
          if (is_expired) draw_line_x(exit_tick_time, 'End Time');
        }
      }
    }
  }

  function calculate_granularity(end_time, now_time, purchase_time, start_time) {
    var duration = Math.min(end_time*1, now_time) - (purchase_time || start_time);
    var granularity = 0;
    if(duration <= 60*60) { granularity = 0; } // 1 hour
    else if(duration <= 2*60*60) { granularity = 120; } // 2 hours
    else if(duration <= 6*60*60) { granularity = 600; } // 6 hours
    else if(duration <= 24*60*60) { granularity = 900; } // 1 day
    else if(duration <= 24*5*60*60) { granularity = 3600; } // 5 days
    else if(duration <= 24*30*60*60) { granularity = 14400; } // 30 days
    else { granularity = 86400; } // more than 30 days
    window.granularity = granularity;
    return [granularity, duration];
  }

  function update_chart(contract, options){
    initialize_values(contract);
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
    if (now_time === exit_tick_time) draw_line_x(exit_tick_time, 'Exit Spot', 'textLeft');
    if (now_time > end_time) draw_line_x(end_time, 'End Time');
  }

  return {
    show_chart: show_chart
  };
}());
