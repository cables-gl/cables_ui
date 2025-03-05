export default class Keypresenter
{
    constructor()
    {
        this.counter = 0;
        this._lastTextElement = null;
        this._lastKeyEvent = 0;
        this._lastWheel = 0;
        this._lineCounter = 0;
        const body = document.getElementsByTagName("body")[0];
        const keypresenter = document.createElement("div");
        keypresenter.id = "keypresenter";
        body.appendChild(keypresenter);
        this._container = keypresenter;
    }

    addLine()
    {
        if (Date.now() - this._lastKeyEvent > 500)
        {
            const elId = "#kp-line" + this._lineCounter;
            setTimeout(function ()
            {
                const el = document.querySelector(elId);
                if (el) el.remove();
            }, 2000);

            this._lineCounter++;

            const newEl = document.createElement("div");
            newEl.id = "kp-line" + this._lineCounter;
            newEl.classList.add("kp-line");
            this._container.appendChild(newEl);
        }
    }

    showAction(title)
    {
        const id = "kp-ele-" + this.counter;
        const actionEl = document.createElement("span");
        actionEl.id = id;
        actionEl.classList.add("kp-ele");
        actionEl.innerHTML = title;
        const line = document.getElementById("kp-line" + this._lineCounter);
        if (line) line.appendChild(actionEl);
        this.counter++;
        return id;
    }

    start()
    {
        setInterval(this.addLine.bind(this), 250);

        document.addEventListener("keydown", function (e)
        {
            let str = e.key;
            if (e.key.length === 1)
            {
                if (e.key === " ")str = "_";
                if (str)
                {
                    str = str.toUpperCase();
                    if (this._lastTextElement !== null && Date.now() - this._lastKeyEvent < 300)
                    {
                        str = this._lastTextElement.innerHTML + str;
                        this._lastTextElement.remove();
                    }

                    const id = this.showAction(str);
                    this._lastTextElement = document.getElementById(id);
                }
            }
            else
            {
                str = "[" + e.key + "]";
                if (e.key === "ArrowUp")str = "<span class=\"icon icon-arrow-up\"></span>";
                if (e.key === "ArrowDown")str = "<span class=\"icon icon-arrow-down\"></span>";
                if (e.key === "ArrowLeft")str = "<span class=\"icon icon-arrow-left\"></span>";
                if (e.key === "ArrowRight")str = "<span class=\"icon icon-arrow-right\"></span>";
                if (e.key === "Enter")str = "<span class=\"icon icon-corner-down-left\"></span>";
                if (e.key === "Meta")str = "<span class=\"icon icon-command\"></span>";
                this.showAction(str);
                this._lastTextElement = null;
            }

            this._lastKeyEvent = Date.now();
        }.bind(this));

        document.addEventListener("mousedown", (e) =>
        {
            let which = "left";
            if (e.buttons == 4)which = "middle";
            if (e.buttons == 2)which = "right";
            this.showAction("[click " + which + "]");
            this._lastKeyEvent = Date.now();
        });

        document.addEventListener("wheel", () =>
        {
            if (Date.now() - this._lastWheel > 1000)
            {
                this.showAction("[mousewheel]");
                this._lastWheel = Date.now();
            }
        });
    }
}
