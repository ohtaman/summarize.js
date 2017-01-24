var TinySegmenter = require('tiny-segmenter');
var math = require('mathjs');
window.math = math;

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

function flatten(array) {
    return array.reduce(function (a, b) {
        return a.concat(b);
    });
}

function encode(sentences) {
    var segmenter = new TinySegmenter();
    var tokens = sentences.map(function (sentence) {
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

function calcPMI(tokenIds, vocab) {
    var freq = math.matrix();
    var corr = math.matrix();


}

function pmi(x, y) {
    return Math.log2() - Math.log2() - Math.log2();
}

function summarize (sentences, callback) {
    var ep = 1.0e-10
    console.log('Start summarization.');
    var tokens = encode(sentences);
    var vocabSize = Object.keys(tokens.vocab).length;
    var tf = Array(vocabSize).fill(0);
    flatten(tokens.tokens).forEach(function (tokenId) {
        tf[tokenId] += 1;
    });

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
        if (tmp > 0) {
            return value/tmp;
        } else {
            return 0;
        }
    });

    var normalizer = math.sqrt(math.multiply(pmi, math.ones(pmi.size()[0])))
    window.normalizer = normalizer
    var normalizedPmi = pmi.map((value, idx) => {
        if (normalizer[idx[0]] == 0 || normalizer[idx[1]] == 0) {
            return 0;
        } else {
            console.log(normalizer[idx[0]]*normalizer[idx[1]])
            return value/(normalizer[idx[0]]*normalizer[idx[1]]);
        }
    });

    window.math = math;
    window.pmi = pmi;
    window.npmi = normalizedPmi

    callback(tokens.tokens.map(function (tokens, score) {
        return Math.random();
    }));
    console.log('End sumarization.');
}

module.exports = {
    summarize: summarize
}
