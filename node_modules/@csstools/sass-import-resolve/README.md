# Sass Import Resolve [<img src="https://jonathantneal.github.io/sass-import-resolve/sass-logo.svg" alt="Sass Logo" width="90" height="90" align="right">][Sass Import Resolve]

[![NPM Version][npm-img]][npm-url]
[![Linux Build Status][cli-img]][cli-url]
[![Windows Build Status][win-img]][win-url]
[![Gitter Chat][git-img]][git-url]

[Sass Import Resolve] resolves the path and contents of Sass imports, following
the [Sass Import Resolve Specification].

```sh
npm install @csstools/sass-import-resolve
```

## The Resolve Method

The `resolve` method takes any path and returns its absolute path, as
resolved by the [Sass Import Resolve Specification].

```js
import resolve from '@csstools/sass-import-resolve';

const { file } = resolve('path/to/sass-file');
```

The `resolve` method may also return the contents of the resolved file.

```js
const { file, contents } = resolve('path/to/sass-file', {
  readFile: true
});
```

The `resolve` method may also resolve the path from a specific directory.

```js
const { file } = resolve('sass-file', {
  cwd: 'path/to'
});
```

The `resolve` method may also share its resolved cache.

```js
const sharedCache = {};

const { file } = resolve('path/to/sass-file', {
  cache: sharedCache
});

/* sharedCache {
  "/absolute/path/to/sass-file": Promise {
    file,
    contents (when `readFile` is true)
  }
} */
```

## The Resolve Algorithm

When `@import` is called, the following high-level algorithm is used to resolve
the location of a file within `url(id)` from `cwd`:

1. if `id` begins with `/`
   1. `cwd` is the filesystem root
2. `file` is `cwd/id`
3. `base` is base path of `file`
4. `dir` is directory path of `file`
5. if `base` ends with `.sass`, `.scss`, or `.css`
   1. test whether `file` exists
   2. if `base` does not start with `_`
      1. test whether `dir/_base` exists
6. otherwise
   1. test whether `dir/base.scss` exists
   2. test whether `dir/base.sass` exists
   3. test whether `dir/base.css` exists
   4. if `base` does not start with `_`
      1. test whether `dir/_base.scss` exists
      2. test whether `dir/_base.sass` exists
      3. test whether `dir/_base.css` exists
6. if the length of existing files is `1`
   1. return the existing file
7. otherwise, if the length of existing files is greater than `1`
   1. throw `"It's not clear which file to import"`
8. otherwise, if `base` does not end with `.css`
   1. throw `"File to import not found or unreadable"`

See the [Sass Import Resolve Specification] for more details.

[Sass Import Resolve]: https://github.com/jonathantneal/sass-import-resolve
[Sass Import Resolve Specification]: https://jonathantneal.github.io/sass-import-resolve

[cli-url]: https://travis-ci.org/jonathantneal/sass-import-resolve
[cli-img]: https://img.shields.io/travis/jonathantneal/sass-import-resolve.svg
[git-url]: https://gitter.im/postcss/postcss
[git-img]: https://img.shields.io/badge/chat-gitter-blue.svg
[npm-url]: https://www.npmjs.com/package/@csstools/sass-import-resolve
[npm-img]: https://img.shields.io/npm/v/@csstools/sass-import-resolve.svg
[win-url]: https://ci.appveyor.com/project/jonathantneal/sass-import-resolve
[win-img]: https://img.shields.io/appveyor/ci/jonathantneal/sass-import-resolve.svg
