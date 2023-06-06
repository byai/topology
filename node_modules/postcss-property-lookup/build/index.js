'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _tcomb = require('tcomb');

var _tcomb2 = _interopRequireDefault(_tcomb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var plugin = 'postcss-property-lookup';
var lookupPattern = /@\(?([a-z-]+)\)?\b/g;

var LogLevel = _tcomb2.default.enums.of(['error', 'warn'], 'LogLevel');
var PluginOptions = _tcomb2.default.struct({
  logLevel: LogLevel
}, 'PluginOptions');

var defaultOptions = {
  logLevel: 'warn'
};

exports.default = _postcss2.default.plugin(plugin, propertyLookup);


function propertyLookup(options) {
  var _this = this;

  var errorContext = { plugin };
  options = new PluginOptions((0, _objectAssign2.default)({}, defaultOptions, options));

  var log = {
    warn(message, rule, result) {
      rule.warn(result, message);
    },
    error(message, rule) {
      throw rule.error(message, errorContext);
    }
  }[options.logLevel];

  if (!log) {
    throw new Error(`Invalid logLevel: ${options.logLevel}`);
  }

  return function (root, result) {
    root.walkRules(function (rule) {
      eachDecl(rule, function (decl) {
        if (decl.value.indexOf('@') === -1) {
          return;
        }
        decl.value = decl.value.replace(lookupPattern, resolveLookup.bind(_this, rule));
      });
    });

    function resolveLookup(rule, orig, prop) {
      var resolvedValue = closest(rule, prop);

      if (!resolvedValue) {
        log(`Unable to find property ${orig} in ${rule.selector}`, rule, result);
      }

      return resolvedValue;
    }

    function closest(container, prop) {
      if (!container) {
        return '';
      }
      var resolvedValue = void 0;

      eachDecl(container, function (decl) {
        if (decl.prop === prop) {
          resolvedValue = decl.value;
        }
      });

      // Ignore a reference to itself
      // e.g a {color: @color;}
      if (resolvedValue && resolvedValue.replace('@', '') === prop) {
        return '';
      }

      if (!resolvedValue) {
        return closest(container.parent, prop);
      }

      if (resolvedValue.indexOf('@') === -1) {
        return resolvedValue;
      }

      return resolvedValue.replace(lookupPattern, resolveLookup.bind(this, container));
    }
  };
}

function eachDecl(container, callback) {
  container.each(function (node) {
    if (node.type === 'decl') {
      callback(node);
    }
    // Recurse through child declarations of a media rule
    if (node.type === 'atrule') {
      eachDecl(node, callback);
    }
  });
}
module.exports = exports['default'];