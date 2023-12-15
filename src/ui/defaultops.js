/**
 * default ops for various shortcuts/operations/files/variables etc.
 *
 */

import { CONSTANTS } from "../../../cables/src/core/constants";


const defaultOpNames =
{
    "number": "Ops.Number.Number",
    "defaultOpImage": "Ops.Gl.Texture_v2",
    "defaultOpAudio": "Ops.WebAudio.AudioBuffer_v2",
    "defaultOpVideo": "Ops.Gl.Textures.VideoTexture_v3",
    "defaultOpGltf": "Ops.Gl.GLTF.GltfScene_v4",
    "defaultOpJson": "Ops.Json.HttpRequest_v3",
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

    "blueprint": "Ops.Dev.Blueprint",

    "subPatch": "Ops.Ui.SubPatch",
    "subPatch2": "Ops.Ui.Subpatch2Temp",
    "subPatchInput2": "Ops.Ui.SubPatchInput",
    "subPatchOutput2": "Ops.Ui.SubPatchOutput",

    "uiArea": "Ops.Ui.Area",
    "defaultOpSvg": "Ops.Gl.Textures.TextureSVG_v2",
    "defaultOpVizTexture": "Ops.Ui.VizTexture",

    "NumberToString": "Ops.String.NumberToString_v2",
    "TriggerOnChangeNumber": "Ops.Number.TriggerOnChangeNumber",
    "TriggerOnChangeString": "Ops.Trigger.TriggerOnChangeString",
    "TriggerCounter": "Ops.Trigger.TriggerCounter",
    "parseFloat": "Ops.String.ParseFloat",
    "arrayLength": "Ops.Array.ArrayLength_v2",
    "StringToArray": "Ops.Array.StringToArray_v2",
    "arrayToString": "Ops.Array.ArrayToString_v3",
    "stringConcat": "Ops.String.Concat_v2",

    "VizArrayTable": "Ops.Ui.VizArrayTable",
    "VizBool": "Ops.Ui.VizBool",
    "VizGraph": "Ops.Ui.VizGraph",
    "VizNumber": "Ops.Ui.VizNumber",
    "VizNumberBar": "Ops.Ui.VizNumberBar",
    "VizObject": "Ops.Ui.VizObject",
    "VizString": "Ops.Ui.VizString",
    "VizStringLong": "Ops.Ui.VizStringLong",
    "VizTexture": "Ops.Ui.VizTexture",
    "VizLogger": "Ops.Ui.VizLogger",
    "VizTextureTable": "Ops.Ui.VizTextureTable",

    "string": "Ops.String.String_v2",
    "stringEditor": "Ops.String.StringEditor",
    "sequence": "Ops.Trigger.Sequence",
    "divElement": "Ops.Html.DivElement_v3",
    "customShader": "Ops.Gl.Shader.CustomShader_v2",

    "GreaterThan": "Ops.Math.Compare.GreaterThan",
    "LessThan": "Ops.Math.Compare.LessThan",
    "Sum": "Ops.Math.Sum",
    "Subtract": "Ops.Math.Subtract",
    "Divide": "Ops.Math.Divide",
    "Multiply": "Ops.Math.Multiply",
    "Equals": "Ops.Math.Compare.Equals",
    "ArraySum": "Ops.Array.ArraySum",
    "ArraySubtract": "Ops.Array.ArraySubtract",
    "ArrayDivide": "Ops.Array.ArrayDivide",
    "ArrayMultiply": "Ops.Array.ArrayMultiply"
};

const defaultOps = {
    "defaultOpNames": defaultOpNames,
    "converterOps":
    [
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "op": defaultOpNames.NumberToString,
            "portIn": "Number",
            "portOut": "Result",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_TRIGGER,
            "op": defaultOpNames.TriggerOnChangeNumber,
            "portIn": "Value",
            "portOut": "Next",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_TRIGGER,
            "op": defaultOpNames.TriggerOnChangeString,
            "portIn": "String",
            "portOut": "Changed",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_TRIGGER,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "op": defaultOpNames.triggerCounter,
            "portIn": "exe",
            "portOut": "timesTriggered",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "op": defaultOpNames.parseFloat,
            "portIn": "String",
            "portOut": "Number",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_ARRAY,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "op": defaultOpNames.arrayLength,
            "portIn": "array",
            "portOut": "length",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_ARRAY,
            "op": defaultOpNames.StringToArray,

            "portIn": "text",
            "portOut": "array",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_ARRAY,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "op": defaultOpNames.arrayToString,
            "portIn": "Array",
            "portOut": "Result",
        },


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
    },
    "getVizOpsForPortLink": (p, l) =>
    {
        if (p && p.direction == CONSTANTS.PORT.PORT_DIR_OUT)
        {
            if (p.type == CONSTANTS.OP.OP_PORT_TYPE_STRING) return [defaultOpNames.VizString, defaultOpNames.VizStringLong, defaultOpNames.VizLogger];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_VALUE && (p.uiAttribs.display == "bool" || p.uiAttribs.display == "boolnum")) return [defaultOpNames.VizBool, defaultOpNames.VizNumber,, defaultOpNames.VizLogger];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_VALUE) return [defaultOpNames.VizNumber, defaultOpNames.VizGraph, defaultOpNames.VizNumberBar, defaultOpNames.VizLogger];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_ARRAY) return [defaultOpNames.VizArrayTable];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "texture") return [defaultOpNames.VizTexture, defaultOpNames.VizTextureTable, defaultOpNames.VizObject];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT) return [defaultOpNames.VizObject];
        }
        return [];
    },
    "getOpsForPortLink": (p, l) =>
    {
        if (p && p.direction == CONSTANTS.PORT.PORT_DIR_IN)
        {
            if (p.type == CONSTANTS.OP.OP_PORT_TYPE_STRING) return [defaultOpNames.string, defaultOpNames.stringEditor];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_VALUE) return [defaultOpNames.number];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_FUNCTION) return [defaultOpNames.sequence];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "texture") return [defaultOpNames.defaultOpImage];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "element") return [defaultOpNames.divElement];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "shader") return [defaultOpNames.customShader];
        }
        if (p && p.direction == CONSTANTS.PORT.PORT_DIR_OUT)
        {
            if (p.type == CONSTANTS.OP.OP_PORT_TYPE_FUNCTION) return [defaultOpNames.sequence];
        }
        return [];
    },
    "getOpsForFilename": (filename) =>
    {
        const ops = [];

        filename = filename.toLowerCase();

        if (filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".jxl") || filename.endsWith(".webp")) ops.push(defaultOpNames.defaultOpImage);
        else if (filename.endsWith(".ogg") || filename.endsWith(".wav") || filename.endsWith(".mp3") || filename.endsWith(".m4a") || filename.endsWith(".aac")) ops.push(defaultOpNames.defaultOpAudio);
        else if (filename.endsWith(".mp4") || filename.endsWith(".m4a") || filename.endsWith(".mpg") || filename.endsWith(".webm") || filename.endsWith(".mkv") || filename.endsWith(".mov")) ops.push(defaultOpNames.defaultOpVideo);
        else if (filename.endsWith(".glb")) ops.push(defaultOpNames.defaultOpGltf);
        else if (filename.endsWith(".json")) ops.push(defaultOpNames.defaultOpJson);
        else if (filename.endsWith(".ttf") || filename.endsWith(".woff") || filename.endsWith(".woff2") || filename.endsWith(".otf")) ops.push(defaultOpNames.defaultFont);
        else if (filename.endsWith(".exr")) ops.push(defaultOpNames.defaultOpExr);
        else if (filename.endsWith(".svg")) ops.push(defaultOpNames.defaultOpSvg);
        return ops;
    },
    "getVarGetterOpNameByType": (type, port) =>
    {
        let portName = "Value";
        let portNameOut = portName;
        let opSetterName = "unknown";
        let opGetterName = "unknown";
        let opSetTriggerName = "unknown";

        if (type == CABLES.OP_PORT_TYPE_VALUE)
        {
            opSetterName = defaultOpNames.VarSetNumber;
            opGetterName = defaultOpNames.VarGetNumber;
            opSetTriggerName = defaultOpNames.VarTriggerNumber;
        }
        else if (type == CABLES.OP_PORT_TYPE_OBJECT)
        {
            opSetterName = defaultOpNames.VarSetObject;
            opGetterName = defaultOpNames.VarGetObject;
            opSetTriggerName = defaultOpNames.VarTriggerObject;

            if (port && port.uiAttribs.objType == "texture")
            {
                opSetterName = defaultOpNames.VarSetTexture;
                opGetterName = defaultOpNames.VarGetTexture;
            }
        }
        else if (type == CABLES.OP_PORT_TYPE_ARRAY)
        {
            opSetterName = defaultOpNames.VarSetArray;
            opGetterName = defaultOpNames.VarGetArray;
            opSetTriggerName = defaultOpNames.VarTriggerArray;
        }
        else if (type == CABLES.OP_PORT_TYPE_STRING)
        {
            opSetterName = defaultOpNames.VarSetString;
            opGetterName = defaultOpNames.VarGetString;
            opSetTriggerName = defaultOpNames.VarTriggerString;
        }
        else if (type == CABLES.OP_PORT_TYPE_FUNCTION)
        {
            portName = "Trigger";
            portNameOut = "Triggered";

            opSetterName = defaultOpNames.VarSetTrigger;
            opGetterName = defaultOpNames.VarGetTrigger;
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
    },

    "getPortTypeClassHtml": (type) =>
    {
        if (type == CABLES.OP_PORT_TYPE_VALUE) return "port_text_color_value";
        if (type == CABLES.OP_PORT_TYPE_FUNCTION) return "port_text_color_function";
        if (type == CABLES.OP_PORT_TYPE_OBJECT) return "port_text_color_object";
        if (type == CABLES.OP_PORT_TYPE_ARRAY) return "port_text_color_array";
        if (type == CABLES.OP_PORT_TYPE_STRING) return "port_text_color_string";
        if (type == CABLES.OP_PORT_TYPE_DYNAMIC) return "port_text_color_dynamic";
        return "port_text_color_unknown";
    },

    "getPortTypeClass": (type) =>
    {
        if (type == CABLES.OP_PORT_TYPE_VALUE) return "port_color_value";
        if (type == CABLES.OP_PORT_TYPE_FUNCTION) return "port_color_function";
        if (type == CABLES.OP_PORT_TYPE_OBJECT) return "port_color_object";
        if (type == CABLES.OP_PORT_TYPE_ARRAY) return "port_color_array";
        if (type == CABLES.OP_PORT_TYPE_STRING) return "port_color_string";
        if (type == CABLES.OP_PORT_TYPE_DYNAMIC) return "port_color_dynamic";
        return "port_color_unknown";
    },

    "getVarClass": (type) =>
    {
        if (type == "number") return "port_text_color_value";
        if (type == "trigger") return "link_color_function";
        if (type == "object") return "port_text_color_object";
        if (type == "array") return "port_text_color_array";
        if (type == "string") return "port_text_color_string";
        else return "link_color_dynamic";
    },

    "getNamespaceClassName": (opName) =>
    {
        const opNameParts = opName.split(".");
        return "nsColor_" + opNameParts[0] + "_" + opNameParts[1];
    },

    "getNamespace": (opname) =>
    {
        if (!opname) return "";
        const parts = opname.split(".");
        parts.length -= 1;
        return parts.join(".") + ".";
    },



    "getPatchOpsPrefix": () =>
    {
        return "Ops.Patch.P";
    },

    "getPatchOpsNamespace": () =>
    {
        const PATCHOPS_ID_REPLACEMENTS = {
            "-": "___"
        };
        let namespace = gui.project().shortId;
        Object.keys(PATCHOPS_ID_REPLACEMENTS).forEach((key) =>
        {
            namespace = namespace.replaceAll(key, PATCHOPS_ID_REPLACEMENTS[key]);
        });
        return defaultOps.getPatchOpsPrefix() + namespace + ".";
    },

    "getOpsPrefix": () =>
    {
        return "Ops.";
    },

    "getUserOpsPrefix": () =>
    {
        return "Ops.User.";
    },

    "getTeamOpsPrefix": () =>
    {
        return "Ops.Team.";
    },

    "getExtensionOpsPrefix": () =>
    {
        return "Ops.Extension.";
    },

    "isDevOp": (opname) =>
    {
        return opname && opname.includes(".Dev.");
    },

    "isAdminOp": (opname) =>
    {
        return opname && opname.indexOf("Ops.Admin.") === 0;
    },

    "isUserOp": (opname) =>
    {
        return opname && opname.startsWith("Ops.User.");
    },

    "isCurrentUserOp": (opname) =>
    {
        return defaultOps.isUserOpOfUser(opname, gui.user.usernameLowercase);
    },

    "isUserOpOfUser": (opname, userNameLowercase) =>
    {
        return opname && opname.startsWith(defaultOps.getUserOpsPrefix() + userNameLowercase);
    },

    "isDeprecatedOp": (opname) =>
    {
        return opname && opname.includes(".Deprecated.");
    },

    "isExtensionOp": (opname) =>
    {
        return opname && opname.startsWith(defaultOps.getExtensionOpsPrefix());
    },

    "isCoreOp": (opname) =>
    {
        return !defaultOps.isNonCoreOp(opname);
    },

    "isNonCoreOp": (opname) =>
    {
        return defaultOps.isUserOp(opname) || defaultOps.isExtensionOp(opname) || defaultOps.isTeamOp(opname) || defaultOps.isPatchOp(opname);
    },

    "isCustomOp": (opname) =>
    {
        return opname.startsWith("Ops.Deprecated.Cables.CustomOp");
    },

    "isPrivateOp": (opname) =>
    {
        return defaultOps.isTeamOp(opname) || defaultOps.isPatchOp(opname) || defaultOps.isUserOp(opname);
    },

    "isPatchOp": (opname) =>
    {
        return opname && opname.indexOf(defaultOps.getPatchOpsPrefix()) === 0;
    },

    "isExtension": (opname) =>
    {
        if (!opname) return false;
        if (!opname.startsWith(defaultOps.getExtensionOpsPrefix())) return false;
        if (!opname.endsWith(".")) opname += ".";
        const parts = opname.split(".");
        return parts.length < 5;
    },

    "isCollection": (opname) =>
    {
        return opname && (defaultOps.isExtension(opname) || defaultOps.isTeamNamespace(opname));
    },

    "isTeamOp": (opname) =>
    {
        return opname && opname.startsWith(defaultOps.getTeamOpsPrefix());
    },

    "isTeamNamespace": (opname) =>
    {
        if (!opname) return false;
        if (!opname.startsWith(defaultOps.getTeamOpsPrefix())) return false;
        if (!opname.endsWith(".")) opname += ".";
        const parts = opname.split(".");
        return parts.length < 5;
    },

    "isBlueprintOp": (op) =>
    {
        if (op && op.storage)
            return op.storage.blueprintVer || 0;
    },

    "isInBlueprint": (op) =>
    {
        return op.storage && op.storage.hasOwnProperty("blueprint");
    }
};

export default defaultOps;
