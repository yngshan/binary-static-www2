pjax_config_page_require_auth("new_account/knowledgetest", function(){
    return {
        onLoad: function() {
            KnowledgeTest.init();
        }
    };
});
