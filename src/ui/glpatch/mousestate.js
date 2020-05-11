CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.MouseState = class extends CABLES.EventTarget
{
    constructor(canvas)
    {
        super();
        this._mouseOverCanvas = false;
        this._x = 0;
        this._y = 0;
        this._buttonStates = [false, false, false, false];

        canvas.addEventListener("mouseenter", (e) =>
        {
            this._mouseOverCanvas = true;
        });

        canvas.addEventListener("mousedown", (e) =>
        {
            this._setButton(e.buttons, true);
        });

        canvas.addEventListener("mouseup", (e) =>
        {
            this._setButtonsUp();
        });

        canvas.addEventListener("mouseleave", (e) =>
        {
            this._mouseOverCanvas = false;
        });

        canvas.addEventListener("mousemove", (e) =>
        {
            this._mouseOverCanvas = true;
            // this._x = e.x;
            // this._y = e.y;

            if (e.buttons) this._setButton(e.buttons, true);
            else this._setButtonsUp();
        });
    }

    get mouseOverCanvas() { return this._mouseOverCanvas; }

    get buttonLeft() { return this._buttonStates[CABLES.UI.MOUSE_BUTTON_LEFT]; }

    get buttonRight() { return this._buttonStates[CABLES.UI.MOUSE_BUTTON_RIGHT]; }

    isButtonDown(button)
    {
        return this._buttonStates[button];
    }

    _setButtonsUp()
    {
        for (let i = 0; i < this._buttonStates.length; i++)
        {
            this._buttonUp(i);
        }
    }

    _buttonUp(button)
    {
        if (this._buttonStates[button])
        {
            this._buttonStates[button] = false;
            this.emitEvent("buttonUp", button);
        }
    }

    _buttonDown(button)
    {
        if (!this._buttonStates[button])
        {
            this._buttonStates[button] = true;
            this.emitEvent("buttonDown", button);
        }
    }

    _setButton(button, newState)
    {
        if (this._buttonStates[button] != newState)
        {
            const oldState = this._buttonStates[button];
            if (oldState && !newState) this._buttonUp(button);
            if (!oldState && newState) this._buttonDown(button);
        }
    }

    debug(data)
    {
        data.mouse_OverCanvas = this._mouseOverCanvas;
        data.mouse_buttonStates = this._buttonStates.join(",");
    }
};
