import path from "path";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";

export default (isLiveBuild, buildInfo, minify = false) =>
{
    const __dirname = new URL(".", import.meta.url).pathname;
    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "src-talkerapi", "talkerapi.js"),
        ],
        "devtool": minify ? "source-map" : "eval-cheap-module-source-map",
        "output": {
            "path": path.join(__dirname, "dist/js"),
            "filename": "talkerapi.js"
        },
        "optimization": {
            "minimizer": [new TerserPlugin({ "extractComments": false })],
            "minimize": minify,
            "usedExports": true
        },
        "externals": ["CABLES"],
        "resolve": {
            "extensions": [".json", ".js"],
        },
        "module": {
            "rules": [
                { "sideEffects": false },
            ]
        },
        "plugins": [
            new webpack.DefinePlugin({
                "window.BUILD_INFO": JSON.stringify(buildInfo)
            })
        ]
    };
};
