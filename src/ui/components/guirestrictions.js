import { ele } from "cables-shared-client";

/**
 * gui restrictions,e.g. show an editor to the user, the user can  make changes etc.
 *
 * @export
 * @class GuiRestrictions
 */
export default class GuiRestrictions
{
    constructor()
    {
        this._messages = {};
        this._currentlyShowing = null;

        this._restrictionDialog = ele.byId("restriction_container");
        this._messageBox = ele.byId("restriction_message");

        ele.clickable(ele.byId("restriction_close"), () =>
        {
            this._restrictionDialog.classList.add("hidden");
        });

    }

    hide()
    {
        this._currentlyShowing = null;
        this._restrictionDialog.classList.add("hidden");
    }

    get visible()
    {
        return Object.keys(this._messages).length > 0;
    }

    /**
     * @param {String} id
     * @param {String} msg
     */
    setMessage(id, msg = null)
    {
        if (!msg)
        {
            delete this._messages[id];
            const hasKeys = Object.keys(this._messages);

            if (hasKeys.length > 0)
            {
                msg = this._messages[Object.keys(this._messages)];
            }
        }
        else this._messages[id] = msg;

        this._messageBox.innerHTML = msg;

        if (msg)
        {
            this._currentlyShowing = id;
            this._restrictionDialog.classList.remove("hidden");
        }
        else
        {
            this._currentlyShowing = null;
            this._restrictionDialog.classList.add("hidden");
        }

    }

    showing(id)
    {
        return this.visible && this._currentlyShowing === id;
    }
}
