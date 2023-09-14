import text from "../text";
import ele from "../utils/ele";

let tooltipTimeout = null;
let eleTooltip = null;
let inited = false;

export function showToolTip(e, txt, nopadding)
{
    eleTooltip = eleTooltip || ele.byId("cbltooltip");
    if (!eleTooltip) return;

    ele.show(eleTooltip);

    eleTooltip.classList.toggle("tooltip_nopadding", nopadding);

    if (!inited)
    {
        eleTooltip.addEventListener("mouseover", function (evt)
        {
            hideToolTip();
        }, true);

        inited = true;
    }

    if (e)
    {
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

export function showInfo(txt, param)
{
    if (param)gui.bottomInfoArea.setContentParam(txt);
    else gui.bottomInfoArea.setContent(txt);
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
    if(!str || !str.match || !str.length) return false;
    return ((str.match(/\n/g) || []).length > 0);
}

function getPortDescription(thePort, overlink)
{
    let str = "";

    let objType = thePort.uiAttribs.objType || "";
    if (objType)objType += " ";

    let stride = "";
    if (thePort.uiAttribs.stride)stride = thePort.uiAttribs.stride;

    str += "<span class=\"tooltip_port\" style=\"background-color:var(--color_port_" + thePort.getTypeString().toLowerCase() + ");\">";
    str += thePort.getTypeString() + stride;
    str += "</span>";

    if (objType)
    {
        objType = objType.charAt(0).toUpperCase() + objType.slice(1);
        str += "<span class=\"tooltip_objtype\">" + objType + "</span>";
    }

    if (thePort.uiAttribs.title) str += " <b>" + thePort.uiAttribs.title + " (" + thePort.getName() + ") </b> ";
    else str += " <b>" + thePort.getName() + "</b> ";

    if (!overlink)
    {
        let strInfo = "";

        if (thePort.direction == CABLES.PORT_DIR_IN) strInfo += text.portDirIn;
        if (thePort.direction == CABLES.PORT_DIR_OUT) strInfo += text.portDirOut;
        if (thePort.isLinked()) strInfo += text.portMouseUnlink;
        else strInfo += text.portMouseCreate;
        gui.showInfo(strInfo);
    }

    return str;
}

export function updateHoverToolTip(event, port, overlink)
{
    if (!port) return;

    let txt = getPortDescription(port, overlink);
    let val = null;

    if (port && !port.uiAttribs.hideParam && !port.uiAttribs.hidePort)
    {
        if (port.type == CABLES.OP_PORT_TYPE_VALUE)
        {
            val = port.getValueForDisplay();
            if (CABLES.UTILS.isNumeric(val))val = Math.round(val * 1000) / 1000;

            txt += "<span class=\"tooltip_value\">" + val + "</span>";
        }
        else if (port.type == CABLES.OP_PORT_TYPE_STRING)
        {
            val = port.getValueForDisplay();
            if (isMultilineString(val))
            {
                val = "\"" + val + "\"";
                txt += ": <span class=\"tooltip_value multiline-string-port\">" + val + "</span>";
            }
            else
            {
                val = "\"" + val + "\"";
                txt += ": <span class=\"tooltip_value\">" + val + "</span>";
            }
        }
        else if (port.type == CABLES.OP_PORT_TYPE_ARRAY)
        {
            val = port.get();
            if (val)
            {
                txt += " (total:" + val.length + ") <span class=\"tooltip_value\">";
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

                txt += " ... </span>";
            }
            else txt += "<span class=\"tooltip_value\">null</span>";
        }
        else if (port.type == CABLES.OP_PORT_TYPE_OBJECT)
        {
            if (!port.get())txt += "<span class=\"tooltip_value\">null</span>";
            if (port.get())
            {
                if (port.get().getInfoOneLineShort)txt += "<span class=\"tooltip_value\">" + port.get().getInfoOneLineShort() + "</span>";
                else if (port.get().getInfoOneLine)txt += "<span class=\"tooltip_value\">" + port.get().getInfoOneLine() + "</span>";
            }
        }
        else
        {
            txt += "&nbsp;&nbsp;";
        }

        if (gui.patchView.patchRenderer.dragLine && gui.patchView.patchRenderer.dragLine.isActive)
        {
            let oport = gui.patchView.patchRenderer.dragLine.glPort.port;
            if (gui.patchView.patchRenderer.dragLine._startGlPorts[0])
                oport = gui.patchView.patchRenderer.dragLine._startGlPorts[0].port;

            if (!CABLES.Link.canLink(port, oport))
                txt = "<span class=\"icon icon-alert-triangle icon-warning icon-near-text fleft\"></span> &nbsp;" + CABLES.Link.canLinkText(port, oport);
        }
    }
    txt += "&nbsp;";

    if (port.apf >= 0) txt += "" + Math.round(port.apf * 100) / 100 + " APF ";

    CABLES.UI.showToolTip(event, txt, true);

    if (overlink)
    {
        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval = -1;
    }

    if (CABLES.UI.hoverInterval == -1)
        CABLES.UI.hoverInterval = setInterval(
            () =>
            {
                updateHoverToolTip(event, port, overlink);
            }, 50);
}
