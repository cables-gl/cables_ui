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

        this.zPosOps = -0.45;
        this.zPosOpsUnlinked = 0.24;
        this.zOpsBandDepth = 0.54;

        this.zDepthBufferResolution = 2 / 65536;
        this.zOpLayerStep = this.zDepthBufferResolution * 1.5;
        this.zOpSlot = this.zOpLayerStep * 8;
        this.zOpsMaxStackRank = Math.floor(this.zOpsBandDepth / this.zOpSlot);
        this.zOpsStackHeadroom = Math.floor(this.zOpsMaxStackRank / 4);
        this.zOpLayerHighlight = this.zOpLayerStep * 2;
        this.zOpLayerDecoration = -this.zOpLayerStep;
        this.zOpLayerPort = -this.zOpLayerStep * 2;
        this.zOpLayerTitle = -this.zOpLayerStep * 3;
        this.zOpLayerIndicator = -this.zOpLayerStep * 4;
        this.zPortDotOffset = -this.zOpLayerStep;

        this.zPosCableButtonRect = -0.4;
        this.zPosCables = -0.4;
        this.zPosSelectedOpsBorder = 0.3;
        this.zPosAreas = 0.35;
        this.zPosGreyOutRect = -0.1;

        this.zPosSubPatchAnimRect = 0.25;

        this.subPatchOpBorder = 2;
        this.rectResizeSize = 10;
    }
}

const gluiconfig = new GlUiConfig();
export default gluiconfig;
