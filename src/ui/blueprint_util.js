import OpDocs from "./components/opdocs";
import defaultOps from "./defaultops";
import ModalLoading from "./dialogs/modalloading";
import gluiconfig from "./glpatch/gluiconfig";

import srcBluePrintOp from "./blueprint_op.js.txt";
import ModalDialog from "./dialogs/modaldialog";
import { getHandleBarHtml } from "./utils/handlebars";



const blueprintUtil = {};

blueprintUtil.blueprintPortJsonAttachmentFilename = "att_ports.json";
blueprintUtil.blueprintSubpatchAttachmentFilename = "att_subpatch_json";

blueprintUtil.executeBlueprintIfMultiple = (opname, next) =>
{
    const ops = gui.corePatch().getOpsByObjName(opname);

    if (ops.length > 0)
    {
        console.log("execute bp op");
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
    let src = "console.log(\"creating ports....\")\n";

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
    const loadingModal = new ModalLoading("Modify port ...");
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

                    loadingModal.close();
                });
            });
        }
    );
};

blueprintUtil.portJsonDelete = (opId, portid) =>
{
    const loadingModal = new ModalLoading("Deleting port...");
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

                    loadingModal.close();
                });
            });
        }
    );
};

blueprintUtil.portJsonMove = (opId, portid, dir) =>
{
    const loadingModal = new ModalLoading("Moving port...");
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
                loadingModal.close();
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

                    loadingModal.close();
                });
            });
        }
    );
};

blueprintUtil.createBlueprintPortJsonElement = (port) =>
{
    const o = {
        "id": CABLES.shortId(),
        "title": port.getTitle(),
        "dir": port.direction,
        "type": port.type,
        "uiDisplay": port.uiAttribs.display
    };

    if (port.type == CABLES.OP_PORT_TYPE_VALUE || port.type == CABLES.OP_PORT_TYPE_STRING)
        o.value = port.get();

    return o;
};

blueprintUtil.savePortJsonBlueprintAttachment = (portsJson, opname, next) =>
{
    if (!portsJson.ports)
    {
        console.error("thats not json", portsJson);
        debugger;
        return;
    }

    portsJson.ports = blueprintUtil.sortPortsJsonPorts(portsJson.ports);

    const atts = {};
    atts[blueprintUtil.blueprintPortJsonAttachmentFilename] = JSON.stringify(portsJson, false, 4);
    atts["att_inc_gen_ports.js"] = blueprintUtil.generatePortsAttachmentJsSrc(portsJson);

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
            console.log("response", r);
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

blueprintUtil.addPortToBlueprint = (opId, port) =>
{
    const loadingModal = new ModalLoading("Adding port...");

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

            const newPortJson = blueprintUtil.createBlueprintPortJsonElement(port);

            js.ports.push(newPortJson);
            js.ports = blueprintUtil.sortPortsJsonPorts(js.ports);

            loadingModal.setTask("saving ports json");


            blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
            {
                loadingModal.setTask("reload op");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    gui.patchView.unselectAllOps();
                    gui.opParams.refresh();
                    if (subOuter) gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());


                    gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                    gui.corePatch().buildSubPatchCache();

                    if (port.op.storage && port.op.storage.ref)
                    {
                        const theOp = gui.corePatch().getOpByRefId(port.op.storage.ref, newOps[0].patchId.get());

                        gui.corePatch().link(
                            theOp,
                            port.name,
                            gui.corePatch().getSubPatch2InnerInputOp(newOps[0].patchId.get()),
                            "innerOut_" + newPortJson.id
                        );
                    }

                    loadingModal.close();
                });
            });
        }
    );
};

blueprintUtil.updateBluePrint2Attachment = (newOp, options) =>
{
    const oldSubId = options.oldSubId;

    const ops = gui.patchView.getAllOpsInBlueprint(oldSubId);
    const o = { "ops": [] };
    const subId = CABLES.shortId();

    if (options.loadingModal)options.loadingModal.setTask("serialize ops");

    ops.forEach((op) =>
    {
        const ser = op.getSerialized();
        delete ser.uiAttribs.history;
        if (ser.uiAttribs.subPatch == oldSubId)ser.uiAttribs.subPatch = subId;
        o.ops.push(ser);
    });

    if (options.loadingModal)options.loadingModal.setTask("replace op ids");

    CABLES.Patch.replaceOpIds(o, { "parentSubPatchId": subId, "refAsId": true, "doNotUnlinkLostLinks": true, "fixLostLinks": true });


    if (options.loadingModal)options.loadingModal.setTask("save attachment...");

    const oldSubPatchId = gui.patchView.getCurrentSubPatch();



    CABLESUILOADER.talkerAPI.send(
        "opAttachmentSave",
        {
            "opname": newOp.objName,
            "name": blueprintUtil.blueprintSubpatchAttachmentFilename,
            "content": JSON.stringify(o, null, "    "),
        },
        (errr, re) =>
        {
            CABLES.UI.notify("Saved " + newOp.objName + " (" + o.ops.length + " ops)");
            gui.showLoadingProgress(false);

            if (options.loadingModal)options.loadingModal.setTask("update project date...");

            CABLESUILOADER.talkerAPI.send("setProjectUpdated", { "projectId": gui.patchId }, (e) =>
            {
                gui.patchView.store._serverDate = e.data.updated;
            });

            if (newOp.patchId)
                gui.savedState.setSaved("saved bp", newOp.patchId.get());

            if (options.execute !== false)
            {
                if (options.loadingModal)options.loadingModal.setTask("execute...");

                if (gui.corePatch().getOpsByObjName(newOp.objName).length > 1)
                    gui.serverOps.execute(newOp.objName,
                        (newOps, refNewOp) =>
                        {
                            if (refNewOp && refNewOp.patchId)console.log(refNewOp.patchId.get());

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
                            }, 100);


                            if (options.next)options.next();
                        },
                        newOp);
            }
            else
            {
                if (options.next)options.next();
            }
        });
};

blueprintUtil.getAutoName = () =>
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
            break;
        }
    }

    console.log("newOpName", newOpName);

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

            const port =
            {
                "id": portId,
                "title": eleName.value,
                "dir": parseInt(eleDir.value),
                "type": type,
                // "uiDisplay": "range",
                // "value": value,
                // "order": 1
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


            console.log("port", port);
        });
};


blueprintUtil.createBlueprint2Op = (newOp, oldSubpatchOp, next, loadingModal) =>
{
    if (loadingModal)loadingModal.setTask("add Corelib");

    // gui.serverOps.addCoreLib(newOp.objName, "subpatchop", () =>
    // {
    // CABLESUILOADER.talkerAPI.send(
    //     "getOpCode",
    //     {
    //         "opname": defaultOps.defaultOpNames.blueprintTemplate,
    //         "projectId": gui.serverOps._patchId
    //     },
    //     (er, rslt) =>
    //     {
    if (loadingModal)loadingModal.setTask("save op code");

    CABLESUILOADER.talkerAPI.send("opUpdate",
        {
            "opname": newOp.objName,
            "update": {
                "code": srcBluePrintOp,
                // "attachments": {
                //     // "att_test": "testsss"
                // },
                "coreLibs": ["subpatchop"]
            }
        },
        (r) =>
        {
            console.log("response", r);
            if (loadingModal)loadingModal.setTask("update bp2 attachment");

            console.log("oldSubpatchOp.patchId.get()", oldSubpatchOp.patchId.get());

            blueprintUtil.updateBluePrint2Attachment(
                newOp,
                {
                    "execute": false,
                    "loadingModal": loadingModal,
                    "oldSubId": oldSubpatchOp.patchId.get(),
                    "replaceIds": true,
                    "next": () =>
                    {
                        gui.serverOps.execute(newOp.objName,
                            (newOps) =>
                            {
                                if (oldSubpatchOp && newOps.length == 1) newOps[0].setUiAttrib({ "translate": { "x": oldSubpatchOp.uiAttribs.translate.x, "y": oldSubpatchOp.uiAttribs.translate.y + gluiconfig.newOpDistanceY } });

                                if (next)next();
                            });
                    }
                });
        });


    // CABLESUILOADER.talkerAPI.send(
    //     "saveOpCode",
    //     {
    //         "opname": newOp.objName,
    //         "code": rslt.code
    //     },
    //     (err, res) =>
    //     {
    // });
    // });
    // }, { "showReloadInfo": false });
};



export default blueprintUtil;


