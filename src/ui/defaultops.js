
export default
{
    "defaultOpNames":
    {
        "number": "Ops.Value.Number",
        "defaultOpImage": "Ops.Gl.Texture_v2",
        "defaultOpAudio": "Ops.WebAudio.AudioBuffer_v2",
        "defaultOpJson3d": "Ops.Json3d.Mesh3d",
        "defaultOpVideo": "Ops.Gl.Textures.VideoTexture",
        "defaultOpGltf": "Ops.Gl.GLTF.GltfScene_v3",
        "defaultOpJson": "Ops.Json.AjaxRequest_v2",
        "VarSetNumber": "Ops.Vars.VarSetNumber_v2",
        "VarGetNumber": "Ops.Vars.VarGetNumber_v2",
        "VarSetObject": "Ops.Vars.VarSetObject_v2",
        "VarGetObject": "Ops.Vars.VarGetObject_v2",
        "VarSetArray": "Ops.Vars.VarSetArray_v2",
        "VarGetArray": "Ops.Vars.VarGetArray_v2",
        "VarSetString": "Ops.Vars.VarSetString_v2",
        "VarGetString": "Ops.Vars.VarGetString",
        "VarSetTrigger": "Ops.Trigger.TriggerSend",
        "VarGetTrigger": "Ops.Trigger.TriggerReceive",
        "defaultFont": "Ops.Html.FontFile_v2",
        "blueprint": "Ops.Dev.Blueprint",

        "subPatch": "Ops.Ui.SubPatch",
        "uiArea": "Ops.Ui.Area"
    },

    "getOpsForFilename": (filename) =>
    {
        const ops = [];

        if (filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".webp")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpImage);
        else if (filename.endsWith(".ogg") || filename.endsWith(".wav") || filename.endsWith(".mp3") || filename.endsWith(".m4a") || filename.endsWith(".aac")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpAudio);
        else if (filename.endsWith(".3d.json")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpJson3d);
        else if (filename.endsWith(".mp4" || ".m4a" || ".mpg" || ".webm")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpVideo);
        else if (filename.endsWith(".glb")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpGltf);
        else if (filename.endsWith(".json")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultOpJson);
        else if (filename.endsWith(".ttf") || filename.endsWith(".woff") || filename.endsWith(".woff2") || filename.endsWith(".otf")) ops.push(CABLES.UI.DEFAULTOPNAMES.defaultFont);

        return ops;
    },
    "getVarGetterOpNameByType": (type) =>
    {
        let portName = "Value";
        let portNameOut = portName;

        let opSetterName = "unknown";
        let opGetterName = "unknown";
        if (type == CABLES.OP_PORT_TYPE_VALUE)
        {
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetNumber;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetNumber;
        }
        else if (type == CABLES.OP_PORT_TYPE_OBJECT)
        {
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetObject;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetObject;
        }
        else if (type == CABLES.OP_PORT_TYPE_ARRAY)
        {
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetArray;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetArray;
        }
        else if (type == CABLES.OP_PORT_TYPE_STRING)
        {
            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetString;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetString;
        }
        else if (type == CABLES.OP_PORT_TYPE_FUNCTION)
        {
            portName = "Trigger";
            portNameOut = "Triggered";

            opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetTrigger;
            opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetTrigger;
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
        };
    }


};
