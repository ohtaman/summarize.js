var TinySegmenter = require('tiny-segmenter');
var math = require('mathjs');

var segmenter = new TinySegmenter();
window.math = math;

function divideToSentence(text) {
    return text.replace(/([。.：:;])/g, '$1\n').split('\n');
}

function tokenize(sentence) {
    return segmenter.segment(sentence);
}

function buildVocab(tokens) {
    var vocab = {}
    tokens.forEach((token) => {
        var keys = Object.keys(vocab)
        if (keys.indexOf(token) < 0) {
            vocab[token] = keys.length;
        }
    });
    return vocab;
}

function flatten(array) {
    return array.reduce((a, b) => a.concat(b));
}

function encode(sentences) {
    var tokens = sentences.map(tokenize);
    var vocab = buildVocab(flatten(tokens));
    var tokenIds = tokens.map((sentence) => {
        return sentence.map((token) => {
            return vocab[token];
        });
    });
    return {tokens: tokenIds, vocab: vocab};
}

function pmi(x, y) {
    return Math.log2() - Math.log2() - Math.log2();
}

function summarize (sentences, callback) {
    var ep = 1.0e-10
    console.log('Start summarization.');
    var tokens = encode(sentences);
    var size = tokens.tokens.length;
    var vocabSize = Object.keys(tokens.vocab).length;
    var tf = Array(vocabSize).fill(0);
    flatten(tokens.tokens).forEach(function (tokenId) {
        tf[tokenId] += 1;
    });
    window.tf = tf;

    var corr = math.zeros(vocabSize, vocabSize);
    tokens.tokens.forEach(function (tokenIds) {
        var set = new Set(tokenIds);
        set.forEach(function (tokenId1) {
            set.forEach(function (tokenId2) {
                if (tokenId1 !== tokenId2) {
                    corr._data[tokenId1][tokenId2] += 1
                }
            });
        });
    });

    var pmi = corr.map(function (value, idx) {
        var tmp = tf[idx[0]]*tf[idx[1]];
        return math.max(math.log10((value + 1)*size/tmp)/math.log10(2), 0);
    });

    var mean = math.mean(pmi)

    var normalizer = math.multiply(math.ones(pmi.size()[0]), pmi);
    var normalizedPmi = pmi.map((value, idx) => {
        if (normalizer.get([idx[0]]) == 0 || normalizer.get([idx[1]]) == 0) {
            return 0;
        } else {
            return value/normalizer.get([idx[1]]);
        }
    });

    window.math = math;
    window.pmi = pmi;
    window.npmi = normalizedPmi

    var alpha = 0.85;
    var b = math.zeros(pmi.size()[0]);
    b.set([0], 1.0);
    var google = math.add(math.multiply(alpha/pmi.size()[0], math.ones(pmi.size())), math.multiply((1 - alpha), normalizedPmi));
    window.google = google;

    for (var i = 0; i < 1000; i++) {
        prevB = b;
        b = math.multiply(google, b);
        if (math.norm(math.subtract(prevB, b)) < 1e-10) {
            break;
        }
    }
    window.b = b;
    window.tokens = tokens

    callback(tokens.tokens.map(function (tokens, score) {
        return Math.random();
    }));
    console.log('End sumarization.');
}

module.exports = {
    summarize: summarize,
    divideToSentence: divideToSentence
}
