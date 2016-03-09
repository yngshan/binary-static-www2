pjax_config_page("account/knowledgetest", function(){
    return {
        onLoad: function() {
            KnowledgeTest.init();
        }
    };
});

