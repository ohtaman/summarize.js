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

        textContents.map(function (idx, elem) {
            var text = $(elem).text();
            return divideToSentence(text).map(function (sentence) { 
                return $('<span class="sentence">').text(sentence)[0];
            }).concat($('<br>')[0]);
        }).appendTo(textArea.empty());

        var sentences = $('span.sentence');
        summarize.summarize(
            sentences.map(function (idx, elem) {
                return $(elem).text();
            }).get(),
            function (scores) {
                scores.forEach(function (score, idx) {
                    $(sentences[idx]).css('opacity', score);
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