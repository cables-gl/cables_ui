
const oldModalWrap=
{

    show : function (content, options)
    {
        let logger=new CABLES.UI.Logger("modal");
        logger.stack("deprecated function CABLES.UI.MODAL.show ");

        options=options||{};
        options.html=content;
        new CABLES.UI.ModalDialog(options);
    },

    showError : function (title, content)
    {
        let logger=new CABLES.UI.Logger("modal");
        logger.stack("deprecated function CABLES.UI.MODAL.showError ");
        new CABLES.UI.ModalDialog({
                "warning":true,
                "title":title,
                "html":content
            });
    },

    prompt : function (title, text, value, callback)
    {
        let logger=new CABLES.UI.Logger("modal");
        logger.stack("deprecated CABLES.UI.MODAL.prompt, use CABLES.UI.ModalDialog ");

        new CABLES.UI.ModalDialog({
            "prompt": true,
            "title": title,
            "text": text,
            "promptValue": value,
            "promptOk": callback
        });
    }

}

export default oldModalWrap;
