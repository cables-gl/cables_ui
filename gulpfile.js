import gulp from "gulp";

import sass from "gulp-sass-no-nodesass";

import webpack from "webpack";
import git from "git-last-commit";
import replace from "gulp-replace";
import fs from "fs";
import svgmin from "gulp-svgmin";
import svgcss from "gulp-svg-css";
import rename from "gulp-rename";
import concat from "gulp-concat";
import sassCompiler from "sass";
import path from "path";
import { BuildWatcher } from "cables-shared-client";
import webpackConfig from "./webpack.config.js";
import webpackTalkerApiConfig from "./webpack.talkerapi.config.js";
import webpackLibsConfig from "./webpack.libs.config.js";

sass.compiler = sassCompiler;

let configLocation = path.join("..", "gen", "cables.json");
if (process.env.npm_config_apiconfig) configLocation = path.join("..", "/cables_env_" + process.env.npm_config_apiconfig + ".json");

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

function _watch(done)
{
    const buildWatcher = new BuildWatcher(gulp, config, "ui");
    const watchOptions = { "ignored": (file) =>
    {
        const basename = path.basename(file);
        return file.includes("/node_modules/") || basename.startsWith(".");
    } };
    buildWatcher.watch([".git/HEAD"], watchOptions, gulp.series(_scripts_ui_webpack));
    buildWatcher.watch(["../cables/build/**/*.js"], { "queue": false, ...watchOptions }, gulp.series(_scripts_ui_webpack));
    buildWatcher.watch(["src/ui/**/*.js", "src/ui/**/*.json", "src/ui/**/*.frag", "src/ui/**/*.vert", "../shared/client/**/*.js", "../shared/shared_constants.json"], watchOptions, gulp.series(_scripts_ui_webpack));
    buildWatcher.watch(["scss/**/*.scss"], watchOptions, gulp.series(_sass));
    buildWatcher.watch(["html/**/*.html"], watchOptions, gulp.series(_html_ui));
    buildWatcher.watch("../shared/client/src/talkerapi.js", watchOptions, gulp.series(_scripts_talkerapi));
    buildWatcher.watch("libs/**/*", watchOptions, gulp.series(_scripts_libs_ui));
    buildWatcher.watch("icons/**/*.svg", watchOptions, gulp.series(_svgcss));
    done();
}

function _scripts_libs_ui(done)
{
    getBuildInfo((buildInfo) =>
    {
        webpack(webpackLibsConfig(isLiveBuild, buildInfo, minify, analyze, config.sourceMap), (err, stats) =>
        {
            if (err) done(err);
            if (stats.hasErrors())
            {
                done(new Error(getWebpackErrorMessage(stats)));
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
        webpack(webpackTalkerApiConfig(isLiveBuild, buildInfo, minify, analyze, config.sourceMap), (err, stats) =>
        {
            if (err) done(err);
            if (stats.hasErrors())
            {
                done(new Error(getWebpackErrorMessage(stats)));
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
        .src(["../cables/build/**/*.*", "!../cables/build/corelibs/*", "!../cables/build/*.html"])
        .pipe(gulp.dest("dist/js/"));
}

function _scripts_ui_webpack(done)
{
    getBuildInfo((buildInfo) =>
    {
        webpack(webpackConfig(isLiveBuild, buildInfo, minify, analyze, config.sourceMap), (err, stats) =>
        {
            if (err) done(err);
            if (stats.hasErrors())
            {
                const error = new Error(getWebpackErrorMessage(stats));
                delete error.stack;
                done(error);
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

function getWebpackErrorMessage(stats)
{
    let errorMessage = stats.compilation.errors.join("\n");
    const errorsWarnings = stats.toJson("errors-warnings");
    if (errorsWarnings && errorsWarnings.errors)
    {
        const modules = errorsWarnings.errors.filter((e) => { return !!e.moduleIdentifier; });
        if (modules && modules.length > 0)
        {
            modules.forEach((m) =>
            {
                const parts = m.moduleIdentifier.split("|");
                const filename = parts.length > 0 ? parts[1] : m.moduleIdentifier;
                const em = m.message.split("\n");
                errorMessage = "\n" + filename + ":" + m.loc + " - " + (em[0] || m.message) + "\n";
            });
        }
    }
    return errorMessage;
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

gulp.task("watch", gulp.series(
    defaultSeries,
    _watch
));

gulp.task("svgcss", _svgcss);

gulp.task("testui", gulp.series(
    _scripts_ui_webpack
));
