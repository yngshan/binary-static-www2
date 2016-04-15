pjax_config_page('/get-started-jp', function() {
    return {
        onLoad: function() {
          var tab = window.location.hash;
          if (tab && tab !== '') {
            $('#index').hide();
            $('.sidebar-left ul li.' + tab.slice(1, tab.length)).addClass('selected');
            showSelectedTab();
          }
          function showSelectedTab() {
            if ($('#index').is(":visible")) $('#index').hide();
            $('.contents div').hide();
            $('.contents div[id=content-' + window.location.hash.slice(1, window.location.hash.length) + ']').show();
            $('.contents').show();
          }
          $(window).on('hashchange', function(){
            showSelectedTab();
            if (window.location.hash === '') {
              $('.contents').hide();
              $('#index').show();
            }
          });
          $('.sidebar-left ul li').click(function(e) {
            $('.sidebar-left ul li').removeClass('selected');
            $(this).addClass('selected');
          });
        }
    };
});
