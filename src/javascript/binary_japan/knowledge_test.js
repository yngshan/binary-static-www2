pjax_config_page_require_auth("new_account/knowledgetest", function(){

    // TODO: show meaningful msg
    var cannotTakeKnowledgeTest = function() {
        window.location.href = page.url.url_for('user/my_accountws');
    };

    return {
        onLoad: function() {
            KnowledgeTest.init();
        }
    };
});

