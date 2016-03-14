pjax_config_page_require_auth("account/knowledgetest", function(){
    return {
        onLoad: function() {
            KnowledgeTest.init();
        }
    };
});

