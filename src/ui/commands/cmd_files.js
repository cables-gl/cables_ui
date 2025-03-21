import { gui } from "../gui.js";
import { platform } from "../platform.js";

export function copyFileToPatch(url, options = null)
{
    platform.talkerAPI.send("fileConvert",
        {
            "url": url,
            "converterId": "copytopatch",
            "options": options
        },
        function (err, res)
        {
            if (err)
            {
                console.log("Error: something went wrong while converting..." + (err.msg || ""));
            }
            else
            {
                console.log(res);
                if (res && res.converterResult && res.converterResult.sourceUrl && res.converterResult.targetUrl)
                {
                    CABLES.CMD.PATCH.replaceFilePath(res.converterResult.sourceUrl, res.converterResult.targetUrl);
                }
            }
            gui.refreshFileManager();
        });

}
