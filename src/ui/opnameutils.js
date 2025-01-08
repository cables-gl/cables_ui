import defaultOps from "./defaultops.js";

export default class opNames {}

opNames.getNamespaceClassName = (opName) =>
{
    const opNameParts = opName.split(".");
    return "nsColor_" + opNameParts[0] + "_" + opNameParts[1];
};

opNames.getVizOpsForPortLink = (p, l) =>
{
    if (p && p.direction == CABLES.PORT_DIR_OUT)
    {
        if (p.type == CABLES.OP_PORT_TYPE_STRING) return [defaultOps.defaultOpNames.VizString, defaultOps.defaultOpNames.VizLogger];
        else if (p.type == CABLES.OP_PORT_TYPE_VALUE && (p.uiAttribs.display == "bool" || p.uiAttribs.display == "boolnum")) return [defaultOps.defaultOpNames.VizBool, defaultOps.defaultOpNames.VizNumber, defaultOps.defaultOpNames.VizLogger];
        else if (p.type == CABLES.OP_PORT_TYPE_VALUE) return [defaultOps.defaultOpNames.VizNumber, defaultOps.defaultOpNames.VizGraph, defaultOps.defaultOpNames.VizNumberBar, defaultOps.defaultOpNames.VizLogger];
        else if (p.type == CABLES.OP_PORT_TYPE_ARRAY) return [defaultOps.defaultOpNames.VizArrayTable, defaultOps.defaultOpNames.VizArrayGraph];
        else if (p.type == CABLES.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "texture") return [defaultOps.defaultOpNames.VizTexture, defaultOps.defaultOpNames.VizTextureTable, defaultOps.defaultOpNames.VizObject];
        else if (p.type == CABLES.OP_PORT_TYPE_OBJECT) return [defaultOps.defaultOpNames.VizObject];
    }
    return [];
};
opNames.getOpsForPortLink = (p, l) =>
{
    if (p && p.direction == CABLES.PORT_DIR_IN)
    {
        if (p.type == CABLES.OP_PORT_TYPE_STRING) return [defaultOps.defaultOpNames.string, defaultOps.defaultOpNames.stringEditor];
        else if (p.type == CABLES.OP_PORT_TYPE_VALUE) return [defaultOps.defaultOpNames.number];
        else if (p.type == CABLES.OP_PORT_TYPE_ARRAY) return [defaultOps.defaultOpNames.array, defaultOps.defaultOpNames.randomarray, defaultOps.defaultOpNames.StringToArray];
        else if (p.type == CABLES.OP_PORT_TYPE_FUNCTION) return [defaultOps.defaultOpNames.sequence];
        else if (p.type == CABLES.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "texture") return [defaultOps.defaultOpNames.defaultOpImage, defaultOps.defaultOpNames.textureGradient, defaultOps.defaultOpNames.textureNoise];
        else if (p.type == CABLES.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "element") return [defaultOps.defaultOpNames.divElement];
        else if (p.type == CABLES.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "shader") return [defaultOps.defaultOpNames.customShader];
        else if (p.type == CABLES.OP_PORT_TYPE_OBJECT) return [defaultOps.defaultOpNames.parseObject];
    }
    if (p && p.direction == CABLES.PORT_DIR_OUT)
        if (p.type == CABLES.OP_PORT_TYPE_FUNCTION) return [defaultOps.defaultOpNames.vizTrigger, defaultOps.defaultOpNames.sequence];

    return [];
};

opNames.getOpsForFilename = (filename) =>
{
    const ops = [];
    if (!filename) return ops;

    filename = filename.toLowerCase();

    if (filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".jxl") || filename.endsWith(".webp")) ops.push(defaultOps.defaultOpNames.defaultOpImage);
    else if (filename.endsWith(".ogg") || filename.endsWith(".wav") || filename.endsWith(".mp3") || filename.endsWith(".m4a") || filename.endsWith(".aac")) ops.push(defaultOps.defaultOpNames.defaultOpAudio);
    else if (filename.endsWith(".mp4") || filename.endsWith(".m4a") || filename.endsWith(".mpg") || filename.endsWith(".webm") || filename.endsWith(".mkv") || filename.endsWith(".mov")) ops.push(defaultOps.defaultOpNames.defaultOpVideo);
    else if (filename.endsWith(".glb")) ops.push(defaultOps.defaultOpNames.defaultOpGltf);
    else if (filename.endsWith(".json")) ops.push(defaultOps.defaultOpNames.defaultOpJson);
    else if (filename.endsWith(".ttf") || filename.endsWith(".woff") || filename.endsWith(".woff2") || filename.endsWith(".otf")) ops.push(defaultOps.defaultOpNames.defaultFont);
    else if (filename.endsWith(".exr")) ops.push(defaultOps.defaultOpNames.defaultOpExr);
    else if (filename.endsWith(".svg")) ops.push(defaultOps.defaultOpNames.defaultOpSvg);
    else if (filename.endsWith(".css")) ops.push(defaultOps.defaultOpNames.defaultOpCss);

    if (ops.length === 0 && defaultOps.defaultOpNames.defaultOpFallback) ops.push(defaultOps.defaultOpNames.defaultOpFallback);

    return ops;
};
opNames.getVarGetterOpNameByType = (type, port) =>
{
    let portName = "Value";
    let portNameOut = portName;
    let opSetterName = "unknown";
    let opGetterName = "unknown";
    let opSetTriggerName = "unknown";

    if (type == CABLES.OP_PORT_TYPE_VALUE)
    {
        opSetterName = defaultOps.defaultOpNames.VarSetNumber;
        opGetterName = defaultOps.defaultOpNames.VarGetNumber;
        opSetTriggerName = defaultOps.defaultOpNames.VarTriggerNumber;
    }
    else if (type == CABLES.OP_PORT_TYPE_OBJECT)
    {
        opSetterName = defaultOps.defaultOpNames.VarSetObject;
        opGetterName = defaultOps.defaultOpNames.VarGetObject;
        opSetTriggerName = defaultOps.defaultOpNames.VarTriggerObject;

        if (port && port.uiAttribs.objType == "texture")
        {
            opSetterName = defaultOps.defaultOpNames.VarSetTexture;
            opGetterName = defaultOps.defaultOpNames.VarGetTexture;
        }
    }
    else if (type == CABLES.OP_PORT_TYPE_ARRAY)
    {
        opSetterName = defaultOps.defaultOpNames.VarSetArray;
        opGetterName = defaultOps.defaultOpNames.VarGetArray;
        opSetTriggerName = defaultOps.defaultOpNames.VarTriggerArray;
    }
    else if (type == CABLES.OP_PORT_TYPE_STRING)
    {
        opSetterName = defaultOps.defaultOpNames.VarSetString;
        opGetterName = defaultOps.defaultOpNames.VarGetString;
        opSetTriggerName = defaultOps.defaultOpNames.VarTriggerString;
    }
    else if (type == CABLES.OP_PORT_TYPE_FUNCTION)
    {
        portName = "Trigger";
        portNameOut = "Triggered";

        opSetterName = defaultOps.defaultOpNames.VarSetTrigger;
        opGetterName = defaultOps.defaultOpNames.VarGetTrigger;
        opSetTriggerName = opSetterName;
    }
    else
    {
        console.log("createvar unknown var", type);
    }

    return {
        "portName": portName,
        "portNameOut": portNameOut,
        "setter": opSetterName,
        "getter": opGetterName,
        "setTrigger": opSetTriggerName
    };
};

opNames.getPortTypeClassHtml = (type) =>
{
    if (type == CABLES.OP_PORT_TYPE_VALUE) return "port_text_color_value";
    if (type == CABLES.OP_PORT_TYPE_FUNCTION) return "port_text_color_function";
    if (type == CABLES.OP_PORT_TYPE_OBJECT) return "port_text_color_object";
    if (type == CABLES.OP_PORT_TYPE_ARRAY) return "port_text_color_array";
    if (type == CABLES.OP_PORT_TYPE_STRING) return "port_text_color_string";
    if (type == CABLES.OP_PORT_TYPE_DYNAMIC) return "port_text_color_dynamic";
    return "port_text_color_unknown";
};

opNames.getPortTypeClass = (type) =>
{
    if (type == CABLES.OP_PORT_TYPE_VALUE) return "port_color_value";
    if (type == CABLES.OP_PORT_TYPE_FUNCTION) return "port_color_function";
    if (type == CABLES.OP_PORT_TYPE_OBJECT) return "port_color_object";
    if (type == CABLES.OP_PORT_TYPE_ARRAY) return "port_color_array";
    if (type == CABLES.OP_PORT_TYPE_STRING) return "port_color_string";
    if (type == CABLES.OP_PORT_TYPE_DYNAMIC) return "port_color_dynamic";
    return "port_color_unknown";
};

// opNames.getVarClass = (type) =>
// {
//     if (type == "number") return "port_text_color_value";
//     if (type == "trigger") return "link_color_function";
//     if (type == "object") return "port_text_color_object";
//     if (type == "array") return "port_text_color_array";
//     if (type == "string") return "port_text_color_string";
//     else return "link_color_dynamic";
// };

opNames.getRerouteOp = (type) =>
{
    if (type == CABLES.OP_PORT_TYPE_NUMBER) return defaultOps.defaultOpNames.rerouteNumber;
    if (type == CABLES.OP_PORT_TYPE_STRING) return defaultOps.defaultOpNames.rerouteString;
    if (type == CABLES.OP_PORT_TYPE_ARRAY) return defaultOps.defaultOpNames.rerouteArray;
    if (type == CABLES.OP_PORT_TYPE_OBJECT) return defaultOps.defaultOpNames.rerouteObject;
    if (type == CABLES.OP_PORT_TYPE_FUNCTION) return defaultOps.defaultOpNames.rerouteTrigger;
};
