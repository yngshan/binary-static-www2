var KnowledgeTest = (function() {
    "use strict";

    var hiddenClass = 'invisible';

    var submitted = {};
    var randomPicks = [];
    var randomPicksAnswer = {};
    var resultScore = 0;

    var $knowledgeTestMsg = $('#knowledge-test-msg');
    var $knowledgeTestQuestions = $('#knowledge-test-questions');
    var $knowledgeContainer = $('#knowledge-test-container');

    var passMsg = 'Congratulations, you have pass the test, our Customer Support will contact you shortly';
    var failMsg = 'Sorry, you have failed the test, please try again after 24 hours.';

    function questionAnswerHandler(ev) {
        var selected = ev.target.value;
        var qid = ev.target.name;
        submitted[qid] = selected === '1';
    }

    function submitHandler() {
        if (Object.keys(submitted).length !== 20) {
            $knowledgeTestMsg
                .addClass('notice-msg')
                .text(text.localize('You need to finish all 20 questions.'));
            $("html, body").animate({ scrollTop: 0 }, "slow");
            return;
        }

        // compute score
        for (var k in submitted) {
            if (submitted.hasOwnProperty(k)) {
                resultScore += submitted[k] === randomPicksAnswer[k] ? 1 : 0;
            }
        }
        KnowledgeTestData.sendResult(resultScore);
        // use now as temp, need from backend
        showResult(resultScore, Date.now());

        $("html, body").animate({ scrollTop: 0 }, "slow");
    }

    function showQuestionsTable() {
        for (var j = 0 ; j < randomPicks.length ; j ++) {
            var table = KnowledgeTestUI.createQuestionTable(randomPicks[j]);
            $('#section' + (j + 1) + '-question').append(table);
        }

        $('#knowledge-test-questions input[type=radio]').click(questionAnswerHandler);
        $('#knowledge-test-submit').click(submitHandler);
        $knowledgeTestQuestions.removeClass(hiddenClass);
    }

    function showResult(score, time) {
        $('#knowledge-test-header').text(text.localize('Knowledge Test Result'));
        if (score > 14) {
            $knowledgeTestMsg.text(text.localize(passMsg));
        } else {
            $knowledgeTestMsg.text(text.localize(failMsg));
        }

        var $resultTable = KnowledgeTestUI.createResultUI(score, time);

        $knowledgeContainer.append($resultTable);
        $knowledgeTestQuestions.addClass(hiddenClass);
    }

    function showDisallowedMsg(nextTestEpoch) {
        $knowledgeTestQuestions.addClass(hiddenClass);
        $knowledgeContainer.append(KnowledgeTestUI.createErrorDiv(nextTestEpoch));
    }

    function populateQuestions() {
        randomPicks = KnowledgeTestData.randomPick20();
        for (var i = 0 ; i < 5 ; i ++) {
            for ( var k = 0 ; k < 4 ; k++) {
                var qid = randomPicks[i][k].id;
                var ans = randomPicks[i][k].answer;

                randomPicksAnswer[qid] = ans;
            }
        }

        showQuestionsTable();
    }

    function init() {
        BinarySocket.init({
            onmessage: function(msg) {
                var response = JSON.parse(msg.data);
                var type = response.msg_type;

                var passthrough = response.echo_req.passthrough && response.echo_req.passthrough.key;

                if (type === 'get_settings' && passthrough === 'knowledgetest') {
                    var jpStatus = response.get_settings.jp_account_status;

                    switch(jpStatus.status) {
                        case 'jp_knowledge_test_pending': populateQuestions();
                            break;
                        case 'jp_knowledge_test_fail': if (Date.now() >= jpStatus.next_test_epoch * 1000) {
                            // show Knowledge Test cannot be taken
                            showDisallowedMsg(jpStatus.next_test_epoch)
                        }
                            break;
                        default: showDisallowedMsg(jpStatus.next_test_epoch);
                    }
                } else {
                    showDisallowedMsg(jpStatus.next_test_epoch);
                }
            }
        });

        BinarySocket.send({get_settings: 1, passthrough: {key: 'knowledgetest'}});
    }

    return {
        init: init
    };
}());
