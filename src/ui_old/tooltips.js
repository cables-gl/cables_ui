CABLES.UI = CABLES.UI || {};
CABLES.UI.tooltipTimeout = null;
CABLES.UI.eleInfoArea = null;
CABLES.UI.eleTooltip = null;

CABLES.UI.showToolTip = function (e, txt)
{
    // console.log("toolstip", txt);
    CABLES.UI.eleTooltip = CABLES.UI.eleTooltip || document.getElementById("cbltooltip");
    if (!CABLES.UI.eleTooltip) return;

    CABLES.UI.eleTooltip.style.display = "block";

    if (e)
        if (e.style)
        {
            CABLES.UI.eleTooltip.style.top = e.getBoundingClientRect().top + 25 + "px";
            CABLES.UI.eleTooltip.style.left = e.getBoundingClientRect().left + "px";
        }
        else
        {
            CABLES.UI.eleTooltip.style.top = e.clientY + 12 + "px";
            CABLES.UI.eleTooltip.style.left = e.clientX + 25 + "px";
        }

    CABLES.UI.eleTooltip.innerHTML = txt;
};

CABLES.UI.hideToolTip = function ()
{
    if (!CABLES.UI.eleTooltip) return;
    CABLES.UI.eleTooltip.style.display = "none";
};

CABLES.UI.addToolTipListener = function (ele)
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
    ele.addEventListener("mouseover", over);
    ele.addEventListener("mouseleave", out);
    ele.addEventListener("mouseout", out);
};


Array.from(document.querySelectorAll(".tt")).forEach((tt) =>
{
    CABLES.UI.addToolTipListener(tt);
});


// --------------------------

CABLES.UI.showInfo = function (txt)
{
    txt = txt || CABLES.UI.TEXTS.infoArea;
    CABLES.UI.eleInfoArea = CABLES.UI.eleInfoArea || document.getElementById("infoArea");
    CABLES.UI.eleInfoArea.classList.remove("hidden");
    CABLES.UI.eleInfoArea.innerHTML = "<div class=\"infoareaContent\">" + mmd(txt || "") + "</div>";
};

CABLES.UI.hideInfo = function ()
{
    CABLES.UI.eleInfoArea = CABLES.UI.eleInfoArea || document.getElementById("infoArea");
    CABLES.UI.eleInfoArea.classList.add("hidden");
    CABLES.UI.eleInfoArea.innerHTML = "";
};

CABLES.UI.addInfoListener = function (ele)
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

    ele.addEventListener("mouseover", over);
    ele.addEventListener("mousemove", over);
    ele.addEventListener("mouseout", out);
};

Array.from(document.querySelectorAll(".info")).forEach((tt) =>
{
    CABLES.UI.addInfoListener(tt);
});

// test

CABLES.UI.ttObserver = new MutationObserver(function (mutations)
{
    mutations.forEach(function (mutation)
    {
        for (let i = 0; i < mutation.addedNodes.length; i++)
        {
            if (!mutation.addedNodes[i].tagName) continue;


            // console.log(mutation.addedNodes[i].classList);

            if (mutation.addedNodes[i].classList.contains("tt"))
            {
                CABLES.UI.addToolTipListener(mutation.addedNodes[i]);
                console.log(mutation.addedNodes[i].dataset.tt);
            }
            if (mutation.addedNodes[i].classList.contains("info"))
            {
                CABLES.UI.addInfoListener(mutation.addedNodes[i]);
            }
        }
    });
});

CABLES.UI.ttObserver.observe(document.body, { "attributes": false, "childList": true, "characterData": false, "subtree": true });
