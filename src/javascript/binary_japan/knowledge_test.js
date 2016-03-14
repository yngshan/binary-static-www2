pjax_config_page_require_auth("account/knowledgetest", function(){

    // TODO: show meaningful msg
    var cannotTakeKnowledgeTest = function() {
        window.location.href = page.url.url_for('user/my_accountws');
    };

    return {
        onLoad: function() {
            BinarySocket.init({
                onmessage: function(msg) {
                    var response = JSON.parse(msg.data);
                    var type = response.msg_type;

                    var passthrough = response.echo_req.passthrough;

                    if (type === 'get_account_status') {
                        var accountStatus = response.get_account_status;
                        if (accountStatus === 'jp_knowledge_test_pending' && passthrough === 'knowledgetest') {
                            KnowledgeTest.init();
                        } else if (accountStatus === 'jp_knowledge_test_fail') {
                            BinarySocket.send({get_settings: 1, passthrough: 'knowledgetest'});
                        } else {
                            cannotTakeKnowledgeTest();
                        }
                    } else if (type === 'get_settings') {
                        if (response.get_settings === 'knowledge_test_allowed' && passthrough === 'knowledgetest') {
                            KnowledgeTest.init();
                        } else {
                            cannotTakeKnowledgeTest();
                        }
                    } else {
                        cannotTakeKnowledgeTest();
                    }
                }
            });

            BinarySocket.send({get_account_status: 1, passthrough: 'knowledgetest'});
        }
    };
});

