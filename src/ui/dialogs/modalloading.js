import ModalDialog from "./modaldialog.js";

/**
 * Opens a modal dialog and shows a loading indicator animation
 *
 * @param {String} title
 * @class
 */
export default class ModalLoading
{
    constructor(title)
    {
        this._tasks = [];
        this.options = {
            "title": title,
            "html": this.getHtml()
        };

        this._dialog = new ModalDialog(this.options);
    }

    getHtml()
    {
        let str = "";
        if (this._tasks.length > 0)
        {
            str += "<div class=\"code\">";
            for (let i = 0; i < this._tasks.length; i++)
            {
                str += "- " + this._tasks[i] + "<br/>";
            }
            str += "</div>";
        }
        else
        {
            str = "<div class=\"loading\" ></div>";
        }

        return str;
    }

    setTask(txt)
    {
        // console.log("[ModalLoading] " + this.options.title + ": " + txt);
        this._tasks.push(txt);
        this._dialog.updateHtml(this.getHtml());
    }

    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
