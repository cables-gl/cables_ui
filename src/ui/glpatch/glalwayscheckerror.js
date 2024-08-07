
export default class GlAlwaysCheckError
{
    constructor(cgl)
    {
        this._cgl = cgl;
        this._originals = {};
        // this.shouldStart = true;
        this._count = 0;

        this.start();
    }


    _glGetError()
    {
        return this._cgl.gl.getError();
    }


    _profile(func, funcName)
    {
        const gl = this._cgl.gl;
        const self = this;
        return function ()
        {
            self._count++;
            // const start = performance.now(),
            let returnVal = func.apply(this, arguments);
            // op.patch.cgl.gl.getError();
            const error = self._glGetError();

            if (error != gl.NO_ERROR)
            {
                let errStr = "";
                if (error == gl.OUT_OF_MEMORY) errStr = "OUT_OF_MEMORY";
                if (error == gl.INVALID_ENUM) errStr = "INVALID_ENUM";
                if (error == gl.INVALID_OPERATION) errStr = "INVALID_OPERATION";
                if (error == gl.INVALID_FRAMEBUFFER_OPERATION) errStr = "INVALID_FRAMEBUFFER_OPERATION";
                if (error == gl.INVALID_VALUE) errStr = "INVALID_VALUE";
                if (error == gl.CONTEXT_LOST_WEBGL)
                {
                    this.aborted = true;
                    errStr = "CONTEXT_LOST_WEBGL";
                }
                if (error == gl.NO_ERROR) errStr = "NO_ERROR";

                console.warn("GL ERROR " + self._count + "th command: ", funcName);
                console.log("arguments", arguments);

                console.log("gl error [" + self._cgl.canvas.id + "]: ", error, errStr);
                // op.patch.printTriggerStack();
                console.log((new Error()).stack);

                // op.patch.printTriggerStack();

                const error2 = self._glGetError();
                console.log("err after", error2);
            }

            return returnVal;
        };
    }

    start()
    {
        const gl = this._cgl.gl;

        for (const i in gl)
        {
            if (typeof gl[i] == "function" && i != "getError")
            {
                this._originals[i] = gl[i];
                const orig = this._originals[i];
                gl[i] = this._profile(gl[i], "" + i);
            }
        }
    }

    // end()
    // {
    //     const gl = this._cgl.gl;
    //     cgl.debugOneFrame = false;
    //     for (const i in gl)
    //         if (this._originals[i] && typeof gl[i] == "function")
    //             gl[i] = this._originals[i];
    // }
}
