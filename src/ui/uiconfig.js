
CABLES.UI=CABLES.UI|| {};

CABLES.UI.uiConfig=
{

    portSize:10,
    portHeight:6,
    portPadding:2,
    resizeBarWidth:6,

    opHeight:31,
    opWidth:20,
    opWidthSmall:40,

    colorBackground:'#1a1a1a',
    colorLink:'#888',
    colorLinkHover:'#fff',
    colorLinkInvalid:'#666',
    // colorOpBg:'#333',
    colorOpText: '#eee',
    colorOpBgSelected:'#444',
    colorPort:'#6c9fde',
    colorRubberBand:'#52FDE1',
    colorPortHover:'#f00',
    colorPatchStroke:'#6c9fde',

    colorSelected:'#fff',
    colorKey:'#6c9fde',
    colorKeyOther:'#ea6638',
    colorCursor:'#ea6638',

    highlight:'#52FDE1',

    miniMapWidth:240,
    miniMapHeight:180,
    miniMapShowAutomaticallyNumOps:20,

    watchValuesInterval:33,
    rendererSizes:[{w:640,h:360},{w:1024,h:768},{w:1280,h:720},{w:0,h:0}],


    getPortClass:function(port)
    {
        var type=port.getType();
        if(type==OP_PORT_TYPE_VALUE) return 'port_color_value';
        else if(type==OP_PORT_TYPE_FUNCTION) return 'port_color_function';
        else if(type==OP_PORT_TYPE_OBJECT)  return 'port_color_object';
        else if(type==OP_PORT_TYPE_ARRAY)  return 'port_color_array';
        else if(type==OP_PORT_TYPE_DYNAMIC)  return 'port_color_dynamic';
        else return 'port_color_unknown';

    },

    getLinkClass:function(port)
    {
        var type=port.getType();
        if(type==OP_PORT_TYPE_VALUE) return 'link_color_value';
        else if(type==OP_PORT_TYPE_FUNCTION) return 'link_color_function';
        else if(type==OP_PORT_TYPE_OBJECT)  return 'link_color_object';
        else if(type==OP_PORT_TYPE_ARRAY)  return 'link_color_array';
        else if(type==OP_PORT_TYPE_DYNAMIC)  return 'link_color_dynamic';
        else return 'link_color_unknown';

    },


    getNamespaceClassName:function(opName)
    {
        if(!opName) return 'default';
        if( opName.startsWith('Ops.Gl') ) return 'gl';
        if( opName.startsWith('Ops.WebAudio') ) return 'audio';
        if( opName.startsWith('Ops.Devices') ) return 'devices';
        if( opName.startsWith('Ops.Html') ) return 'html';
        if( opName.startsWith('Ops.Sidebar') ) return 'html';
        return 'default';

    },

    getOpMiniRectClassName:function(opName)
    {
        return 'op_minirect_'+this.getNamespaceClassName(opName);
    },

    getOpHandleClassName:function(opName)
    {
        return 'op_handle_'+this.getNamespaceClassName(opName);
    },

    linkingLine:
    {
        "stroke-width": 1,
    },


};
