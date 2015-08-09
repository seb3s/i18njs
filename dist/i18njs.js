(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.i18njs = f()}})(function(){var define,module,exports;
var noMatch = /(.)^/;
var escaperRegEx = /\\|'|\r|\n|\u2028|\u2029/g;
var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
};
var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};

var createEscaper = function (map) {
    'use strict';
    var escaper = function(match) {
        return map[match];
    };

    var source = '(?:' + Object.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');

    return function(string) {
        string = string == null ? '' : '' + string;

        return testRegexp.test(string) ?
            string.replace(replaceRegexp, escaper) : string;
    };
};

var escapeChar = function (match) {
    'use strict';
    return '\\' + escapes[match];
};

var template = function (text, settings) {
    'use strict';
    var index = 0;
    var source = "__p+='";

    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    text.replace(matcher,
        function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset)
                .replace(escaperRegEx, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" +
                    escape + "))==null?'':_.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" +
                    interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            return match;
        }
    );

    source += "';\n";
    source = 'with(obj||{}){\n' + source + '}\n';
    source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + 'return __p;\n';

    try {
        var render = new Function('obj', '_', source);
    } catch (e) {
        e.source = source;

        throw e;
    }

    var tmpl = function (data) {
        return render.call(this, data, {
            escape: createEscaper(escapeMap)
        });
    };

    // Create the source as a string
    // to be able to write it in the requirejs plugin
    tmpl.source = 'function (data) {\n    return ' +
        render.toString() +
    '.call(this, data, {\n    escape:' +
        createEscaper.toString() +
    '.call(this, { \'&\': \'&amp;\', \'<\': \'&lt;\', \'>\': \'&gt;\',' +
        '\'"\': \'&quot;\', "\'": \'&#x27;\',\'`\': \'&#x60;\'}' +
    ')})}';

    return tmpl;
};
/*globals template*/
var parse = function (key, obj) {
    'use strict';
    var ar = key.split('.');

    while (obj && ar.length) {
        obj = obj[ar.shift()];
    }

    return obj;
};

var I18n = function () {
    'use strict';
    // PRIVATES
    var localLang = 'en';
    var dico = {};
    var defaults = {};
    var evaluate = /\{\{([\s\S]+?)\}\}/g;
    var interpolate = /\{\{=([\s\S]+?)\}\}/g;
    var escape = /\{\{-([\s\S]+?)\}\}/g;

    this.add = function (lang, ns, locales) {
        var i;
        var obj;

        dico[lang] = dico[lang] || {};

        if (locales === undefined) {
            locales = ns;
            ns = undefined;
            obj = dico[lang];
        } else {
            dico[lang][ns] = dico[lang][ns] || {};
            obj = dico[lang][ns];
        }

        for (i in locales) {
            if (locales.hasOwnProperty(i)) {
                obj[i] = locales[i];
            }
        }
    };

    this.has = function (key, lang) {
        lang = lang || localLang;

        var keyToParse = lang + '.' + key;

        // Check for the lang
        if (dico[key]) {
            return true;
        }

        // Check for the key and lang
        return parse(keyToParse, dico) ? true : false;
    };

    this.listLangs = function () {
        var langs = [];

        for (var i in dico) {
            langs.push(i);
        }

        return langs;
    };

    this.getCurrentLang = function () {
        return localLang;
    };

    this.getDico = function () {
        return dico;
    };

    this.setLang = function (lang) {
        localLang = lang;
        return localLang;
    };

    this.setDefaults = function (options) {
        defaults = options || {};
    };

    this.get = function (key, data, options, lang) {
        var lng = lang || localLang;

        if (lang === undefined) {
            if (typeof data === 'string') {
                lng = data;
                data = undefined;
            } else if (typeof options === 'string') {
                lng = options;
            }
        }

        var obj = parse(lng + '.' + key, dico);

        options = options || {};

        if (typeof obj === 'string' || typeof obj === 'function') {
            var i;
            var settings = {
                evaluate: options.evaluate || evaluate,
                interpolate: options.interpolate || interpolate,
                escape: options.escape || escape
            };
            var newDatas = {};
            var defs = defaults[localLang] || defaults;

            for (i in defs) {
                if (defs.hasOwnProperty(i)) {
                    newDatas[i] = defs[i];
                }
            }

            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    newDatas[i] = data[i];
                }
            }

            if (typeof obj !== 'function' && typeof template === 'function') {
                obj = template(obj, settings);
            }

            return obj(newDatas);
        } else if (typeof obj === 'object') {
            return obj;
        }

        return key;
    };
};

return new I18n();

});