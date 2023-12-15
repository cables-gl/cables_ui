class GlUiConfig
{
    constructor()
    {
        this.OpTitlePaddingLeftRight = 10;
        this.OpTitlePaddingExtTitle = 1;

        // this.OpErrorDotSize = 8;

        this.portWidth = 10;
        this.portHeight = 5;
        this.portPadding = 2;

        this.opHeight = 31;
        this.opWidth = 20;

        this.minZoom = 15;
        this.zoomDefault = 500;

        this.newOpDistanceY = 40;
        this.zPosCableButtonRect = -0.9;
        this.drawBoundingRect = true;
        this.clickMaxDuration = 300;

        this.zPosOpArea = -0.1;
        this.zPosOpSelected = -0.3;

        this.zPosGlRectSelected = 0.4;
        this.zPosGlTitle = -0.01;
    }
}


const gluiconfig = new GlUiConfig();
export default gluiconfig;
