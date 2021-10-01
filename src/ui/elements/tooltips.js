

let tooltipTimeout = null;
let eleInfoArea = null;
let eleTooltip = null;

export function showToolTip(e, txt)
{
    // console.log("toolstip", txt);
    eleTooltip = eleTooltip || document.getElementById("cbltooltip");
    if (!eleTooltip) return;

    eleTooltip.style.display = "block";

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
    eleTooltip.style.display = "none";
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
    clearTimeout(tooltipTimeout);
    hideToolTip();
}


// --------------------------

export function showInfo(txt)
{
    txt = txt || CABLES.UI.TEXTS.infoArea;
    eleInfoArea = eleInfoArea || document.getElementById("infoArea");
    eleInfoArea.classList.remove("hidden");
    eleInfoArea.innerHTML = "<div class=\"infoareaContent\">" + mmd(txt || "") + "</div>";
}

export function hideInfo()
{
    eleInfoArea = eleInfoArea || document.getElementById("infoArea");
    eleInfoArea.classList.add("hidden");
    eleInfoArea.innerHTML = "";
}

function eleInfoOver(e)
{
    let txt = e.target.dataset.info;
    if (e.target.dataset.infotext) txt = CABLES.UI.TEXTS[e.target.dataset.infotext];
    if (!txt)
    {
        txt = document.getElementById("infoArea").dataset.info;
    }
    showInfo(txt);
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

    if (thePort.direction == CABLES.PORT_DIR_IN) strInfo += CABLES.UI.TEXTS.portDirIn;
    if (thePort.direction == CABLES.PORT_DIR_OUT) strInfo += CABLES.UI.TEXTS.portDirOut;
    if (thePort.isLinked()) strInfo += CABLES.UI.TEXTS.portMouseUnlink;
    else strInfo += CABLES.UI.TEXTS.portMouseCreate;
    CABLES.UI.showInfo(strInfo);

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
        CABLES.UI.hoverInterval = setInterval(function ()
        {
            updateHoverToolTip(event, port);
        }, 50);
}
