import { Events } from "cables-shared-client";

/**
 * detect shaking of ops to disconnect
 *
 * @export
 * @class ShakeDetector
 * @extends {Events}
 */
export default class ShakeDetector extends Events
{
    constructor()
    {
        super();

        this.shakeCountP = 0;
        this.shakeCountN = 0;
        this.shakeLastX = -1;
        this.shakeStartTime = 0;
        this.shakeTimeOut = null;
        this.lastShakeDir = false;
    }

    /**
     * Description
     * @param {Number} __x
     * @param {Number} __y
     */
    down(__x, __y)
    {
        this.shakeCountP = 0;
        this.shakeCountN = 0;
    }

    move(a)
    {
        if (this.shakeLastX != -1)
        {
            if (this.shakeLastX - a > 30 && this.lastShakeDir)
            {
                this.lastShakeDir = false;
                this.shakeCountP++;
                this.shakeLastX = a;
                clearTimeout(this.shakeTimeOut);
                this.shakeTimeOut = setTimeout(function ()
                {
                    this.shakeCountP = 0;
                    this.shakeCountN = 0;
                }, 250);
            }
            else
            if (this.shakeLastX - a < -30 && !this.lastShakeDir)
            {
                this.lastShakeDir = true;
                this.shakeCountN++;
                this.shakeLastX = a;
                clearTimeout(this.shakeTimeOut);
                this.shakeTimeOut = setTimeout(function ()
                {
                    this.shakeCountP = 0;
                    this.shakeCountN = 0;
                }, 250);
            }
            if (this.shakeCountP + this.shakeCountN == 1)
            {
                this.shakeStartTime = CABLES.now();
            }

            if (this.shakeCountP + this.shakeCountN >= 6 && CABLES.now() - this.shakeStartTime > 100)
            {
                this.emitEvent("shake");
                // opui.op.unLinkTemporary();
                this.shakeLastX = -1;
            }
        }
        this.shakeLastX = a;
    }

    up()
    {
        this.shakeCountP = 0;
        this.shakeCountN = 0;
    }
}
