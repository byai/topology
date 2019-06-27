const gulp = require('gulp');
const less = require('gulp-less');
const concat = require('gulp-concat');
const replace = require('gulp-replace');

gulp.task('less', async function () {
    return gulp.src('./src/lib/**/*.less')
        .pipe(concat('index.css'))
        .pipe(less())
        .pipe(gulp.dest('./dist/lib'));
});

gulp.task('remove-less-require', async function () {
    gulp.src('./dist/lib/**/*.js')
        .pipe(replace(/import\s*'(.*)\.less';/, function(match, p1, offset, string) {
            return '';
        }))
        .pipe(gulp.dest('./dist/lib'));
});

gulp.task('default', gulp.parallel('remove-less-require', 'less'));