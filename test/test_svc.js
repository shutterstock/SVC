var testCase = require('nodeunit').testCase;

var jsdom = require('jsdom');

module.exports = testCase({
	'all tests' : function (test) {
		jsdom.env({
			html: 'test_svc.html',
			scripts: [
				'https://raw.github.com/Jakobo/PTClass/master/class-min.js',
				'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.3/underscore-min.js',
				//'https://ajax.googleapis.com/ajax/libs/prototype/1.7.0.0/prototype.js',
				'http://github.com/jquery/qunit/raw/master/qunit/qunit.js'
			],
			done: function (errors, window) {
				var $ = window.$;
				var testResults = $('qunit-testresult');
				var passed = testResults.select('.passed').first().innerHTML;
				var total = testResults.select('.total').first().innerHTML;
				var errors = testResults.select('.errors').first().innerHTML;
				
				console.log(passed + " tests passed, " + errors + " tests had errors out of " + total + " tests.");
				test.equal(passed, total, 'passed tests should equal total tests');
				test.done();
			}
		});
	}
});
