import gulp from "gulp";

import sass from "gulp-sass-no-nodesass";

import webpack from "webpack";
import git from "git-last-commit";
import autoprefixer from "gulp-autoprefixer";
import replace from "gulp-replace";
import fs from "fs";
import svgmin from "gulp-svgmin";
import svgcss from "gulp-svg-css";
import rename from "gulp-rename";
import concat from "gulp-concat";
import sassCompiler from "sass";

import webpackConfig from "./webpack.config.js";
import webpackTalkerApiConfig from "./webpack.talkerapi.config.js";
import webpackLibsConfig from "./webpack.libs.config.js";

sass.compiler = sassCompiler;

let configLocation = "../cables_api/cables.json";
if (process.env.npm_config_apiconfig) configLocation = "../cables_api/cables_env_" + process.env.npm_config_apiconfig + ".json";

let analyze = false;
let isLiveBuild = false;
let minify = false;
let config = {};
if (fs.existsSync(configLocation))
{
    config = JSON.parse(fs.readFileSync(configLocation, "utf-8"));
    isLiveBuild = config.env === "live";
    minify = config.hasOwnProperty("minifyJs") ? config.minifyJs : false;
}

function _scripts_libs_ui(done)
{
    getBuildInfo((buildInfo) =>
    {
        webpack(webpackLibsConfig(isLiveBuild, buildInfo, minify, analyze), (err, stats) =>
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
        });
    });
}

function _scripts_talkerapi(done)
{
    getBuildInfo((buildInfo) =>
    {
        webpack(webpackTalkerApiConfig(isLiveBuild, buildInfo, minify, analyze), (err, stats) =>
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
        );
    });
}

function _scripts_core()
{
    return gulp
        .src(["../cables/build/**/*.*", "!../cables/build/libs/*", "!../cables/build/*.html"])
        .pipe(gulp.dest("dist/js/"));
}

function _scripts_ui_webpack(done)
{
    getBuildInfo((buildInfo) =>
    {
        webpack(webpackConfig(isLiveBuild, buildInfo, minify, analyze), (err, stats) =>
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
        });
    });
}

function getBuildInfo(cb)
{
    const date = new Date();
    git.getLastCommit((err, commit) =>
    {
        const buildInfo = {
            "timestamp": date.getTime(),
            "created": date.toISOString(),
            "git": {
                "branch": commit.branch,
                "commit": commit.hash,
                "date": commit.committedOn,
                "message": commit.subject
            }
        };
        fs.writeFile("./dist/buildinfo.json", JSON.stringify(buildInfo), () =>
        {
            cb(buildInfo);
        });
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
        .pipe(sass().on("error", sass.logError))
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
    const task = gulp
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
    if (!process.env.cables_electron || process.env.cables_electron === "false")
    {
        return task.pipe(gulp.dest("../cables_api/scss/"));
    }
    else
    {
        return task;
    }
}

function _watch(done)
{
    const watchOptions = { "usePolling": true, "ignored": (fileName) => { return fileName.includes("node_modules"); } };
    gulp.watch(["src/ui/**/*.js", "src/ui/*.js", "src/ui/**/*.json", "src/ui/**/*.frag", "src/ui/**/*.vert", "../shared/client/*.js", "../shared/client/**/*.js"], watchOptions, gulp.series(_scripts_ui_webpack));
    gulp.watch(["scss/**/*.scss", "scss/*.scss"], watchOptions, gulp.series(_sass));
    gulp.watch(["html/**/*.html", "html/*.html"], watchOptions, gulp.series(_html_ui));
    gulp.watch("../shared/client/src/talkerapi.js", watchOptions, gulp.series(_scripts_talkerapi));
    gulp.watch("libs/**/*", watchOptions, gulp.series(_scripts_libs_ui));
    gulp.watch("icons/**/*.svg", watchOptions, gulp.series(_svgcss));
    done();
}

function _analyze(done)
{
    analyze = true;
    done();
}

/*
 * -------------------------------------------------------------------------------------------
 * MAIN TASKS
 * -------------------------------------------------------------------------------------------
 */

const defaultSeries = gulp.series(
    _svgcss,
    _html_ui,
    _scripts_libs_ui,
    _scripts_core,
    _scripts_ui_webpack,
    _scripts_talkerapi,
    _sass,
);

/**
 * Run "gulp build"
 */
gulp.task("build", defaultSeries);
gulp.task("analyze", gulp.series(_analyze, defaultSeries));

/**
 * Default Task, for development
 * Run "gulp"
 */
gulp.task("default", gulp.series(
    defaultSeries,
    _watch
));

gulp.task("testui", gulp.series(
    _scripts_ui_webpack
));
