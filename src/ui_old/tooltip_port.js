CABLES.UI.getPortDescription = function (thePort)
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
};

CABLES.UI.updateHoverToolTip = function (event, port)
{
    if (!port) return;

    let txt = CABLES.UI.getPortDescription(port);
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
            if (CABLES.UI.isMultilineString(val))
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
            CABLES.UI.updateHoverToolTip(event, port);
        }, 50);
};
