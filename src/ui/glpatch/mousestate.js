import userSettings from "../components/usersettings";


export default class MouseState extends CABLES.EventTarget
{
    constructor(canvas)
    {
        super();
        this._mouseOverCanvas = false;
        this._x = 0;
        this._y = 0;
        this._buttonStates = {};
        this._buttonStates[MouseState.BUTTON_LEFT] = false;
        this._buttonStates[MouseState.BUTTON_RIGHT] = false;
        this._buttonStates[MouseState.BUTTON_WHEEL] = false;
        this._buttonStates[MouseState.BUTTON_4] = false;
        this._buttonStates[MouseState.BUTTON_5] = false;
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

    get buttonAny() { return this._buttonStates[MouseState.BUTTON_LEFT] || this._buttonStates[MouseState.BUTTON_RIGHT] || this._buttonStates[MouseState.BUTTON_WHEEL] || this._buttonStates[MouseState.BUTTON_4] || this._buttonStates[MouseState.BUTTON_5]; }

    get buttonLeft() { return this._buttonStates[MouseState.BUTTON_LEFT]; }

    get buttonRight() { return this._buttonStates[MouseState.BUTTON_RIGHT]; }

    get buttonMiddle() { return this._buttonStates[MouseState.BUTTON_WHEEL]; }

    get isDragging() { return this._isDragging; }

    getButton()
    {
        if (this._buttonStates[MouseState.BUTTON_LEFT]) return MouseState.BUTTON_LEFT;
        if (this._buttonStates[MouseState.BUTTON_RIGHT]) return MouseState.BUTTON_RIGHT;
        if (this._buttonStates[MouseState.BUTTON_WHEEL]) return MouseState.BUTTON_WHEEL;
        if (this._buttonStates[MouseState.BUTTON_4]) return MouseState.BUTTON_4;
        if (this._buttonStates[MouseState.BUTTON_5]) return MouseState.BUTTON_5;
        return MouseState.BUTTON_NONE;
    }

    isButtonDown(button)
    {
        if (button === undefined) return this.buttonAny;
        return this._buttonStates[button];
    }

    _setButtonsUp()
    {
        for (const i in this._buttonStates)
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
        data.mouse_buttonStates = JSON.stringify(this._buttonStates);// .join(",");
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

    get buttonStateForScrolling()
    {
        return this._buttonStates[parseInt(userSettings.get("patch_button_scroll") || MouseState.BUTTON_RIGHT)];
        // return this._buttonStates[MouseState.BUTTON_LEFT + MouseState.BUTTON_RIGHT];
    }

    get buttonStateForLinkInsertOp()
    {
        return this._buttonStates[MouseState.BUTTON_LEFT];
    }

    get buttonStateForLinkDrag()
    {
        return this._buttonStates[MouseState.BUTTON_RIGHT];
    }

    get buttonStateForSelectionArea()
    {
        return this._buttonStates[MouseState.BUTTON_LEFT];
    }

    get buttonForRemoveLink()
    {
        return MouseState.BUTTON_RIGHT;
    }
}

MouseState.BUTTON_NONE = 0;
MouseState.BUTTON_LEFT = 1;
MouseState.BUTTON_RIGHT = 2;
MouseState.BUTTON_WHEEL = 4;
MouseState.BUTTON_4 = 8;
MouseState.BUTTON_5 = 16;
