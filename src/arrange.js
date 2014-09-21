/** @module format */

this.arrange = (function(arrange) {
  'use strict';

  if (typeof arrange !== 'undefined')
    return arrange;

  // Standard functions reference
  var ArraySlice = Array.prototype.slice;
  var ObjectToString = Object.prototype.toString;

  // Cross-browser trim
  var trim = String.prototype.trim ? function(string) { return string.trim(); }
           : function(string) { return string.replace(/^\s+|\s+$/g, ''); };

  function isNullOrUndefined(obj) {
    // obj == null match exactly undefined and null
    return obj == null; // jshint ignore: line
  }

  function getDefault(obj, defaultValue) {
    return isNullOrUndefined(obj) ? defaultValue: obj;
  }

  // Parse a quoted string
  function unquoteString(quoted) {
    var quote = quoted.charAt(0);
    // turn double quotes in single quotes
    return quoted.slice(1, -1).replace(quote + quote, quote);
  }

  // pad a value to the left
  function padLeft(value, amount, padding) {
    value = value.toString();
    if (value.length >= amount)
      return value;

    if (isNullOrUndefined(padding))
      padding = ' ';

    return (new Array(amount - value.length + 1)).join(padding || ' ') + value;
  }

  // pad a value to the right
  function padRight(value, amount, padding) {
    value = value.toString();

    if (value.length >= amount)
      return value;

    if (isNullOrUndefined(padding))
      padding = ' ';

    return value + (new Array(amount - value.length + 1)).join(padding || ' ');
  }

  // Cross browser function to check if an element is in an array
  function contains(sequence, item) {
    for (var i = 0; i < sequence.length; i++)
      if (sequence[i] === item)
        return true;
    return false;
  }

  // Escape regular expression special characters
  function escapeRegExp(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  // Get a more specific type then typeof
  // Design notes: this function tries to return the lowercased [[class]]
  // private property of the JS object across all major browsers
  function getActualType(obj) {
    if (obj === null)
      return 'null';

    var type = typeof obj;

    if (type !== 'object')
      return type;

    // Ex. '[object Array]' => 'array'
    return ObjectToString.call(obj).slice(8, -1).toLowerCase();
  }

  // Given a locale string in the formats zz_ZZ, zz-ZZ or zz (ignoring the
  // case) returns the appropriate locale object if found
  function getLocaleInfo(locale, defaultLocaleInfo) {
    if (!locale)
      return defaultLocaleInfo;

    if (availableLocaleInfo[locale])
      return availableLocaleInfo[locale];

    var localeParts = locale.match(/^([A-Z]+)(?:[_-]([A-Z]+))?$/i);
    if (localeParts) {
      var language = localeParts[1].toLowerCase();
      var territory = localeParts[2] ? ('_' + localeParts[2].toUpperCase()) : '';

      if (availableLocaleInfo[language + territory])
        return availableLocaleInfo[language + territory];

      if (availableLocaleInfo[language])
        return availableLocaleInfo[language];
    }

    return defaultLocaleInfo;
  }

  // Available locales
  // TODO: should be expanded and expandable
  var availableLocaleInfo = {
    'en': {
      locale: 'en',
      ampm: ['AM', 'PM'],
      months: 'January February March April May June July August September October November December'.split(' '),
      monthsShort: 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' '),
      day: 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' '),
      dayShort: 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')
    },
    'it': {
      locale: 'it',
      ampm: ['AM', 'PM'],
      months: 'gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottoble novembre dicembre'.split(' '),
      monthsShort: 'gen feb mar apr mag giu lug ago set ott nov dic'.split(' '),
      day: 'domenica lunedì martedì mercoledì giovedì venerdì sabato'.split(' '),
      dayShort: 'dom lun mar mer gio ven sab'.split(' ')
    }
  };

  var DEFAULT_OPTIONS = {
    openChar: '{',
    closeChar: '}',
    localeInfo: getLocaleInfo('en'),
    // ValuesFormatters are so specified:
    //  name: the name of the formatter
    //  [argumentsRegexp]:
    //    a regexp that match the arguments format, if not provided everything will match
    //  [allowedTypes]:
    //    list of all the formattable types (as defined by getActualType), if not provided
    //    everything will match
    //  [processMatch(match)]:
    //    if provided the match value of the argumentsRegex will be preprocessed by this function.
    //    If the return value is undefined then the format did not match
    //  formatValue(value, type, args):
    //    Format the value given the type (as defined by getActualType) and the parsed arguments.
    //    If the return value is null or undefined then the format did not match
    // The actual formatter will be the first matching of the list
    valueFormatters: [
      {
        // TODO: [N]umber localized [C]urrency
        name: 'NumberFormat',
        // Formats a number
        // Available formats:
        //  [B]oolean: formatted as a boolean integer number, optionally padded with zeros at the specified length
        //  [D]ecimal: formatted as a (decimal) integer number, optionally padded with zeros at the specified length
        //  [E]xponential: as the toExponential function
        //  [F]ixed:  as the toFixed function
        //  [G]eneral: the shortest between the E and P formats
        //  [O]ctal: formatted as an octal integer number, optionally padded with zeros at the specified length
        //  [P]recision: as the toPrecision function
        //  he[X]adecimal: formatted as an hexadecimal integer number, optionally padded with zeros at the specified length
        // When the output contains letters the case is dependant on the case of the format letter parameter
        // If the argument starts with a plus then the result will always show the sign, even negative zero.
        argumentsRegexp: /^([BDEFGOPX])(\+?[0-9]+)?\s*$/i,
        allowedTypes: ['number', 'string'],
        processMatch: function(match) {
          var plus = false;
          var parameter;

          if (match[2]) {
            plus = (match[2].charAt(0) === '+');
            parameter = parseInt(match[2], 10);
          }

          return {
            code: match[1],
            parameter: parameter,
            alwaysShowSign: plus
          };
        },
        formatValue: function(value, type, args) {
          var number = (type === 'number' ? value : parseFloat(value));

          if (number !== number)
            return 'NaN';

          if (number === 1 / 0)
            return args.alwaysShowSign ? '+Infinity' : 'Infinity';

          if (number === -1 / 0)
            return '-Infinity';

          var code = args.code.toUpperCase();
          var upper = (code === args.code);

          var formatted;

          // integer handling
          if (code === 'D' || code === 'X' || code === 'B' || code === 'O') {
            var integer = Math.round(number);
            var padLength = args.parameter || 0;
            var base = code === 'D' ? 10
                     : code === 'X' ? 16
                     : code === 'B' ? 2
                     : 8; // code === 'O' || code === 'o'

            // the sign is added after the padding
            // negative zero here is formatted with a plus
            if (integer < 0)
              formatted = '-' + padLeft((-integer).toString(base), padLength, '0');
            else if (args.alwaysShowSign)
              formatted = '+' + padLeft(integer.toString(base), padLength, '0');
            else
              formatted = padLeft(integer.toString(base), padLength, '0');
          } else { // float handling
            if (code === 'E') {
              formatted = number.toExponential(args.parameter);
            } else if (code === 'F') {
              formatted = number.toFixed(args.parameter);
            } else if (code === 'P') {
              formatted = number.toPrecision(args.parameter);
            } else { // 'G'
              var exponential = number.toExponential(args.parameter);
              var precision = number.toPrecision(args.parameter);

              // Shortest preferring precision
              formatted = (exponential.length < precision.length ? exponential : precision);
            }

            // -0 is not positive
            var positive = number ? (number > 0) : (1 / number > 0);

            if (args.alwaysShowSign) {
              if (positive)
                formatted = '+' + formatted;
              else if (formatted.charAt(0) !== '-')
                formatted = '-' + formatted;
            }
          }

          return upper ? formatted.toUpperCase() : formatted.toLowerCase();
        }

      },
      {
        // TODO: Available only if JSON.stringify actually exists
        name: 'JsonFormat',
        // Formats an object with JSON.stringify
        // Format: the string JS or JSON (case insensitive) optionally followed by a quoted string or a number.
        // The optional string or number is used for the spaces argument of JSON.stringify
        argumentsRegexp: /^JS(?:ON)?\s*([+-]?[0-9]+|"(?:[^"]|"")*"|'(?:[^']|'')*')?\s*$/i,
        allowedTypes: null, // All types can be stringified with JSON,
        processMatch: function(match) {
          if (!match[1])
            return null;

          var arg = trim(match[1]);

          if (/^['"]/.test(arg)) // quoted string
            return unquoteString(arg);

          return parseInt(arg, 10);
        },
        formatValue: function(value, type, args) {
          try {
            var space = isNullOrUndefined(args) ? undefined : args;
            var json = JSON.stringify(value, undefined, space);

            return isNullOrUndefined(json) ? value.toString() : json;
          } catch (e) {
            return value.toString();
          }
        }
      },
      {
        name: 'ToStringFormat',
        // Formats an object using the toString function
        // Format: S
        argumentsRegexp: /^S\s*$/i,
        allowedTypes: null, // We can always call toString, null is treated as ''
        formatValue: function(value) {
          return value === null ? '' : value.toString();
        }
      },
      {
        name: 'DateFormat',
        // Format a date
        // All the chacters in the format date are returned in the output string verbatin except the following patterns:
        //  d     The day of the month 0-31
        //  dd    The day of the month zero padded 00-31
        //  ddd   The abbreviated day of the week Sun-Sat
        //  dddd  The abbreviated day of the week Sunday-Saturday
        //  M     The month of the year 1-12
        //  MM    The month of the year zero padded 01-12
        //  MMM   The abbreviated month of the year Jan-Dec
        //  MMMM  The month of the year January-December
        //  f     The tenth of the second 0-9
        //  ff    The hundredth of the second 00-99
        //  fff   The millisecond of the second 000-999
        //  F     The tenth of the second 0-9
        //  FF    As ff with trailing zeros removed (0,01,..,09,1,11,..,99)
        //  FFF   As fff with trailing zeros removed (0,001,..,009,01,011,..,099,1,101,..,999)
        //  h     The hour using a 12 hours clock 1-12
        //  hh    The hour using a 12 hours clock 1-12 zero padded 01-12
        //  H     The hour using a 24 hours clock 0-23
        //  HH    The hour using a 24 hours clock 0-23 zero padded 00-23
        //  m     The minute 0-59
        //  mm    The minute zero padded 00-59
        //  s     The second 0-59
        //  ss    The second zero padded 00-59
        //  t     The first character of AM/PM
        //  tt    AM/PM
        //  K     Time zone information (NOTE: not portable!)
        //  :     The time separator (TODO: use locale!)
        //  \     The date separator (TODO: use locale!)
        //  y     The last two digit of the year not padded 2014->4, 2001->1
        //  yy    The last two digit of the year zero padded 2014->14, 2001->01
        //  yyy   The year zero-padded to at least length 3 if shorter 2014->2014, 10->010
        //  yyyy  The year zero-padded to at least length 4 if shorter 2014->2014, 10->0010
        //  yyyyy The year zero-padded to at least length 5 if shorter 2014->02014, 10->00010
        //  z     The hour offset from UTC ..,-10,-9,..-1,+0,+1,..,+9,+10,..
        //  zz    The hour offset from UTC zero padded ..,-10,-09,..-01,+00,+01,..,+09,+10,..
        //  zzz   The hour offset from UTC zero padded with the minutes part (-10:00)
        //  'txt' The quoted test is printed verbatim after escaping the quotes: "te""st" -> te"st
        //  "txt" The quoted test is printed verbatim after escaping the quotes: 'te''st' -> te'st
        argumentsRegexp: /^[\s\S]+$/, // All the nonempty strings are valid format date
        allowedTypes: ['date'],
        elementsRegexp: /(%?d{1,4}|M{1,4}|f{1,3}|F{1,3}|h{1,2}|H{1,2}|m{1,2}|s{1,2}|t{1,2}|[K:\/]|y{1,5}|z{1,3}|"(?:[^"]|"")*"|'(?:[^']|'')*')/, // jshint ignore: line

        processMatch: function(match) {
          var tokens = match[0].split(this.elementsRegexp);

          var args = [];
          for (var i = 0; i < tokens.length; i++) {
            var arg;
            if (tokens[i].search(this.elementsRegexp) === -1) {
              arg = tokens[i];
            } else {
              var token = tokens[i];

              if (token.charAt(0) === '%')
                token = token.slice(1);

              if (/^['"]/.test(token)) // quoted string
                arg = unquoteString(token);
              else
                arg = {
                  element: token.charAt(0),
                  count: token.length
                };
            }

            if (arg !== '') {
              if (typeof args[args.length - 1] === 'string' && typeof arg === 'string')
                args[args.length - 1] += arg;
              else
                args.push(arg);
            }
          }

          return args;
        },
        formatValue: function(value, type, args, localeInfo) {
          var date = (type !== 'date' ? new Date(value) : value);
          var time = date.getTime();

          // Invalid date
          if (time !== time)
            return null;

          var output = [];
          for (var i = 0; i < args.length; i++) {
            var token = args[i];

            var formatted = null;
            if (typeof token === 'string') {
              formatted = token;
            } else {
              var tzOff;
              var tzSign;
              var year;
              switch (token.element) {
                case 'd': // 1-4
                  if (token.count <= 2)
                    formatted = padLeft(date.getDate(), token.count, '0');
                  else if (token.count === 3)
                    formatted = localeInfo.dayShort[date.getDay()];
                  else
                    formatted = localeInfo.day[date.getDay()];
                  break;
                case 'M': // 1-4
                  formatted = token.count <= 2 ? padLeft(date.getMonth() + 1, token.count, '0')
                            : token.count === 3 ? localeInfo.monthsShort[date.getMonth()]
                            : localeInfo.months[date.getMonth()];
                  break;
                case 'f': // 1-3
                  formatted = padLeft(Math.floor(date.getMilliseconds() * Math.pow(10, token.count - 3)), token.count, '0');
                  break;
                case 'F': // 1-3
                  formatted = padLeft(Math.floor(date.getMilliseconds() * Math.pow(10, token.count - 3)), token.count, '0');
                  formatted = formatted.replace(/0+$/, '') || '0'; // remove ending 0
                  break;
                case 'h': // 1-2
                  var hours = date.getHours();
                  formatted = padLeft(hours === 0 ? 12
                                : hours > 12 ? hours - 12
                                : hours,
                                  token.count,
                                  '0');
                  break;
                case 'H': // 1-2
                  formatted = padLeft(date.getHours(), token.count, '0');
                  break;
                case 'm': // 1-2
                  formatted = padLeft(date.getMinutes(), token.count, '0');
                  break;
                case 's': // 1-2
                  formatted = padLeft(date.getSeconds(), token.count, '0');
                  break;
                case 't': // 1-2
                  formatted = localeInfo.ampm[date.getHours() < 12 ? 0 : 1].substr(0, token.count);
                  break;
                case 'K': // 1
                  var tzMatch = date.toString().match(/\(.+\)/);
                  if (tzMatch) {
                    formatted = tzMatch[0].slice(1, -1);
                  } else {
                    tzOff = date.getTimezoneOffset();
                    tzSign = tzOff < 0 ? '-' : '+';

                    formatted = tzSign + padLeft(Math.floor(tzOff / 60), 2, '0') + ':' + padLeft(tzOff % 60, 2, '0');
                  }
                  break;
                case ':': // 1
                  formatted = ':';
                  break;
                case '/': // 1
                  formatted = '/';
                  break;
                case 'y': // 1-5
                  year = date.getFullYear();

                  formatted = year < 0 ? '-' : '';
                  year = Math.abs(year);

                  formatted += token.count > 2 ? padLeft(year, token.count, '0')
                             : padLeft(year % 100, token.count, '0');
                  break;
                case 'z': // 1-3
                  tzOff = date.getTimezoneOffset();
                  formatted = tzOff < 0 ? '-' : '+';
                  tzOff = Math.abs(tzOff);

                  formatted += padLeft(Math.floor(tzOff / 60), token.count, '0');

                  if (token.count === 3)
                    formatted += ':' + padLeft(tzOff % 60, 2, '0');
                  break;
                default:
                  formatted = token;
              }
            }

            if (!isNullOrUndefined(formatted) && formatted !== '')
              output.push(formatted);
          }

          return output.join('');
        }
      },
      {
        name: 'DefaultFormat',
        // TODO: use stringify
        // Use toString on values of type string, number, boolean, date or on values on which JSON.stringify fails,
        // else uses JSON.stringify
        argumentsRegexp: null, // All strings
        allowedTypes: null, // All types
        formatValue: function(value, type) {
          switch (type) {
            case 'string':
              return value;
            case 'number':
            case 'boolean':
            case 'date':
              return value.toString();
          }

          try {
            var json = JSON.stringify(value);

            return isNullOrUndefined(json) ? value.toString() : json;
          } catch (e) {
            return value.toString();
          }
        }
      }
    ]
  };

  // Formatter options
  //  [openChar]: character that opens a pattern, default '{'
  //  [closeChar]: character that closes a pattern, default '}'
  //  [locale]: locate to use, in the format en, en_US, en-US (case insensitive), default 'en'
  //  [valueFormatters]: addition formatters to use
  function InternalFormatter(options) {
    options = getDefault(options, {});

    this.openChar = getDefault(options.openChar, DEFAULT_OPTIONS.openChar);
    this.closeChar = getDefault(options.closeChar, DEFAULT_OPTIONS.closeChar);

    this.valueFormatters = getDefault(options.valueFormatters, []).concat(DEFAULT_OPTIONS.valueFormatters);

    this.localeInfo = getLocaleInfo(options.locale, DEFAULT_OPTIONS.localeInfo);

    this.templateCache = options.noCache ? null : {};

    var open = escapeRegExp(this.openChar); // Rx: /\{/
    var close = escapeRegExp(this.closeChar); // Rx: /\}/

    var escapedOpen = open + open; // Rx: /\{\{/
    var escapedClose = close + close; // Rx: /\}\}/

    var ident = '[a-zA-Z$_][a-zA-Z$_0-9]*';
    var integer = '[+-]?[0-9]+';

    var quoted1 = "'(?:[^']|'')*'"; // jshint ignore:line
    var quoted2 = '"(?:[^"]|"")*"';
    var quoted = '(?:' + quoted1 + '|' + quoted2 + ')';

    // Rx: /(?:ident|integer|quoted)/
    var key = '(?:' + ident + '|' + integer + '|' + quoted + ')';
    var dot = '(?:\\s*\\.\\s*)'; // Rx: /(?:\s\.\s)/

    // Rx: /(?:dot?key(?:dotkey)*)?/
    var selector = '(?:' + dot + '?' + key + '(?:' + dot + key + ')*)?';

    // Rx: /(?:,[+-]?[0-9]+)?/
    var alignement = '(?:,[+-]?[0-9]+)?';

    // Rx: /(?::(?:[^{}]|\{\{|\}\})+)?/
    var format = '(?::(?:[^' + open + close + ']|' + escapedOpen + '|' + escapedClose + ')+)?';

    var expression = open + '\\s*' + selector + '\\s*' + alignement + '\\s*' + format + '\\s*' + close;
    var exprCapturing = open + '\\s*(' + selector + ')\\s*(' + alignement + ')\\s*(' + format + ')\\s*' + close;

    this.expressionRx = new RegExp(exprCapturing);
    this.keyRx = new RegExp(key, 'g');

    var token = '(' + escapedOpen + '|' + escapedClose + '|' + expression + ')';

    this.tokenRx = new RegExp(token, 'g');
  }

  // Parse the selector and returns:
  //  selector: list of the keys
  //  isProperty: flag to check if the input is a property
  InternalFormatter.prototype.ParseSelector = function(selectorString) {
    selectorString = trim(selectorString || '');

    if (selectorString === '') {
      return {
        selector: [],
        isProperty: false
      };
    }

    var selector = selectorString.match(this.keyRx) || [];
    for (var i = 0; i < selector.length; i++) {
      selector[i] = trim(selector[i]);

      if (/^[0-9+-]/.test(selector[i])) // number
        selector[i] = parseInt(selector[i], 10);
      else if (/^['"]/.test(selector[i])) // quoted string
        selector[i] = unquoteString(selector[i]);
    }

    var isProperty = (selectorString.charAt(0) === '.' || typeof selector[0] === 'string');

    return {
      selector: selector,
      isProperty: isProperty
    };
  };

  // Parse the alignement and return the value (default 0)
  InternalFormatter.prototype.ParseAlignement = function(alignement) {
    if (isNullOrUndefined(alignement) || alignement === '')
      return 0;

    return parseInt(alignement.slice(1), 10); // remove the ','
  };

  // Parse the format and returns the formatters compatible with it
  InternalFormatter.prototype.ParseFormat = function(format) {
    format = (format || '').slice(1); // remove the ':'

    if (format === '')
      return [];

    format = format.replace(this.openChar + this.openChar, this.openChar);
    format = format.replace(this.closeChar + this.closeChar, this.closeChar);

    var possibleFormatters = [];

    for (var i = 0; i < this.valueFormatters.length; i++) {
      var formatter = this.valueFormatters[i];
      var match = formatter.argumentsRegexp ? format.match(formatter.argumentsRegexp) : [format];

      if (match) {
        var args = formatter.processMatch ? formatter.processMatch(match) : match;

        if (typeof args !== 'undefined') {
          possibleFormatters.push({
            formatter: formatter,
            formatArgs: args
          });
        }
      }
    }

    return possibleFormatters;
  };

  // Parse the expression
  InternalFormatter.prototype.ParseExpression = function(stringFormat) {
    var match = stringFormat.match(this.expressionRx); // Should always succeed

    var selector = this.ParseSelector(match[1]);

    return {
      selector: selector.selector,
      isProperty: selector.isProperty,
      alignement: this.ParseAlignement(match[2]),
      possibleFormatters: this.ParseFormat(match[3])
    };
  };

  // Parse the input string
  InternalFormatter.prototype.Parse = function(pattern) {
    if (!isNullOrUndefined(this.templateCache) && this.templateCache[pattern])
      return this.templateCache[pattern];

    // tokenize the string
    var tokens = pattern.split(this.tokenRx);
    var output = [];
    for (var i = 0; i < tokens.length; i++) {
      var token;

      // excaped openChar
      if (tokens[i] === this.openChar + this.openChar)
        token = this.openChar;
      // excaped closeChar
      else if (tokens[i] === this.closeChar + this.closeChar)
        token = this.closeChar;
      // expression
      else if (tokens[i].charAt(0) === this.openChar && tokens[i].slice(-1) === this.closeChar)
        token = this.ParseExpression(tokens[i]);
      // plain text
      else
        token = tokens[i];

      // concatenate all the consecutive plain texts together
      if (typeof output[output.length - 1] === 'string' && typeof token === 'string')
        output[output.length - 1] += token;
      else
        output.push(token);
    }

    var template = new InternalTemplate(output, this.localeInfo);

    if (this.templateCache !== null)
      this.templateCache[pattern] = template;

    return template;
  };

  // Template created by a format string
  function InternalTemplate(tokens, localeInfo) {
    this.tokens = tokens;
    this.localeInfo = localeInfo;
  }

  // Apply the template to the values
  InternalTemplate.prototype.ApplyArray = function(args) {
    var step = [0];

    var output = [];
    for (var i = 0; i < this.tokens.length; i++) {
      var token = this.tokens[i];

      var value = null;
      if (typeof token === 'string') {
        value = token;
      } else {
        value = this.ApplyExpression(args, token.selector, token.isProperty, step);
        value = this.ApplyFormat(value, token.possibleFormatters);
        value = this.ApplyAlignment(value, token.alignement);
      }

      if (!isNullOrUndefined(value) && value !== '')
        output.push(value);
    }

    return output.join('');
  };

  // Apply the expression to the value
  InternalTemplate.prototype.ApplyExpression = function(args, selector, isProperty, step) {
    var value;
    if (isProperty) {
      for (var j = 0; j < args.length; j++) {
        value = this.ApplyExpression(args[j], selector, false, step);

        if (typeof value !== 'undefined')
          return value;
      }

      return value;
    }

    // Pattern {} handling
    if (selector.length === 0) {
      value = this.ApplyExpression(args, step, false, step);
      step[0]++;
      return value;
    }

    value = args;
    for (var i = 0; i < selector.length; i++) {
      if (isNullOrUndefined(value))
        break;

      value = value[selector[i]];
    }

    return value;
  };

  // Apply the formatters to the value
  InternalTemplate.prototype.ApplyFormat = function(value, possibleFormatters) {
    if (isNullOrUndefined(value))
      return null;

    var type = getActualType(value);
    for (var i = 0; i < possibleFormatters.length; i++) {
      var formatter = possibleFormatters[i].formatter;
      if (isNullOrUndefined(formatter.allowedTypes) || contains(formatter.allowedTypes, type) !== -1) {
        var formatted = null;
        if (formatter.formatValue)
          formatted = formatter.formatValue(value, type, possibleFormatters[i].formatArgs, this.localeInfo);

        if (!isNullOrUndefined(formatted))
          return formatted;
      }
    }

    // should be unreachable
    return value.toString();
  };

  // Apply the alignment to the value
  InternalTemplate.prototype.ApplyAlignment = function(value, alignement) {
    return isNullOrUndefined(value) ? null
         : alignement === 0 ? value
         : alignement < 0 ? padRight(value, -alignement)
         : padLeft(value, alignement);
  };

  // Formatted object to be evaluated (with toString) lazily
  function LazyFormatted(template, args) {
    this._template = template;
    this._args = args;
  }

  // Format the object
  LazyFormatted.prototype.toString = function() {
    return this._template.ApplyArray(this._args);
  };

  // Public template object
  function Template(template) {
    this._template = template;
  }

  // Format the Template with the given arguments
  Template.prototype.arrange = function() {
    var args = ArraySlice.call(arguments, 0);
    return this._template.ApplyArray(args);
  };

  // Create a LazyFormatted object with the given arguments
  Template.prototype.lazy = function() {
    var args = ArraySlice.call(arguments, 0);
    return new LazyFormatted(this._template, args);
  };

  // Create a Formattable object with the given arguments
  function Formattable(formatter, args) {
    this._formatter = formatter;
    this._args = args;
  }

  // Format the Formattable with the given string
  Formattable.prototype.arrange = function(stringFormat) {
    return this._formatter.Parse(stringFormat).ApplyArray(this._args);
  };

  // Create a LazyFormatted object the given string
  Formattable.prototype.lazy = function(stringFormat) {
    return new LazyFormatted(this._formatter.Parse(stringFormat), this._args);
  };

  function createArrange(options) {
    var formatter = new InternalFormatter(options);

    var arrangeRef = function arrange(stringFormat) {
      var args = ArraySlice.call(arguments, 1);
      return formatter.Parse(stringFormat).ApplyArray(args);
    };

    // formatter reference for debug and testing
    arrangeRef._formatter = formatter;

    arrangeRef.newArrange = function(options) {
      return createArrange(options);
    };

    arrangeRef.lazy = function(stringFormat) {
      var args = ArraySlice.call(arguments, 1);
      return new LazyFormatted(formatter.Parse(stringFormat), args);
    };

    arrangeRef.template = function(stringFormat) {
      return new Template(formatter.Parse(stringFormat));
    };

    arrangeRef.formattable = function() {
      var args = ArraySlice.call(arguments, 0);
      return new Formattable(formatter, args);
    };

    return arrangeRef;
  }

  return createArrange();
})(this.arrange);
