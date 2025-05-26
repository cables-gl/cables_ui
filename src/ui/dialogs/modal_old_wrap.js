import { Logger } from "cables-shared-client";
import ModalDialog from "./modaldialog.js";

const oldModalWrap =
{

    /**
     * @deprecated
     */
    "show": function (content, options)
    {
        let logger = new Logger("modal");
        logger.stack("deprecated function CABLES.UI.MODAL.show ");

        options = options || {};
        options.html = content;
        new ModalDialog(options);
    },

    /**
     * @deprecated
     */
    "showError": function (title, content)
    {
        let logger = new Logger("modal");
        logger.stack("deprecated function CABLES.UI.MODAL.showError ");
        new ModalDialog({
            "warning": true,
            "title": title,
            "html": content
        });
    },

    /**
     * @deprecated
     */
    "prompt": function (title, text, value, callback)
    {
        let logger = new Logger("modal");
        logger.stack("deprecated CABLES.UI.MODAL.prompt, use ModalDialog ");

        new ModalDialog({
            "prompt": true,
            "title": title,
            "text": text,
            "promptValue": value,
            "promptOk": callback
        });
    }

};

export default oldModalWrap;
