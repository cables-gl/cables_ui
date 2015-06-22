var gulp = require('gulp');


var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');


gulp.task('lint', function()
{
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('scripts_libs', function()
{
    return gulp.src(['libs/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('libs.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('libs.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts_core', function()
{
    return gulp.src(['src/core/*.js','src/ops/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('cables_max.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('cables.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts_ui', function()
{
    return gulp.src(['src/ui/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('cablesui.max.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('cablesui.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
.on('error', gutil.log)
        .pipe(gulp.dest('dist/js'));

});


gulp.task('html_ui', function() {
    return gulp.src(['html/ui/header.html','html/ui/templates/*.html','html/ui/footer.html'])
        .pipe(concat('index.html'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('sass', function() {
    return gulp.src('scss/*.scss')
        .pipe(sass())
        .pipe(rename('ui.css'))
        .pipe(gulp.dest('dist/css'));
});


gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['scripts_core','scripts_ui']);
    gulp.watch('scss/*.scss', ['sass']);
    gulp.watch('html/**/*.html', ['html_ui']);
});


gulp.task('default', ['lint','html_ui','scripts_core','scripts_libs','scripts_ui','sass','watch']);
