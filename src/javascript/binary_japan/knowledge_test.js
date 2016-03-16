pjax_config_page_require_auth("new_account/knowledge_test", function(){
    return {
        onLoad: function() {
            KnowledgeTest.init();
        }
    };
});
