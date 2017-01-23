var TinySegmenter = require('tiny-segmenter');
var math = require('mathjs');
var summarize = require('./summarize');
$ = JQuery = require('jquery');


function editable(elem, value) {
    if (value === undefined) {
        return elem.attr('contentEditable') === 'true';
    } else {
        return elem.attr('contentEditable', value);
    }
}

function divideToSentence(text) {
    return text.replace(/([。.：:;])/g, '$1\n').split('\n');
}

$(document).ready(function(){
    var summarizeButton = $('#summarize-button');
    var textArea = $('#textarea');
    var textContents = textArea.contents();

    summarizeButton.on('click', function () {
        if (editable(textArea)) {
            textContents = textArea.contents();
            editable(textArea, false);
        }

        $(textContents.get().map(function (elem) {
            return divideToSentence(elem.innerHTML).map(function (sentence) { 
                return $('<span class="sentence">').text(sentence)[0];
            });
        }).reduce(function (line1, line2) {
            return line1.concat($('<br>')[0], line2);
        })).appendTo(textArea.empty());

        var sentences = $('span.sentence');
        summarize.summarize(
            sentences.get().map(function (elem) {
                return elem.innerHTML;
            }),
            function (scores) {
                scores.forEach(function (score, idx) {
                    $(spans[idx]).css('opacity', score);
                });
            }
        );
    });

    textArea.on('click', function () {
        if (!editable(textArea)) {
            editable(textArea, true);
            textArea.empty().append(textContents);
        }
        textArea.focus();
    });

    window.math = math;
    window.summarize = summarize;
    var segmenter = new TinySegmenter();
});