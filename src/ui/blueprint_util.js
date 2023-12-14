import defaultOps from "./defaultops";
import ModalLoading from "./dialogs/modalloading";
import gluiconfig from "./glpatch/gluiconfig";


const blueprintUtil =
{
    "blueprintPortJsonAttachmentFilename": "att_ports.json",
    "blueprintSubpatchAttachmentFilename": "att_subpatch_json",

    "executeBlueprintIfMultiple": (opname, next) =>
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
    },

    "generatePortsAttachmentJsSrc": (ports) =>
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
            if (p.uiDisplay)src += "display:\"" + p.uiDisplay + "\",";
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
    },


    "fportJsonTitle": (opId, portid, title) =>
    {
        const loadingModal = new ModalLoading("Setting port title...");

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
                "name": blueprintUtil.blueprintUtil.blueprintPortJsonAttachmentFilename,
            },
            (err, res) =>
            {
                res = res || {};
                res.content = res.content || JSON.stringify({ "ports": [] });
                const js = JSON.parse(res.content);

                for (let i = 0; i < js.ports.length; i++) if (js.ports[i].id == portid)js.ports[i].title = title;

                loadingModal.setTask("saving ports json");

                blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
                {
                    loadingModal.setTask("reload op");

                    gui.serverOps.execute(opId, (newOps) =>
                    {
                        gui.opParams.refresh();
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                        gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                        gui.corePatch().buildSubPatchCache();

                        loadingModal.close();
                    });
                });
            }
        );
    },

    "portJsonDelete": (opId, portid) =>
    {
        const loadingModal = new ModalLoading("Deleting port...");

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

                if (idx != -1)
                {
                    js.ports.splice(1, idx);
                }
                else
                {
                    loadingModal.setTask("INVALID PORT INDEX");
                }

                loadingModal.setTask("saving ports json");

                blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
                {
                    loadingModal.setTask("reload op");

                    gui.serverOps.execute(opId, (newOps) =>
                    {
                        gui.opParams.refresh();
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                        gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                        gui.corePatch().buildSubPatchCache();

                        loadingModal.close();
                    });
                });
            }
        );
    },

    "portJsonMove": (opId, portid, dir) =>
    {
        const loadingModal = new ModalLoading("Moving port...");

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
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                        gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                        gui.corePatch().buildSubPatchCache();

                        loadingModal.close();
                    });
                });
            }
        );
    },

    "createBlueprintPortJsonElement": (port, i) =>
    {
        const o = {
            "id": "id" + i,
            "title": port.getTitle(),
            "dir": port.direction,
            "type": port.type,
            "uiDisplay": port.uiAttribs.display
        };

        if (port.type == CABLES.OP_PORT_TYPE_VALUE || port.type == CABLES.OP_PORT_TYPE_STRING)
            o.value = port.get();

        return o;
    },

    "savePortJsonBlueprintAttachment": (portsJson, opname, next) =>
    {
        if (!portsJson.ports)
        {
            console.error("thats not json", portsJson);
            debugger;
            return;
        }

        portsJson.ports = portsJson.ports.filter((n) => { return n; });


        console.log("portsJson", portsJson);

        CABLESUILOADER.talkerAPI.send(
            "opAttachmentSave",
            {
                "opname": opname,
                "name": blueprintUtil.blueprintPortJsonAttachmentFilename,
                "content": JSON.stringify(portsJson, false, 4),
            },
            (errr2, re2) =>
            {
                const src = blueprintUtil.generatePortsAttachmentJsSrc(portsJson);

                CABLESUILOADER.talkerAPI.send(
                    "opAttachmentSave",
                    {
                        "opname": opname,
                        "name": "att_inc_gen_ports.js",
                        "content": src,
                    },
                    (errr3, re3) =>
                    {
                        if (next)next();
                    },
                );
            },
        );
    },

    "addPortToBlueprint": (opId, port) =>
    {
        const loadingModal = new ModalLoading("Adding port...");

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
                const newPortJson = blueprintUtil.createBlueprintPortJsonElement(port, js.ports.length);

                js.ports.push(newPortJson);
                loadingModal.setTask("saving ports json");


                blueprintUtil.savePortJsonBlueprintAttachment(js, opId, () =>
                {
                    loadingModal.setTask("reload op");

                    gui.serverOps.execute(opId, (newOps) =>
                    {
                        gui.opParams.refresh();
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

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
    },
    "updateBluePrint2Attachment": (newOp, options) =>
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
                                }, 300);


                                if (options.next)options.next();
                            },
                            newOp);
                }
                else
                {
                    if (options.next)options.next();
                }
            });
    },

    "createBlueprint2Op": (newOp, oldSubpatchOp, next, loadingModal) =>
    {
        if (loadingModal)loadingModal.setTask("add Corebib");

        gui.serverOps.addCoreLib(newOp.objName, "subpatchop", () =>
        {
            CABLESUILOADER.talkerAPI.send(
                "getOpCode",
                {
                    "opname": defaultOps.defaultOpNames.blueprintTemplate,
                    "projectId": gui.serverOps._patchId
                },
                (er, rslt) =>
                {
                    if (loadingModal)loadingModal.setTask("save op code");

                    CABLESUILOADER.talkerAPI.send(
                        "saveOpCode",
                        {
                            "opname": newOp.objName,
                            "code": rslt.code
                        },
                        (err, res) =>
                        {
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
                });
        }, { "showReloadInfo": false });
    }


};

export default blueprintUtil;
