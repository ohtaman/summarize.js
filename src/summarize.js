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
        var keys = Object.keys(vocab);
        if (keys.indexOf(token) < 0) {
            console.log(keys.length)
            console.log(token);
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

    var ivocab = {}
Object.keys(tokens.vocab).forEach((key) => {ivocab[tokens.vocab[key]] = key;})
    var corr = math.zeros(vocabSize, vocabSize);
    tokens.tokens.forEach(function (tokenIds) {
        var set = new Set(tokenIds);
        set.forEach(function (tokenId1) {
            if (ivocab[tokenId1].length <= 1) {
                return;
            }
            set.forEach(function (tokenId2) {
                if (ivocab[tokenId1].length <= 2) {
                    return;
                }
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
    var b = math.divide(math.ones(pmi.size()[0]), pmi.size()[0]);
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


class JapaneseSentenceSegmenter {
    static segment(text) {
        return text.replace(/([。.：:;])/g, '$1\n').split('\n');
    }
}

class TinyTokenizer {
    constructor () {
        this.segmenter = new TinySegmenter();
    }

    tokenize (raw_text) {
        return this.segmenter.segment(raw_text);
    }
}

class VocabularyProcessor {
    constructor (tokenizer, unknown="") {
        this.tokenizer = tokenizer;
        this.unknown = unknown;
    }

    fit (raw_documents) {
        this._vocab = {};
        this._vocab[this.unknown] = 0;
        raw_documents.forEach((raw_document) => {
            let tokens = this.tokenizer.tokenize(raw_document);
            tokens.forEach((token) => {
                if (!(token in this._vocab)) {
                    let idx = Object.keys(this._vocab).length;
                    this._vocab[token] = idx;
                }
            });
        });

        this._ivocab = {};
        Object.keys(this._vocab).forEach((key) => {
            this._ivocab[this._vocab[key]] = key;
        });

        return this;
    }

    transform (raw_documents) {
        return raw_documents.map((raw_document) => {
            let tokens = this.tokenizer.tokenize(raw_document);
            return tokens.map((token) => this._vocab[token]);
        });
    }

    reverse (documents) {
        return documents.map((document) => {
            return document.map((tokenId) => {
                return this._ivocab[tokenId];
            }).join("");
        })
    }
};

class Summarizer {
    constructor (vocab) {
        this.vocab = vocab;
    }

    summarize (raw_sentences, callback) {
        let sentences = this.vocab.transform(raw_sentences);
        let termWeights = this.calcTermWeights(sentences);
    }

    calcTermWeights (sentences) {
        let tf = this.calcTermFrequency(sentences);
        return tf;
    }

    calcTermFrequency (sentences) {
        let tf = {};
        sentences.forEach((sentence) => {
            sentence.forEach((tokenId) => {
                if (tokenId in tf) {
                    tf[tokenId] += 1;
                } else {
                    tf[tokenId] = 1;
                }
            });
        });
        return tf;
    }
};

class QuantumIsingAnnealer {
    constructor (latticeShape) {
        this.latticeShape = latticeShape
    }

    optimize (J, H, initialBeta=40, initialGamma=10, nTrotter=32, freezeLimit=100, maxIter=10000, callback=()=>{}) {
        this.J = J;
        this.H = H;
        this.beta = initialBeta
        this.gamma = initialGamma
        this.nTrotter = nTrotter
        this.freezeLimit = freezeLimit;
        this.state = this.buildInitialState();
        this.freezeCount = 0;
        this.energy = this.calcEnergy(this.state);

        for(let i = 0; i < maxIter; i++) {
            if (this.isFrozen()) {
                break;
            }

            if (!this.update()) {
                this.freezeCount++;
            }
            callback(this);
        }
    }

    buildInitialState () {
        let shape = [this.nTrotter].concat(this.latticeShape);
        return math.subtract(math.multiply(math.randomInt(shape, 2), 2), 1);
    }

    update () {

    }

    isFrozen () {
        this.freezeCount >= this.freezeLimit;
    }

    calcEnergy (state) {
        state.forEach((trotterLayer) => {
            math.multiply(this.J, trotterLayer)

        });
    }
};