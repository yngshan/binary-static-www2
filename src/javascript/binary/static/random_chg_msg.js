// temporary script to show message about Random renamed to Volatile on trading page

pjax_config_page('trading', function(){
    return {
        onLoad: function() {
            var hasRandom = false;
            Object.keys(Symbols.markets())
                .forEach(function(s) {
                    if (s === 'random') {
                        hasRandom = true;
                    }
                });

            var tempMsgKey = 'hide_temp_msg';
            if (SessionStore.get(tempMsgKey) || !hasRandom) {
                $('#temp_notice_msg').addClass('invisible');
            }

            $('#close_temp_msg').click(function() {
                SessionStore.set(tempMsgKey, '1');
                $('#temp_notice_msg').addClass('invisible');
            });
        }
    };

});
