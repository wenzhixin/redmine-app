var fs = require('fs'),
    gulp = require('gulp'),
    del = require('del'),
    minifyHTML = require('gulp-minify-html'),
    cssimport = require('gulp-cssimport'),
    minifyCSS = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    concatScript = require('gulp-concat-script'),
    uglify = require('gulp-uglify'),
    bless = require('gulp-bless'),
    target = 'redmine-app';

gulp.task('clean', function(cb) {
    del([target], cb);
});

gulp.task('copy', ['clean'], function () {
    gulp.src('manifest.json')
        .pipe(gulp.dest(target));

    gulp.src('icon*.png')
        .pipe(gulp.dest(target));
});

gulp.task('html', ['clean'], function () {
    gulp.src('index.html')
        .pipe(minifyHTML())
        .pipe(gulp.dest(target));
});

gulp.task('css', ['clean'], function () {
    gulp.src('css/app.css')
        .pipe(cssimport())
        .pipe(minifyCSS())
        .pipe(bless())
        .pipe(gulp.dest(target + '/css/'));
});

gulp.task('js', ['clean'], function () {
    gulp.src('js/background.js')
        .pipe(uglify())
        .pipe(gulp.dest(target + '/js'));

    gulp.src('js/app.js')
        .pipe(concatScript())
        .pipe(uglify())
        .pipe(gulp.dest(target + '/js'));
});

gulp.task('default', ['copy', 'html', 'css', 'js']);