var TinySegmenter = require('tiny-segmenter');
var stopWords = require('./stopWords');

class JapaneseSentenceSegmenter {
    segment(text) {
        return text.replace(/([。.：:;])/g, '$1\n').trim().split('\n');
    }
}

class TinyTokenizer {
    constructor () {
        this.segmenter = new TinySegmenter();
    }

    tokenize (rawText) {
        return this.segmenter.segment(rawText);
    }
}

class VocabularyProcessor {
    constructor (tokenizer=new TinyTokenizer(), unknown="") {
        this.tokenizer = tokenizer;
        this.unknown = unknown;
    }

    fit (rawDocuments) {
        this._vocab = {};
        this._vocab[this.unknown] = 0;
        rawDocuments.forEach((rawDocument) => {
            let tokens = this.tokenizer.tokenize(rawDocument);
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

    transform (rawDocuments) {
        return rawDocuments.map((rawDocument) => {
            let tokens = this.tokenizer.tokenize(rawDocument);
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
    constructor (vocab=new VocabularyProcessor(new TinyTokenizer())) {
        this.vocab = vocab;
    }

    summarize (rawSentences, callback) {
        this.vocab.fit(rawSentences);
        let sentences = this.vocab.transform(rawSentences);
        let termWeights = this.calcTermWeights(sentences);
        return rawSentences;
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
        this.latticeShape = latticeShape;
        this.latticeSize = math.prod(latticeShape);
    }

    optimize (J, H, {initialBeta=40, initialGamma=10, betaFactor=1.05, gammaFactor=0.95, nTrotter=32, freezeLimit=100, minPercent=0.02, maxFlip=3, maxAccepts=10, maxTrials=100, maxIter=10000, callback=()=>{}} = {}) {
        this.J = J;
        this.H = H;
        this.beta = initialBeta;
        this.gamma = initialGamma;
        this.betaFactor = betaFactor;
        this.gammaFactor = gammaFactor;
        this.nTrotter = nTrotter;
        this.freezeLimit = freezeLimit;
        this.minPercent = minPercent;
        this.maxFlip = maxFlip;
        this.maxAccepts = maxAccepts;
        this.maxTrials = maxTrials;

        this._J = this._flattenJ(J);
        this._H = math.flatten(H);
        this._state = this.buildInitialState();
        this.freezeCount = 0;
        this.trialCount = 0;
        this.acceptCount = 0;
        this.energy = this.calcEnergy(this.state);
        this.minEnergy = energy;

        for(let i = 0; i < maxIter; i++) {
            if (this.isFrozen()) {
                break;
            }

            let updateResult = this.updateState();

            this.trialCount++;
            if (updateResult.accept) {
                this.acceptCount++;
            }
            if (updateResult.upadteBest) {
                this.freezeCount = 0;
            }

            if (this.updateParams(updateResult)) {
                if (this.acceptCount/this.trialCount < this.minPercent) {
                    this.freezeCount++;
                }
                this.trialCount = 0;
                this.acceptCount = 0;
            }

            callback(updateResult, this);
        }
    }

    buildInitialState () {
        let shape = [this.nTrotter].concat(math.prod(this.latticeShape));
        return math.subtract(math.multiply(math.randomInt(shape, 2), 2), 1);
    }

    updateState () {
        let trotterSliceIdx = math.randomInt(this.nTrotter);
        let flipIdx = this._getFlattenIndex();
        this.flipSpin(flipIdx, trotterSliceIdx);
        let candidateEnergy = this.calcEnergy(this._state);
        let energyDiff = candidateEnergy - this.energy;

        if (energyDiff < 0) {
            this.energy = candidateEnergy;
            if (this.energy < this.minEnergy) {
                this.minEnergy = this.energy;
                return {accept: true, updateBest: true};
            } else {
                return {accept: true, updateBest: false};
            }
        } else if (math.exp(-this.beta*energyDiff) > math.random()){
            this.energy = candidateEnergy;
            return {accept: true, updateBest: false};
        } else {
            this.flipSpin(flipIdx, trotterSliceIdx);
            return {accept: false, upadteBest: false};
        }
    }

    updateParams (updateStateResult) {
        if (this.acceptCount > this.maxAccepts || this.trialCount > this.maxTrials) {
            this.beta *= this.bataFactor;
            this.gamma *= this.gammaFactor;
            return true;
        } else {
            return false;
        }
    }

    _getFlipIndex () {
        let nFlip = math.randomInt(this.maxFlip) + 1;
        return math.randomInt([nFlip], this.latticeSize);
    }

    isFrozen () {
        this.freezeCount >= this.freezeLimit;
    }

    calcEnergy (state) {
        let energy = 0;
        // Classical term
        state.forEach((trotterSlice) => {
            energy -= math.multiply(
                    trotterSlice,
                    math.multiply(this._J, trotterSlice)
            );
            energy -= math.dot(this._H, trotterSlice);
        });
        energy /= this.nTrotter;

        // Quantum term
        let coeff = math.log(math.coth(this.beta*this.gamma/this.nTrotter))/(2*this.beta);
        energy -= coeff*math.sum(state.map((trotterSlice, idx) => {
            var nextSlice = state[idx%this.nTrotter];
            return math.dot(trotterslice, nextSlice);
        }));
        return energy;
    }

    _flipSpin(spins, trotterSliceIdx) {
        spins.forEach((idx) => {
            let value = this._state.get([trotterSlice, idx]);
            this._state.set([trotterSlice, idx], -value);
        });
    }

    _flattenJ (J, latticeShape) {
        let stateSize = math.prod(latticeShape);
        let _J = math.zeros([stateSize, stateSize]);
        J.forEach((value, idx) => {
            let leftIdx = idx.slice(0, idx.length/2);
            let rightIdx = idx.slice(idx.length/2);
            let flattenLeftIdx = this._getFlattenIndex(leftIdx);
            let flattenRightIdx = this._getFlattenIndex(rightIdx);
            _J.set([flattenLeftIdx, flattenRightIdx], value);
        });
        return _J
    }

    _getFlattenIndex (idx, shape) {
        return math.dot(
            shape.map((_, i) => {
                return math.prod(shape.slice(i));
            }).slice(1).concat(1),
            idx
        );
    }
};

module.exports = {
    JapaneseSentenceSegmenter,
    TinyTokenizer,
    VocabularyProcessor,
    Summarizer
}