import { Logger } from "cables-shared-client";
import { Port } from "cables";
import defaultOps from "./defaultops.js";
import { PortDir, portType } from "./core_constants.js";

export default class opNames {}

const Log = new Logger("opnames");

opNames.getNamespaceClassName = (opName) =>
{
    const opNameParts = opName.split(".");
    return "nsColor_" + opNameParts[0] + "_" + opNameParts[1];
};

/**
 * @param {Port} p
 */
opNames.getVizOpsForPortLink = (p) =>
{
    if (p && p.direction == PortDir.out)
    {
        if (p.type == portType.string) return [defaultOps.defaultOpNames.VizString, defaultOps.defaultOpNames.VizLogger];
        else if (p.type == portType.number && (p.uiAttribs.display == "bool" || p.uiAttribs.display == "boolnum")) return [defaultOps.defaultOpNames.VizBool, defaultOps.defaultOpNames.VizNumber, defaultOps.defaultOpNames.VizLogger];
        else if (p.type == portType.number) return [defaultOps.defaultOpNames.VizNumber, defaultOps.defaultOpNames.VizGraph, defaultOps.defaultOpNames.VizNumberBar, defaultOps.defaultOpNames.VizLogger];
        else if (p.type == portType.array) return [defaultOps.defaultOpNames.VizArrayTable, defaultOps.defaultOpNames.VizArrayGraph];
        else if (p.type == portType.object && p.uiAttribs.objType == "texture") return [defaultOps.defaultOpNames.VizTexture, defaultOps.defaultOpNames.VizTextureTable, defaultOps.defaultOpNames.VizObject];
        else if (p.type == portType.object) return [defaultOps.defaultOpNames.VizObject];
    }
    return [];
};

/**
 * @param {Port} p
 */
opNames.getOpsForPortLink = (p) =>
{
    if (p && p.direction == PortDir.in)
    {
        if (p.type == portType.string) return [defaultOps.defaultOpNames.string, defaultOps.defaultOpNames.stringEditor];
        else if (p.type == portType.number) return [defaultOps.defaultOpNames.number];
        else if (p.type == portType.array) return [defaultOps.defaultOpNames.array, defaultOps.defaultOpNames.randomarray, defaultOps.defaultOpNames.StringToArray];
        else if (p.type == portType.trigger) return [defaultOps.defaultOpNames.sequence];
        else if (p.type == portType.object && p.uiAttribs.objType == "texture") return [defaultOps.defaultOpNames.defaultOpImage, defaultOps.defaultOpNames.textureGradient, defaultOps.defaultOpNames.textureNoise];
        else if (p.type == portType.object && p.uiAttribs.objType == "element") return [defaultOps.defaultOpNames.divElement];
        else if (p.type == portType.object && p.uiAttribs.objType == "shader") return [defaultOps.defaultOpNames.customShader];
        else if (p.type == portType.object) return [defaultOps.defaultOpNames.parseObject];
    }
    if (p && p.direction == PortDir.out)
        if (p.type == portType.trigger) return [defaultOps.defaultOpNames.vizTrigger, defaultOps.defaultOpNames.sequence];

    return [];
};

/**
 * @param {String} filename
 */
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

    if (type == portType.number)
    {
        opSetterName = defaultOps.defaultOpNames.VarSetNumber;
        opGetterName = defaultOps.defaultOpNames.VarGetNumber;
        opSetTriggerName = defaultOps.defaultOpNames.VarTriggerNumber;
    }
    else if (type == portType.object)
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
    else if (type == portType.array)
    {
        opSetterName = defaultOps.defaultOpNames.VarSetArray;
        opGetterName = defaultOps.defaultOpNames.VarGetArray;
        opSetTriggerName = defaultOps.defaultOpNames.VarTriggerArray;
    }
    else if (type == portType.string)
    {
        opSetterName = defaultOps.defaultOpNames.VarSetString;
        opGetterName = defaultOps.defaultOpNames.VarGetString;
        opSetTriggerName = defaultOps.defaultOpNames.VarTriggerString;
    }
    else if (type == portType.trigger)
    {
        portName = "Trigger";
        portNameOut = "Triggered";

        opSetterName = defaultOps.defaultOpNames.VarSetTrigger;
        opGetterName = defaultOps.defaultOpNames.VarGetTrigger;
        opSetTriggerName = opSetterName;
    }
    else
    {
        Log.warn("createvar unknown var", type);
    }

    return {
        "portName": portName,
        "portNameOut": portNameOut,
        "setter": opSetterName,
        "getter": opGetterName,
        "setTrigger": opSetTriggerName
    };
};

/**
 * @param {number} type
 */
opNames.getPortTypeClassHtml = (type) =>
{
    if (type == portType.number) return "port_text_color_value";
    if (type == portType.trigger) return "port_text_color_function";
    if (type == portType.object) return "port_text_color_object";
    if (type == portType.array) return "port_text_color_array";
    if (type == portType.string) return "port_text_color_string";
    if (type == portType.dynamic) return "port_text_color_dynamic";
    return "port_text_color_unknown";
};

/**
 * @param {number} type
 */
opNames.getPortTypeClass = (type) =>
{
    if (type == portType.number) return "port_color_value";
    if (type == portType.trigger) return "port_color_function";
    if (type == portType.object) return "port_color_object";
    if (type == portType.array) return "port_color_array";
    if (type == portType.string) return "port_color_string";
    if (type == portType.dynamic) return "port_color_dynamic";
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

/**
 * @param {number} type
 */
opNames.getRerouteOp = (type) =>
{
    if (type == portType.number) return defaultOps.defaultOpNames.rerouteNumber;
    if (type == portType.string) return defaultOps.defaultOpNames.rerouteString;
    if (type == portType.array) return defaultOps.defaultOpNames.rerouteArray;
    if (type == portType.object) return defaultOps.defaultOpNames.rerouteObject;
    if (type == portType.trigger) return defaultOps.defaultOpNames.rerouteTrigger;
};
