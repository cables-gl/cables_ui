
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};


CABLES.UI.SuggestionDialog = function (suggestions, op, mouseEvent, cb, _action, showSelect, cbCancel)
{
    this._eleDialog = ele.byId("suggestionDialog");
    this._bg = new CABLES.UI.ModalBackground();

    this._bg.on("hide", () =>
    {
        this.close();
        if (cbCancel)cbCancel();
    });

    this.doShowSelect = showSelect;
    this.close = function ()
    {
        this._eleDialog.innerHTML = "";

        ele.hide(this._eleDialog);
        this._bg.hide();

        // CABLES.UI.MODAL.hide(true);
        CABLES.UI.suggestions = null;
    };

    this.showSelect = function ()
    {
        if (cb)cb();
        else this.close();
    };

    this.action = function (id)
    {
        this.close();
        _action(id);
    };

    const self = this;

    if (!suggestions)
    {
        if (cb)cb();
        return;
    }

    CABLES.UI.suggestions = this;

    const sugDegree = 6;
    const sugHeight = 23;

    for (let i = 0; i < suggestions.length; i++)
    {
        suggestions[i].id = i;
        suggestions[i].rot = (((i) - (suggestions.length / 2)) * sugDegree);
        suggestions[i].left = 15 - Math.abs(((i) - ((suggestions.length - 1) / 2)) * 3) / 2;
        suggestions[i].top = (i * sugHeight) - (suggestions.length * sugHeight / 2) - sugHeight;
        suggestions[i].shortName = suggestions[i].name.substr(4, suggestions[i].name.length);
        if (suggestions[i].name) suggestions[i].shortName = suggestions[i].name;
    }

    const html = CABLES.UI.getHandleBarHtml("suggestions", { suggestions, showSelect });
    this._eleDialog.innerHTML = html;
    // $("#modalbg").show();
    this._bg.show();

    ele.show(this._eleDialog);

    this._eleDialog.style.left = mouseEvent.clientX + "px";
    this._eleDialog.style.top = mouseEvent.clientY + "px";

    for (let i = 0; i < suggestions.length; i++)
    {
        suggestions[i].rot = (((i) - (suggestions.length / 2)) * sugDegree);
        const left = 15 - Math.abs(((i) - ((suggestions.length - 1) / 2)) * 3);

        suggestions[i].shortName = suggestions[i].name.substr(4, suggestions[i].name.length);

        $("#suggestion" + i).css({ "opacity": 0 });
        $("#suggestion" + i).animate(
            {
                "opacity": 1,
                left,
            }, 230);

        suggestions[i].id = i;
    }
};
