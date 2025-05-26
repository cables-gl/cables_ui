import { ele } from "cables-shared-client";
import { CGP } from "cables-corelibs";
import { escapeHTML } from "../utils/helper.js";
import ModalDialog from "./modaldialog.js";
import { userSettings } from "../components/usersettings.js";

/**
 * @param {CgpShader} shader
 * @param {GPUCompilationInfo} nfo
 */
export function showShaderErrorCgp(shader, nfo, src)
{
    const badLines = {};
    let infoLog = "";

    for (const msg of nfo.messages)
    {
        infoLog += msg.type + " at line " + msg.lineNum + ":" + msg.linePos + " :" + msg.message + "<br/>";
        if (msg.type == "error") badLines[msg.lineNum] = msg.lineNum;
    }

    const lines = src.split("\n");
    let htmlWarning = "<pre style=\"margin-bottom:0px;\"><code class=\"shaderErrorCode language-glsl\" style=\"padding-bottom:0px;max-height: initial;max-width: initial;\">";

    for (const i in lines)
    {
        const j = parseInt(i, 10) + 1;
        const line = j + ": " + lines[i];

        let isBadLine = false;
        for (const bj in badLines) if (badLines[bj] == j) isBadLine = true;

        if (isBadLine)
        {
            htmlWarning += "</code></pre>";
            htmlWarning += "<pre style=\"margin:0\"><code class=\"language-glsl\" style=\"background-color:#660000;padding-top:0px;padding-bottom:0px\">";
        }
        htmlWarning += escapeHTML(line) + "\n";

        if (isBadLine)
        {
            htmlWarning += "</code></pre>";
            htmlWarning += "<pre style=\"margin:0\"><code class=\"language-glsl\" style=\";padding-top:0px;padding-bottom:0px\">";
        }
    }

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
