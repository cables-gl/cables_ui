/**
 * default ops for various shortcuts/operations/files/variables etc.
 *
 */

import { portType } from "./core_constants.js";

const defaultOpNames =
{
    "number": "Ops.Number.Number",
    "string": "Ops.String.String_v3",
    "array": "Ops.Array.Array_v3",
    "anim": "Ops.TimeLine.Anim",
    "randomarray": "Ops.Array.RandomNumbersArray_v4",
    "defaultOpImage": "Ops.Gl.Texture_v2",
    "defaultOpAudio": "Ops.WebAudio.AudioBuffer_v3",
    "defaultOpVideo": "Ops.Gl.Textures.VideoTexture_v3",
    "defaultOpGltf": "Ops.Gl.GLTF.GltfScene_v4",
    "defaultOpJson": "Ops.Json.HttpRequest_v4",
    "defaultOpExr": "Ops.Gl.Textures.ExrTexture",
    "VarSetNumber": "Ops.Vars.VarSetNumber_v2",
    "VarTriggerNumber": "Ops.Vars.VarTriggerNumber",
    "VarGetNumber": "Ops.Vars.VarGetNumber_v2",
    "VarSetObject": "Ops.Vars.VarSetObject_v2",
    "VarTriggerObject": "Ops.Vars.VarTriggerObject",
    "VarGetObject": "Ops.Vars.VarGetObject_v2",
    "VarSetTexture": "Ops.Vars.VarSetTexture_v2",
    "VarGetTexture": "Ops.Vars.VarGetTexture_v2",
    "VarSetArray": "Ops.Vars.VarSetArray_v2",
    "VarTriggerArray": "Ops.Vars.VarTriggerArray",
    "VarGetArray": "Ops.Vars.VarGetArray_v2",
    "VarSetString": "Ops.Vars.VarSetString_v2",
    "VarTriggerString": "Ops.Vars.VarTriggerString",
    "VarGetString": "Ops.Vars.VarGetString",
    "VarSetTrigger": "Ops.Trigger.TriggerSend",
    "VarGetTrigger": "Ops.Trigger.TriggerReceive",
    "defaultFont": "Ops.Html.FontFile_v2",

    "TimelineConfig": "Ops.TimeLine.TimelineConfig",

    "incrementor": "Ops.Math.Incrementor",

    "performance": "Ops.Gl.Performance",

    "subPatch": "Ops.Ui.SubPatch",
    "subPatch2": "Ops.Ui.Subpatch2Template",
    "subPatchInput2": "Ops.Ui.SubPatchInput",
    "subPatchOutput2": "Ops.Ui.SubPatchOutput",

    "uiArea": "Ops.Ui.Area",
    "defaultOpSvg": "Ops.Gl.Textures.TextureSVG_v2",
    "defaultOpCss": "Ops.Html.CSS.CssFile",

    "defaultOpVizTexture": "Ops.Ui.VizTexture",

    "BoolToString": "Ops.Boolean.BoolToString",
    "NumberToString": "Ops.String.NumberToString_v2",

    "TriggerOnChangeString": "Ops.Trigger.TriggerOnChangeString_v2",
    "TriggerOnChangeArray": "Ops.Trigger.TriggerOnChangeArray_v2",
    "TriggerOnChangeNumber": "Ops.Number.TriggerOnChangeNumber_v2",
    "TriggerOnChangeObject": "Ops.Trigger.TriggerOnChangeObject_v2",

    "TriggerOnChangedTrue": "Ops.Boolean.TriggerChangedTrue",

    "TriggerNumber": "Ops.Trigger.TriggerNumber",
    "TriggerString": "Ops.Trigger.TriggerString",
    "triggerCounter": "Ops.Trigger.TriggerCounter",

    "StringLength": "Ops.String.StringLength_v2",
    "parseFloat": "Ops.String.StringToNumber",
    "arrayLength": "Ops.Array.ArrayLength_v2",
    "StringToArray": "Ops.Array.StringToArray_v2",
    "arrayToString": "Ops.Array.ArrayToString_v3",
    "stringConcat": "Ops.String.Concat_v2",

    "VizArrayTable": "Ops.Ui.VizArrayTable_v2",
    "VizArrayGraph": "Ops.Ui.VizArrayGraph",
    "VizBool": "Ops.Ui.VizBool",
    "VizGraph": "Ops.Ui.VizGraph",
    "VizNumber": "Ops.Ui.VizNumber",
    "VizNumberBar": "Ops.Ui.VizNumberBar",
    "VizObject": "Ops.Ui.VizObject",
    "VizString": "Ops.Ui.VizString",
    "VizTexture": "Ops.Ui.VizTexture",
    "VizLogger": "Ops.Ui.VizLogger",
    "vizTrigger": "Ops.Ui.VizTrigger",
    "VizTextureTable": "Ops.Ui.VizTextureTable",

    "stringEditor": "Ops.String.StringEditor",
    "sequence": "Ops.Trigger.Sequence",
    "divElement": "Ops.Html.Elements.Element_v2",
    "customShader": "Ops.Gl.Shader.CustomShader_v2",

    "GreaterThan": "Ops.Math.Compare.GreaterThan",
    "LessThan": "Ops.Math.Compare.LessThan",
    "Sum": "Ops.Math.Sum",
    "Subtract": "Ops.Math.Subtract",
    "Divide": "Ops.Math.Divide",
    "Multiply": "Ops.Math.Multiply",
    "Equals": "Ops.Math.Compare.Equals",
    "Modulo": "Ops.Math.Modulo",
    "ArraySum": "Ops.Array.ArraySum",
    "ArraySubtract": "Ops.Array.ArraySubtract",
    "ArrayDivide": "Ops.Array.ArrayDivide",
    "ArrayMultiply": "Ops.Array.ArrayMultiply",
    "parseObject": "Ops.Json.ParseObject_v2",

    "textureGradient": "Ops.Gl.GradientTexture",
    "textureNoise": "Ops.Gl.Textures.NoiseTexture",

    "rerouteNumber": "Ops.Ui.Routing.RouteNumber",
    "rerouteString": "Ops.Ui.Routing.RouteString",
    "rerouteArray": "Ops.Ui.Routing.RouteArray",
    "rerouteObject": "Ops.Ui.Routing.RouteObject",
    "rerouteTrigger": "Ops.Ui.Routing.RouteTrigger",

    "ArrayGetArray": "Ops.Array.ArrayGetArray",
    "ArrayGetNumber": "Ops.Array.ArrayGetNumber",
    "ArrayGetObject": "Ops.Array.ArrayGetObject",
    "ArrayGetString": "Ops.Array.ArrayGetString_v2",
    "ObjectGetArray": "Ops.Json.ObjectGetArray_v2",
    "ObjectGetNumber": "Ops.Json.ObjectGetNumber_v2",
    "ObjectGetObject": "Ops.Json.ObjectGetObject_v2",
    "ObjectGetString": "Ops.Json.ObjectGetString_v2",

    "ArrayGetArrayByPath": "Ops.Data.JsonPath.ArrayGetArrayByPath",
    "ArrayGetArrayValuesByPath": "Ops.Data.JsonPath.ArrayGetArrayValuesByPath",
    "ArrayGetNumberByPath": "Ops.Data.JsonPath.ArrayGetNumberByPath",
    "ArrayGetObjectByPath": "Ops.Data.JsonPath.ArrayGetObjectByPath",
    "ArrayGetStringByPath": "Ops.Data.JsonPath.ArrayGetStringByPath_v2",
    "ObjectGetArrayByPath": "Ops.Data.JsonPath.ObjectGetArrayByPath",
    "ObjectGetArrayValuesByPath": "Ops.Data.JsonPath.ObjectGetArrayValuesByPath",
    "ObjectGetNumberByPath": "Ops.Data.JsonPath.ObjectGetNumberByPath",
    "ObjectGetObjectByPath": "Ops.Data.JsonPath.ObjectGetObjectByPath",
    "ObjectGetStringByPath": "Ops.Data.JsonPath.ObjectGetStringByPath_v2",

    "HttpRequest": "Ops.Json.HttpRequest_v4",
    "glMainloop": "Ops.Gl.MainLoop_v2"

};

/**
 * default ops structure for assets, ports, math operations etc.
 */
const defaultOps = {
    "newOpNameSuggestion": "MyAwesomeOpName",
    "defaultOpNames": defaultOpNames,
    "prefixes": {
        "op": "Ops.",
        "patchOp": "Ops.Patch.P",
        "userOp": "Ops.User.",
        "teamOp": "Ops.Team.",
        "extensionOp": "Ops.Extension.",
        "webgpu": "Ops.Extension.WebGpu",
        "webgl": "Ops.Gl.",
    },
    "converterOps":
    [
        {
            "typeFrom": portType.number,
            "typeTo": portType.string,
            "op": defaultOpNames.NumberToString,
            "portIn": "Number",
            "portOut": "Result",
        },
        {
            "typeFrom": portType.string,
            "typeTo": portType.object,
            "op": defaultOpNames.parseObject,
            "portIn": "JSON String",
            "portOut": "Result",
        },
        {
            "typeFrom": portType.number,
            "typeTo": portType.string,
            "op": defaultOpNames.BoolToString,
            "portIn": "Boolean",
            "portOut": "String",
        },

        {
            "typeFrom": portType.number,
            "typeTo": portType.trigger,
            "op": defaultOpNames.TriggerOnChangeNumber,
            "portIn": "Value",
            "portOut": "Next",
        },
        {
            "typeFrom": portType.string,
            "typeTo": portType.trigger,
            "op": defaultOpNames.TriggerOnChangeString,
            "portIn": "String",
            "portOut": "Changed",
        },
        {
            "typeFrom": portType.array,
            "typeTo": portType.trigger,
            "op": defaultOpNames.TriggerOnChangeArray,
            "portIn": "String",
            "portOut": "Changed",
        },
        {
            "typeFrom": portType.trigger,
            "typeTo": portType.string,
            "op": defaultOpNames.TriggerString,
            "portIn": "Trigger",
            "portOut": "Result",
        },
        {
            "typeFrom": portType.trigger,
            "typeTo": portType.number,
            "op": defaultOpNames.TriggerNumber,
            "portIn": "Set",
            "portOut": "Out Value",
        },
        {
            "typeFrom": portType.number,
            "typeTo": portType.trigger,
            "op": defaultOpNames.TriggerOnChangedTrue,
            "portIn": "Value",
            "portOut": "Next",
        },
        {
            "typeFrom": portType.string,
            "typeTo": portType.number,
            "op": defaultOpNames.parseFloat,
            "portIn": "String",
            "portOut": "Number",
        },
        {
            "typeFrom": portType.string,
            "typeTo": portType.number,
            "op": defaultOpNames.StringLength,
            "portIn": "String",
            "portOut": "Result",
        },
        {
            "typeFrom": portType.array,
            "typeTo": portType.number,
            "op": defaultOpNames.arrayLength,
            "portIn": "array",
            "portOut": "length",
        },
        {
            "typeFrom": portType.string,
            "typeTo": portType.array,
            "op": defaultOpNames.StringToArray,

            "portIn": "text",
            "portOut": "array",
        },
        {
            "typeFrom": portType.array,
            "typeTo": portType.string,
            "op": defaultOpNames.arrayToString,
            "portIn": "Array",
            "portOut": "Result",
        },
        {
            "typeFrom": portType.trigger,
            "typeTo": portType.number,
            "op": defaultOpNames.triggerCounter,
            "portIn": "exe",
            "portOut": "timesTriggered",
        },
        {
            "typeFrom": portType.trigger,
            "typeTo": portType.number,
            "op": defaultOpNames.incrementor,
            "portIn": "Increment",
            "portOut": "Value",
        },
        {
            "typeFrom": portType.object,
            "typeTo": portType.number,
            "op": defaultOpNames.ObjectGetNumber,
            "portIn": "Data",
            "portOut": "Result",
        },
        {
            "typeFrom": portType.object,
            "typeTo": portType.string,
            "op": defaultOpNames.ObjectGetString,
            "portIn": "data",
            "portOut": "result",
        },
        {
            "typeFrom": portType.object,
            "typeTo": portType.trigger,
            "op": defaultOpNames.TriggerOnChangeObject,
            "portIn": "Object",
            "portOut": "Changed",
        }

    ],
    "jsonPathOps": {
        "ArrayGetArray": { "opName": defaultOpNames.ArrayGetArray, "dataPort": "Array of Arrays", "keyPort": "Index" },
        "ArrayGetArrayValues": { "opName": defaultOpNames.ArrayGetArrayValuesByPath, "dataPort": "Array", "keyPort": "Path" },
        "ArrayGetNumber": { "opName": defaultOpNames.ArrayGetNumber, "dataPort": "array", "keyPort": "index" },
        "ArrayGetObject": { "opName": defaultOpNames.ArrayGetObject, "dataPort": "array", "keyPort": "index" },
        "ArrayGetString": { "opName": defaultOpNames.ArrayGetString, "dataPort": "array", "keyPort": "index" },

        "ObjectGetArray": { "opName": defaultOpNames.ObjectGetArray, "dataPort": "data", "keyPort": "key" },
        "ObjectGetArrayValues": { "opName": defaultOpNames.ObjectGetArrayValuesByPath, "dataPort": "Object", "keyPort": "Path" },
        "ObjectGetNumber": { "opName": defaultOpNames.ObjectGetNumber, "dataPort": "Data", "keyPort": "Key" },
        "ObjectGetObject": { "opName": defaultOpNames.ObjectGetObject, "dataPort": "Object", "keyPort": "Key" },
        "ObjectGetString": { "opName": defaultOpNames.ObjectGetString, "dataPort": "data", "keyPort": "Key" },

        "ArrayGetArrayByPath": { "opName": defaultOpNames.ArrayGetArrayByPath, "dataPort": "Array", "keyPort": "Path" },
        "ArrayGetArrayValuesByPath": { "opName": defaultOpNames.ArrayGetArrayValuesByPath, "dataPort": "Array", "keyPort": "Path" },
        "ArrayGetNumberByPath": { "opName": defaultOpNames.ArrayGetNumberByPath, "dataPort": "Array", "keyPort": "Path" },
        "ArrayGetObjectByPath": { "opName": defaultOpNames.ArrayGetObjectByPath, "dataPort": "Array", "keyPort": "Path" },
        "ArrayGetStringByPath": { "opName": defaultOpNames.ArrayGetStringByPath, "dataPort": "Array", "keyPort": "Path" },
        "ObjectGetArrayByPath": { "opName": defaultOpNames.ObjectGetArrayByPath, "dataPort": "Object", "keyPort": "Path" },
        "ObjectGetArrayValuesByPath": { "opName": defaultOpNames.ObjectGetArrayValuesByPath, "dataPort": "Object", "keyPort": "Path" },
        "ObjectGetNumberByPath": { "opName": defaultOpNames.ObjectGetNumberByPath, "dataPort": "Object", "keyPort": "Path" },
        "ObjectGetObjectByPath": { "opName": defaultOpNames.ObjectGetObjectByPath, "dataPort": "Object", "keyPort": "Path" },
        "ObjectGetStringByPath": { "opName": defaultOpNames.ObjectGetStringByPath, "dataPort": "Object", "keyPort": "Path" }
    },
    "hideInOpSelect":
    [
        "Ops.Ui.SubPatch",
        "Ops.Ui.Subpatch2Template",
        "Ops.Ui.SubPatchInput",
        "Ops.Ui.SubPatchOutput",
        "Ops.Ui.PatchInput",
        "Ops.Ui.PatchOutput"
    ],
    "defaultMathOps":
    {
        "default":
        {
            ">": defaultOpNames.GreaterThan,
            "<": defaultOpNames.LessThan,
            "+": defaultOpNames.Sum,
            "-": defaultOpNames.Subtract,
            "/": defaultOpNames.Divide,
            "*": defaultOpNames.Multiply,
            "=": defaultOpNames.Equals,
            "%": defaultOpNames.Modulo,

        },
        "array":
        {
            "+": defaultOpNames.ArraySum,
            "-": defaultOpNames.ArraySubtract,
            "/": defaultOpNames.ArrayDivide,
            "*": defaultOpNames.ArrayMultiply,
        },
        "string":
        {
            "+": defaultOpNames.stringConcat
        }
    }
};

export default defaultOps;
