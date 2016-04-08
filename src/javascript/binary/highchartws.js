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
          if (times[i] >= options.min && times[i] <= window.max) {
            data.push([times[i]*1000, prices[i]*1]);
          }
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
          min: options.min ? parseInt(options.min)*1000 : null,
          max: window.max ? parseInt(window.max)*1000 : null,
          labels: { overflow:"justify", format:"{value:%H:%M:%S}" }
        },
        yAxis: {
          labels: { align: 'left', x: 0, y: -2 },
          title: ''
        },
        series: [{
          name: title,
          data: data,
          type: type,
          zones: [{
              value: window.entry_time*1000 || null,
              color: '#ccc'
          }, {
              value: window.exit_time*1000 || null,
              color: ''
          }, {
              color: '#ccc'
          }],
          zoneAxis: 'x'
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

      if (options.history) {
        chartOptions.subtitle = {
          text: '<div style="display:inline-block;border:3px solid orange;border-radius:6px;width:4px;height:4px;"></div> Entry spot <div style="margin-left:10px;display:inline-block;background-color:orange;border-radius:6px;width:10px;height:10px;"></div> Exit spot',
          align: 'right',
          useHTML: true
        };
      }
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
    exitTime        = is_sold && sell_time < end_time ? sell_spot_time : end_time;
  }

  var socketSend = function(req) {
      if(!req.hasOwnProperty('passthrough')) {
          req.passthrough = {};
      }
      req.passthrough['dispatch_to'] = 'ViewChartWS';
      BinarySocket.send(req);
  };

  var dispatch = function(response) {
    if(response.echo_req.hasOwnProperty('passthrough') && response.echo_req.passthrough.dispatch_to === 'ViewChartWS') {
      var type = response.msg_type,
          error = response.error;
      if ((type === 'history' || type === 'candles' || type === 'tick' || type === 'ohlc') && !error){
          window.responseID = response[type].id;
          ViewPopupWS.storeSubscriptionID(window.responseID);
          var contract = window.contract,
              options  = { 'title' : contract.underlying };
          initialize_values(contract);
          if (response.history || response.candles) {
            if (response.history) {
                window.tick_type = 'history';
                options.history = response.history;
                if (response.history.times) {
                  for (i = 0; i < response.history.times.length; i++) {
                      if (contract.entry_tick_time && parseInt(response.history.times[i]) === contract.entry_tick_time) {
                          options.min = parseInt(response.history.times[i-1]);
                          break;
                      } else if (contract.purchase_time && !start_time && parseInt(response.history.times[i]) === contract.purchase_time) {
                          options.min = parseInt(response.history.times[i-1]);
                          break;
                      } else if (start_time && parseInt(response.history.times[i]) < start_time && parseInt(response.history.times[i+1]) > start_time) {
                          options.min = response.history.times[i];
                          options.entry_tick_time = parseInt(response.history.times[i+1]);
                          break;
                      } else if (parseInt(response.history.times[i]) === start_time) {
                          options.min = response.history.times[i-1];
                          options.entry_tick_time = parseInt(response.history.times[i+1]);
                          break;
                      }
                  }
                }
                if (sell_time && sell_time < end_time) {get_max_history(contract, response, sell_spot_time);}
                else if (exit_tick_time) {get_max_history(contract, response, exit_tick_time);}
                else {get_max_history(contract, response, end_time);}
            } else if (response.candles) {
                window.tick_type = 'candles';
                options.candles = response.candles;
                for (i = 0; i < response.candles.length; i++) {
                    if (contract.entry_tick_time && response.candles[i] && response.candles[i].epoch <= contract.entry_tick_time && response.candles[i+1].epoch > contract.entry_tick_time) {
                        options.min = response.candles[i-1].epoch;
                        break;
                    } else if (contract.purchase_time && response.candles[i] && response.candles[i].epoch <= contract.purchase_time && response.candles[i+1].epoch > contract.purchase_time) {
                        options.min = response.candles[i-1].epoch;
                        break;
                    }
                }
                if (sell_time && sell_time < end_time) {get_max_candle(contract, response, sell_spot_time);}
                else {get_max_candle(contract, response, end_time);}
            }
            window.entry_time = entry_tick_time ? entry_tick_time : options.entry_tick_time;
            if (sell_time && sell_time < end_time) {
              window.exit_time = sell_spot_time;
            } else if (exit_tick_time) {
              window.exit_time = exit_tick_time;
            } else {
              window.exit_time = end_time;
            }

            window.chart = init_chart(options);

            if (purchase_time !== start_time) draw_line_x(purchase_time, 'Purchase Time');

            if (!is_sold || (sell_time && sell_time > start_time)) {
              draw_line_x(start_time, 'Start Time');
            }

            var duration = calculate_granularity(end_time, now_time, purchase_time, start_time)[1];

            if (duration <= 24*60*60 && (!is_sold || (sell_time && sell_time >= end_time))) {
              draw_line_x(end_time, 'End Time', 'textLeft');
            }

            if (contract.barrier) {
                window.chart.addPlotLineY({value: contract.barrier*1, label: 'Barrier (' + contract.barrier + ')'});
                window.ymin = contract.barrier*1;
                window.ymax = contract.barrier*1;
            } else if (contract.high_barrier && contract.low_barrier) {
                window.chart.addPlotLineY({value: contract.high_barrier*1, label: 'High Barrier (' + contract.high_barrier + ')'});
                window.chart.addPlotLineY({value: contract.low_barrier*1, label: 'Low Barrier (' + contract.low_barrier + ')', color: 'red'});
                window.ymin = contract.low_barrier*1;
                window.ymax = contract.high_barrier*1;
            }

            find_min_max();
          } else if (response.tick || response.ohlc) {
            if (response.tick) {
              options.tick = response.tick;
              if (response.tick.epoch > start_time && !window.entry_time) {
                  window.entry_time = response.tick.epoch;
              }
              if (sell_time && sell_time < end_time) {get_max_history(contract, response, sell_spot_time);}
              else if (is_expired && exit_tick_time) {get_max_history(contract, response, exit_tick_time);}
              else {get_max_history(contract, response, end_time);}
              find_min_max(response.tick.quote);
            } else if (response.ohlc) {
              window.tick_type = 'candles';
              options.ohlc = response.ohlc;
              if (sell_time && sell_time < end_time) {get_max_candle(contract, response, sell_spot_time);}
              else {get_max_candle(contract, response, end_time);}
              find_min_max(response.ohlc.low, response.ohlc.high);
            }
            if (window.chart && window.chart.series) {
              update_chart(contract, options);
            }
          }
          if (window.entry_time && now_time >= entry_time) {
            select_entry_tick(window.entry_time, response);
            if (window.chart) {
              window.chart.series[0].zones[0].value = parseInt(window.entry_time)*1000;
              // force to redraw:
              window.chart.isDirty = true;
              window.chart.redraw();
            }
          }
          if (is_sold || is_expired || sell_time) {
            end_contract(contract);
          }
      } else if (type === 'ticks_history' && error) {
          document.getElementById('analysis_live_chart').innerHTML = '<p class="error-msg">' + error.message + '</p>';
      }
    }
  };

  function show_chart(contract) {
      window.contract = contract;
      request_data(contract);
  }

  function clear_values() {
    window.max = '';
    window.entry_time = '';
    window.exit_time = '';
    window.responseID = '';
    window.tick_type = '';
  }

  function request_data(contract) {
    initialize_values(contract);
    var calculateGranularity = calculate_granularity(exitTime, now_time, purchase_time, start_time);
    var granularity = calculateGranularity[0],
        duration    = calculateGranularity[1],
        margin      = 0; // time margin
    margin = granularity === 0 ? Math.max(300, 30*duration/(60*60) || 0) : 3*granularity;

    var request = {
      ticks_history: contract.underlying,
      start: ((purchase_time || start_time)*1 - margin).toFixed(0), /* load around 2 more ticks before start */
      end: end_time ? (end_time*1 + margin).toFixed(0) : 'latest',
      style: 'ticks',
      count: 4999 /* maximum number of ticks possible */
    };

    if (is_sold || sell_time) {
      request.end = sell_spot_time ? (sell_spot_time*1 + margin).toFixed(0) : 'latest';
    }

    if(granularity !== 0) {
      request.granularity = granularity;
      request.style = 'candles';
    }

    if(!contract.is_expired && (!contract.is_sold && !contract.sell_time)) {
        request.subscribe = 1;
    }

    socketSend(request);
  }

  function find_min_max(currentLow, currentHigh) {
    var chartYmax = window.chart.yAxis[0].max,
        chartYmin = window.chart.yAxis[0].min;
    var margin = Math.max((chartYmax - chartYmin), window.ymax - window.ymin) * 0.005;
    var ymax = -1,
        ymin = -1;
    if (chartYmax < window.ymax) {
      ymax = window.ymax + margin;
    }
    if (chartYmin > window.ymin) {
      ymin = window.ymin - margin;
    }
    currentHigh = currentHigh || currentLow;
    if (currentHigh && currentHigh > chartYmax) {
      ymax = null;
    }
    if (currentLow && currentLow < chartYmin) {
      ymin = null;
    }
    chart.yAxis[0].setExtremes(ymin !== -1 ? ymin : chartYmin, ymax !== -1 ? ymax : chartYmax);
    return;
  }

  function select_entry_tick(value, response) {
    value = parseInt(value);
    if (value && (response.history || response.tick)) {
      for (i = 0; i < chart.series[0].data.length; i++) {
        if (value*1000 === chart.series[0].data[i].x) {
          chart.series[0].data[i].update({marker: {fillColor: '#fff', lineColor: 'orange', lineWidth: 3, radius: 4, states: {hover: {fillColor: '#fff', lineColor: 'orange', lineWidth: 3, radius: 4}}}});
          return;
        }
      }
    }
  }

  function select_exit_tick(value) {
    value = parseInt(value);
    if (value && window.tick_type === 'history') {
      for (i = chart.series[0].data.length - 1; i >= 0; i--) {
        if (value*1000 === chart.series[0].data[i].x) {
          chart.series[0].data[i].update({marker: {fillColor: 'orange', lineColor: 'orange', lineWidth: 3, radius: 4, states: {hover: {fillColor: 'orange', lineColor: 'orange', lineWidth: 3, radius: 4}}}});
          return;
        }
      }
    }
  }

  function get_max_history(contract, response, end_time) {
    if (response.history && response.history.times && (contract.is_expired || contract.is_sold || contract.sell_time)) {
      for (i = response.history.times.length; i >= 0; i--) {
          if (response.history.times[i] === end_time.toString()) {
              window.max = response.history.times[i+1];
              break;
          }
      }
    } else {
      window.max = contract.date_expiry.toString();
    }
    return;
  }

  function get_max_candle(contract, response, end_time) {
    if (contract.is_expired || contract.is_sold || contract.sell_time) {
      for (i = response.candles.length - 2; i >= 0; i--) {
          if (response.candles[i] && response.candles[i].epoch <= end_time && response.candles[i+1].epoch > end_time) {
              window.max = response.candles[i+1].epoch;
              break;
          }
      }
    } else {
      window.max = contract.date_expiry;
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
      if (exit_tick_time || is_expired || is_sold || sell_time) {
        if (sell_time && sell_time < end_time) {
          draw_line_x(sell_time, 'Sell Time', 'textLeft');
        } else if (sell_time && sell_time >= end_time) {
          draw_line_x(end_time, 'End Time', 'textLeft');
        }
      }
      if (sell_spot_time && sell_spot_time < end_time && sell_spot_time >= start_time) {
        select_exit_tick(sell_spot_time);
      } else if (exit_tick_time) {
        select_exit_tick(exit_tick_time);
      }
    }
    if (window.responseID) {
      BinarySocket.send({'forget':window.responseID});
    }
    clear_values();
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
    if (now_time >= end_time || now_time >= sell_time) {
      end_contract(contract);
    }
  }

  return {
    show_chart   : show_chart,
    dispatch     : dispatch,
    clear_values : clear_values
  };
}());
