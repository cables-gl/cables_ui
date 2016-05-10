
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
    // colorOpBg:'#333',
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

    // getPortColor:function(port)
    // {
    //     if(!port)return '#ff0000';
    //     // TEST
    //     //return '#aaa'
    //     var type=port.getType();
    //     if(type==OP_PORT_TYPE_VALUE) return '#F0D165';
    //     else if(type==OP_PORT_TYPE_FUNCTION) return '#50B283';
    //     else if(type==OP_PORT_TYPE_OBJECT)  return '#DE8A3C';
    //     else if(type==OP_PORT_TYPE_ARRAY)  return '#7A8AE3';
    //     else if(type==OP_PORT_TYPE_DYNAMIC)  return '#733E70';
    //
    //     else return '#c6c6c6';
    // },

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
    // getOpColor:function(opName)
    // {
    //     var opColor = '#E0766C';
    //     if(!opName) return opColor;
    //     console.log("op name: " + opName );
    //     if( opName.startsWith('Ops.Gl') ) opColor='#8FD692';
    //     if( opName.startsWith('Ops.WebAudio') ) opColor='#83BDE0';
    //     if( opName.startsWith('Ops.Devices') ) opColor='#FFBC8A';
    //     if( opName.startsWith('Ops.Html') ) opColor='#E392BC';
    //
    //     return opColor;
    // },
    getOpHandleClassName:function(opName)
    {
        if(!opName) return 'op_handle_default';

        if( opName.startsWith('Ops.Gl') ) return 'op_handle_gl';
        if( opName.startsWith('Ops.WebAudio') ) return 'op_handle_audio';
        if( opName.startsWith('Ops.Devices') ) return 'op_handle_devices';
        if( opName.startsWith('Ops.Html') ) return 'op_handle_html';
        return 'op_handle_default';

    },

    linkingLine:
    {
        "stroke-width": 1,
    },


};
