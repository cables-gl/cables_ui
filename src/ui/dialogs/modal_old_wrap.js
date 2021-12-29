import Logger from '../utils/logger';
import ModalDialog from './modaldialog';

const oldModalWrap=
{

    show : function (content, options)
    {
        let logger=new Logger("modal");
        logger.stack("deprecated function CABLES.UI.MODAL.show ");

        options=options||{};
        options.html=content;
        new ModalDialog(options);
    },

    showError : function (title, content)
    {
        let logger=new Logger("modal");
        logger.stack("deprecated function CABLES.UI.MODAL.showError ");
        new ModalDialog({
                "warning":true,
                "title":title,
                "html":content
            });
    },

    prompt : function (title, text, value, callback)
    {
        let logger=new Logger("modal");
        logger.stack("deprecated CABLES.UI.MODAL.prompt, use CABLES.UI.ModalDialog ");

        new ModalDialog({
            "prompt": true,
            "title": title,
            "text": text,
            "promptValue": value,
            "promptOk": callback
        });
    }

}

export default oldModalWrap;
