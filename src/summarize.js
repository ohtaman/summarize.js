var TinySegmenter = require('tiny-segmenter');
var math = require('mathjs');

function buildVocablary(tokens) {
    var vocablary = {}
    tokens.forEach(function (token) {
        var keys = Object.keys(vocablary)
        if (keys.indexOf(token) < 0) {
            vocablary[token] = keys.length;
        }
    });
    return vocablary;
}

function splitToSentence(text) {
    return text.split('[\n。.]');
}

function flatten(array) {
    return array.reduce(function (a, b) {
        return a.concat(b);
    });
}

function encode(text) {
    var segmenter = new TinySegmenter();
    var tokens = splitToSentence(text).map(function (sentence) {
        return segmenter.segment(sentence);
    });
    var vocab = buildVocablary(flatten(tokens));
    var tokenIds = tokens.map(function (sentence) {
        return sentence.map(function (token) {
            return vocab[token];
        });
    });
    return {tokens: tokenIds, vocab: vocab};
}

function calcPMI(tokenIds) {
    var freq = math.matrix();
    var corr = math.matrix();
}

function pmi(x, y) {
    return Math.log2() - Math.log2() - Math.log2();
}

function summarize (sentences, callback) {
    console.log('Start summarize.');
    callback(sentences.map(function (sentence, score) {
        console.log(sentence)
        console.log(score)
        var id = sentence[0];
        var text = sentence[1];
        return 0.4;
    }));
    console.log('End sumarize.');
}

module.exports = {
    summarize: summarize
}