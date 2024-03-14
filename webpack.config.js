import path from "path";

import webpack from "webpack";

export default (isLiveBuild, buildInfo) =>
{
    const __dirname = new URL(".", import.meta.url).pathname;
    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "src", "ui", "index.js"),
        ],
        "devtool": isLiveBuild ? "source-map" : "eval-cheap-module-source-map",
        "output": {
            "path": path.join(__dirname, "build"),
            "filename": isLiveBuild ? "cablesui.min.js" : "cablesui.max.js",
        },
        "stats": isLiveBuild,
        "optimization": { "minimize": isLiveBuild },
        "externals": ["CABLES"],
        "resolve": {
            "extensions": [".json", ".js"],
        },
        "module": {
            "rules": [
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
        "plugins": [
            new webpack.DefinePlugin({
                "window.BUILD_INFO": JSON.stringify(buildInfo)
            })
        ]
    };
};
