
export default class GuiRestrictions
{
    constructor()
    {
        this._restrictionMultiplayer = 0;
        this._restrictionBlueprint = 0;

        this._messages = {};

        this._messageBox = ele.byId("restriction_message");
        // this._messageBox.addEventListener("click", () =>
        // {
        //     this.setMessage(null);
        // });
    }

    setMessage(id, msg)
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

        if (msg) this._messageBox.classList.remove("hidden");
        else this._messageBox.classList.add("hidden");

        this._messageBox.innerHTML = msg;// + "<span class=\"icon icon-1_5x icon-x\"></span>";
    }
}

GuiRestrictions.RESTRICT_MODE_LOADING = 0;
GuiRestrictions.RESTRICT_MODE_PAUSE = 1;
GuiRestrictions.RESTRICT_MODE_BLUEPRINT = 5;

GuiRestrictions.RESTRICT_MODE_REMOTEVIEW = 10;
GuiRestrictions.RESTRICT_MODE_FOLLOWER = 20;
GuiRestrictions.RESTRICT_MODE_EXPLORER = 30;
GuiRestrictions.RESTRICT_MODE_FULL = 40;
