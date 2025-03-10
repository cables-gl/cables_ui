import { ele } from "cables-shared-client";
import { escapeHTML } from "../utils/helper.js";
import ModalDialog from "./modaldialog.js";
import { userSettings } from "../components/usersettings.js";

function getBadLines(infoLog)
{
    const basLines = [];
    const lines = infoLog.split("\n");
    for (const i in lines)
    {
        const divide = lines[i].split(":");
        if (parseInt(divide[2], 10)) basLines.push(parseInt(divide[2], 10));
    }
    return basLines;
}

export function showShaderError(shader)
{
    if (!shader.error)
    {
        console.log("shader has no erorr ?!");
        return;
    }
    let infoLog = shader.error.infoLog;
    const badLines = getBadLines(infoLog);

    const lines = shader.error.str.match(/^.*((\r\n|\n|\r)|$)/gm);

    let htmlWarning = "<pre style=\"margin-bottom:0px;\"><code class=\"shaderErrorCode language-glsl\" style=\"padding-bottom:0px;max-height: initial;max-width: initial;\">";
    if (infoLog)
    {
        // if (type == cgl.gl.VERTEX_SHADER) this._log.log("VERTEX_SHADER");
        // if (type == cgl.gl.FRAGMENT_SHADER) this._log.log("FRAGMENT_SHADER");

        for (const i in lines)
        {
            const j = parseInt(i, 10) + 1;
            const line = j + ": " + lines[i];

            let isBadLine = false;
            for (const bj in badLines)
                if (badLines[bj] == j) isBadLine = true;

            if (isBadLine)
            {
                htmlWarning += "</code></pre>";
                htmlWarning += "<pre style=\"margin:0\"><code class=\"language-glsl\" style=\"background-color:#660000;padding-top:0px;padding-bottom:0px\">";

                // cglShader._log.log("bad line: `" + line + "`");
            }
            htmlWarning += escapeHTML(line);

            if (isBadLine)
            {
                htmlWarning += "</code></pre>";
                htmlWarning += "<pre style=\"margin:0\"><code class=\"language-glsl\" style=\";padding-top:0px;padding-bottom:0px\">";
            }
        }
    }

    infoLog = infoLog.replace(/\n/g, "<br/>");

    let html = infoLog;
    html += "<a id=\"alwaysshowbutton\" class=\"button-small right\">" + getShowAlwaysButtonText() + "</a>";
    html += "<br/>" + htmlWarning + "<br/>";
    html += "</code></pre>";

    new ModalDialog({ "html": html, "title": "Shader Error" });

    ele.clickable(ele.byId("alwaysshowbutton"), () =>
    {
        userSettings.set("showAllShaderErrors", !userSettings.get("showAllShaderErrors"));
        ele.byId("alwaysshowbutton").innerHTML = getShowAlwaysButtonText();
    });

}

function getShowAlwaysButtonText()
{
    if (!userSettings.get("showAllShaderErrors")) return "<icon class=\"icon icon-x\"></icon>Always open on shader errors";
    return "<icon class=\"icon icon-check\"></icon>Always open on shader errors";
}
