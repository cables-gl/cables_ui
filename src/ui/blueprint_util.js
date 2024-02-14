import OpDocs from "./components/opdocs";
import defaultOps from "./defaultops";
import ModalLoading from "./dialogs/modalloading";
import gluiconfig from "./glpatch/gluiconfig";

import srcBluePrintOp from "./blueprint_op.js.txt";
import ModalDialog from "./dialogs/modaldialog";
import { getHandleBarHtml } from "./utils/handlebars";

import ModalError from "./dialogs/modalerror";


const blueprintUtil = {};

blueprintUtil.blueprintPortJsonAttachmentFilename = "att_ports.json";
blueprintUtil.blueprintSubpatchAttachmentFilename = "att_subpatch_json";

blueprintUtil.executeBlueprintIfMultiple = (opname, next) =>
{
    const ops = gui.corePatch().getOpsByObjName(opname);

    if (ops.length > 0)
    {
        gui.serverOps.execute(opname, next);
    }
    else
    {
        console.log("no need to execute bp op");
        next();
    }
};

blueprintUtil.generatePortsAttachmentJsSrc = (ports) =>
{
    let src = "";

    if (!ports || !ports.ports) ports = { "ports": [] };

    for (let i = 0; i < ports.ports.length; i++)
    {
        const p = ports.ports[i];
        if (!p || !p.id) continue;
        src += "const port_" + p.id + "=";

        if (p.dir == 0) // INPUT
        {
            if (p.type == CABLES.OP_PORT_TYPE_VALUE) src += "op.inFloat";
            if (p.type == CABLES.OP_PORT_TYPE_FUNCTION) src += "op.inTrigger";
            if (p.type == CABLES.OP_PORT_TYPE_OBJECT) src += "op.inObject";
            if (p.type == CABLES.OP_PORT_TYPE_ARRAY) src += "op.inArray";
            if (p.type == CABLES.OP_PORT_TYPE_STRING) src += "op.inString";

            src += "(\"" + p.id + "\""; // 1. name

            if (p.type == CABLES.OP_PORT_TYPE_STRING) src += ",\"" + p.value + "\""; // 2. param default value
            if (p.type == CABLES.OP_PORT_TYPE_VALUE) src += "," + p.value; // 2. param default value

            src += ");";
        }
        else // OUTPUT
        {
            if (p.type == CABLES.OP_PORT_TYPE_VALUE) src += "op.outNumber";
            if (p.type == CABLES.OP_PORT_TYPE_FUNCTION) src += "op.outTrigger";
            if (p.type == CABLES.OP_PORT_TYPE_OBJECT) src += "op.outObject";
            if (p.type == CABLES.OP_PORT_TYPE_ARRAY) src += "op.outArray";
            if (p.type == CABLES.OP_PORT_TYPE_STRING) src += "op.outString";

            src += "(\"" + p.id + "\""; // 1. name

            src += ");";
        }

        src += "\n";
        src += "port_" + p.id + ".setUiAttribs({";
        if (p.title)src += "title:\"" + p.title + "\",";

        if (p.uiDisplay == "texture")src += "display:\"texture\",objType:\"texture\",";
        else if (p.uiDisplay == "int")src += "increment:\"integer\",";
        else if (p.uiDisplay)src += "display:\"" + p.uiDisplay + "\",";
        src += "});\n";

        src += "".endl();
    }

    src +=
            "op.initInnerPorts=function(addedOps)".endl() +
            "{".endl() +
            "  for(let i=0;i<addedOps.length;i++)".endl() +
            "  {".endl() +

            "    if(addedOps[i].innerInput)".endl() +
            "    {".endl();


    for (let i = 0; i < ports.ports.length; i++)
    {
        const p = ports.ports[i];
        if (!p) continue;
        if (p.dir != 0) continue; // only INPUT ports: add OUTPUTS to inner input op

        let outPortFunc = "outNumber";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_FUNCTION) outPortFunc = "outTrigger";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_OBJECT) outPortFunc = "outObject";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_ARRAY) outPortFunc = "outArray";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_STRING) outPortFunc = "outString";

        src += "const innerOut_" + p.id + " = addedOps[i]." + outPortFunc + "(\"innerOut_" + p.id + "\");".endl();

        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_VALUE || ports.ports[i].type == CABLES.OP_PORT_TYPE_STRING)
            src += "innerOut_" + p.id + ".set(port_" + p.id + ".get() );".endl();

        if (p.title)src += "innerOut_" + p.id + ".setUiAttribs({title:\"" + p.title + "\"});\n";

        if (p.type == 0 || p.type == 5) src += "port_" + p.id + ".on(\"change\", (a,v) => { innerOut_" + p.id + ".set(a); });".endl();
        else if (p.type == 1) src += "port_" + p.id + ".onTriggered = () => { innerOut_" + p.id + ".trigger(); };".endl();
        else src += "port_" + p.id + ".on(\"change\", (a,v) => { innerOut_" + p.id + ".setRef(a); });".endl();

        src += "".endl();
    }


    src += "    }".endl();


    src += "if(addedOps[i].innerOutput)".endl() +
                "{".endl();


    for (let i = 0; i < ports.ports.length; i++)
    {
        const p = ports.ports[i];
        if (!p) continue;
        if (p.dir != 1) continue;

        let inPortFunc = "inFloat";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_FUNCTION) inPortFunc = "inTrigger";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_OBJECT) inPortFunc = "inObject";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_ARRAY) inPortFunc = "inArray";
        if (ports.ports[i].type == CABLES.OP_PORT_TYPE_STRING) inPortFunc = "inString";

        src += "const innerIn_" + p.id + " = addedOps[i]." + inPortFunc + "(\"innerIn_" + p.id + "\");".endl();
        if (p.title)src += "innerIn_" + p.id + ".setUiAttribs({title:\"" + p.title + "\"});\n";

        if (p.type == 0 || p.type == 5) src += "innerIn_" + p.id + ".on(\"change\", (a,v) => { port_" + p.id + ".set(a); });".endl();
        else if (p.type == 1) src += "innerIn_" + p.id + ".onTriggered = () => { port_" + p.id + ".trigger(); };".endl();
        else src += "innerIn_" + p.id + ".on(\"change\", (a,v) => { port_" + p.id + ".setRef(a); });".endl();

        src += "".endl();
    }
    src +=
                "}".endl();


    src +=
            "}".endl() +
        "};".endl();

    return src;
};


blueprintUtil.portJsonUtil = (opId, portid, options) =>
{
    const loadingModal = gui.startModalLoading("Modify port ...");
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

    let setSavedParentSubpatch = false;
    if (gui.savedState.isSavedSubPatch(oldSubPatchId)) setSavedParentSubpatch = oldSubPatchId;

    const ops = gui.corePatch().getOpsByOpId(opId);
    for (let i = 0; i < ops.length; i++)
    {
        for (let k = 0; k < ops[i].portsIn.length; k++) ops[i].portsIn[k].setUiAttribs({ "title": null });
        for (let k = 0; k < ops[i].portsOut.length; k++) ops[i].portsOut[k].setUiAttribs({ "title": null });
    }

    loadingModal.setTask("getting ports json");
    CABLESUILOADER.talkerAPI.send(
        "opAttachmentGet",
        {
            "opname": opId,
            "name": blueprintUtil.blueprintPortJsonAttachmentFilename,
        },
        (err, res) =>
        {
            res = res || {};
            res.content = res.content || JSON.stringify({ "ports": [] });
            const js = JSON.parse(res.content);

            let found = false;
            for (let i = 0; i < js.ports.length; i++)
            {
                if (js.ports[i].id == portid)
                {
                    if (options.hasOwnProperty("title")) js.ports[i].title = options.title;
                    if (options.hasOwnProperty("port")) js.ports[i] = options.port;
                    found = true;
                }
            }

            if (!found)
            {
                if (options.hasOwnProperty("port"))
                {
                    js.ports.push(options.port);
                }
            }

            loadingModal.setTask("saving ports json");

            blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
            {
                loadingModal.setTask("reload op");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    gui.opParams.refresh();

                    if (subOuter)
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                    gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                    gui.corePatch().buildSubPatchCache();

                    if (setSavedParentSubpatch !== false)gui.savedState.setSaved("blueprintutil", setSavedParentSubpatch);

                    gui.endModalLoading();
                });
            });
        }
    );
};

blueprintUtil.portJsonDelete = (opId, portid) =>
{
    const loadingModal = gui.startModalLoading("Deleting port...");
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

    let setSavedParentSubpatch = false;
    if (gui.savedState.isSavedSubPatch(oldSubPatchId)) setSavedParentSubpatch = oldSubPatchId;

    loadingModal.setTask("getting ports json");
    CABLESUILOADER.talkerAPI.send(
        "opAttachmentGet",
        {
            "opname": opId,
            "name": blueprintUtil.blueprintPortJsonAttachmentFilename,
        },
        (err, res) =>
        {
            res = res || {};
            res.content = res.content || JSON.stringify({ "ports": [] });
            const js = JSON.parse(res.content);

            for (let i = 0; i < js.ports.length; i++) if (js.ports[i] && js.ports[i].id == portid) js.ports[i] = null;

            js.ports = blueprintUtil.sortPortsJsonPorts(js.ports);

            loadingModal.setTask("saving ports json");

            blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
            {
                loadingModal.setTask("reload op");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    gui.opParams.refresh();
                    if (subOuter)
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                    gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                    gui.corePatch().buildSubPatchCache();
                    if (setSavedParentSubpatch !== false)gui.savedState.setSaved("blueprintutil", setSavedParentSubpatch);

                    gui.endModalLoading();
                });
            });
        }
    );
};

blueprintUtil.portJsonMove = (opId, portid, dir) =>
{
    const loadingModal = gui.startModalLoading("Moving port...");
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);
    let setSavedParentSubpatch = false;
    if (gui.savedState.isSavedSubPatch(oldSubPatchId)) setSavedParentSubpatch = oldSubPatchId;

    loadingModal.setTask("getting ports json");
    CABLESUILOADER.talkerAPI.send(
        "opAttachmentGet",
        {
            "opname": opId,
            "name": blueprintUtil.blueprintPortJsonAttachmentFilename,
        },
        (err, res) =>
        {
            res = res || {};
            res.content = res.content || JSON.stringify({ "ports": [] });
            const js = JSON.parse(res.content);

            let idx = -1;
            for (let i = 0; i < js.ports.length; i++) if (js.ports[i] && js.ports[i].id == portid)idx = i;


            function array_move(arr, old_index, new_index)
            {
                if (new_index >= arr.length)
                {
                    let k = new_index - arr.length + 1;
                    while (k--)
                    {
                        arr.push(undefined);
                    }
                }
                arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
                return arr; // for testing
            }

            if (idx + dir < 0)
            {
                gui.endModalLoading();
                return;
            }

            let newIndex = idx + dir;

            array_move(js.ports, idx, newIndex);

            loadingModal.setTask("saving ports json");

            blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
            {
                loadingModal.setTask("reload op");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    gui.opParams.refresh();

                    if (subOuter) gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                    gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                    gui.corePatch().buildSubPatchCache();

                    if (setSavedParentSubpatch !== false)gui.savedState.setSaved("blueprintutil", setSavedParentSubpatch);

                    gui.endModalLoading();
                });
            });
        }
    );
};

blueprintUtil.createBlueprintPortJsonElement = (port, reverseDir) =>
{
    const o = {
        "id": CABLES.shortId(),
        "title": port.getTitle(),
        "dir": port.direction,
        "type": port.type,
        "uiDisplay": port.uiAttribs.display
    };

    if (reverseDir)
        if (o.dir == 0)o.dir = 1;
        else o.dir = 0;

    if (port.type == CABLES.OP_PORT_TYPE_VALUE || port.type == CABLES.OP_PORT_TYPE_STRING)
        o.value = port.get();

    return o;
};

blueprintUtil.savePortJsonBlueprintAttachment = (portsJson, opname, next) =>
{
    if (!portsJson.ports)
    {
        console.error("thats not json", portsJson);
        return;
    }

    portsJson.ports = blueprintUtil.sortPortsJsonPorts(portsJson.ports);

    const atts = {};
    atts[blueprintUtil.blueprintPortJsonAttachmentFilename] = JSON.stringify(portsJson, false, 4);
    atts["att_inc_gen_ports.js"] = blueprintUtil.generatePortsAttachmentJsSrc(portsJson);


    if (!gui.savedState.isSavedSubPatch(gui.patchView.getCurrentSubPatch()))
    {
        const subOuterOp = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
        if (
            subOuterOp &&
            (subOuterOp.opId == opname || subOuterOp.objName == opname) &&
            gui.patchView.getCurrentSubPatch() != 0
        )
        {
            const newSubId = CABLES.shortId();
            const o = blueprintUtil._getSubPatchSerialized(gui.patchView.getCurrentSubPatch(), newSubId);

            atts[blueprintUtil.blueprintSubpatchAttachmentFilename] = JSON.stringify(o, null, "  ");
        }
    }

    CABLESUILOADER.talkerAPI.send("opUpdate",
        {
            "opname": opname,
            "update":
            {
                "attachments": atts
            }
        },
        (r) =>
        {
            if (next)next();
        });
};

blueprintUtil.sortPortsJsonPorts = (ports) =>
{
    ports = ports.filter((n) => { return n; }); // remove null objects

    for (let i = 0; i < ports.length; i++)
        ports[i].order = ports[i].dir * 1000 + i;

    return ports.sort((a, b) => { return a.order - b.order; });
};

blueprintUtil.addPortToBlueprint = (opId, port, options) =>
{
    options = options || {};
    const loadingModal = gui.startModalLoading("Adding port");
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

    gui.patchView.unselectAllOps();

    loadingModal.setTask("getting ports json");





    CABLESUILOADER.talkerAPI.send(
        "opAttachmentGet",
        {
            "opname": opId,
            "name": blueprintUtil.blueprintPortJsonAttachmentFilename,
        },
        (err, res) =>
        {
            res = res || {};
            res.content = res.content || JSON.stringify({ "ports": [] });
            const js = JSON.parse(res.content) || {};
            js.ports = js.ports || [];

            const newPortJson = blueprintUtil.createBlueprintPortJsonElement(port, options.reverseDir);

            js.ports.push(newPortJson);
            js.ports = blueprintUtil.sortPortsJsonPorts(js.ports);

            loadingModal.setTask("saving ports json");


            blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
            {
                loadingModal.setTask("reload op");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    const newOp = newOps[0];
                    gui.patchView.unselectAllOps();
                    gui.opParams.refresh();
                    if (subOuter) gui.patchView.setCurrentSubPatch(newOp.patchId.get());

                    gui.corePatch().clearSubPatchCache(newOp.patchId.get());
                    gui.corePatch().buildSubPatchCache();

                    if (port.op.storage && port.op.storage.ref)
                    {
                        const theOp = gui.corePatch().getOpByRefId(port.op.storage.ref, newOp.patchId.get());

                        gui.corePatch().link(
                            theOp,
                            port.name,
                            gui.corePatch().getSubPatch2InnerInputOp(newOp.patchId.get()),
                            "innerOut_" + newPortJson.id
                        );
                    }

                    if (options.cb)options.cb(newPortJson, newOp);
                    gui.endModalLoading();
                });
            });
        }
    );
};


blueprintUtil.getAutoName = (short) =>
{
    let newOpName = "";
    const ns = defaultOps.getPatchOpsNamespace();

    for (let i = 0; i < 1000; i++)
    {
        newOpName = ns + "SubPatch" + i;
        // const ops = gui.corePatch().getOpsByObjName(newOpName);
        const doc = gui.opDocs.getOpDocByName(newOpName);
        // if (ops.length == 0)
        if (!doc)
        {
            if (short)newOpName = "SubPatch" + i;
            break;
        }
    }

    return newOpName;
};

blueprintUtil.portEditDialog = (opId, portId, portData) =>
{
    if (!portId)portId = CABLES.shortId();
    const html = getHandleBarHtml("dialog_createport", { "portId": portId, "port": portData });

    new ModalDialog({ "html": html });

    const elSubmit = ele.byId("createPortSubmit");


    elSubmit.addEventListener("click",
        () =>
        {
            // const elePortId = ele.byId("createPortId");
            const eleDir = ele.byId("createPortDir");
            const eleName = ele.byId("createPortName");
            const eleType = ele.byId("createPortType");
            const eleValue = ele.byId("createPortValue");

            let type = 0;
            if (eleType.value.indexOf("Number") == 0)type = CABLES.OP_PORT_TYPE_VALUE;
            if (eleType.value.indexOf("Boolean") == 0)type = CABLES.OP_PORT_TYPE_VALUE;
            if (eleType.value.indexOf("String") == 0)type = CABLES.OP_PORT_TYPE_STRING;
            if (eleType.value.indexOf("Array") == 0)type = CABLES.OP_PORT_TYPE_ARRAY;
            if (eleType.value.indexOf("Object") == 0)type = CABLES.OP_PORT_TYPE_OBJECT;
            if (eleType.value.indexOf("Trigger") == 0)type = CABLES.OP_PORT_TYPE_FUNCTION;

            if (!eleName.value)
            {
                eleName.value = eleType.value;

                if (eleName.value.indexOf(" ") > -1)
                    eleName.value = eleName.value.slice(0, eleName.value.indexOf(" "));

                if (eleDir.value == 0)eleName.value += " Input";
                else eleName.value += " Output";
            }
            const port =
            {
                "id": portId,
                "title": eleName.value,
                "dir": parseInt(eleDir.value),
                "type": type
            };


            if (type == CABLES.OP_PORT_TYPE_STRING)
            {
                port.value = eleValue.value;
                if (eleType.value.indexOf("Editor") > -1) port.uiDisplay = "editor";
                if (eleType.value.indexOf("URL") > -1) port.uiDisplay = "file";
            }

            if (type == CABLES.OP_PORT_TYPE_FUNCTION)
            {
                if (eleType.value.indexOf("Button") > -1) port.uiDisplay = "button";
            }
            if (type == CABLES.OP_PORT_TYPE_VALUE)
            {
                port.value = parseFloat(eleValue.value) || 0;

                if (eleType.value.indexOf("Integer") > -1) port.uiDisplay = "int";
                if (eleType.value.indexOf("Slider") > -1) port.uiDisplay = "range";
                if (eleType.value.indexOf("Boolean") > -1) port.uiDisplay = "bool";
            }


            if (type == CABLES.OP_PORT_TYPE_OBJECT)
            {
                if (eleType.value.indexOf("Texture") > -1)
                {
                    port.uiDisplay = "texture";
                    // port.uiAttribs = { "display": "texture" };
                    // port.objType = "texture";
                }
            }


            blueprintUtil.portJsonUtil(opId, portId, { "port": port });
        });
};

blueprintUtil._getSubPatchSerialized = function (oldSubId, newSubId)
{
    const ops = gui.patchView.getAllOpsInBlueprint(oldSubId);
    const o = { "ops": [] };

    ops.forEach((op) =>
    {
        const ser = op.getSerialized();
        delete ser.uiAttribs.history;
        delete ser.uiAttribs.selected;

        if (ser.uiAttribs.subPatch == oldSubId)ser.uiAttribs.subPatch = newSubId;
        o.ops.push(ser);
    });

    CABLES.Patch.replaceOpIds(o, { "parentSubPatchId": newSubId, "refAsId": true, "doNotUnlinkLostLinks": true, "fixLostLinks": true });

    return o;
};

blueprintUtil.updateBluePrint2Attachment = (newOp, options) =>
{
    const oldSubId = options.oldSubId;
    gui.patchView.setPositionSubPatchInputOutputOps(oldSubId);
    const loadingModal = gui.startModalLoading("serialize ops");

    const subId = CABLES.shortId();
    const o = blueprintUtil._getSubPatchSerialized(oldSubId, subId);

    loadingModal.setTask("save attachment...");

    const oldSubPatchId = gui.patchView.getCurrentSubPatch();

    CABLESUILOADER.talkerAPI.send(
        "opAttachmentSave",
        {
            "opname": newOp.objName,
            "name": blueprintUtil.blueprintSubpatchAttachmentFilename,
            "content": JSON.stringify(o, null, "  "),
        },
        (err) =>
        {
            if (err)
            {
                gui.serverOps.showApiError(err);
                // new ModalError({ "title": "Error/Invalid response from server 1", "text": "<pre>" + JSON.stringify(err, false, 4) + "</pre>" });
                CABLES.UI.notifyError("Could not save " + newOp.objName);
            }
            else
            {
                CABLES.UI.notify("Saved " + newOp.objName + " (" + o.ops.length + " ops)");
            }

            gui.showLoadingProgress(false);

            if (options.loadingModal) options.loadingModal.setTask("update project date...");

            CABLESUILOADER.talkerAPI.send("setProjectUpdated", { "projectId": gui.patchId }, (e) =>
            {
                gui.patchView.store._serverDate = e.data.updated;
            });

            if (newOp.patchId)
                gui.savedState.setSaved("saved bp", newOp.patchId.get());

            if (options.execute !== false)
            {
                if (gui.corePatch().getOpsByObjName(newOp.objName).length > 1)
                {
                    if (options.loadingModal)options.loadingModal.setTask("execute op...");
                    gui.serverOps.execute(newOp.objName,
                        (newOps, refNewOp) =>
                        {
                            gui.corePatch().clearSubPatchCache(refNewOp.uiAttribs.subPatch);
                            gui.corePatch().clearSubPatchCache(newOp.patchId.get());

                            setTimeout(() =>
                            {
                                if (refNewOp)
                                {
                                    gui.patchView.setCurrentSubPatch(gui.corePatch().getNewSubpatchId(oldSubPatchId));//
                                    gui.patchView.focusOp(refNewOp.id);
                                    gui.patchView.centerSelectOp(refNewOp.id, true);
                                }

                                if (options.next)options.next();
                            }, 100);
                        },
                        newOp);
                }
            }
            else
            {
                if (options.next)options.next();
            }
            gui.endModalLoading();
        });
};



blueprintUtil.createBlueprint2Op = (newOp, oldSubpatchOp, next, options = {}) =>
{
    const loadingModal = gui.startModalLoading("save op code");

    CABLESUILOADER.talkerAPI.send("opUpdate",
        {
            "opname": newOp.objName,
            "update": {
                "code": srcBluePrintOp,
                "coreLibs": ["subpatchop"]
            }
        },
        (err) =>
        {
            if (err)
            {
                // new ModalError({ "title": "Error/Invalid response from server 2", "text": "<pre>" + JSON.stringify(err, false, 4) + "</pre>" });
                this.showApiError(err);
                return;
            }
            loadingModal.setTask("update bp2 attachment");

            if (oldSubpatchOp && newOp)
                newOp.setUiAttrib(
                    { "translate":
                        {
                            "x": oldSubpatchOp.uiAttribs.translate.x,
                            "y": oldSubpatchOp.uiAttribs.translate.y + gluiconfig.newOpDistanceY
                        }
                    });

            blueprintUtil.updateBluePrint2Attachment(
                newOp,
                {
                    "execute": false,
                    "oldSubId": oldSubpatchOp.patchId.get(),
                    "replaceIds": true,
                    "next": () =>
                    {
                        if (!options.doNotExecute)
                            gui.serverOps.execute(newOp.objName,
                                (newOps) =>
                                {
                                    gui.endModalLoading();
                                    if (next)next();
                                });
                        else
                        {
                            gui.endModalLoading();
                            if (next)next();
                        }
                    }
                });
        });
};



export default blueprintUtil;


