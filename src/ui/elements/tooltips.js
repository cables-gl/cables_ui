

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
