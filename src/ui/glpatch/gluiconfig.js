class GlUiConfig
{
    constructor()
    {
        this.OpTitlePaddingLeftRight = 10;
        this.OpTitlePaddingExtTitle = 1;

        this.portWidth = 10;
        this.portHeight = 5;
        this.portObjectOutline = 1.5;
        this.objColorInactiveMul = 0.8;

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
        this.zOpsBandDepth = 0.27;
        this.zPosOpsInAreas = this.zPosOps - this.zOpsBandDepth;

        this.zDepthBufferResolution = 2 / 65536;
        this.zOpLayerStep = this.zDepthBufferResolution * 1.5;
        this.zOpSlot = this.zOpLayerStep * 8;
        this.zOpsMaxDrawRank = Math.floor(this.zOpsBandDepth / this.zOpSlot);
        this.zOpsDrawHeadroom = Math.floor(this.zOpsMaxDrawRank / 4);
        this.zOpLayerHighlight = this.zOpLayerStep * 2;
        this.zOpLayerDecoration = -this.zOpLayerStep;
        this.zOpLayerPort = -this.zOpLayerStep * 2;
        this.zOpLayerTitle = -this.zOpLayerStep * 3;
        this.zOpLayerIndicator = -this.zOpLayerStep * 4;
        this.zPortDotOffset = -this.zOpLayerStep;
        this.zOpLayerCable = this.zOpLayerStep;

        this.zPosCables = -0.4;
        this.zPosSelectedOpsBorder = 0.3;
        this.zPosHoverPort = -0.995;
        this.zPosAreas = 0.35;
        this.zPosStackRects = 0.32;
        this.zPosGreyOutRect = -0.1;

        this.zPosSubPatchAnimRect = 0.25;

        this.subPatchOpBorder = 2;
        this.rectResizeSize = 10;
        this.areaFlashDuration = 0.3;
        this.opStackGap = 2;
        this.opStackNumRects = 2;
        this.opStackBrighten = 0.08;
        this.opStackShadeStep = 0.03;
    }
}

const gluiconfig = new GlUiConfig();
export default gluiconfig;
