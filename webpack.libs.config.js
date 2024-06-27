import path, { dirname } from "path";

import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import RemoveSourceMapUrlWebpackPlugin from "@rbarilani/remove-source-map-url-webpack-plugin";

export default (isLiveBuild, buildInfo, minify = false, analyze = false) =>
{
    const outputFile = "libs.ui.js";
    let __dirname = dirname(fileURLToPath(import.meta.url));

    const plugins = [
        // needed because markedjs has sourceMappingUrl in their production files in npm...
        new RemoveSourceMapUrlWebpackPlugin({
            "test": (fileName) =>
            {
                return !minify && fileName === outputFile;
            }
        }),
        new webpack.DefinePlugin({
            "window.BUILD_INFO": JSON.stringify(buildInfo)
        })
    ];

    if (analyze)
    {
        plugins.push(new BundleAnalyzerPlugin({ "analyzerMode": "static", "openAnalyzer": false, "reportTitle": "cables ui libs", "reportFilename": path.join(__dirname, "dist", "report_ui_libs.html") }));
    }

    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "libs", "ui", "index.js"),
        ],
        "devtool": minify ? "source-map" : false,
        "output": {
            "path": path.join(__dirname, "dist", "js"),
            "filename": outputFile,
        },
        "optimization": {
            "minimizer": [new TerserPlugin({ "extractComments": false, "terserOptions": { "output": { "comments": false } } })],
            "minimize": minify,
            "usedExports": true
        },
        "externals": ["CABLES"],
        "resolve": {
            "extensions": [".js"],
            "alias": {
                "handlebars": "handlebars/dist/handlebars.min.js"
            }
        },
        "module": {
            "rules": [
                { "sideEffects": false },
                {
                    "test": /\.frag/,
                    "use": "raw-loader",
                },
                {
                    "test": /\.vert/,
                    "use": "raw-loader",
                },
                {
                    "test": /\.txt/,
                    "use": "raw-loader",
                }
            ]
        },
        "plugins": plugins
    };
};
