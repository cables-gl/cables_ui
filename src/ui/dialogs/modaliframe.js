import ModalDialog from "./modaldialog.js";

/**
 * Opens a modal dialog and shows a loading indicator animation
 *
 * @param {String} title
 * @class
 */
export default class ModalIframe
{
    constructor(options)
    {
        this._options = {
            "title": options.title || "",
            "src": options.src
        };
        this._options.html = this.getHtml();
        this._dialog = new ModalDialog(this._options);
        this.iframeEle = ele.byId("modaliframe");
        const modalEle = this._dialog.getElement();
        modalEle.style.minHeight = "500px";
    }

    getHtml()
    {
        let html = "";
        html += "<iframe id=\"modaliframe\" frameborder=\"0\" src=\"" + this._options.src + "\" style=\"min-height: 500px; width: 100%;\" title=\"" + this._options.title + "\"></iframe>";
        return html;
    }

    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
