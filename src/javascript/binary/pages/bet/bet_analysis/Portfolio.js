BetAnalysis.Portfolio = (function() {

  function init() {
    if (typeof is_japan === 'function') {
      var $container = $('#tab_portfolio-content');
      var $portfolio = $('#portfolio');

      if ($portfolio && $('#portfolio').parent().get(0).id !== 'tab_portfolio-content') {
        $portfolio.detach();
        $container.append($portfolio);
      }
    }

    return;
  }

  function show() {
    if (typeof is_japan === 'function') {
      PortfolioWS.init();
    }

    return;
  }

  function hide() {
    if (typeof is_japan === 'function') {
      PortfolioWS.onUnload();
    }

    return;
  }

  return {
    init: init,
    show: show,
    hide: hide,
  };
})();
