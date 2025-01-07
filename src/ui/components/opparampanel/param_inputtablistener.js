import { ele } from "cables-shared-client";


let currentEle = null;
let currentEleListener = null;

export default class ParamTabInputListener
{
    constructor(ele)
    {
        this._ele = ele;

        if (currentEle) currentEle.removeEventListener("keydown", currentEleListener);

        currentEle = this._ele;
        currentEleListener = this._tabKeyListener.bind(this);

        this._ele.addEventListener("keydown", currentEleListener);
    }

    _tabKeyListener(event)
    {
        if (event.which == 9) // tab key
        {
            let r = true;
            event.preventDefault();
            if (event.shiftKey) r = this._switchToNextInput(-1);
            else r = this._switchToNextInput(1);

            return r;
        }
    }

    _switchToNextInput(dir)
    {
        const tabableInputs = ele.byClassAll("tabable");
        let currentIdx = -1;
        let prevIdx = -1;

        for (let i = 0; i < tabableInputs.length; i++)
        {
            if (tabableInputs[i] == this._ele || tabableInputs[i] == this._ele.parentElement)
            {
                prevIdx = i - 1;
                currentIdx = i;
                break;
            }
        }

        const nextIdx = currentIdx + dir;
        const nextEle = tabableInputs[nextIdx];

        if (nextEle)
        {
            if (nextEle.classList.contains("valuesliderinput") || nextEle.classList.contains("numberinput"))
            {
                nextEle.dispatchEvent(new Event("mousedown"));
                const inputEleId = "portval_" + nextEle.dataset.portnum + "_" + nextEle.dataset.panelid;
                const inputEle = ele.byId(inputEleId);

                this._ele.removeEventListener("keydown", CABLES.UI.paramsHelper.inputListenerCursorKeys);

                CABLES.UI.valueChanger(inputEleId, true, nextEle.dataset.portname, nextEle.dataset.opid);

                inputEle.focus();
                new ParamTabInputListener(inputEle);
            }
            else
            {
                nextEle.focus();
                new ParamTabInputListener(nextEle);
            }
        }
        else
        {
            console.log("element not found");
            document.activeElement.blur(); // blur when tab in last element - to execute math evaluation
            return true;
        }
        return false;
    }
}
