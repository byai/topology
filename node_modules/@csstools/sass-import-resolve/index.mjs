import { readFile, stat } from 'fs';
import { basename, dirname, join } from 'path';

/* Resolve the absolute path of a file in Sass
/* ========================================================================== */

export default function resolve(id, rawopts) {
	const opts = Object.assign({
		cache: {},
		cwd: process.cwd(),
		readFile: false
	}, rawopts);

	// if `id` starts with `/`
	if (starts_with_root(id)) {
		// `cwd` is the filesystem root
		opts.cwd = '';
	}

	// `file` is `cwd/id`
	const file = join(opts.cwd, id);

	// `base` is the last segment path of `file`
	const base = basename(file);

	// `dir` is all but the last segment path of `file`
	const dir = dirname(file);

	const tests = [];

	// if `base` ends with `.sass`, `.scss`, or `.css`
	if (ends_with_sass_extension(base) || ends_with_css_extension(base)) {
		// test whether `file` exists
		tests.push(test_file(file, opts));

		// if `base` does not start with `_`
		if (!starts_with_partial(base)) {
			// test whether `dir/_base` exists
			tests.push(test_file(join(dir, `_${base}`), opts));
		}
	} else {
		// otherwise
		tests.push(
			// test whether `dir/base.scss` exists
			test_file(join(dir, `${base}.scss`), opts),
			// test whether `dir/base.sass` exists
			test_file(join(dir, `${base}.sass`), opts),
			// test whether `dir/base.css` exists
			test_file(join(dir, `${base}.css`), opts)
		);

		// if `base` does not start with `_`
		if (!starts_with_partial(base)) {
			tests.push(
				// test whether `dir/_base.scss` exists
				test_file(join(dir, `_${base}.scss`), opts),
				// test whether `dir/_base.sass` exists
				test_file(join(dir, `_${base}.sass`), opts),
				// test whether `dir/_base.css` exists
				test_file(join(dir, `_${base}.css`), opts)
			);
		}
	}

	return Promise.all(tests).then(
		test => test.filter(result => result)
	).then(files => {
		// if the length of existing files is `1`
		if (files.length === 1) {
			// return the existing file
			return files[0];
		}

		// otherwise, if the length of existing files is greater than `1`
		if (files.length > 1) {
			// throw `"It's not clear which file to import"`
			throw new Error('It\'s not clear which file to import');
		}

		// otherwise, if `base` does not end with `.css`
		if (!ends_with_css_extension(base)) {
			// throw `"File to import not found or unreadable"`
			throw new Error('File to import not found or unreadable');
		}
	});
}

/* Additional tooling
/* ========================================================================== */

function test_file(file, opts) {
	opts.cache[file] = opts.cache[file] || new Promise(resolvePromise => {
		if (opts.readFile) {
			readFile(file, 'utf8', (error, contents) => {
				if (error) {
					resolvePromise(false);
				} else {
					resolvePromise({
						file,
						contents
					});
				}
			});
		} else {
			stat(file, (error, stats) => {
				if (error || !stats.isFile()) {
					resolvePromise(false);
				} else {
					resolvePromise({
						file
					});
				}
			});
		}
	});

	return opts.cache[file];
}

function starts_with_root(id) {
	return /^\//.test(id);
}

function starts_with_partial(base) {
	return /^_/.test(base);
}

function ends_with_css_extension(base) {
	return /\.css$/i.test(base);
}

function ends_with_sass_extension(base) {
	return /\.s[ac]ss$/i.test(base);
}
