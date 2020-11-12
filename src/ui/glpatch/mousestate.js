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
        this._buttonStates = [false, false, false, false, false];
        this._numFingers = 0;

        this._isDragging = false;
        this._mouseDownX = 0;
        this._mouseDownY = 0;

        canvas.addEventListener("mouseenter", (e) =>
        {
            this._mouseOverCanvas = true;
        });

        canvas.addEventListener("mousedown", (e) =>
        {
            this._mouseDownX = e.offsetX;
            this._mouseDownY = e.offsetY;
            this._isDragging = false;

            this._setButton(e.buttons, true);
        });

        canvas.addEventListener("mouseup", (e) =>
        {
            this._isDragging = false;
            this._setButtonsUp();
        });

        canvas.addEventListener("mouseleave", (e) =>
        {
            this._mouseOverCanvas = false;
        });

        canvas.addEventListener("mousemove", (e) =>
        {
            this._mouseOverCanvas = true;

            if (this.buttonAny) this._isDragging = this._mouseDownX != e.offsetX || this._mouseDownY != e.offsetY;

            if (e.buttons) this._setButton(e.buttons, true);
            else this._setButtonsUp();
        });

        canvas.addEventListener("touchmove", (e) =>
        {
            this._numFingers = e.touches.length;
        });
        canvas.addEventListener("touchenter", (e) =>
        {
            this._numFingers = e.touches.length;
        });
        canvas.addEventListener("touchleave", (e) =>
        {
            this._numFingers = e.touches.length;
        });
    }

    get numFingers() { return this._numFingers; }

    get mouseOverCanvas() { return this._mouseOverCanvas; }

    get buttonAny() { return this._buttonStates[0] || this._buttonStates[1] || this._buttonStates[2] || this._buttonStates[3]; }

    get buttonLeft() { return this._buttonStates[CABLES.UI.MOUSE_BUTTON_LEFT]; }

    get buttonRight() { return this._buttonStates[CABLES.UI.MOUSE_BUTTON_RIGHT]; }

    get buttonMiddle() { return this._buttonStates[CABLES.UI.MOUSE_BUTTON_MIDDLE]; }

    get isDragging() { return this._isDragging; }

    getButton()
    {
        if (this._buttonStates[CABLES.UI.MOUSE_BUTTON_LEFT]) return CABLES.UI.MOUSE_BUTTON_LEFT;
        if (this._buttonStates[CABLES.UI.MOUSE_BUTTON_RIGHT]) return CABLES.UI.MOUSE_BUTTON_RIGHT;
        if (this._buttonStates[CABLES.UI.MOUSE_BUTTON_MIDDLE]) return CABLES.UI.MOUSE_BUTTON_MIDDLE;
        return CABLES.UI.MOUSE_BUTTON_NONE;
    }

    isButtonDown(button)
    {
        if (button === undefined)
        {
            return this._buttonStates[0] || this._buttonStates[1] || this._buttonStates[2] || this._buttonStates[3];
        }
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
