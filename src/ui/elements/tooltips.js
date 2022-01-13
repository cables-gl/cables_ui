import text from "../text";
import ele from "../utils/ele";

let tooltipTimeout = null;
let eleTooltip = null;

export function showToolTip(e, txt)
{
    eleTooltip = eleTooltip || ele.byId("cbltooltip");
    if (!eleTooltip) return;

    ele.show(eleTooltip);
    // eleTooltip.style.display = "block";

    if (e)
        if (e.style)
        {
            eleTooltip.style.top = e.getBoundingClientRect().top + 25 + "px";
            eleTooltip.style.left = e.getBoundingClientRect().left + "px";
        }
        else
        {
            eleTooltip.style.top = e.clientY + 12 + "px";
            eleTooltip.style.left = e.clientX + 25 + "px";
        }

    eleTooltip.innerHTML = txt;
}

export function hideToolTip()
{
    if (!eleTooltip) return;
    // eleTooltip.style.display = "none";
    clearTimeout(tooltipTimeout);
    clearInterval(CABLES.UI.hoverInterval);
    CABLES.UI.hoverInterval = -1;
    ele.hide(eleTooltip);
}


function eleTtOver(e)
{
    clearTimeout(tooltipTimeout);
    const txt = e.target.dataset.tt;
    tooltipTimeout = setTimeout(() =>
    {
        showToolTip(e, txt);
    }, 300);
}

function eleTtOut(e)
{
    if (document.activeElement.classList.contains("tt")) return;
    clearTimeout(tooltipTimeout);
    hideToolTip();
}


// --------------------------

export function showInfo(txt)
{
    gui.bottomInfoArea.setContent(txt);
}

export function hideInfo()
{
    gui.bottomInfoArea.setContent("");
}

function eleInfoOver(e)
{
    gui.bottomInfoArea.hoverInfoEle(e);
}

function eleInfoOut(e)
{
    clearTimeout(tooltipTimeout);
    CABLES.UI.hideInfo();
}

document.querySelector("body").addEventListener("mouseover", function (evt)
{
    if (evt.target.classList.contains("tt")) eleTtOver(evt);
    if (evt.target.classList.contains("info")) eleInfoOver(evt);
}, true);

document.querySelector("body").addEventListener("mouseout", function (evt)
{
    if (evt.target.classList.contains("tt")) eleTtOut(evt);
    if (evt.target.classList.contains("info")) eleInfoOut(evt);
}, true);


function isMultilineString(str)
{
    return ((str.match(/\n/g) || []).length > 0);
}

function getPortDescription(thePort)
{
    let str = "";

    let objType = thePort.uiAttribs.objType || "";
    if (objType)objType += " ";

    str += "[" + objType + thePort.getTypeString() + "] ";

    if (thePort.uiAttribs.title) str += " <b>" + thePort.uiAttribs.title + " (" + thePort.getName() + ") </b> ";
    else str += " <b>" + thePort.getName() + "</b> ";
    let strInfo = "";

    if (thePort.direction == CABLES.PORT_DIR_IN) strInfo += text.portDirIn;
    if (thePort.direction == CABLES.PORT_DIR_OUT) strInfo += text.portDirOut;
    if (thePort.isLinked()) strInfo += text.portMouseUnlink;
    else strInfo += text.portMouseCreate;
    gui.showInfo(strInfo);

    return str;
}

export function updateHoverToolTip(event, port)
{
    if (!port) return;

    let txt = getPortDescription(port);
    let val = null;
    if (port)
    {
        if (port.type == CABLES.OP_PORT_TYPE_VALUE)
        {
            val = port.getValueForDisplay();
            if (CABLES.UTILS.isNumeric(val))val = Math.round(val * 1000) / 1000;
            else val = "\"" + val + "\"";
            txt += ": <span class=\"code\">" + val + "</span>";
        }
        else if (port.type == CABLES.OP_PORT_TYPE_STRING)
        {
            val = port.getValueForDisplay();
            if (isMultilineString(val))
            {
                val = "\"" + val + "\"";
                txt += ": <span class=\"code multiline-string-port\">" + val + "</span>";
            }
            else
            {
                val = "\"" + val + "\"";
                txt += ": <span class=\"code\">" + val + "</span>";
            }
        }
        else if (port.type == CABLES.OP_PORT_TYPE_ARRAY)
        {
            val = port.get();
            if (val)
            {
                txt += " (total:" + val.length + ") <span class=\"\"> [";
                for (let i = 0; i < Math.min(3, val.length); i++)
                {
                    if (i != 0)txt += ", ";

                    if (CABLES.UTILS.isNumeric(val[i]))txt += Math.round(val[i] * 1000) / 1000;
                    else if (typeof val[i] == "string")txt += "\"" + val[i] + "\"";
                    else if (typeof val[i] == "object")
                    {
                        txt += "[object]";
                    }
                    else JSON.stringify(val[i]);
                }

                txt += " ...] </span>";
            }
            else txt += "no array";
        }
    }

    CABLES.UI.showToolTip(event, txt);
    if (CABLES.UI.hoverInterval == -1)
        CABLES.UI.hoverInterval = setInterval(
            () =>
            {
                updateHoverToolTip(event, port);
            }, 50);
}
