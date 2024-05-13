import gulp from "gulp";

import sass from "gulp-sass-no-nodesass";

import compiler from "webpack";
import webpack from "webpack-stream";
import git from "git-last-commit";
import autoprefixer from "gulp-autoprefixer";
import replace from "gulp-replace";
import fs from "fs";
import svgmin from "gulp-svgmin";
import svgcss from "gulp-svg-css";
import sourcemaps from "gulp-sourcemaps";
import rename from "gulp-rename";
import gulpUglify from "gulp-uglify-es";
import concat from "gulp-concat";
import sassCompiler from "sass";

import webpackConfig from "./webpack.config.js";
import webpackTalkerApiConfig from "./webpack.talkerapi.config.js";

const uglify = gulpUglify.default;
sass.compiler = sassCompiler;

let configLocation = "../cables_api/cables.json";
if (process.env.npm_config_apiconfig) configLocation = "../cables_api/cables_env_" + process.env.npm_config_apiconfig + ".json";

let isLiveBuild = false;
let minify = false;
let config = {};
if (fs.existsSync(configLocation))
{
    config = JSON.parse(fs.readFileSync(configLocation, "utf-8"));
    isLiveBuild = config.env === "live";
    minify = config.hasOwnProperty("minifyJs") ? config.minifyJs : false;
}
else
{
    console.error("config file not found at", configLocation, "assuming local build (dev/no minify)");
}

function _scripts_libs_ui(done)
{
    let task = gulp.src(["libs/ui/*.js"]);

    if (minify) task = task.pipe(sourcemaps.init());
    task = task.pipe(concat("libs.ui.js")).pipe(gulp.dest("dist/js"));
    if (minify)
    {
        task = task.pipe(uglify());
        task = task.pipe(sourcemaps.write("./"));
    }

    return task.pipe(gulp.dest("dist/js"));
}

function _scripts_talkerapi(done)
{
    getBuildInfo((buildInfo) =>
    {
        return gulp.src(["src-talkerapi/talkerapi.js"])
            .pipe(
                webpack(
                    {
                        "config": webpackTalkerApiConfig(isLiveBuild, buildInfo, minify),
                    },
                    compiler,
                    (err, stats) =>
                    {
                        if (err) done(err);
                        if (stats.hasErrors())
                        {
                            done(new Error(stats.compilation.errors.join("\n")));
                        }
                        else
                        {
                            done();
                        }
                    }
                )
            )
            .pipe(gulp.dest("dist/js"))
            .on("error", (err) =>
            {
                console.error("WEBPACK ERROR NEU!!!!!!!", err);
                done(err);
            });
    });
}

function _scripts_core()
{
    return gulp
        .src(["../cables/build/**/*.*", "!../cables/build/buildinfo.json", "!../cables/build/libs/*"])
        .pipe(gulp.dest("dist/js/"));
}

function _scripts_ui_webpack(done)
{
    getBuildInfo((buildInfo) =>
    {
        return gulp.src(["src/ui/index.js"])
            .pipe(
                webpack(
                    {
                        "config": webpackConfig(isLiveBuild, buildInfo, minify),
                    },
                    compiler,
                    (err, stats) =>
                    {
                        if (err) done(err);
                        if (stats.hasErrors())
                        {
                            done(new Error(stats.compilation.errors.join("\n")));
                        }
                        else
                        {
                            done();
                        }
                    }
                )
            )
            .pipe(gulp.dest("dist/js"))
            .on("error", (err) =>
            {
                console.error("WEBPACK ERROR NEU!!!!!!!", err);
                done(err);
            });
    });
}

function getBuildInfo(cb)
{
    const date = new Date();
    git.getLastCommit((err, commit) =>
    {
        cb({
            "timestamp": date.getTime(),
            "created": date.toISOString(),
            "git": {
                "branch": commit.branch,
                "commit": commit.hash,
                "date": commit.committedOn,
                "message": commit.subject
            }
        });
    });
}

function _update_buildInfo(done)
{
    getBuildInfo((buildInfo) =>
    {
        fs.writeFileSync("./dist/buildinfo.json", JSON.stringify(buildInfo));
        done();
    });
}

function _html_ui(done)
{
    return gulp
        .src(["html/ui/header.html", "html/ui/templates/*.html", "html/ui/footer.html"])
        .pipe(concat("index.html"))
        .pipe(gulp.dest("dist/"));
}

function _sass(done)
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

function _svgcss(done)
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
        .pipe(gulp.dest("scss/"))
        .pipe(gulp.dest("../cables_api/scss/"));
}

function _watch(done)
{
    gulp.watch(["src/ui/**/*.js", "src/ui/*.js", "src/ui/**/*.json", "src/ui/**/*.frag", "src/ui/**/*.vert", "../shared/client/*.js", "../shared/client/**/*.js"], { "usePolling": true }, gulp.series(_update_buildInfo, _scripts_ui_webpack));
    gulp.watch(["scss/**/*.scss", "scss/*.scss"], { "usePolling": true }, gulp.series(_update_buildInfo, _sass));
    gulp.watch(["html/**/*.html", "html/*.html"], { "usePolling": true }, gulp.series(_update_buildInfo, _html_ui));
    gulp.watch("src-talkerapi/**/*", { "usePolling": true }, gulp.series(_update_buildInfo, _scripts_talkerapi));
    done();
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
    _update_buildInfo,
    _scripts_ui_webpack,
    _html_ui,
    _scripts_core,
    _scripts_libs_ui,
    _sass,
    _svgcss,
    _scripts_talkerapi,
    _watch
));

/**
 * Is this still used?
 * Run "gulp build"
 */
gulp.task("build", gulp.series(
    _update_buildInfo,
    _svgcss,
    _html_ui,
    _scripts_libs_ui,
    _scripts_core,
    _scripts_ui_webpack,
    _scripts_talkerapi,
    _sass,
));

gulp.task("testui", gulp.series(
    _scripts_ui_webpack
));
