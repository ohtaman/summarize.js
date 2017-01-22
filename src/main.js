var TinySegmenter = require('tiny-segmenter');
var math = require('mathjs');
var summarize = require('./summarize');

(function(){
    window.math = math;
    window.summarize = summarize;
    console.log(math);
    var segmenter = new TinySegmenter();
    console.log(segmenter.segment("私の名前は太田です。ちょっと新しいことをやってみたいと思うよ。"))
})();