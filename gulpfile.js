const gulp = require("gulp");
const jshint = require("gulp-jshint");
const sass = require("gulp-sass-no-nodesass");
sass.compiler = require("sass");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const svgcss = require("gulp-svg-css");
const svgmin = require("gulp-svgmin");
const fs = require("fs");
const replace = require("gulp-replace");
const autoprefixer = require("gulp-autoprefixer");
const getRepoInfo = require("git-repo-info");
const webpack = require("webpack-stream");
const compiler = require("webpack");
const webpackConfig = require("./webpack.config");

let configLocation = "../cables_api/cables.json";
if (process.env.npm_config_apiconfig) configLocation = "../cables_api/cables_env_" + process.env.npm_config_apiconfig + ".json";

let isLiveBuild = false;
if (fs.existsSync(configLocation))
{
    const config = JSON.parse(fs.readFileSync(configLocation, "utf-8"));
    isLiveBuild = config.env === "live";
}
else
{
    console.error("config file not found at", configLocation, "forcing dev build");
}



let buildInfo = getBuildInfo();

function _scripts_libs_ui(done)
{
    let task = gulp.src(["libs/ui/*.js"]);
    if (isLiveBuild) task = task.pipe(sourcemaps.init());
    task = task.pipe(concat("libs.ui.js")).pipe(gulp.dest("dist/js")).pipe(rename("libs.ui.min.js"));
    if (isLiveBuild) task = task.pipe(uglify()).pipe(sourcemaps.write("./"));
    return task.pipe(gulp.dest("dist/js"));
}

function _scripts_talkerapi(done)
{
    let task = gulp.src(["src-talkerapi/*.js"]);
    if (isLiveBuild) task = task.pipe(sourcemaps.init());
    task = task.pipe(concat("talkerapi.js")).pipe(gulp.dest("dist/js")).pipe(rename("talkerapi.js"));
    if (isLiveBuild) task = task.pipe(uglify()).pipe(sourcemaps.write("./"));
    return task.pipe(gulp.dest("dist/js"));
}

function _scripts_core()
{
    return gulp
        .src(["../cables/build/**/*.*", "!../cables/build/buildInfo.json", "!../cables/build/libs/*"])
        .pipe(gulp.dest("dist/js/"));
}

function _scripts_ui_webpack(done)
{
    return gulp.src(["src/ui/index.js"])
        .pipe(
            webpack(
                {
                    "config": webpackConfig(isLiveBuild, buildInfo),
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
}

function getBuildInfo()
{
    const git = getRepoInfo();
    const date = new Date();
    return {
        "timestamp": date.getTime(),
        "created": date.toISOString(),
        "git": {
            "branch": git.branch,
            "commit": git.sha,
            "date": git.committerDate,
            "message": git.commitMessage
        }
    };
}

function _update_buildInfo(done)
{
    buildInfo = getBuildInfo();
    fs.writeFileSync("./dist/buildInfo.json", JSON.stringify(buildInfo));
    done();
}

function _html_ui(done)
{
    return gulp
        .src(["html/ui/header.html", "html/ui/templates/*.html", "html/ui/footer.html"])
        .pipe(concat("index.html"))
        .pipe(gulp.dest("dist/"));
}

function _cleanup_scripts(done)
{
    if (isLiveBuild)
    {
        console.log("live build: deleting map/max files...");
        const filesToDelete = [
            "./dist/js/stats.json",
            "./dist/js/cablesui.min.js.map",
            "./dist/js/talkerapi.js.map",
            "./dist/js/cables.min.js.map",
            "./dist/js/libs.ui.min.js.map",
            "./dist/js/libs.core.min.js.map",
            "./dist/js/babel.cables.min.js.map"
        ];
        filesToDelete.forEach((file) =>
        {
            if (fs.existsSync(file))
            {
                console.log("   deleting", file);
                fs.unlinkSync(file);
            }
            const jsFile = file.slice(0, -4);
            if (file.endsWith(".map") && fs.existsSync(jsFile))
            {
                let js = fs.readFileSync(jsFile, "utf-8");
                const mapping = "# sourceMappingURL=";
                js = js.replaceAll(mapping, "# originalSourceMappingURL=");
                fs.writeFileSync(jsFile, js, { "encoding": "utf-8" });
            }
        });
    }
    done();
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
    gulp.watch(["src/ui/**/*.js", "src/ui/*.js", "src/ui/**/*.json", "src/ui/**/*.frag", "src/ui/**/*.vert"], { "usePolling": true }, gulp.series(_update_buildInfo, _scripts_ui_webpack));
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
    _cleanup_scripts,
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
    _cleanup_scripts,
    _sass,
));

gulp.task("testui", gulp.series(
    _scripts_ui_webpack
));
