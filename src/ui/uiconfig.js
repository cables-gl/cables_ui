
CABLES.UI=CABLES.UI|| {};

CABLES.UI.uiConfig=
{
    portSize:10,
    portHeight:7,
    portPadding:2,
    resizeBarWidth:8,

    colorBackground:'#1a1a1a',
    colorLink:'#fff',
    colorLinkHover:'#fff',
    colorLinkInvalid:'#666',
    colorOpBg:'#333',
    colorOpText: '#eee',
    colorOpBgSelected:'#444',
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
        // TEST
        //return '#aaa'
        var type=port.getType();
        if(type==OP_PORT_TYPE_VALUE) return '#F0D165';
        else if(type==OP_PORT_TYPE_FUNCTION) return '#50B283';
        else if(type==OP_PORT_TYPE_OBJECT)  return '#DE8A3C';
        else if(type==OP_PORT_TYPE_ARRAY)  return '#7874E3';
        else if(type==OP_PORT_TYPE_DYNAMIC)  return '#733E70';

        else return '#c6c6c6';
    },
    getOpColor:function(opName)
    {
        var opColor = '#E0766C';
        if(!opName) return opColor;
        console.log("op name: " + opName );
        if( opName.startsWith('Ops.Gl') ) opColor='#8FD692';
        if( opName.startsWith('Ops.WebAudio') ) opColor='#83BDE0';
        if( opName.startsWith('Ops.Devices') ) opColor='#FFBC8A';
        if( opName.startsWith('Ops.Html') ) opColor='#E392BC';

        return opColor;
    },

    linkingLine:
    {
        "stroke-width": 1,
    },


};
