var KnowledgeTestUI = (function () {
    "use strict";

    function createTrueFalseBox(qid) {
        var trueId = qid + 'true';
        var falseId = qid + 'false';

        var $trueButton = $('<input />', {type: 'radio', name: qid, id: trueId, value: '1'});
        var $trueLabel = $('<label></label>', {class: 'img-holder true', for: trueId, value: '1'});
        var $trueTd = $('<td></td>').append($trueButton).append($trueLabel);

        var $falseButton = $('<input />', {type: 'radio', name: qid, id: falseId, value: '0'});
        var $falseLabel = $('<label></label>', {class: 'img-holder false', for: falseId, value: '0'});
        var $falseTd = $('<td></td>').append($falseButton).append($falseLabel);

        return [$trueTd, $falseTd];
    }

    function createQuestionRow(no, question) {
        var $questionRow = $('<tr></tr>', {id: no, class: 'question'});
        var $questionData = $('<td></td>').text(text.localize(question.question));
        var trueFalse = createTrueFalseBox(question.id);

        return $questionRow
            .append($questionData)
            .append(trueFalse[0])
            .append(trueFalse[1]);
    }

    function createQuestionTable(questions) {
        var $header = $('<tr></tr>');
        var $questionColHeader = $('<th></th>', {id: 'question-header', class: 'question-col'})
            .text(text.localize('Questions'));

        var $trueColHeader = $('<th></th>', {id: 'true-header', class: 'true-col'})
            .text(text.localize('True'));

        var $falseColHeader = $('<th></th>', {id: 'fasle-header', class: 'false-col'})
            .text(text.localize('False'));

        $header
            .append($questionColHeader)
            .append($trueColHeader)
            .append($falseColHeader);

        var $tableContainer = $('<table></table>', {id: 'knowledge-test'});

        $tableContainer.append($header);
        questions.forEach(function(question, questionNo) {
            var qr = createQuestionRow(questionNo, question);
            $tableContainer.append(qr);
        });

        return $tableContainer;
    }

    return {
        createTrueFalseBox: createTrueFalseBox,
        createQuestionRow: createQuestionRow,
        createQuestionTable: createQuestionTable
    };
}());

