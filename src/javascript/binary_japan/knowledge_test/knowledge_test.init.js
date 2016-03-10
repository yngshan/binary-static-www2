var KnowledgeTest = (function() {
    "use strict";

    var submitted = {};
    var randomPicks = [];
    var randomPicksAnswer = {};

    function questionAnswerHandler(ev) {
        var selected = ev.target.value;
        var qid = ev.target.name;
        submitted[qid] = selected;
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
    }

    return {
        init: init
    };
}());
