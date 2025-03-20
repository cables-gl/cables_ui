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
                // let html = "";

                // if (res && res.info) html = res.info;
                // else html = "Finished!";

                // ele.byId("modalClose").classList.remove("hidden");
                // ele.byId("converteroutput").innerHTML = html;

                // FileManager.updatedFiles.push(fileId);
                console.log(res);
            }
            gui.refreshFileManager();
        });

}
