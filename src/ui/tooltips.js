CABLES.UI = CABLES.UI || {};
CABLES.UI.tooltipTimeout = null;
CABLES.UI.eleInfoArea = null;
CABLES.UI.eleTooltip = null;

CABLES.UI.showToolTip = function (e, txt)
{
    CABLES.UI.eleTooltip = CABLES.UI.eleTooltip || document.getElementById("cbltooltip");
    if (!CABLES.UI.eleTooltip) return;

    CABLES.UI.eleTooltip.style.display = "block";
    if (e)
    {
        CABLES.UI.eleTooltip.style.top = e.clientY + 12;
        CABLES.UI.eleTooltip.style.left = e.clientX + 25;
    }

    CABLES.UI.eleTooltip.innerHTML = txt;
};

CABLES.UI.hideToolTip = function ()
{
    if (!CABLES.UI.eleTooltip) return;
    CABLES.UI.eleTooltip.style.display = "none";
};

$(document).on("mouseover mousemove", ".tt", function (e)
{
    clearTimeout(CABLES.UI.tooltipTimeout);
    const txt = $(this).data("tt");
    CABLES.UI.tooltipTimeout = setTimeout(() =>
    {
        CABLES.UI.showToolTip(e, txt);
    }, 300);
});

$(document).on("mouseout", ".tt", () =>
{
    clearTimeout(CABLES.UI.tooltipTimeout);
    CABLES.UI.hideToolTip();
});

// --------------------------

CABLES.UI.showInfo = function (txt)
{
    txt = txt || CABLES.UI.TEXTS.infoArea;
    CABLES.UI.eleInfoArea = CABLES.UI.eleInfoArea || document.getElementById("infoArea");
    CABLES.UI.eleInfoArea.innerHTML = "<div class=\"infoareaContent\"><a class=\"icon-x icon fright\" style=\"margin-right:10px;\" onclick=\"gui.closeInfo();\">sss</a>" + mmd(txt || "") + "</div>";
};

CABLES.UI.hideInfo = function ()
{
    CABLES.UI.eleInfoArea = CABLES.UI.eleInfoArea || document.getElementById("infoArea");
    CABLES.UI.eleInfoArea.innerHTML = "";
};

$(document).on("mouseover mousemove", ".info", function (e)
{
    clearTimeout(CABLES.UI.tooltipTimeout);
    var txt = $(this).data("info");
    if ($(this).data("infotext")) txt = CABLES.UI.TEXTS[$(this).data("infotext")];
    if (!txt)
    {
        txt = $("infoArea").data("info");
    }
    CABLES.UI.showInfo(txt);
});

$(document).on("mouseout", ".info", () =>
{
    clearTimeout(CABLES.UI.tooltipTimeout);
    CABLES.UI.hideInfo();
});
