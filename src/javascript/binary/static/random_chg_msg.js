// temporary script to show message about Random renamed to Volatile on trading page

pjax_config_page('trading', function(){
    return {
        onLoad: function() {
            if(page.language().toLowerCase() === 'id') {
                $('#temp_notice_msg a').attr('href', 'https://blog.binary.com/indeks-random-berganti-nama-menjadi-indeks-volatilitas/');
            }

            var tempMsgKey = 'hide_temp_msg';
            if (SessionStore.get(tempMsgKey)) {
                $('#temp_notice_msg').addClass('invisible');
            }

            $('#close_temp_msg').click(function() {
                SessionStore.set(tempMsgKey, '1');
                $('#temp_notice_msg').addClass('invisible');
            });
        }
    };

});
