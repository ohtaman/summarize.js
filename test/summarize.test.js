var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var summarize = require('../src/summarize');

describe('summarize', () => {
    describe('JapaneseSentenceSegmenter', () => {
        let testee = new summarize.JapaneseSentenceSegmenter();
        it('can segment Japanese text to sentence', () => {
            let text = '私の名前は中野です。あなたの名前は太田です。';
            let segmented = testee.segment(text);
            should.equal(segmented.length, 2);
            should.equal(segmented[0], '私の名前は中野です。');
            should.equal(segmented[1], 'あなたの名前は太田です。');
        });
    });

    describe('TinyTokenizer', () => {
        let testee = new summarize.TinyTokenizer();
        it('can tokenize Japanese text', () => {
            let text = '私の名前は中野です。';
            let tokens = testee.tokenize(text);
            should.equal(tokens.length, 7);
            should.equal(tokens[0], '私');
            should.equal(tokens[1], 'の');
            should.equal(tokens[2], '名前');
            should.equal(tokens[3], 'は');
            should.equal(tokens[4], '中野');
            should.equal(tokens[5], 'です');
            should.equal(tokens[6], '。');
        });
    });

    describe('VocabularyProcessor', () => {
        let testee = new summarize.VocabularyProcessor(new summarize.TinyTokenizer());
        let tokens = ['私', 'の', '名前', 'は', '中野', 'です', '。'];
        it('can fit and transform tokens', () => {
            testee.fit(tokens);
            let transformed = testee.transform(tokens);
            should.equal(transformed.length, tokens.length);
            should.equal(new Set(transformed).size, tokens.length);
        });
        it('can reverse tokenized text', () => {
            testee.fit(tokens);
            let transformed = testee.transform(tokens);
            let reversed = testee.reverse(transformed);
            should.equal(reversed.length, tokens.length);
            reversed.forEach((elem, idx) => {
                should.equal(elem, tokens[idx]);
            });
        });
    });

    describe('Summarizer', () => {
        let rawSentences = ['私の名前は中野です。', 'あなたの名前は太田です。', '東京都庁に行きます。'];
        let testee = new summarize.Summarizer();
        it('can summarize text', () => {
            let targetLength = 1;
            let summarized = testee.summarize(rawSentences, targetLength);
            expect(summarized).to.have.length.below(targetLength);
        });
    });
});