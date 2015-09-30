
CABLES.UI=CABLES.UI|| {};

CABLES.UI.uiConfig=
{
    portSize:10,
    portHeight:7,
    portPadding:2,

    colorBackground:'#333',
    colorLink:'#fff',
    colorLinkHover:'#fff',
    colorLinkInvalid:'#888',
    colorOpBg:'#ddd',
    colorOpBgSelected:'#ff9',
    colorPort:'#6c9fde',
    colorRubberBand:'#6c9fde',
    colorPortHover:'#f00',
    colorPatchStroke:'#6c9fde',

    colorSelected:'#fff',
    colorKey:'#6c9fde',
    colorKeyOther:'#ea6638',
    colorCursor:'#ea6638',

    watchValuesInterval:100,
    rendererSizes:[{w:640,h:360},{w:1024,h:768},{w:1280,h:720},{w:0,h:0}],

    getPortColor:function(port)
    {
        if(!port)return '#ff0000';
        var type=port.getType();
        if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
        else if(type==OP_PORT_TYPE_FUNCTION) return '#6c9fde';
        else if(type==OP_PORT_TYPE_OBJECT)  return '#26a92a';
        else if(type==OP_PORT_TYPE_ARRAY)  return '#a02bbd';
        else if(type==OP_PORT_TYPE_DYNAMIC)  return '#666';
        
        else return '#c6c6c6';
    },

    linkingLine:
    {
        "stroke-width": 1,
    }


};

