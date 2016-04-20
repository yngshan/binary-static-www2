BetAnalysis.Portfolio = (function() {

  var $portfolio;

  function init() {
    var user = new User();

    if (user.email && isJapan()) {
      $('#tab_portfolio').removeClass('invisible');
    }

    var $container = $('#tab_portfolio-content');
    $portfolio = $portfolio || $('#portfolio');

    if ($portfolio &&
      (!$('#portfolio').parent().length ||
        $('#portfolio').parent().get(0).id !== 'tab_portfolio-content')) {
      $portfolio.detach();
      $container.append($portfolio);
    }
  }

  function show() {
    if (isJapan()) {
      PortfolioWS.init();
    }

    return;
  }

  function hide() {
    if (isJapan()) {
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

