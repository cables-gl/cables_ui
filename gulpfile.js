const gulp = require("gulp");
const jshint = require("gulp-jshint");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const svgcss = require("gulp-svg-css");
const svgmin = require("gulp-svgmin");
const fs = require("fs");
const browserify = require("browserify");
const babelify = require("babelify");
const vueify = require("vueify-babel-7-support");
const replace = require("gulp-replace");
const autoprefixer = require("gulp-autoprefixer");
const merge = require("merge-stream");

function _vueify()
{
    return browserify("vue-src/main.js")
        .transform(vueify)
        .transform(babelify.configure({
            "presets": [
                "@babel/preset-env"
            ],
            "plugins": [
                "@babel/plugin-transform-runtime",
                "@babel/plugin-proposal-object-rest-spread"
            ]
        }))
        .bundle()
        .pipe(fs.createWriteStream("dist/js/bundle.js"));
}

function _lint()
{
    return gulp
        .src("src/**/*.js")
        .pipe(jshint())
        .pipe(jshint.reporter("default"));
}

function _scripts_libs_ui()
{
    return gulp
        .src(["libs/ui/*.js"])
        .pipe(sourcemaps.init())
        .pipe(concat("libs.ui.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(rename("libs.ui.min.js"))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist/js"));
}

function _scripts_talkerapi()
{
    return gulp
        .src(["src-talkerapi/*.js"])
        .pipe(sourcemaps.init())
        .pipe(concat("talkerapi.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(rename("talkerapi.js"))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist/js"));
}

function _scripts_core()
{
    return gulp
        .src(["../cables/build/**/*.*", "!../cables/build/libs/*"])
        .pipe(gulp.dest("dist/js/"));
}

function _scripts_ops()
{
    return gulp
        .src(["src/ops/*.js"])
        .pipe(sourcemaps.init())
        .pipe(concat("cables.ops.max.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(rename("cables.ops.min.js"))
        .pipe(uglify())
        .on("error", () =>
        {
            console.log("error.....");
        })

        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist/js"));
}

function _scripts_ui()
{
    return gulp
        .src(["src/ui/**/*.js"])
        .pipe(sourcemaps.init())
        .pipe(concat("cablesui.max.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(rename("cablesui.min.js"))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist/js"));
}

function _html_ui()
{
    return gulp
        .src(["html/ui/header.html", "html/ui/templates/*.html", "html/ui/footer.html"])
        .pipe(concat("index.html"))
        .pipe(gulp.dest("dist/"));
}

function _sass()
{
    return gulp
        .src("scss/style-dark.scss")
        .pipe(sass())
        .pipe(rename("style-dark.css"))
        .pipe(
            autoprefixer({
                "cascade": false,
            })
        )
        .pipe(gulp.dest("dist/css"));
}

function _svgcss()
{
    return gulp
        .src("icons/**/*.svg")
        .pipe(svgmin())
        .pipe(
            svgcss({
                "fileName": "icons",
                "cssPrefix": "icon-",
                "addSize": false,
            })
        )
        .pipe(replace("background-image", "mask"))
        .pipe(
            autoprefixer({
                "cascade": false,
            })
        )
        .pipe(rename("svgicons.scss"))
        .pipe(gulp.dest("scss/"));
}

function _electronapp()
{
    const copydist = gulp.src("dist/**/*.*").pipe(gulp.dest("dist-electron/"));
    const electronsrc = gulp.src("src-electron/**/*.*").pipe(gulp.dest("dist-electron/"));
    // var someOtherOperation = gulp.src('./assets').pipe(gulp.dest('out/assets'));
    return merge(copydist, electronsrc);
}

function _watch(cb)
{
    gulp.watch("../cables/build/**/*.js", gulp.series(_scripts_core));
    // gulp.watch("../cables/build/libs/**/*.js", ["scripts_core_libs"]);
    gulp.watch("src/ops/**/*.js", gulp.series(_scripts_ops));
    gulp.watch("src/ui/**/*.js", gulp.series(_scripts_ui)); // ,'electron' // electron broke the watch SOMEHOW
    gulp.watch("scss/**/*.scss", gulp.series(_sass));
    gulp.watch("html/**/*.html", gulp.series(_html_ui));
    gulp.watch("icons/**/*.svg", gulp.series(_svgcss));
    gulp.watch("vue-src/**/*", gulp.series(_vueify));
    gulp.watch("src-talkerapi/**/*", gulp.series(_scripts_talkerapi));
    cb();
}

function _electron_watch(cb)
{
    gulp.watch("../cables/src/core/build/**/*.js", gulp.series(_scripts_core));
    gulp.watch("src/ops/**/*.js", gulp.series(_scripts_ops));
    gulp.watch("src/ui/**/*.js", gulp.series(_scripts_ui, _electronapp));
    gulp.watch("scss/**/*.scss", gulp.series(_sass, _electronapp));
    gulp.watch("html/**/*.html", gulp.series(_html_ui));
    gulp.watch("icons/**/*.svg", gulp.series(_svgcss));
    gulp.watch("vue-src/**/*", gulp.series(_vueify));
    gulp.watch("src-electron/**/*", gulp.series(_electronapp));
    cb();
}

/*
 * -------------------------------------------------------------------------------------------
 * MAIN TASKS
 * -------------------------------------------------------------------------------------------
 */

/**
 * Default Task, for development
 * Run "gulp"
 */
gulp.task("default", gulp.series(
    _scripts_ui,
    _html_ui,
    _scripts_core,
    _scripts_libs_ui,
    _scripts_ops,
    _sass,
    _vueify,
    _svgcss,
    _scripts_talkerapi,
    _watch,
));

/**
 * Is this still used?
 * Run "gulp build"
 */
gulp.task("build", gulp.series(
    _svgcss,
    _html_ui,
    _scripts_libs_ui,
    _scripts_ops,
    _scripts_core,
    _scripts_ui,
    _scripts_talkerapi,
    _sass,
    _vueify
));

/**
 * Electron development
 * Run "gulp electron"
 */
gulp.task("electron", gulp.series(
    _svgcss,
    _scripts_ui,
    _lint,
    _html_ui,
    _scripts_libs_ui,
    _scripts_ops,
    _sass,
    _vueify,
    _electronapp,
    _electron_watch
));
