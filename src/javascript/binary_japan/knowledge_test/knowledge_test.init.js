var KnowledgeTest = (function() {
    "use strict";

    var submitted = {};
    var randomPicks = [];
    var randomPicksAnswer = {};
    var resultScore = 0;

    function questionAnswerHandler(ev) {
        var selected = ev.target.value;
        var qid = ev.target.name;
        submitted[qid] = selected === '1';
    }

    function submitHandler() {
        if (Object.keys(submitted).length !== 20) {
            console.log('You hve not finished');
            return;
        }

        for (var k in submitted) {
            if (submitted.hasOwnProperty(k)) {
                resultScore += submitted[k] === randomPicksAnswer[k] ? 1 : 0;
            }
        }

        if (resultScore >= 14) {
            console.log('pass');
        } else {
            console.log('fail');
        }
    }

    function createQuestionsTable() {
        for (var j = 0 ; j < randomPicks.length ; j ++) {
            var table = KnowledgeTestUI.createQuestionTable(randomPicks[j]);
            $('#section' + (j + 1)).append(table);
        }
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
        $('#knowledge-test-container input[type=radio]').click(questionAnswerHandler);
        $('#knowledge-test-submit').click(submitHandler);
    }

    return {
        init: init
    };
}());
