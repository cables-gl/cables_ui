

export default class MouseState extends CABLES.EventTarget
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

        canvas.addEventListener("pointerenter", (e) =>
        {
            this._mouseOverCanvas = true;
        });

        canvas.addEventListener("pointerleave", (e) =>
        {
            this._mouseOverCanvas = false;
        });

        canvas.addEventListener("pointerdown", this._down.bind(this));
        canvas.addEventListener("pointerup", this._up.bind(this));
        canvas.addEventListener("pointermove", this._move.bind(this));
        canvas.addEventListener("touchmove", this._move.bind(this));

        canvas.addEventListener("touchstart", this._down.bind(this));
        canvas.addEventListener("touchend", this._up.bind(this));

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

    get buttonLeft() { return this._buttonStates[MouseState.BUTTON_LEFT]; }

    get buttonRight() { return this._buttonStates[MouseState.BUTTON_RIGHT]; }

    get buttonMiddle() { return this._buttonStates[MouseState.BUTTON_WHEEL]; }


    get buttonForScrolling()
    {
        return this._buttonStates[MouseState.BUTTON_RIGHT];
    }

    get isDragging() { return this._isDragging; }

    getButton()
    {
        if (this._buttonStates[MouseState.BUTTON_LEFT]) return MouseState.BUTTON_LEFT;
        if (this._buttonStates[MouseState.BUTTON_RIGHT]) return MouseState.BUTTON_RIGHT;
        if (this._buttonStates[MouseState.BUTTON_WHEEL]) return MouseState.BUTTON_WHEEL;
        return MouseState.BUTTON_NONE;
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

    _move(e)
    {
        if (!e.pointerType) return;
        this._mouseOverCanvas = true;

        if (this.buttonAny)
        {
            this._isDragging = this._mouseDownX != e.offsetX || this._mouseDownY != e.offsetY;
            this.draggingDistance = Math.sqrt((e.offsetX - this._mouseDownX) ** 2 + (e.offsetY - this._mouseDownY) ** 2);
        }

        if (e.buttons) this._setButton(e.buttons, true);
        else this._setButtonsUp();
    }

    _down(e)
    {
        this._mouseDownX = e.offsetX;
        this._mouseDownY = e.offsetY;
        this._isDragging = false;
        this.draggingDistance = 0;
        this._setButton(e.buttons, true);
    }

    _up(e)
    {
        this._isDragging = false;
        this._setButtonsUp();
    }
}

MouseState.BUTTON_NONE = 0;
MouseState.BUTTON_LEFT = 1;
MouseState.BUTTON_RIGHT = 2;
MouseState.BUTTON_WHEEL = 4;
