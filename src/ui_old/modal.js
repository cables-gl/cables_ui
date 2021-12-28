CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UI.MODAL = CABLES.UI.MODAL || {};

CABLES.UI.MODAL.logger=new CABLES.UI.Logger("modal");

CABLES.UI.MODAL.show = function (content, options)
{
    CABLES.UI.MODAL.logger.stack("deprecated function CABLES.UI.MODAL.show ");

    options=options||{};
    options.html=content;
    new CABLES.UI.ModalDialog(options);
};

CABLES.UI.MODAL.showError = function (title, content)
{
    CABLES.UI.MODAL.logger.stack("deprecated function CABLES.UI.MODAL.showError ");
    new CABLES.UI.ModalDialog({
            "warning":true,
            "title":title,
            "html":content
        });
};

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
