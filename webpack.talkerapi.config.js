import path from "path";
import webpack from "webpack";

export default (isLiveBuild, buildInfo) =>
{
    const __dirname = new URL(".", import.meta.url).pathname;
    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "src-talkerapi", "talkerapi.js"),
        ],
        "devtool": isLiveBuild ? "source-map" : "eval-cheap-module-source-map",
        "output": {
            "path": path.join(__dirname, "dist/js"),
            "filename": "talkerapi.js"
        },
        "stats": isLiveBuild,
        "optimization": {
            "minimize": isLiveBuild,
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
