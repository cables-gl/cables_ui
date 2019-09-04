var gulp = require("gulp");
var jshint = require("gulp-jshint");
var sass = require("gulp-sass");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify-es").default;
var rename = require("gulp-rename");
var sourcemaps = require("gulp-sourcemaps");
var svgcss = require("gulp-svg-css");
var svgmin = require("gulp-svgmin");
var fs = require("fs");
var browserify = require("browserify");
var babelify = require("babelify");
var vueify = require("vueify");
var replace = require("gulp-replace");
var autoprefixer = require("gulp-autoprefixer");
var merge = require("merge-stream");

// var notifier = require('node-notifier');

gulp.task("vueify", () =>
{
    browserify("vue-src/main.js")
        .transform(vueify)
        .transform(babelify)
        .bundle()
        .pipe(fs.createWriteStream("dist/js/bundle.js"));
});

gulp.task("lint", () =>
    gulp
        .src("src/**/*.js")
        .pipe(jshint())
        .pipe(jshint.reporter("default")));

gulp.task("scripts_libs_ui", () =>
    gulp
        .src(["libs/ui/*.js"])
        .pipe(sourcemaps.init())
        .pipe(concat("libs.ui.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(rename("libs.ui.min.js"))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist/js")));

gulp.task("scripts_talkerapi", () =>
    gulp
        .src(["src-talkerapi/*.js"])
        .pipe(sourcemaps.init())
        .pipe(concat("talkerapi.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(rename("libs.ui.min.js"))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist/js")));

gulp.task("scripts_core", () =>
{
    gulp
        .src("../cables/build/**/*.*").pipe(gulp.dest("dist/js/"));
});


// gulp.task('scripts_libs_core', function()
// {
//     return gulp.src(['libs/core/*.js'])
//         .pipe(sourcemaps.init())
//         .pipe(concat('libs.core.js'))
//         .pipe(gulp.dest('dist/js'))
//         .pipe(rename('libs.core.min.js'))
//         .pipe(uglify())
//         .pipe(sourcemaps.write('./'))
//         .pipe(gulp.dest('dist/js'));
// });

// gulp.task('scripts_core', function()
// {
//     return gulp.src(["../cables/src/index.js"])
//     .pipe(
//         webpack(
//             {
//                 config: require("../cables/webpack.config.js"),
//             },
//             compiler,
//             (err, stats) =>
//             {
//                 if (err) throw err;
//                 if (stats.hasErrors())
//                 {
//                     return reject(new Error(stats.compilation.errors.join("\n")));
//                 }
//             },
//         ),
//     )

//     .pipe(gulp.dest("dist/js"))
//     .on("error", (err) =>
//     {
//         console.error("WEBPACK ERROR", err);
//     });

//     // return gulp.src(['../cables/src/core/*.js'])
//     //     .pipe(sourcemaps.init())
//     //     .pipe(concat('cables.max.js'))
//     //     .pipe(gulp.dest('dist/js'))
//     //     .pipe(rename('cables.min.js'))
//     //     .pipe(uglify())
//     //     // .on('error', function(error){ console.log(`gulp error: ${error}`); notifier.notify(error);  })

//     //     .pipe(sourcemaps.write('./'))
//     //     .pipe(gulp.dest('dist/js'));
// });

gulp.task("scripts_ops", () =>
    gulp
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
        .pipe(gulp.dest("dist/js")));

gulp.task("scripts_ui", () =>
    gulp
        .src(["src/ui/**/*.js"])
        .pipe(sourcemaps.init())
        .pipe(concat("cablesui.max.js"))
        .pipe(gulp.dest("dist/js"))
        .pipe(rename("cablesui.min.js"))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("dist/js")));

gulp.task("html_ui", () =>
    gulp
        .src(["html/ui/header.html", "html/ui/templates/*.html", "html/ui/footer.html"])
        .pipe(concat("index.html"))
        .pipe(gulp.dest("dist/")));

gulp.task("sass", () =>
    gulp
        .src("scss/style-dark.scss")
        .pipe(sass())
        .pipe(rename("style-dark.css"))
        .pipe(
            autoprefixer({
                browsers: ["last 2 versions"],
                cascade: false,
            })
        )
        .pipe(gulp.dest("dist/css")));

gulp.task("svgcss", () =>
    gulp
        .src("icons/**/*.svg")
        .pipe(svgmin())
        .pipe(
            svgcss({
                fileName: "icons",
                cssPrefix: "icon-",
                addSize: false,
            })
        )
        .pipe(replace("background-image", "mask"))
        .pipe(
            autoprefixer({
                browsers: ["last 2 versions"],
                cascade: false,
            })
        )
        .pipe(rename("svgicons.scss"))
        .pipe(gulp.dest("scss/")));

gulp.task("electronapp", () =>
{
    var copydist = gulp.src("dist/**/*.*").pipe(gulp.dest("dist-electron/"));
    var electronsrc = gulp.src("src-electron/**/*.*").pipe(gulp.dest("dist-electron/"));
    // var someOtherOperation = gulp.src('./assets').pipe(gulp.dest('out/assets'));
    return merge(copydist, electronsrc);
});

gulp.task("watch", () =>
{
    gulp.watch("../cables/build/**/*.js", ["scripts_core"]);
    gulp.watch("src/ops/**/*.js", ["scripts_ops"]);
    gulp.watch("src/ui/**/*.js", ["scripts_ui"]); // ,'electron' // electron broke the watch SOMEHOW
    gulp.watch("scss/**/*.scss", ["sass"]);
    gulp.watch("html/**/*.html", ["html_ui"]);
    gulp.watch("icons/**/*.svg", ["svgcss"]);
    gulp.watch("vue-src/**/*", ["vueify"]);
    gulp.watch("src-talkerapi/**/*", ["scripts_talkerapi"]);
    
});

gulp.task("electron-watch", () =>
{
    gulp.watch("../cables/src/core/build/**/*.js", ["scripts_core"]);
    gulp.watch("src/ops/**/*.js", ["scripts_ops"]);
    gulp.watch("src/ui/**/*.js", ["scripts_ui", "electronapp"]);
    gulp.watch("scss/**/*.scss", ["sass", "electronapp"]);
    gulp.watch("html/**/*.html", ["html_ui"]);
    gulp.watch("icons/**/*.svg", ["svgcss"]);
    gulp.watch("vue-src/**/*", ["vueify"]);
    gulp.watch("src-electron/**/*", ["electronapp"]);
});

/*
 * -------------------------------------------------------------------------------------------
 * MAIN TASKS
 * -------------------------------------------------------------------------------------------
 */

/**
 * Default Task, for development
 * Run "gulp"
 */
gulp.task("default", [
    "scripts_ui",
    // 'lint',
    "html_ui",
    "scripts_core",
    "scripts_libs_ui",
    "scripts_ops",
    "sass",
    "vueify",
    "svgcss",
    "scripts_talkerapi",
    "watch",
]);

/**
 * Is this still used?
 * Run "gulp build"
 */
gulp.task("build", ["svgcss", "html_ui", "scripts_libs_ui", "scripts_ops", "scripts_core","scripts_ui", "scripts_talkerapi", "sass", "vueify"]);

/**
 * Electron development
 * Run "gulp electron"
 */
gulp.task("electron", ["svgcss", "scripts_ui", "lint", "html_ui", "scripts_libs_ui", "scripts_ops", "sass", "vueify", "electron", "electronapp", "electron-watch"]);