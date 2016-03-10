var KnowledgeTest = (function() {
    "use strict";

    var hiddenClass = 'invisible';

    var submitted = {};
    var randomPicks = [];
    var randomPicksAnswer = {};
    var resultScore = 0;

    var $knowledgeTestMsg = $('#knowledge-test-msg');
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

        // use now as temp, need from backend
        createResult(resultScore, Date.now());

        $("html, body").animate({ scrollTop: 0 }, "slow");
    }

    function createQuestionsTable() {
        for (var j = 0 ; j < randomPicks.length ; j ++) {
            var table = KnowledgeTestUI.createQuestionTable(randomPicks[j]);
            $('#section' + (j + 1) + '-question').append(table);
        }

        $('#knowledge-test-questions input[type=radio]').click(questionAnswerHandler);
        $('#knowledge-test-submit').click(submitHandler);
    }

    function createResult(score, time) {
        $('#knowledge-test-header').text(text.localize('Knowledge Test Result'));
        if (score > 14) {
            $knowledgeTestMsg
                .text(text.localize(passMsg));
        } else {
            //for (var j = 0 ; j < randomPicks.length ; j ++) {
            //    var table = KnowledgeTestUI.createQuestionTable(randomPicks[j], true);
            //    $('#section' + (j + 1) + '-result').append(table);
            //}

            $knowledgeTestMsg
                .text(text.localize(failMsg));

            // only show if client failed
            // $('#knowledge-test-result').removeClass(hiddenClass);
        }

        var $resultTable = KnowledgeTestUI.createResultUI(score, time);

        $('#knowledge-test-container').append($resultTable);
        $('#knowledge-test-questions').addClass(hiddenClass);
    }

    function init() {
        randomPicks = KnowledgeTestData.randomPick20();
        for (var i = 0 ; i < 5 ; i ++) {
            for ( var k = 0 ; k < 4 ; k++) {
                var qid = randomPicks[i][k].id;
                var ans = randomPicks[i][k].answer;

                randomPicksAnswer[qid] = ans;
            }
        }

        createQuestionsTable();

    }

    return {
        init: init
    };
}());
