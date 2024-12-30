import { Events } from "cables-shared-client";

export default class GlTimeline extends Events
{
    constructor(cgl)
    {
        super();
        this.isAnimated = false;
        this.paused = false;
        this.cgl = cgl;
    }

    render(resX, resY)
    {
        this.cgl.gl.clearColor(0, 1, 0, 1);
        this.cgl.gl.clear(this.cgl.gl.COLOR_BUFFER_BIT | this.cgl.gl.DEPTH_BUFFER_BIT);
    }
}
