class GlUiConfig
{
    constructor()
    {
        this.OpTitlePaddingLeftRight = 10;
        this.OpTitlePaddingExtTitle = 1;

        this.portWidth = 10;
        this.portHeight = 5;

        this.portPadding = 2;
        // this.portLongPortHeight = this.portPadding * 1.5;
        this.portLongPortHeight = this.portHeight;

        this.opHeight = 31;
        this.opWidth = 20;

        this.minZoom = 15;
        this.zoomDefault = 500;

        this.newOpDistanceY = 40;

        this.drawBoundingRect = true;
        this.clickMaxDuration = 300;

        this.zPosOpUnSelected = -0.5;
        this.zPosOpSelected = -0.6;
        this.zPosOpUnlinked = 0.1;

        this.zPosCableButtonRect = -0.4;
        this.zPosCables = -0.4;
        this.zPosGreyOutRect = -0.1;

        this.zPosGlRectSelected = 0.25; // is relative child of op glbgrect
        this.zPosGlTitle = -0.01; // is relative child of op glbgrect

        this.subPatchOpBorder = 2;
        this.rectResizeSize = 10;
    }
}

const gluiconfig = new GlUiConfig();
export default gluiconfig;
