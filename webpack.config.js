import path, { dirname } from "path";

import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import ModuleScopePlugin from "@k88/module-scope-plugin";

export default (isLiveBuild, buildInfo, minify = false, analyze = false) =>
{
    let __dirname = dirname(fileURLToPath(import.meta.url));

    const plugins = [
        new webpack.DefinePlugin({
            "window.BUILD_INFO": JSON.stringify(buildInfo)
        })
    ];

    if (analyze)
    {
        plugins.push(new BundleAnalyzerPlugin({ "analyzerMode": "static", "openAnalyzer": false, "reportTitle": "cables ui", "reportFilename": path.join(__dirname, "dist", "report_ui.html") }));
    }

    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "src", "ui", "index.js"),
        ],
        "devtool": minify ? "source-map" : false,
        "output": {
            "path": path.join(__dirname, "dist", "js"),
            "filename": "cablesui.js",
        },
        "optimization": {
            "concatenateModules": true,
            "minimizer": [new TerserPlugin({
                "extractComments": false,
                "terserOptions": { "output": { "comments": false } }
            })],
            "minimize": minify,
            "usedExports": true
        },
        "externals": ["CABLES", /(\/libs\/ui\/)/i],
        "resolve": {
            "extensions": [".json", ".js"],
            "plugins": [
                new ModuleScopePlugin.default("src/"),
            ],
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
                },
                {
                    "test": /\.d.ts/,
                    "use": "null-loader",
                }
            ]
        },
        "plugins": plugins
    };
};
