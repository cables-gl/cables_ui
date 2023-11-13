/**
 * default ops for various shortcuts/operations/files/variables etc.
 *
 */

import { CONSTANTS } from "../../../cables/src/core/constants";

const defaultOps = {
    "defaultOpNames":
    {
        "number": "Ops.Value.Number",
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
        "blueprintTemplate": "Ops.Templates.Blueprint2",

        "subPatch": "Ops.Ui.SubPatch",
        "subPatch2": "Ops.Dev.SubpatchNew",
        "subPatchInput2": "Ops.Dev.Ui.PatchInput",
        "subPatchOutput2": "Ops.Dev.Ui.PatchOutput",

        "uiArea": "Ops.Ui.Area",
        "defaultOpSvg": "Ops.Gl.Textures.TextureSVG_v2",
        "defaultOpVizTexture": "Ops.Ui.VizTexture",

    },
    "converterOps":
    [
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "op": "Ops.String.NumberToString_v2",
            "portIn": "Number",
            "portOut": "Result",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_TRIGGER,
            "op": "Ops.Value.TriggerOnChangeNumber",
            "portIn": "Value",
            "portOut": "Next",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_TRIGGER,
            "op": "Ops.Trigger.TriggerOnChangeString",
            "portIn": "String",
            "portOut": "Changed",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_TRIGGER,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "op": "Ops.Trigger.TriggerCounter",
            "portIn": "exe",
            "portOut": "timesTriggered",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "op": "Ops.String.ParseFloat",
            "portIn": "String",
            "portOut": "Number",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_ARRAY,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_VALUE,
            "op": "Ops.Array.ArrayLength_v2",
            "portIn": "array",
            "portOut": "length",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_ARRAY,
            "op": "Ops.Array.StringToArray_v2",
            "portIn": "text",
            "portOut": "array",
        },
        {
            "typeFrom": CONSTANTS.OP.OP_PORT_TYPE_ARRAY,
            "typeTo": CONSTANTS.OP.OP_PORT_TYPE_STRING,
            "op": "Ops.Array.ArrayToString_v3",
            "portIn": "Array",
            "portOut": "Result",
        },


    ],
    "defaultMathOps":
    {
        "default":
        {
            ">": "Ops.Math.Compare.GreaterThan",
            "<": "Ops.Math.Compare.LessThan",
            "+": "Ops.Math.Sum",
            "-": "Ops.Math.Subtract",
            "/": "Ops.Math.Divide",
            "*": "Ops.Math.Multiply",
            "=": "Ops.Math.Equals",
        },
        "array":
        {
            "+": "Ops.Array.ArraySum",
            "-": "Ops.Array.ArraySubtract",
            "/": "Ops.Array.ArrayDivide",
            "*": "Ops.Array.ArrayMultiply",
        },
        "string":
        {
            "+": "Ops.String.Concat_v2"
        }
    },
    "getVizOpsForPortLink": (p, l) =>
    {
        if (p && p.direction == CONSTANTS.PORT.PORT_DIR_OUT)
        {
            if (p.type == CONSTANTS.OP.OP_PORT_TYPE_STRING) return ["Ops.Ui.VizString", "Ops.Ui.VizStringLong"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_VALUE && (p.uiAttribs.display == "bool" || p.uiAttribs.display == "boolnum")) return ["Ops.Ui.VizBool", "Ops.Ui.VizNumber"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_VALUE) return ["Ops.Ui.VizNumber", "Ops.Ui.VizGraph", "Ops.Ui.VizNumberBar"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_ARRAY) return ["Ops.Ui.VizArrayTable"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "texture") return ["Ops.Ui.VizTexture", "Ops.Ui.VizTextureTable", "Ops.Ui.VizObject"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT) return ["Ops.Ui.VizObject"];
        }
    },
    "getOpsForPortLink": (p, l) =>
    {
        if (p && p.direction == CONSTANTS.PORT.PORT_DIR_IN)
        {
            if (p.type == CONSTANTS.OP.OP_PORT_TYPE_STRING) return ["Ops.String.String_v2", "Ops.String.StringEditor"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_VALUE) return ["Ops.Value.Number"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_FUNCTION) return ["Ops.Trigger.Sequence"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "texture") return [CABLES.UI.DEFAULTOPNAMES.defaultOpImage];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "element") return ["Ops.Html.DivElement_v2"];
            else if (p.type == CONSTANTS.OP.OP_PORT_TYPE_OBJECT && p.uiAttribs.objType == "shader") return ["Ops.Gl.Shader.CustomShader_v2"];
        }
        if (p && p.direction == CONSTANTS.PORT.PORT_DIR_OUT)
        {
            if (p.type == CONSTANTS.OP.OP_PORT_TYPE_FUNCTION) return ["Ops.Trigger.Sequence"];
        }
    },
    "getOpsForFilename": (filename) =>
    {
        const ops = [];

        filename = filename.toLowerCase();

        if (filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".jxl") || filename.endsWith(".webp")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpImage);
        else if (filename.endsWith(".ogg") || filename.endsWith(".wav") || filename.endsWith(".mp3") || filename.endsWith(".m4a") || filename.endsWith(".aac")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpAudio);
        else if (filename.endsWith(".mp4") || filename.endsWith(".m4a") || filename.endsWith(".mpg") || filename.endsWith(".webm") || filename.endsWith(".mkv") || filename.endsWith(".mov")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpVideo);
        else if (filename.endsWith(".glb")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpGltf);
        else if (filename.endsWith(".json")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpJson);
        else if (filename.endsWith(".ttf") || filename.endsWith(".woff") || filename.endsWith(".woff2") || filename.endsWith(".otf")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultFont);
        else if (filename.endsWith(".exr")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpExr);
        else if (filename.endsWith(".svg")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpSvg);
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
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetNumber;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetNumber;
            opSetTriggerName = CABLES.UI.DEFAULTOPNAMES.VarTriggerNumber;
        }
        else if (type == CABLES.OP_PORT_TYPE_OBJECT)
        {
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetObject;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetObject;
            opSetTriggerName = CABLES.UI.DEFAULTOPNAMES.VarTriggerObject;

            if (port && port.uiAttribs.objType == "texture")
            {
                opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetTexture;
                opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetTexture;
            }
        }
        else if (type == CABLES.OP_PORT_TYPE_ARRAY)
        {
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetArray;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetArray;
            opSetTriggerName = CABLES.UI.DEFAULTOPNAMES.VarTriggerArray;
        }
        else if (type == CABLES.OP_PORT_TYPE_STRING)
        {
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetString;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetString;
            opSetTriggerName = CABLES.UI.DEFAULTOPNAMES.VarTriggerString;
        }
        else if (type == CABLES.OP_PORT_TYPE_FUNCTION)
        {
            portName = "Trigger";
            portNameOut = "Triggered";

            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetTrigger;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetTrigger;
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
        if (!opName) return "default";
        if (opName.startsWith("Ops.Gl.")) return "gl";
        if (opName.startsWith("Ops.WebAudio.")) return "audio";
        if (opName.startsWith("Ops.Devices.")) return "devices";
        if (opName.startsWith("Ops.Html.")) return "html";
        if (opName.startsWith("Ops.Sidebar.")) return "html";
        if (opName.startsWith("Ops.Math.")) return "math";
        if (opName.startsWith("Ops.User.")) return "user";
        if (opName.startsWith("Ops.Team.")) return "team";
        if (opName.startsWith("Ops.Patch.")) return "user";
        return "default";
    },

    "getNamespace": (opname) =>
    {
        if (!opname) return "";
        const parts = opname.split(".");
        parts.length -= 1;
        return parts.join(".") + ".";
    },

    // "isSubPatchOpName": (opname) =>
    // {
    //     return (opname == "Ops.Ui.SubPatch" || opname == "Ops.Dev.SubpatchNew");
    // },

    // "isSubPatchOpNameV2": (opname) =>
    // {
    //     return opname == "Ops.Dev.SubpatchNew";
    // },

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
        return opname.startsWith("Ops.Cables.CustomOp");
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
