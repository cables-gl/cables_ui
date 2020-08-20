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
        if (e.style)
        {
            CABLES.UI.eleTooltip.style.top = e.getBoundingClientRect().top + 25;
            CABLES.UI.eleTooltip.style.left = e.getBoundingClientRect().left;
        }
        else
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

Array.from(document.querySelectorAll(".tt")).forEach((tt) =>
{
    const over = function (e)
    {
        clearTimeout(CABLES.UI.tooltipTimeout);
        const txt = e.target.dataset.tt;
        CABLES.UI.tooltipTimeout = setTimeout(() =>
        {
            CABLES.UI.showToolTip(e, txt);
        }, 300);
    };
    const out = function (e)
    {
        clearTimeout(CABLES.UI.tooltipTimeout);
        CABLES.UI.hideToolTip();
    };
    tt.addEventListener("mouseover", over);
    tt.addEventListener("mouseleave", over);
    tt.addEventListener("mouseout", out);
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

Array.from(document.querySelectorAll(".info")).forEach((tt) =>
{
    const over = function (e)
    {
        let txt = e.target.dataset.info;
        if (e.target.dataset.infotext) txt = CABLES.UI.TEXTS[e.target.dataset.infotext];
        if (!txt)
        {
            txt = document.getElementById("infoArea").dataset.info;
        }
        CABLES.UI.showInfo(txt);
    };

    const out = function (e)
    {
        clearTimeout(CABLES.UI.tooltipTimeout);
        CABLES.UI.hideInfo();
    };
    tt.addEventListener("mouseover", over);
    tt.addEventListener("mousemove", over);
    tt.addEventListener("mouseout", out);
});
