import ModalDialog from "./modaldialog.js";

/** Modal dialog showing a loading indicator animation. */
export default class ModalLoading
{
    /**
     * @param {string} title
     */
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
        this._tasks.push(txt);
        if (this._dialog) this._dialog.updateHtml(this.getHtml());
    }

    close()
    {
        this._dialog.close();
        this._dialog = null;
    }
}
