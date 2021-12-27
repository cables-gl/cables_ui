// http://html5doctor.com/drag-and-drop-to-server/


CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UI.MODAL = CABLES.UI.MODAL || {};
CABLES.UI.MODAL._visible = false;
CABLES.UI.MODAL.contentElement = null;
CABLES.UI.MODAL.headerElement = null; // the (small) header shown in the title bar of the modal

CABLES.UI.MODAL.init = function (options)
{
    options = options || {};
    if (window.gui && gui.canvasUi)gui.canvasUi.showCanvasModal(false);

    if (CABLES.UI.MODAL.contentElement)
        CABLES.UI.MODAL.contentElement.style.display = "none";

    CABLES.UI.MODAL.contentElement = document.getElementById("modalcontent");
    CABLES.UI.MODAL.headerElement = document.getElementById("modalheader");
    if (CABLES.UI.MODAL.headerElement)
        CABLES.UI.MODAL.headerElement.innerHTML = "";
    if (options && options.element)
    {
        CABLES.UI.MODAL.contentElement = document.querySelector(options.element);
    }
    else
    {
        CABLES.UI.MODAL.contentElement.innerHTML = "";
    }

    document.getElementById("modalcontainer").classList.remove("transparent");
    if (!options.nopadding)
    {
        CABLES.UI.MODAL.contentElement.style.padding = "15px";
    }
};

CABLES.UI.MODAL.isVisible = function ()
{
    return CABLES.UI.MODAL._visible;
};

CABLES.UI.MODAL._setVisible = function (visible)
{
    if (visible)
    {
        CABLES.UI.MODAL._visible = true;

        CABLES.UI.MODAL.contentElement.style.display = "block";

        document.getElementById("modalcontainer").style.display = "block";
        document.getElementById("modalcontainer").style.top = "10%";
        CABLES.UI.MODAL.contentElement.style.top = "10%";
    }
    else
    {
        CABLES.UI.MODAL._visible = false;
        CABLES.UI.MODAL.contentElement.style.display = "none";
        CABLES.UI.MODAL.contentElement.style.top = "-999100px";
        document.getElementById("modalcontainer").style.display = "none";
    }
};

CABLES.UI.MODAL.hide = function (force)
{
    if (!force && document.querySelectorAll(".modalerror").length > 0)
    {
        return;
    }

    if (CABLES.UI.MODAL.onClose)CABLES.UI.MODAL.onClose();

    document.getElementById("modalclose").style.display = "block";
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL._setVisible(false);
    CABLES.UI.MODAL.contentElement.classList.remove("nopadding");
    document.getElementById("modalbg").style.display = "none";

    CABLES.UI.hideToolTip();
};

CABLES.UI.MODAL.showTop = function (content, options)
{
    CABLES.UI.MODAL.show(content, options);
};

CABLES.UI.MODAL.setTitle = function (title)
{
    if (title)
    {
        document.getElementById("modalheader").innerHTML = title;
        document.getElementById("modalheader").style.display = "block";
    }
    else
    {
        document.getElementById("modalheader").style.display = "none";
    }
};


CABLES.UI.MODAL.show = function (content, options)
{

    if (CABLES.UI.MODAL.contentElement && options && !options.ignoreTop) CABLES.UI.MODAL.contentElement.style.top = "5%";

    CABLES.UI.MODAL.init(options);

    if (options)
    {
        CABLES.UI.MODAL.setTitle(options.title);
        CABLES.UI.MODAL.onClose = options.onClose;


        if (options.transparent) document.getElementById("modalcontainer").classList.add("transparent");
        if (options.nopadding)
        {
            document.getElementById("modalcontainer").style.padding = "0px";
            CABLES.UI.MODAL.contentElement.classList.add("nopadding");
        }
    }
    else
    {
        CABLES.UI.MODAL.onClose = null;
        document.getElementById("modalcontainer").classList.remove("transparent");
    }

    if (content)
        CABLES.UI.MODAL.contentElement.innerHTML += content;

    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";
    gui.emitEvent("showModal");
};

CABLES.UI.MODAL.showClose = function ()
{
    // if (document.getElementById("modalclose"))
    //     document.getElementById("modalclose").style.display = "block";
};

CABLES.UI.MODAL.showError = function (title, content)
{
    // CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();
    CABLES.UI.MODAL.contentElement.innerHTML = "<h2><span class=\"icon icon-2x icon-alert-triangle\"></span> " + title + "</h2>";

    if (content)
    {
        CABLES.UI.MODAL.contentElement.innerHTML += content;
    }
    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";

    Array.from(document.querySelectorAll(".shadererrorcode")).forEach(function (block)
    {
        hljs.highlightBlock(block);
    });
};

CABLES.UI.MODAL.showCode = function (title, code, type)
{
    // CABLES.UI.MODAL.showClose();
    CABLES.UI.MODAL.init();

    CABLES.UI.MODAL.contentElement.innerHTML += "<h2><span class=\"fa fa-search\"></span>&nbsp;inspect</h2>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<b>" + title + "</b> ";
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";
    CABLES.UI.MODAL.contentElement.innerHTML += "<br/><br/>";

    code = code || "";
    code = code.replace(/\</g, "&lt;"); // for <
    code = code.replace(/\>/g, "&gt;"); // for >

    CABLES.UI.MODAL.contentElement.innerHTML += "<pre><code class=\"" + (type || "javascript") + "\">" + code + "</code></pre>";
    CABLES.UI.MODAL._setVisible(true);
    document.getElementById("modalbg").style.display = "block";
    Array.from(document.querySelectorAll("pre code")).forEach(function (block)
    {
        hljs.highlightBlock(block);
    });
};

// todo: use modaldialog and remove
CABLES.UI.MODAL.prompt = function (title, text, value, callback)
{
    console.log("deprecated CABLES.UI.MODAL.prompt, use CABLES.UI.ModalDialog");
    new CABLES.UI.ModalDialog({
        "prompt": true,
        "title": title,
        "text": text,
        "promptValue": value,
        "promptOk": callback
    });
};
