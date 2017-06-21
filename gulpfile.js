var gulp = require('gulp');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var fs = require("fs");
var browserify = require('browserify');
var vueify = require('vueify');

gulp.task('vueify', function() {
  browserify('vue-src/main.js')
    .transform(vueify)
    .bundle()
    .pipe(fs.createWriteStream("dist/js/bundle.js"));
});

gulp.task('lint', function()
{
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('scripts_libs_ui', function()
{
    return gulp.src(['libs/ui/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('libs.ui.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('libs.ui.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts_libs_core', function()
{
    return gulp.src(['libs/core/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('libs.core.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('libs.core.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts_core', function()
{
    return gulp.src(['../cables/src/core/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('cables.max.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('cables.min.js'))
        .pipe(uglify())
        .on('error', function(){ console.log('error.....'); })

        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});


gulp.task('scripts_ops', function()
{
    return gulp.src(['src/ops/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('cables.ops.max.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('cables.ops.min.js'))
        .pipe(uglify())
        .on('error', function(){ console.log('error.....'); })

        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});


gulp.task('scripts_ui', function()
{
    return gulp.src(['src/ui/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('cablesui.max.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('cablesui.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});


gulp.task('html_ui', function() {
    return gulp.src(['html/ui/header.html','html/ui/templates/*.html','html/ui/footer.html'])
        .pipe(concat('index.html'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('sass', function() {
    return gulp.src('scss/style-dark.scss')
        .pipe(sass())
        .pipe(rename('style-dark.css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('sass-bright', function() {
    return gulp.src('scss/style-bright.scss')
        .pipe(sass())
        .pipe(rename('style-bright.css'))
        .pipe(gulp.dest('dist/css'));
});


gulp.task('watch', function() {
    gulp.watch('../cables/src/core/**/*.js', ['scripts_core']);
    gulp.watch('src/ops/**/*.js', ['scripts_ops']);
    gulp.watch('src/ui/**/*.js', ['scripts_ui']);
    gulp.watch('scss/*.scss', ['sass','sass-bright']);
    gulp.watch('html/**/*.html', ['html_ui']);
    gulp.watch('vue-src/**/*', ['vueify']);
});


gulp.task('default', ['scripts_ui','lint','html_ui','scripts_core','scripts_libs_ui','scripts_libs_core','scripts_ops','sass','sass-bright', 'vueify', 'watch']);
gulp.task('build', ['html_ui','scripts_core','scripts_libs_ui','scripts_libs_core','scripts_ops','scripts_ui','sass','sass-bright', 'vueify']);
