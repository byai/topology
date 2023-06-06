'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var postcss = require('postcss');
var postcss__default = _interopDefault(postcss);
var resolve = _interopDefault(require('@csstools/sass-import-resolve'));

// return the closest variable from a node
function getClosestVariable(name, node, opts) {
  const variables = getVariables(node);
  let variable = variables[name];

  if (requiresAncestorVariable(variable, node)) {
    variable = getClosestVariable(name, node.parent, opts);
  }

  if (requiresFnVariable(variable, opts)) {
    variable = getFnVariable(name, node, opts.variables);
  }

  return variable;
} // return the variables object of a node

const getVariables = node => Object(Object(node).variables); // return whether the variable should be replaced using an ancestor variable


const requiresAncestorVariable = (variable, node) => undefined === variable && node && node.parent; // return whether variable should be replaced using a variables function


const requiresFnVariable = (value, opts) => value === undefined && Object(opts).variables === Object(Object(opts).variables); // return whether variable should be replaced using a variables function


const getFnVariable = (name, node, variables) => 'function' === typeof variables ? variables(name, node) : variables[name];

function manageUnresolved(node, opts, word, message) {
  if ('warn' === opts.unresolved) {
    node.warn(opts.result, message, {
      word
    });
  } else if ('ignore' !== opts.unresolved) {
    throw node.error(message, {
      word
    });
  }
}

// tooling

function getReplacedString(string, node, opts) {
  const replacedString = string.replace(matchVariables, (match, before, name1, name2, name3) => {
    // conditionally return an (unescaped) match
    if (before === '\\') {
      return match.slice(1);
    } // the first matching variable name


    const name = name1 || name2 || name3; // the closest variable value

    const value = getClosestVariable(name, node.parent, opts); // if a variable has not been resolved

    if (undefined === value) {
      manageUnresolved(node, opts, name, `Could not resolve the variable "$${name}" within "${string}"`);
      return match;
    } // the stringified value


    const stringifiedValue = `${before}${stringify(value)}`;
    return stringifiedValue;
  });
  return replacedString;
} // match all $name, $(name), and #{$name} variables (and catch the character before it)

const matchVariables = /(.?)(?:\$([A-z][\w-]*)|\$\(([A-z][\w-]*)\)|#\{\$([A-z][\w-]*)\})/g; // return a sass stringified variable

const stringify = object => Array.isArray(object) ? `(${object.map(stringify).join(',')})` : Object(object) === object ? `(${Object.keys(object).map(key => `${key}:${stringify(object[key])}`).join(',')})` : String(object);

// tooling

function setVariable(node, name, value, opts) {
  // if the value is not a default with a value already defined
  if (!matchDefault.test(value) || getClosestVariable(name, node, opts) === undefined) {
    // the value without a default suffix
    const undefaultedValue = matchDefault.test(value) ? value.replace(matchDefault, '') : value; // ensure the node has a variables object

    node.variables = node.variables || {}; // set the variable

    node.variables[name] = undefaultedValue;
  }
} // match anything ending with a valid !default

const matchDefault = /\s+!default$/;

// tooling

function transformDecl(decl, opts) {
  // update the declaration value with its variables replaced by their corresponding values
  decl.value = getReplacedString(decl.value, decl, opts); // if the declaration is a variable declaration

  if (isVariableDeclaration(decl)) {
    // set the variable on the parent of the declaration
    setVariable(decl.parent, decl.prop.slice(1), decl.value, opts); // remove the declaration

    decl.remove();
  }
} // return whether the declaration property is a variable declaration

const isVariableDeclaration = decl => matchVariable.test(decl.prop); // match a variable ($any-name)


const matchVariable = /^\$[\w-]+$/;

// tooling

function transformAtrule(rule, opts) {
  // update the at-rule params with its variables replaced by their corresponding values
  rule.params = getReplacedString(rule.params, rule, opts);
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _toArray(arr) {
  return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

function getValueAsObject(value) {
  const hasWrappingParens = matchWrappingParens.test(value);
  const unwrappedValue = String(hasWrappingParens ? value.replace(matchWrappingParens, '$1') : value).replace(matchTrailingComma, '');
  const separatedValue = postcss.list.comma(unwrappedValue);
  const firstValue = separatedValue[0];

  if (firstValue === value) {
    return value;
  } else {
    const objectValue = {};
    const arrayValue = [];
    separatedValue.forEach((subvalue, index) => {
      const _ref = subvalue.match(matchDeclaration) || [],
            _ref2 = _slicedToArray(_ref, 3),
            match = _ref2[0],
            key = _ref2[1],
            keyvalue = _ref2[2];

      if (match) {
        objectValue[key] = getValueAsObject(keyvalue);
      } else {
        arrayValue[index] = getValueAsObject(subvalue);
      }
    });
    const transformedValue = Object.keys(objectValue).length > 0 ? Object.assign(objectValue, arrayValue) : arrayValue;
    return transformedValue;
  }
} // match wrapping parentheses ((), (anything), (anything (anything)))

const matchWrappingParens = /^\(([\W\w]*)\)$/g; // match a property name (any-possible_name)

const matchDeclaration = /^([\w-]+)\s*:\s*([\W\w]+)\s*$/; // match a trailing comma

const matchTrailingComma = /\s*,\s*$/;

var waterfall = ((items, asyncFunction) => items.reduce((lastPromise, item) => lastPromise.then(() => asyncFunction(item)), Promise.resolve()));

// tooling

function transformEachAtrule(rule, opts) {
  // if @each is supported
  if (opts.transform.indexOf('@each') !== -1) {
    // @each options
    const _getEachOpts = getEachOpts(rule, opts),
          varname = _getEachOpts.varname,
          incname = _getEachOpts.incname,
          list = _getEachOpts.list;

    const replacements = [];
    const ruleClones = [];
    Object.keys(list).forEach(key => {
      // set the current variable
      setVariable(rule, varname, list[key], opts); // conditionally set the incremenator variable

      if (incname) {
        setVariable(rule, incname, key, opts);
      } // clone the @each at-rule


      const clone = rule.clone({
        parent: rule.parent,
        variables: Object.assign({}, rule.variables)
      });
      ruleClones.push(clone);
    });
    return waterfall(ruleClones, clone => transformNode(clone, opts).then(() => {
      replacements.push(...clone.nodes);
    })).then(() => {
      // replace the @each at-rule with the replacements
      rule.parent.insertBefore(rule, replacements);
      rule.remove();
    });
  }
} // return the @each statement options (@each NAME in LIST, @each NAME ITERATOR in LIST)

const getEachOpts = (node, opts) => {
  const params = node.params.split(matchInOperator);
  const args = (params[0] || '').trim().split(' ');
  const varname = args[0].trim().slice(1);
  const incname = args.length > 1 && args[1].trim().slice(1);
  const rawlist = getValueAsObject(getReplacedString(params.slice(1).join(matchInOperator), node, opts));
  const list = 'string' === typeof rawlist ? [rawlist] : rawlist;
  return {
    varname,
    incname,
    list
  };
}; // match the opertor separating the name and iterator from the list


const matchInOperator = ' in ';

// tooling

function transformIfAtrule(rule, opts) {
  // @if options
  const isTruthy = isIfTruthy(rule, opts);
  const next = rule.next();

  const transformAndInsertBeforeParent = node => transformNode(node, opts).then(() => node.parent.insertBefore(node, node.nodes));

  return ifPromise(opts.transform.indexOf('@if') !== -1, () => ifPromise(isTruthy, () => transformAndInsertBeforeParent(rule)).then(() => {
    rule.remove();
  })).then(() => ifPromise(opts.transform.indexOf('@else') !== -1 && isElseRule(next), () => ifPromise(!isTruthy, () => transformAndInsertBeforeParent(next)).then(() => {
    next.remove();
  })));
}

const ifPromise = (condition, trueFunction) => Promise.resolve(condition && trueFunction()); // return whether the @if at-rule is truthy


const isIfTruthy = (node, opts) => {
  // @if statement options (@if EXPRESSION, @if LEFT OPERATOR RIGHT)
  const params = postcss.list.space(node.params);
  const left = getInterprettedString(getReplacedString(params[0] || '', node, opts));
  const operator = params[1];
  const right = getInterprettedString(getReplacedString(params[2] || '', node, opts)); // evaluate the expression

  const isTruthy = !operator && left || operator === '==' && left === right || operator === '!=' && left !== right || operator === '<' && left < right || operator === '<=' && left <= right || operator === '>' && left > right || operator === '>=' && left >= right;
  return isTruthy;
}; // return the value as a boolean, number, or string


const getInterprettedString = value => 'true' === value ? true : 'false' === value ? false : isNaN(value) ? value : Number(value); // return whether the node is an else at-rule


const isElseRule = node => Object(node) === node && 'atrule' === node.type && 'else' === node.name;

function transformImportAtrule(rule, opts) {
  // if @import is supported
  if (opts.transform.indexOf('@import') !== -1) {
    // @import options
    const _getImportOpts = getImportOpts(rule, opts),
          id = _getImportOpts.id,
          media = _getImportOpts.media,
          cwf = _getImportOpts.cwf,
          cwd = _getImportOpts.cwd; // PostCSS options


    const options = opts.result.opts;
    const parser = options.parser || options.syntax && options.syntax.parse || null;

    if (opts.importFilter instanceof Function && opts.importFilter(id, media) || opts.importFilter instanceof RegExp && opts.importFilter.test(id)) {
      const cwds = [cwd].concat(opts.importPaths); // promise the resolved file and its contents using the file resolver

      const importPromise = cwds.reduce((promise, thiscwd) => promise.catch(() => opts.importResolve(id, thiscwd, opts)), Promise.reject());
      return importPromise.then( // promise the processed file
      ({
        file,
        contents
      }) => processor.process(contents, {
        from: file,
        parser: parser
      }).then(({
        root
      }) => {
        // push a dependency message
        opts.result.messages.push({
          type: 'dependency',
          file: file,
          parent: cwf
        }); // imported nodes

        const nodes = root.nodes.slice(0); // if media params were detected

        if (media) {
          // create a new media rule
          const mediaRule = postcss__default.atRule({
            name: 'media',
            params: media,
            source: rule.source
          }); // append with the imported nodes

          mediaRule.append(nodes); // replace the @import at-rule with the @media at-rule

          rule.replaceWith(mediaRule);
        } else {
          // replace the @import at-rule with the imported nodes
          rule.replaceWith(nodes);
        } // transform all nodes from the import


        return transformNode({
          nodes
        }, opts);
      }), () => {
        // otherwise, if the @import could not be found
        manageUnresolved(rule, opts, '@import', `Could not resolve the @import for "${id}"`);
      });
    }
  }
}
const processor = postcss__default(); // return the @import statement options (@import ID, @import ID MEDIA)

const getImportOpts = (node, opts) => {
  const _list$space = postcss.list.space(node.params),
        _list$space2 = _toArray(_list$space),
        rawid = _list$space2[0],
        medias = _list$space2.slice(1);

  const id = getReplacedString(trimWrappingURL(rawid), node, opts);
  const media = medias.join(' '); // current working file and directory

  const cwf = node.source && node.source.input && node.source.input.file || opts.result.from;
  const cwd = cwf ? path.dirname(cwf) : opts.importRoot;
  return {
    id,
    media,
    cwf,
    cwd
  };
}; // return a string with the wrapping url() and quotes trimmed


const trimWrappingURL = string => trimWrappingQuotes(string.replace(/^url\(([\W\w]*)\)$/, '$1')); // return a string with the wrapping quotes trimmed


const trimWrappingQuotes = string => string.replace(/^("|')([\W\w]*)\1$/, '$2');

function transformIncludeAtrule(rule, opts) {
  // if @include is supported
  if (opts.transform.indexOf('@include') !== -1) {
    // @include options
    const _getIncludeOpts = getIncludeOpts(rule),
          name = _getIncludeOpts.name,
          args = _getIncludeOpts.args; // the closest @mixin variable


    const mixin = getClosestVariable(`@mixin ${name}`, rule.parent, opts); // if the @mixin variable exists

    if (mixin) {
      // set @mixin variables on the @include at-rule
      mixin.params.forEach((param, index) => {
        const arg = index in args ? getReplacedString(args[index], rule, opts) : param.value;
        setVariable(rule, param.name, arg, opts);
      }); // clone the @mixin at-rule

      const clone = mixin.rule.clone({
        original: rule,
        parent: rule.parent,
        variables: rule.variables
      }); // transform the clone children

      return transformNode(clone, opts).then(() => {
        // replace the @include at-rule with the clone children
        rule.parent.insertBefore(rule, clone.nodes);
        rule.remove();
      });
    } else {
      // otherwise, if the @mixin variable does not exist
      manageUnresolved(rule, opts, name, `Could not resolve the mixin for "${name}"`);
    }
  }
} // return the @include statement options (@include NAME, @include NAME(ARGS))

const getIncludeOpts = node => {
  // @include name and args
  const _node$params$split = node.params.split(matchOpeningParen, 2),
        _node$params$split2 = _slicedToArray(_node$params$split, 2),
        name = _node$params$split2[0],
        sourceArgs = _node$params$split2[1];

  const args = sourceArgs ? postcss.list.comma(sourceArgs.slice(0, -1)) : [];
  return {
    name,
    args
  };
}; // match an opening parenthesis


const matchOpeningParen = '(';

// tooling

function transformForAtrule(rule, opts) {
  // if @for is supported
  if (opts.transform.indexOf('@for') !== -1) {
    // @for options
    const _getForOpts = getForOpts(rule, opts),
          varname = _getForOpts.varname,
          start = _getForOpts.start,
          end = _getForOpts.end,
          increment = _getForOpts.increment;

    const direction = start <= end ? 1 : -1;
    const replacements = [];
    const ruleClones = []; // for each iteration

    for (let incrementor = start; incrementor * direction <= end * direction; incrementor += increment * direction) {
      // set the current variable
      setVariable(rule, varname, incrementor, opts); // clone the @for at-rule

      const clone = rule.clone({
        parent: rule.parent,
        variables: Object.assign({}, rule.variables)
      });
      ruleClones.push(clone);
    }

    return waterfall(ruleClones, clone => transformNode(clone, opts).then(() => {
      replacements.push(...clone.nodes);
    })).then(() => {
      // replace the @for at-rule with the replacements
      rule.parent.insertBefore(rule, replacements);
      rule.remove();
    });
  }
} // return the @for statement options (@for NAME from START through END, @for NAME from START through END by INCREMENT)

const getForOpts = (node, opts) => {
  const params = postcss.list.space(node.params);
  const varname = params[0].trim().slice(1);
  const start = Number(getReplacedString(params[2], node, opts));
  const end = Number(getReplacedString(params[4], node, opts));
  const increment = 6 in params && Number(getReplacedString(params[6], node, opts)) || 1;
  return {
    varname,
    start,
    end,
    increment
  };
};

function transformMixinAtrule(rule, opts) {
  // if @mixin is supported
  if (opts.transform.indexOf('@mixin') !== -1) {
    // @mixin options
    const _getMixinOpts = getMixinOpts(rule, opts),
          name = _getMixinOpts.name,
          params = _getMixinOpts.params; // set the mixin as a variable on the parent of the @mixin at-rule


    setVariable(rule.parent, `@mixin ${name}`, {
      params,
      rule
    }, opts); // remove the @mixin at-rule

    rule.remove();
  }
} // return the @mixin statement options (@mixin NAME, @mixin NAME(PARAMS))

const getMixinOpts = (node, opts) => {
  // @mixin name and default params ([{ name, value }, ...])
  const _node$params$split = node.params.split(matchOpeningParen$1, 2),
        _node$params$split2 = _slicedToArray(_node$params$split, 2),
        name = _node$params$split2[0],
        sourceParams = _node$params$split2[1];

  const params = sourceParams && sourceParams.slice(0, -1).trim() ? postcss.list.comma(sourceParams.slice(0, -1).trim()).map(param => {
    const parts = postcss.list.split(param, ':');
    const paramName = parts[0].slice(1);
    const paramValue = parts.length > 1 ? getReplacedString(parts.slice(1).join(':'), node, opts) : undefined;
    return {
      name: paramName,
      value: paramValue
    };
  }) : [];
  return {
    name,
    params
  };
}; // match an opening parenthesis


const matchOpeningParen$1 = '(';

// tooling

function transformRule(rule, opts) {
  // update the rule selector with its variables replaced by their corresponding values
  rule.selector = getReplacedString(rule.selector, rule, opts);
}

// tooling

function transformContentAtrule(rule, opts) {
  // if @content is supported
  if (opts.transform.indexOf('@content') !== -1) {
    // the closest @mixin at-rule
    const mixin = getClosestMixin(rule); // if the @mixin at-rule exists

    if (mixin) {
      // clone the @mixin at-rule
      const clone = mixin.original.clone({
        parent: rule.parent,
        variables: rule.variables
      }); // transform the clone children

      return transformNode(clone, opts).then(() => {
        // replace the @content at-rule with the clone children
        rule.parent.insertBefore(rule, clone.nodes);
        rule.remove();
      });
    } else {
      // otherwise, if the @mixin at-rule does not exist
      manageUnresolved(rule, opts, '@content', 'Could not resolve the mixin for @content');
    }
  }
} // return the closest @mixin at-rule

const getClosestMixin = node => 'atrule' === node.type && 'mixin' === node.name ? node : node.parent && getClosestMixin(node.parent);

// tooling
function transformNode(node, opts) {
  return waterfall(getNodesArray(node), child => transformRuleOrDecl(child, opts).then(() => {
    // conditionally walk the children of the attached child
    if (child.parent) {
      return transformNode(child, opts);
    }
  }));
}

function transformRuleOrDecl(child, opts) {
  return Promise.resolve().then(() => {
    const type = child.type;

    if ('atrule' === type) {
      const name = child.name.toLowerCase();

      if ('content' === name) {
        // transform @content at-rules
        return transformContentAtrule(child, opts);
      } else if ('each' === name) {
        // transform @each at-rules
        return transformEachAtrule(child, opts);
      } else if ('if' === name) {
        // transform @if at-rules
        return transformIfAtrule(child, opts);
      } else if ('import' === name) {
        return transformImportAtrule(child, opts);
      } else if ('include' === name) {
        // transform @include at-rules
        return transformIncludeAtrule(child, opts);
      } else if ('for' === name) {
        // transform @for at-rules
        return transformForAtrule(child, opts);
      } else if ('mixin' === name) {
        // transform mixin at-rules
        return transformMixinAtrule(child, opts);
      } else {
        // transform all other at-rules
        return transformAtrule(child, opts);
      }
    } else if ('decl' === type) {
      // transform declarations
      return transformDecl(child, opts);
    } else if ('rule' === type) {
      // transform rule
      return transformRule(child, opts);
    }
  });
} // return the children of a node as an array


const getNodesArray = node => Array.from(Object(node).nodes || []);

// tooling

var index = postcss__default.plugin('postcss-advanced-variables', opts => (root, result) => {
  // process options
  const transformOpt = ['@content', '@each', '@else', '@if', '@include', '@import', '@for', '@mixin'].filter(feature => !(String(Object(opts).disable || '').split(/\s*,\s*|\s+,?\s*|\s,?\s+/).indexOf(feature) !== -1));
  const unresolvedOpt = String(Object(opts).unresolved || 'throw').toLowerCase();
  const variablesOpt = Object(opts).variables;
  const importCache = Object(Object(opts).importCache);

  const importFilter = Object(opts).importFilter || (id => {
    return !matchProtocol.test(id);
  });

  const importPaths = [].concat(Object(opts).importPaths || []);

  const importResolve = Object(opts).importResolve || ((id, cwd) => resolve(id, {
    cwd,
    readFile: true,
    cache: importCache
  }));

  const importRoot = Object(opts).importRoot || process.cwd();
  return transformNode(root, {
    result,
    importCache,
    importFilter,
    importPaths,
    importResolve,
    importRoot,
    transform: transformOpt,
    unresolved: unresolvedOpt,
    variables: variablesOpt
  });
});
const matchProtocol = /^(?:[A-z]+:)?\/\//;

module.exports = index;
