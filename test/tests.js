/* global arrange */
/* global QUnit */
/* global expect */

/* jshint newcap: false */

(function() {
  'use strict';

  var dateNow = new Date();
  var big = '23098475029384702983476098230754973209482573';

  function t(formatString, expected, args) {
    return {
      formatString: formatString,
      expected: expected,
      args: args
    };
  }

  var TESTS = {
    Basic: [
      t('{}', '1', [1]),
      t(' {}', ' 1', [1]),
      t(' { } ', ' 1 ', [1]),
      t('{0}', '1', [1]),
      t('{1}', '2', [1,2]),
      t('{}_{}_{}', '1_2_3', [1,2,3]),
      t('{0}_{1}_{2}', '1_2_3', [1,2,3]),
      t('{2}_{1}_{0}', '3_2_1', [1,2,3]),
      t('{,2}', ' 1', [1]),
      t('123', '123', [1])
    ],
    Escape: [
      t('{{{}}}', '{1}', [1]),
      t('{{}}', '{}', [])
    ],
    NumberShort: [
      t('{:B}', '11', [3.14]),
      t('{:D}', '3', [3.14]),
      t('{:E}', '3.14E+1', [31.4]),
      t('{:F}', '3', [3.14]),
      t('{:G}', '3.14', [3.14]),
      t('{:O}', '123', [parseInt('123', 8)]),
      t('{:P}', '3.14', [3.14]),
      t('{:X}', 'C0DE', [0xC0DE]),
      t('{:e}', '3.14e+1', [31.4]),
      t('{:x}', 'c0de', [0XC0DE])
    ],
    NumberShortArg: [
      t('{:B+5}', '-00011', [-3.14]),
      t('{:D1}', '123', [123]),
      t('{:E3}', '3.140E+1', [31.4]),
      t('{:F10}', '3.1400000000', [3.14]),
      t('{:G2}', '3.1', [3.14]),
      t('{:O4}', '0123', [parseInt('123', 8)]),
      t('{:P1}', '3', [3.14]),
      t('{:X6}', '00C0DE', [0xC0DE])
    ],
    DateLong: [
      t('{:yyyy/MM/dd hh:mm:ss.FFF}', '2000/01/02 03:04:05.678', [new Date(2000, 1-1, 2, 3, 4, 5, 678)]),
      t('{:yyyy/MM/dd hh:mm:ss.fff}', '2000/01/02 03:04:05.678', [new Date(2000, 1-1, 2, 3, 4, 5, 678)]),
      t('{:y-M-d h:m:s.F}', '0-1-2 3:4:5.6', [new Date(2000, 1-1, 2, 3, 4, 5, 678)]),

      t('{:d dd ddd dddd}', '1 01 Sat Saturday', [new Date(2000, 1-1, 1)]),
      t('{:M MM MMM MMMM}', '1 01 Jan January', [new Date(2000, 1-1, 1)]),
      t('{:f,ff,fff,F,FF,FFF}|{:f,ff,fff,F,FF,FFF}|{:f,ff,fff,F,FF,FFF}',
        '6,67,678,6,67,678|0,00,001,0,0,001|0,00,000,0,0,0',
        [new Date(2000, 1-1, 2, 3, 4, 5, 678), new Date(2000, 1-1, 2, 3, 4, 5, 1), new Date(2000, 1-1, 2, 3, 4, 5, 0)]),
      t('{:h hh H HH t tt}|{:h hh H HH t tt}|{:h hh H HH t tt}|{:h hh H HH t tt}',
        '3 03 3 03 A AM|3 03 15 15 P PM|12 12 12 12 P PM|12 12 0 00 A AM',
        [new Date(2000, 1-1, 1, 3), new Date(2000, 1-1, 1, 15), new Date(2000, 1-1, 1, 12), new Date(2000, 1-1, 1, 0)]),
      t('{:m mm}', '4 04', [new Date(2000, 1-1, 2, 3, 4)]),
      t('{:s ss}', '5 05', [new Date(2000, 1-1, 2, 3, 4, 5)]),
      t('{:y yy yyy yyyy yyyyy}|{:y yy yyy yyyy yyyyy}|{:y yy yyy yyyy yyyyy}|{:y yy yyy yyyy yyyyy}',
        '0 00 2000 2000 02000|10 10 2010 2010 02010|0 00 20000 20000 20000|0 00 100 0100 00100',
        [new Date(2000, 0, 1), new Date(2010, 0, 1), new Date(20000, 0, 1), new Date(100, 0, 1)])
      //t('{:K}', '5 05', [new Date(2000, 1-1, 2, 3, 4, 5)]),
      //t('{:z zz zzz}', '-1 -01 -01:00', [new Date(2000, 1-1, 2, 3, 4, 5)]),
    ],
    'PyTest: Basic': [
      t('', '', []),
      t('abc', 'abc', []),
      t('{0}', 'abc', ['abc']),
      t('{0:}', 'abc', ['abc']),
      t('{:}', 'abc', ['abc']),
      t('{ 0 }', 'abc', ['abc']),
      t('X{0}', 'Xabc', ['abc']),
      t('{0}X', 'abcX', ['abc']),
      t('X{0}Y', 'XabcY', ['abc']),
      t('{1}', 'abc', [1, 'abc']),
      t('X{1}', 'Xabc', [1, 'abc']),
      t('{1}X', 'abcX', [1, 'abc']),
      t('X{1}Y', 'XabcY', [1, 'abc']),
      t('{0}', '-15', [-15]),
      t('{0}{1}', '-15abc', [-15, 'abc']),
      t('{0}X{1}', '-15Xabc', [-15, 'abc']),
      t('{{', '{', []),
      t('}}', '}', []),
      t('{{}}', '{}', []),
      t('{{x}}', '{x}', []),
      t('{{{0}}}', '{123}', [123]),
      t('{{{{0}}}}', '{{0}}', []),
      t('}}{{', '}{', []),
      t('}}x{{', '}x{', [])
    ],
    'PyTest: Property': [
      t('{0."foo-bar"}', 'baz', [{'foo-bar':'baz'}]),
      t('{0."foo bar"}', 'baz', [{'foo bar':'baz'}]),
      t('{0." "}', '3', [{' ':3}]),
      t('{foo._x}', '20', [{foo:{_x:20}}]),
      t('{1}{0}', '2010', [10,20]),
      t('{0._x.x}', 'abc', [{_x:{x:'abc'}}]),
      t('{0.0}', 'abc', [['abc','def']]),
      t('{0.1}', 'def', [['abc','def']]),
      t('{0.1.0}', 'def', [['abc',['def']]]),
      t('{0.1.0.x}', 'def', [['abc',[{x:'def'}]]])
    ],
    'PyTest: Padding': [
      t('{0,3}', 'abc', ['abc']),
      t('{0,3}', ' ab', ['ab']),
      t('{0,3}', 'abcdef', ['abcdef']),
      t('{0,0}', 'abcdef', ['abcdef']),
      t('{0,10}', new Array(9 + 1).join(' ') + 'a', ['a']),
      t('{0,10}', new Array(10 + 1).join(' '), [''])
      // Commented per performance
      // t('{0,10000}', new Array(9999 + 1).join(' ') + 'a', ['a']),
      // t('{0,10000}', new Array(10000 + 1).join(' '), ['']),
      // t('{0,10000000}', new Array(10000000 + 1).join(' '), [''])
    ],
    'Test Types': [
      t('{}', '{}', [{}]),
      t('{}', '[]', [[]]),
      t('{}', '/asd\\/[as]*/i', [/asd\/[as]*/i]),
      t('{}', dateNow.toString(), [dateNow])
    ],
    'PyTest Malformed': [
      t('{', '{', []),
      t('}', '}', []),
      t('a{', 'a{', []),
      t('a}', 'a}', []),
      t('{a', '{a', []),
      t('}a', '}a', []),
      t('{0}', '', []),
      t('{1}', '', ['abc']),
      t('{x}', '', []),
      t('}{', '}{', []),
      t('abc{0:{}', 'abc{0:', []),
      t('{0', '{0', []),
      t('{0.}', '{0.}', []),
      t('{0.}', '{0.}', [0]),
      t('{0[}', '{0[}', []),
      t('{0[}', '{0[}', []),
      t('{0]}', '{0]}', []),
      t('{0.""}', '', [0]),
      t('{0..foo}', '{0..foo}', [0]),
      t('{0[0}', '{0[0}', [0]),
      t('{0[0:foo}', '{0[0:foo}', [0]),
      t('{c]}', '{c]}', []),
      t('{{ {{{0}}', '{ {0}', [0]),
      t('{0}}', '0}', [0]),
      t('{foo}', '', [{bar:3}]),
      t('{:}', '', []),
      t('{:s}', '', []),
      t('{}', '', []),
      t('{' + big + '}', '', []),
      t('{"' + big + '"}', '', [0])
    ],
    'PyTest Various': [
      t('{0.0.x}', '', [undefined]),
      t('{0:s}{1:s}', 'ABC\u0410\u0411\u0412', ['ABC', '\u0410\u0411\u0412']),
      t('{0,8}', '  ABC\u0410\u0411\u0412', ['ABC\u0410\u0411\u0412']),
      t('{"{}"}', '5', [{'{}': 5}]),
      t('{"{}"}', 'a', [{'{}' : 'a'}]),
      t('{"{"}', 'a', [{'{' : 'a'}]),
      t('{"}"}', 'a', [{'}' : 'a'}]),
      t('{"["}', 'a', [{'[' : 'a'}]),
      t('{"!"}', 'a', [{'!' : 'a'}]),
      t('{a{}b}', '{a42b}', [42]),
      t('{a{b}', '{a', [42]),
      t('{[}', '{[}', [42]),
      t('0x{:X16}', '0x0000000000000000', [0x0])
    ],
    'PyTest Basic Object': [
      t('', '', [{}]),
      t('a', 'a', [{}]),
      t('ab', 'ab', [{}]),
      t('a{{', 'a{', [{}]),
      t('a}}', 'a}', [{}]),
      t('{{b', '{b', [{}]),
      t('}}b', '}b', [{}]),
      t('a{{b', 'a{b', [{}])
    ],
    'PyTest Auto Numbering': [
      t('{}', '10', [10]),
      t('{,5}', '    s', ['s']),
      t('{:js}', '"s"', ['s']),
      t('{._x}', '10', [{_x:10}]),
      t('{.1}', '2', [[1, 2]]),
      t('{a}', '4', [{'a':4, 'b':2}]),
      t('a{}b{}c', 'a0b1c', [0, 1]),
      t('a{:{}}b', 'a{:x}b', ['x', '^10']),
      t('a{:{}x}b', 'a{:20x}b', [20, '#']),
      t('{}{1}', '12', [1, 2]),
      t('{1}{}', '21', [1, 2]),
      t('{:{1}}', '{:2}', [1, 2]),
      t('{0:{}}', '{0:1}', [1, 2]),
      t('{f}{}', 'test4', [4,{f:'test'}]),
      t('{}{f}', '4test', [4,{f:'test'}]),
      t('{:{f}}{g}{}', '{:2}g1', [1,3,{g:'g',f:2}]),
      t('{f:{}}{}{g}', '{f:2}4g', [2,4,{f:1,g:'g'}])
    ]
  };

  var METHODS = {
    Lazy: function(test) {
      var formatArgs = [test.formatString].concat(test.args);
      return arrange.lazy.apply(arrange, formatArgs).toString();
    },
    Template: function(test) {
      var template = arrange.template(test.formatString);
      return template.arrange.apply(template, test.args);
    },
    TemplateLazy: function(test) {
      var template = arrange.template(test.formatString);
      return template.lazy.apply(template, test.args).toString();
    },
    Formattable: function(test) {
      return arrange.formattable.apply(arrange, test.args).arrange(test.formatString);
    },
    FormattableLazy: function(test) {
      return arrange.formattable.apply(arrange, test.args).lazy(test.formatString).toString();
    }
  };

  Object.keys(TESTS).forEach(function(testName) {
    if (testName.charAt(0) !== '_') {
      QUnit.test(testName, function(assert) {
        for (var i = 0; i < TESTS[testName].length; i++) {
          var test = TESTS[testName][i];

          var formatArgs = [test.formatString].concat(test.args);
          var formatted = arrange.apply(null, formatArgs);

          assert.ok(formatted === test.expected,
            arrange('{:js}: {:js} = {:js}', test.formatString, formatted, test.expected));
        }
      });
    }
  });

  Object.keys(METHODS).forEach(function(methodName) {
    if (methodName.charAt(0) !== '_') {
      QUnit.test(methodName, function(assert) {
        expect(0);

        Object.keys(TESTS).forEach(function(testName) {
          if (testName.charAt(0) !== '_') {
            for (var i = 0; i < TESTS[testName].length; i++) {
              var test = TESTS[testName][i];

              var formatArgs = [test.formatString].concat(test.args);
              var formatted = arrange.apply(null, formatArgs);
              var formatted2 = METHODS[methodName](test);

              if (formatted !== formatted2)
                assert.ok(formatted === formatted2,
                  arrange('{:js}: {:js} = {:js}', test.formatString, formatted, formatted2));
            }
          }
        });
      });
    }
  });

})();
