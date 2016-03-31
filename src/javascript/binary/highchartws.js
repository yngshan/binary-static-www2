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
        }
        tooltip:{ xDateFormat:'%A, %b %e, %H:%M:%S GMT' },
        xAxis: {
          type: 'datetime',
          categories:null,
          startOnTick: false,
          endOnTick: false,
          min: options.min ? options.min*1000 : null,
          max: options.max ? options.max*1000 : null,
          labels: { overflow:"justify", format:"{value:%H:%M:%S}" },
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

      if (options.xAxis.min && options.xAxis.max) {
        option.xAxis.minRange = options.xAxis.max - options.xAxis.min;
      }

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

  function show_chart(contract) {
      var start_time    = contract.date_start,
          purchase_time = contract.purchase_time,
          now_time      = contract.current_spot_time,
          end_time      = contract.date_expiry;

      var options = { 'title' : contract.underlying };

      var duration = Math.min(end_time*1, now_time) - (purchase_time || start_time);
      var granularity = 0;
      var margin = 0; // time margin
      if(duration <= 60*60) { granularity = 0; } // 1 hour
      else if(duration <= 2*60*60) { granularity = 60; } // 2 hours
      else if(duration <= 6*60*60) { granularity = 120; } // 6 hours
      else if(duration <= 24*60*60) { granularity = 300; } // 1 day
      else { granularity = 3600; } // more than 1 day
      margin = granularity === 0 ? Math.max(3, 30*duration/(60*60) || 0) : 3*granularity;

      BinarySocket.init({
        onmessage: function(msg){
          var response = JSON.parse(msg.data);
          if (response) {
            var type = response.msg_type,
                error = response.error;

            if ((type === 'history' || type === 'candles' || type === 'tick' || type === 'ohlc') && response.echo_req.passthrough.hasOwnProperty('chart_tick') && !error){
                ViewPopupWS.storeSubscriptionID(response[type].id);
                if (response.history) {
                    options.history = response.history;
                    for (i = 0; i < response.history.times.length; i++) {
                        if (response.history.times[i] === start_time.toString()) {
                            options.min = response.history.times[i-1];
                        }
                    }
                    if (contract.is_expired) {
                      for (i = response.history.times.length; i >= 0; i--) {
                          if (response.history.times[i] === end_time.toString()) {
                              options.max = response.history.times[i-1];
                          }
                      }
                    } else {
                      options.max = now_time.toString();
                    }
                } else if (response.candles) {
                    options.candles = response.candles;
                    for (i = 0; i < response.candles.epoch.length; i++) {
                        if (response.candles.epoch[i] < start_time.toString() && response.candles.epoch[i+1] > start_time.toString()) {
                            options.min = response.candles.epoch.times[i-1];
                            return;
                        }
                    }
                    if (contract.is_expired) {
                      for (i = response.candles.epoch.length; i >= 0; i--) {
                          if (response.candles.epoch[i] > end_time.toString() && response.candles.epoch[i+1] < end_time.toString()) {
                              options.max = response.candles.epoch[i+1];
                              return;
                          }
                      }
                    } else {
                      options.max = now_time.toString();
                    }
                }

                var chart = init_chart(options);

                chart.addPlotLineX({ value: start_time*1000, label: 'Start Time', text_left: true });

                if (contract.entry_spot) {
                    chart.addPlotLineX({ value: contract.entry_spot*1000, label: 'Entry Spot', text_left: true });
                }
                if (purchase_time) {
                    chart.addPlotLineX({ value: purchase_time*1000, label: 'Purchase Time'});
                }
                if (contract.exit_tick) {
                    chart.addPlotLineX({ value: contract.exit_tick*1000, label: 'Exit Spot'});
                }
                if (contract.is_expired) {
                    chart.addPlotLineX({ value: end_time*1000, label: 'End Time'});
                    if (response[type].id) {
                        BinarySocket.send({'forget':response[type].id});
                    }
                }
                if (contract.barrier) {
                    chart.addPlotLineY({value: contract.barrier*1, label: 'Barrier (' + contract.barrier + ')'});
                } else if (contract.high_barrier && contract.low_barrier) {
                    chart.addPlotLineY({value: contract.high_barrier*1, label: 'High Barrier (' + contract.high_barrier + ')'});
                    chart.addPlotLineY({value: contract.low_barrier*1, label: 'Low Barrier (' + contract.low_barrier + ')', color: 'red'});
                }
            } else if (type === 'ticks_history' && error) {
                document.getElementById('analysis_live_chart').innerHTML = '<p class="error-msg">' + error.message + '</p>';
            }
          }
        }
      });

      var request = {
        ticks_history: contract.underlying,
        start: (purchase_time || start_time)*1 - margin, /* load around 2 more ticks before start */
        end: end_time ? end_time*1 + margin : 'latest',
        style: 'ticks',
        count: 4999, /* maximum number of ticks possible */
        passthrough: {'chart_tick': 1},
      };

      if(granularity !== 0) {
        request.granularity = granularity;
        request.style = 'candles';
      }

      if(!contract.is_expired) {
          request.subscribe = 1;
      }

      BinarySocket.send(request);
  }

  return {
    init_chart: init_chart,
    show_chart: show_chart
  };
}());
