import { Events } from "cables-shared-client";
import { gui } from "../gui.js";
import UserSettings, { userSettings } from "../components/usersettings.js";

/**
 * managing mouse states buttons/position/dragging etc
 *
 * @export
 * @class MouseState
 * @extends {Events}
 */
export default class MouseState extends Events
{

    static BUTTON_NONE = 0;
    static BUTTON_LEFT = 1;
    static BUTTON_RIGHT = 2;
    static BUTTON_WHEEL = 4;
    static BUTTON_4 = 8;
    static BUTTON_5 = 16;

    constructor(canvas)
    {
        super();
        this._mouseOverCanvas = false;
        this._x = 0;
        this._y = 0;
        this._buttonStates = {};
        this._buttonStates[MouseState.BUTTON_LEFT] = { "down": false };
        this._buttonStates[MouseState.BUTTON_RIGHT] = { "down": false };
        this._buttonStates[MouseState.BUTTON_WHEEL] = { "down": false };
        this._buttonStates[MouseState.BUTTON_4] = { "down": false };
        this._buttonStates[MouseState.BUTTON_5] = { "down": false };
        this._numFingers = 0;

        this.shiftKey = false;
        this._isDragging = false;
        this._mouseDownX = 0;
        this._mouseDownY = 0;

        this._useDragCablesButton = MouseState.BUTTON_RIGHT;
        this.buttonForScrolling = MouseState.BUTTON_RIGHT;
        this.buttonForSelecting = MouseState.BUTTON_LEFT;

        this._initUserPrefs();

        userSettings.on(UserSettings.EVENT_CHANGE, this._initUserPrefs.bind(this));

        canvas.addEventListener("pointerenter", (/** @type {PointerEvent} */e) =>
        {
            if (e.pointerType == "touch") this._mouseOverCanvas = true;
            else this._mouseOverCanvas = true;
        });

        canvas.addEventListener("pointerleave", (/** @type {PointerEvent} */e) =>
        {
            if (e.pointerType == "touch") this._mouseOverCanvas = true;
            else this._mouseOverCanvas = false;
        });

        canvas.addEventListener("pointerdown", this._down.bind(this), { "passive": false });
        canvas.addEventListener("pointerup", this._up.bind(this), { "passive": false });
        canvas.addEventListener("pointermove", this.#move.bind(this), { "passive": false });
        // canvas.addEventListener("touchmove", this._move.bind(this), { "passive": false });

        /*
         * canvas.addEventListener("touchstart", this._down.bind(this), { "passive": false });
         * canvas.addEventListener("touchend", this._up.bind(this), { "passive": false });
         */

        canvas.addEventListener("touchenter", (e) =>
        {
            this._numFingers = e.touches.length;
        });

        canvas.addEventListener("touchleave", (e) =>
        {
            this._numFingers = e.touches.length;
        });
    }

    get x() { return this._x; }

    get y() { return this._y; }

    get numFingers() { return this._numFingers; }

    get mouseOverCanvas() { return this._mouseOverCanvas; }

    get buttonAny() { return this._buttonStates[MouseState.BUTTON_LEFT].down || this._buttonStates[MouseState.BUTTON_RIGHT].down || this._buttonStates[MouseState.BUTTON_WHEEL].down || this._buttonStates[MouseState.BUTTON_4].down || this._buttonStates[MouseState.BUTTON_5].down; }

    get buttonLeft() { return this._buttonStates[MouseState.BUTTON_LEFT].down; }

    get buttonRight() { return this._buttonStates[MouseState.BUTTON_RIGHT].down; }

    get buttonMiddle() { return this._buttonStates[MouseState.BUTTON_WHEEL].down; }

    get isDragging() { return this._isDragging; }

    _initUserPrefs()
    {
        const userSettingScrollButton = userSettings.get("patch_button_scroll");

        if (userSettingScrollButton == 4) this.buttonForScrolling = MouseState.BUTTON_WHEEL;
        if (userSettingScrollButton == 1) this.buttonForScrolling = MouseState.BUTTON_LEFT;
        if (userSettingScrollButton == 2) this.buttonForScrolling = MouseState.BUTTON_RIGHT;
    }

    _updateDebug()
    {
        let str = "";

        for (let i in this._buttonStates)
            str += i + ":" + (this._buttonStates[i].down ? "X" : "-") + " | ";

        gui.patchView._patchRenderer.debugData.mouseState = str;
    }

    /** @returns {Number} */
    getButton()
    {
        if (this._buttonStates[MouseState.BUTTON_LEFT].down) return MouseState.BUTTON_LEFT;
        if (this._buttonStates[MouseState.BUTTON_RIGHT].down) return MouseState.BUTTON_RIGHT;
        if (this._buttonStates[MouseState.BUTTON_WHEEL].down) return MouseState.BUTTON_WHEEL;
        if (this._buttonStates[MouseState.BUTTON_4].down) return MouseState.BUTTON_4;
        if (this._buttonStates[MouseState.BUTTON_5].down) return MouseState.BUTTON_5;
        return MouseState.BUTTON_NONE;
    }

    /** @param {Number} [button] */
    isButtonDown(button)
    {
        if (button === undefined) return this.buttonAny;
        return this._buttonStates[button].down;
    }

    /**
     * @private
     */
    _setButtonsUp()
    {
        for (const i in this._buttonStates)
        {
            this._buttonUp(i);
        }
    }

    /**
     * @private
     */
    _buttonUp(button)
    {
        if (this._buttonStates[button])
        {
            this._buttonStates[button].down = false;
            this.emitEvent("buttonUp", button);
        }
        this._updateDebug();
    }

    #buttonDown(button)
    {
        if (!this._buttonStates[button].down)
        {
            this._buttonStates[button].down = true;
            this.emitEvent("buttonDown", button);
        }
        this._updateDebug();
    }

    #setButton(button, newState)
    {
        if (button == MouseState.BUTTON_LEFT + MouseState.BUTTON_RIGHT)
        {
            this.#setButton(MouseState.BUTTON_LEFT, newState);
            this.#setButton(MouseState.BUTTON_RIGHT, newState);
            return;
        }
        if (button == MouseState.BUTTON_LEFT + MouseState.BUTTON_WHEEL)
        {
            this.#setButton(MouseState.BUTTON_LEFT, newState);
            this.#setButton(MouseState.BUTTON_WHEEL, newState);
            return;
        }
        if (button == MouseState.BUTTON_RIGHT + MouseState.BUTTON_WHEEL)
        {
            this.#setButton(MouseState.BUTTON_RIGHT, newState);
            this.#setButton(MouseState.BUTTON_WHEEL, newState);
            return;
        }

        if (!button) return;

        if (!this._buttonStates[button]) this._buttonStates[button] = {};

        if (this._buttonStates[button].down != newState)
        {
            const oldState = this._buttonStates[button].down;
            if (oldState && !newState) this._buttonUp(button);
            if (!oldState && newState) this.#buttonDown(button);
        }
    }

    debug(data)
    {
        data.mouse_OverCanvas = this._mouseOverCanvas;
        data.mouse_buttonStates = JSON.stringify(this._buttonStates);// .join(",");
    }

    /**
     * @param {PointerEvent} e
     */
    #move(e)
    {
        if (!e.pointerType) return;
        this._mouseOverCanvas = true;

        if (this.buttonAny)
        {
            this._isDragging = this._mouseDownX != e.offsetX || this._mouseDownY != e.offsetY;
            this.draggingDistance = Math.sqrt((e.offsetX - this._mouseDownX) ** 2 + (e.offsetY - this._mouseDownY) ** 2);
        }
        this.shiftKey = e.shiftKey;

        if (e.buttons)
        {
            for (let i in this._buttonStates) this._buttonStates[i].down = false;
            this.#setButton(e.buttons, true);
        }
        else this._setButtonsUp();
    }

    /**
     * @private
     */
    _down(e)
    {
        this._mouseDownX = e.offsetX;
        this._mouseDownY = e.offsetY;
        this._isDragging = false;
        this.draggingDistance = 0;
        this.#setButton(e.buttons, true);
    }

    /**
     * @private
     */
    _up(e)
    {
        this._isDragging = false;

        /*
         * console.log("up", e.buttons, e);
         * this._setButton(e.buttons, false);
         */
        if (e.buttons == 0) this._setButtonsUp();
    }

    get buttonStateForScrolling()
    {
        if (this.buttonForScrolling == this._useDragCablesButton && gui.patchView.patchRenderer.isDraggingPort()) return false;
        if (this.buttonForScrolling == this._useDragCablesButton && gui.patchView.patchRenderer.isDraggingPort()) return false;
        return this._buttonStates[this.buttonForScrolling].down;
    }

    get buttonStateForSelecting()
    {
        return this._buttonStates[this.buttonForSelecting].down;
    }

    get buttonStateForLinkDrag()
    {
        return this._buttonStates[this._useDragCablesButton].down;
    }

    get buttonStateForSelectionArea()
    {
        return this._buttonStates[MouseState.BUTTON_LEFT].down;
    }

    get buttonForRemoveLink()
    {
        return MouseState.BUTTON_RIGHT;
    }

    get buttonForLinkInsertOp()
    {
        return MouseState.BUTTON_LEFT;
    }
}
