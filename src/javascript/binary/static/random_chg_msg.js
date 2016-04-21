// temporary script to show message about Random renamed to Volatile on trading page

pjax_config_page('trading', function(){
    return {
        onLoad: function() {
            $('#close_temp_msg').click(function() {
                $('#temp_notice_msg').addClass('invisible');
            });
        }
    };

});
