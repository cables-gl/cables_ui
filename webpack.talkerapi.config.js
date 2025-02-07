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
        plugins.push(new BundleAnalyzerPlugin({ "analyzerMode": "static", "openAnalyzer": false, "reportTitle": "cables ui talkerapi", "reportFilename": path.join(__dirname, "dist", "report_ui_talkerapi.html") }));
    }

    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "src-talkerapi", "talkerapi.js"),
        ],
        "devtool": minify ? "source-map" : false,
        "output": {
            "path": path.join(__dirname, "dist/js"),
            "filename": "talkerapi.js"
        },
        "optimization": {
            "minimizer": [new TerserPlugin({ "extractComments": false, "terserOptions": { "output": { "comments": false } } })],
            "minimize": minify,
            "usedExports": true
        },
        "externals": ["CABLES"],
        "resolve": {
            "extensions": [".json", ".js"],
            "plugins": [
                new ModuleScopePlugin.default("src-talkerapi/"),
            ],
        },
        "module": {
            "rules": [
                { "sideEffects": false },
                {
                    "test": /\.d.ts/,
                    "use": "null-loader",
                }
            ]
        },
        "plugins": plugins
    };
};
