var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Keypresenter = function ()
{
    this.counter = 0;
    this._lastTextElement = null;
    this._lastKeyEvent = 0;
    // this.lines=[];
    this._lastWheel = 0;
    this._lineCounter = 0;
    $("body").append("<div id=\"keypresenter\"></div>");
};

CABLES.UI.Keypresenter.prototype.addLine = function (title)
{
    function setUpDeath(id)
    {
        setTimeout(function ()
        {
            $(id).fadeOut(400, function ()
            {
                $(id).css("opacity", 0.01);
                $(id).show();
                $(id).slideUp(400, function ()
                {
                    $(id).remove();
                });
            });
        }, 2000);
    }

    if (Date.now() - this._lastKeyEvent > 500)
    {
        setUpDeath("#kp-line" + this._lineCounter);
        this._lineCounter++;
        $("#keypresenter").append("<div class=\"kp-line\" id=\"kp-line" + this._lineCounter + "\"></div>");
    }
};

CABLES.UI.Keypresenter.prototype.showAction = function (title)
{
    const id = "kp-ele-" + this.counter;
    $("#kp-line" + this._lineCounter).append("<span id=\"" + id + "\" class=\"kp-ele\">" + title + "</span>");
    this.counter++;
    return id;
};


CABLES.UI.Keypresenter.prototype.start = function ()
{
    setInterval(this.addLine.bind(this), 250);

    $(document).keydown(function (e)
    {
        let str = e.key;

        if (e.key.length == 1)
        {
            if (e.key == " ")str = "_";
            str = str.toUpperCase();

            if (this._lastTextElement !== null && Date.now() - this._lastKeyEvent < 300)
            {
                str = this._lastTextElement.html() + str;
                this._lastTextElement.remove();
            }

            const id = this.showAction(str);
            this._lastTextElement = $("#" + id);
        }
        else
        {
            str = "[" + e.key + "]";
            if (e.key == "ArrowUp")str = "<span class=\"icon icon-arrow-up\"></span>";
            if (e.key == "ArrowDown")str = "<span class=\"icon icon-arrow-down\"></span>";
            if (e.key == "ArrowLeft")str = "<span class=\"icon icon-arrow-left\"></span>";
            if (e.key == "ArrowRight")str = "<span class=\"icon icon-arrow-right\"></span>";
            if (e.key == "Enter")str = "<span class=\"icon icon-corner-down-left\"></span>";
            if (e.key == "Meta")str = "<span class=\"icon icon-command\"></span>";
            this.showAction(str);
            this._lastTextElement = null;
        }

        this._lastKeyEvent = Date.now();
        // console.log(e);
    }.bind(this));

    $(document).on("mousedown", function (e)
    {
        let which = "left";
        if (e.buttons == 4)which = "middle";
        if (e.buttons == 2)which = "right";
        this.showAction("[click " + which + "]");
        this._lastKeyEvent = Date.now();
    }.bind(this));

    document.addEventListener("wheel", function ()
    {
        if (Date.now() - this._lastWheel > 1000)
        {
            this.showAction("[mousewheel]");
            this._lastWheel = Date.now();
        }
    }.bind(this));
};
