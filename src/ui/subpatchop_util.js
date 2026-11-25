import { Logger, ele, TalkerAPI } from "cables-shared-client";
import { Patch, Port, utils } from "cables";
import { nl } from "cables-corelibs/cg/constants.js";
import gluiconfig from "./glpatch/gluiconfig.js";
import srcSubPatchOp from "./subpatchop.js.txt";
import ModalDialog from "./dialogs/modaldialog.js";
import { getHandleBarHtml } from "./utils/handlebars.js";
import { notify, notifyError } from "./elements/notification.js";
import { gui } from "./gui.js";
import { platform } from "./platform.js";
import { CmdPatch } from "./commands/cmd_patch.js";
import { UiOp } from "./core_extend_op.js";

const subPatchOpUtil = {};

/** names of ops being created from a selection, the build watcher must not reload them meanwhile */
subPatchOpUtil.creatingOps = new Set();

subPatchOpUtil.blueprintPortJsonAttachmentFilename = "att_ports.json";
subPatchOpUtil.blueprintSubpatchAttachmentFilename = "att_subpatch_json";

const _log = new Logger("subPatchOpUtil");

subPatchOpUtil.saveUnsavedPatchSubpatchOps = () =>
{

    const ops = gui.savedState.getUnsavedPatchSubPatchOps();

    for (let i = 0; i < ops.length; i++)
    {
        subPatchOpUtil.updateSubPatchOpAttachment(ops[i].op, { "oldSubId": ops[i].subId });
    }
};

subPatchOpUtil.executeBlueprintIfMultiple = (opname, next) =>
{
    const ops = gui.corePatch().getOpsByObjName(opname);

    if (ops.length > 0)
    {
        gui.serverOps.execute(ops[0].opId, next);
    }
    else
    {
        _log.log("no need to execute bp op");
        next();
    }
};

subPatchOpUtil.generatePortsAttachmentJsSrc = (ports) =>
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
            if (p.type == Port.TYPE_NUMBER) src += "op.inFloat";
            else if (p.type == Port.TYPE_TRIGGER) src += "op.inTrigger";
            else if (p.type == Port.TYPE_OBJECT) src += "op.inObject";
            else if (p.type == Port.TYPE_ARRAY) src += "op.inArray";
            else if (p.type == Port.TYPE_STRING) src += "op.inString";

            src += "(\"" + p.id + "\""; // 1. name

            if (p.type == Port.TYPE_STRING) src += ",\"" + String(p.value).replaceAll("\n", "\\n") + "\""; // 2. param default value
            if (p.type == Port.TYPE_NUMBER) src += "," + p.value; // 2. param default value
            if (p.type == Port.TYPE_OBJECT) src += ",null," + JSON.stringify(p.objType || null); // 2. value, 3. objType

            src += ");";
        }
        else // OUTPUT
        {
            if (p.type == Port.TYPE_NUMBER) src += "op.outNumber";
            if (p.type == Port.TYPE_TRIGGER) src += "op.outTrigger";
            if (p.type == Port.TYPE_OBJECT) src += "op.outObject";
            if (p.type == Port.TYPE_ARRAY) src += "op.outArray";
            if (p.type == Port.TYPE_STRING) src += "op.outString";

            src += "(\"" + p.id + "\""; // 1. name
            if (p.type == Port.TYPE_OBJECT) src += ",null," + JSON.stringify(p.objType || null); // 2. value, 3. objType

            src += ");";
        }

        src += "" + nl;
        src += "port_" + p.id + ".setUiAttribs({";
        if (p.title)src += "title:\"" + p.title + "\",";

        if (p.type == Port.TYPE_OBJECT && p.objType == "texture")src += "display:\"texture\",";
        else if (p.uiDisplay == "int")src += "increment:\"integer\",";
        else if (p.uiDisplay && p.type != Port.TYPE_OBJECT)src += "display:\"" + p.uiDisplay + "\",";

        if (p.objType)src += "objType:\"" + p.objType + "\"";

        src += "});" + nl;

        if (p.values)src += "port_" + p.id + ".setUiAttribs({\"values\":" + JSON.stringify(p.values) + "});" + nl;
        if (p.addUiAttribs)src += "port_" + p.id + ".setUiAttribs(" + JSON.stringify(p.addUiAttribs) + ");" + nl;

        src += "" + nl;
    }

    src +=
            "op.initInnerPorts=function(addedOps)" + nl +
            "{" + nl +
            "  for(let i=0;i<addedOps.length;i++)" + nl +
            "  {" + nl +

            "    if(addedOps[i].innerInput)" + nl +
            "    {" + nl;

    for (let i = 0; i < ports.ports.length; i++)
    {
        const p = ports.ports[i];
        if (!p) continue;
        if (p.dir != 0) continue; // only INPUT ports: add OUTPUTS to inner input op

        let outPortFunc = "outNumber";

        if (p.type == Port.TYPE_OBJECT && p.objType == "texture") outPortFunc = "outTexture";
        else if (p.type == Port.TYPE_TRIGGER) outPortFunc = "outTrigger";
        else if (p.type == Port.TYPE_OBJECT) outPortFunc = "outObject";
        else if (p.type == Port.TYPE_ARRAY) outPortFunc = "outArray";
        else if (p.type == Port.TYPE_STRING) outPortFunc = "outString";

        let innerOutArgs = "\"innerOut_" + p.id + "\"";
        if (outPortFunc == "outObject") innerOutArgs += ",null," + JSON.stringify(p.objType || null);
        src += "const innerOut_" + p.id + " = addedOps[i]." + outPortFunc + "(" + innerOutArgs + ");" + nl;

        if (ports.ports[i].type == Port.TYPE_NUMBER || ports.ports[i].type == Port.TYPE_STRING)
            src += "innerOut_" + p.id + ".set(port_" + p.id + ".get() );" + nl;

        if (p.title)src += "innerOut_" + p.id + ".setUiAttribs({title:\"" + p.title + "\"});\n";

        if (p.type == 0 || p.type == 5) src += "port_" + p.id + ".on(\"change\", (a,v) => { innerOut_" + p.id + ".set(a); });" + nl;
        else if (p.type == 1) src += "port_" + p.id + ".onTriggered = () => { innerOut_" + p.id + ".trigger(); };" + nl;
        else src += "port_" + p.id + ".on(\"change\", (a,v) => { innerOut_" + p.id + ".setRef(a); });" + nl;

        src += "" + nl;
    }

    src += "    }" + nl;

    src += "if(addedOps[i].innerOutput)" + nl +
                "{" + nl;

    for (let i = 0; i < ports.ports.length; i++)
    {
        const p = ports.ports[i];
        if (!p) continue;
        if (p.dir != 1) continue;

        let inPortFunc = "inFloat";
        if (ports.ports[i].type == Port.TYPE_TRIGGER) inPortFunc = "inTrigger";
        if (ports.ports[i].type == Port.TYPE_OBJECT) inPortFunc = "inObject";
        if (ports.ports[i].type == Port.TYPE_ARRAY) inPortFunc = "inArray";
        if (ports.ports[i].type == Port.TYPE_STRING) inPortFunc = "inString";

        let innerInArgs = "\"innerIn_" + p.id + "\"";
        if (inPortFunc == "inObject") innerInArgs += ",null," + JSON.stringify(p.objType || null);
        src += "const innerIn_" + p.id + " = addedOps[i]." + inPortFunc + "(" + innerInArgs + ");" + nl;
        if (p.title)src += "innerIn_" + p.id + ".setUiAttribs({title:\"" + p.title + "\"});\n";

        if (p.type == 0 || p.type == 5) src += "innerIn_" + p.id + ".on(\"change\", (a,v) => { port_" + p.id + ".set(a); });" + nl;
        else if (p.type == 1) src += "innerIn_" + p.id + ".onTriggered = () => { port_" + p.id + ".trigger(); };" + nl;
        else src += "innerIn_" + p.id + ".on(\"change\", (a,v) => { port_" + p.id + ".setRef(a); });" + nl;

        src += "" + nl;
    }
    src += "}" + nl;

    src += "}" + nl +
        "};" + nl;

    return src;
};

subPatchOpUtil.portJsonUtil = (opId, portid, options) =>
{
    // const loadingModal = gui.startModalLoading("Modify port ...");
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

    // loadingModal.setTask("getting ports json");
    platform.talkerAPI.send(
        TalkerAPI.CMD_GET_OP_ATTACHMENT,
        {
            "opname": opId,
            "name": subPatchOpUtil.blueprintPortJsonAttachmentFilename
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

            // loadingModal.setTask("saving ports json");

            subPatchOpUtil.savePortJsonSubPatchOpAttachment(js, opId, () =>
            {
                // loadingModal.setTask("reload op4");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    gui.opParams.refresh();

                    if (subOuter)
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                    gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                    gui.corePatch().buildSubPatchCache();

                    if (setSavedParentSubpatch !== false) gui.savedState.setSaved("subppatchoputil", setSavedParentSubpatch);

                    gui.endModalLoading();
                });
            });
        }
    );
};

subPatchOpUtil.portJsonDelete = (opId, portid) =>
{
    // const loadingModal = gui.startModalLoading("Deleting port...");
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

    let setSavedParentSubpatch = false;
    if (gui.savedState.isSavedSubPatch(oldSubPatchId)) setSavedParentSubpatch = oldSubPatchId;

    // loadingModal.setTask("getting ports json");
    platform.talkerAPI.send(
        TalkerAPI.CMD_GET_OP_ATTACHMENT,
        {
            "opname": opId,
            "name": subPatchOpUtil.blueprintPortJsonAttachmentFilename
        },
        (err, res) =>
        {
            res = res || {};
            res.content = res.content || JSON.stringify({ "ports": [] });
            const js = JSON.parse(res.content);

            for (let i = 0; i < js.ports.length; i++) if (js.ports[i] && js.ports[i].id == portid) js.ports[i] = null;

            js.ports = subPatchOpUtil.sortPortsJsonPorts(js.ports);

            // loadingModal.setTask("saving ports json");

            subPatchOpUtil.savePortJsonSubPatchOpAttachment(js, opId, () =>
            {
                // loadingModal.setTask("reload op3");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    gui.opParams.refresh();
                    if (subOuter)
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());

                    gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                    gui.corePatch().buildSubPatchCache();
                    if (setSavedParentSubpatch !== false) gui.savedState.setSaved("subppatchoputil", setSavedParentSubpatch);

                    gui.endModalLoading();
                });
            });
        }
    );
};

/**
 * @param {string} opId
 * @param {string[]} portIds all port ids in their new order
 */
subPatchOpUtil.portJsonSetOrder = (opId, portIds) =>
{
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);
    let setSavedParentSubpatch = false;
    if (gui.savedState.isSavedSubPatch(oldSubPatchId)) setSavedParentSubpatch = oldSubPatchId;

    platform.talkerAPI.send(
        TalkerAPI.CMD_GET_OP_ATTACHMENT,
        {
            "opname": opId,
            "name": subPatchOpUtil.blueprintPortJsonAttachmentFilename
        },
        (err, res) =>
        {
            res = res || {};
            res.content = res.content || JSON.stringify({ "ports": [] });
            const js = JSON.parse(res.content);

            const index = (p) => { return p ? portIds.indexOf(p.id) : -1; };
            js.ports = js.ports.filter((p) => { return index(p) > -1; }).sort((a, b) => { return index(a) - index(b); });

            // loadingModal.setTask("saving ports json");

            subPatchOpUtil.savePortJsonSubPatchOpAttachment(js, opId, () =>
            {
                // loadingModal.setTask("reload op2");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    gui.opParams.refresh();

                    if (subOuter)
                    {
                        gui.patchView._patchRenderer.viewBox.storeCurrentSubPatch(newOps[0].patchId.get());
                        gui.patchView.setCurrentSubPatch(newOps[0].patchId.get());
                    }

                    gui.corePatch().clearSubPatchCache(newOps[0].patchId.get());
                    gui.corePatch().buildSubPatchCache();

                    if (setSavedParentSubpatch !== false) gui.savedState.setSaved("subppatchoputil", setSavedParentSubpatch);

                    gui.endModalLoading();
                });
            });
        }
    );
};

subPatchOpUtil.createBlueprintPortJsonElement = (port, reverseDir) =>
{
    const o = {
        "id": utils.shortId(),
        "title": port.getTitle(),
        "dir": port.direction,
        "type": port.type,
        "objType": port.uiAttribs.objType,
        "uiDisplay": port.uiAttribs.display
    };

    if (reverseDir)
        if (o.dir == 0)o.dir = 1;
        else o.dir = 0;

    if (port.type == Port.TYPE_NUMBER || port.type == Port.TYPE_STRING)
        o.value = port.get();

    return o;
};

subPatchOpUtil.savePortJsonSubPatchOpAttachment = (portsJson, opname, next) =>
{
    if (!portsJson.ports)
    {
        this._log.error("thats not json", portsJson);
        return;
    }

    portsJson.ports = subPatchOpUtil.sortPortsJsonPorts(portsJson.ports);

    const atts = {};
    atts[subPatchOpUtil.blueprintPortJsonAttachmentFilename] = JSON.stringify(portsJson, false, 4);
    atts["att_inc_gen_ports.js"] = subPatchOpUtil.generatePortsAttachmentJsSrc(portsJson);

    if (!gui.savedState.isSavedSubPatch(gui.patchView.getCurrentSubPatch()))
    {
        const subOuterOp = gui.patchView.getSubPatchOuterOp(gui.patchView.getCurrentSubPatch());
        if (
            subOuterOp &&
            (subOuterOp.opId == opname || subOuterOp.objName == opname) &&
            gui.patchView.getCurrentSubPatch() != Patch.DEFAULT_SUBPATCHID
        )
        {
            const newSubId = utils.shortId();
            const o = subPatchOpUtil._getSubPatchSerialized(gui.patchView.getCurrentSubPatch(), newSubId);

            atts[subPatchOpUtil.blueprintSubpatchAttachmentFilename] = JSON.stringify(o, null, "  ");
        }
    }

    platform.talkerAPI.send(TalkerAPI.CMD_UPDATE_OP,
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

subPatchOpUtil.sortPortsJsonPorts = (ports) =>
{
    ports = ports.filter((n) => { return n; }); // remove null objects

    for (let i = 0; i < ports.length; i++)
        ports[i].order = ports[i].dir * 1000 + i;

    return ports.sort((a, b) => { return a.order - b.order; });
};

/**
 * an executed subpatch op loads its inner ops async, saving before that would store an empty subpatch
 * @param {string} subPatchId
 * @param {function} cb
 */
subPatchOpUtil.onSubPatchLoaded = (subPatchId, cb) =>
{
    if (gui.corePatch().getSubPatchOps(subPatchId, false).length > 0) return cb();

    const listenerId = gui.corePatch().on("subpatchExpose", (exposedId) =>
    {
        if (exposedId != subPatchId) return;
        gui.corePatch().off(listenerId);
        cb();
    });
};

subPatchOpUtil.addPortToSubpatch = (opId, port, options) =>
{
    options = options || {};
    // const loadingModal = gui.startModalLoading("Adding port");
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

    gui.patchView.unselectAllOps();

    const portOuter = gui.patchView.getSubPatchOuterOp(port.op.uiAttribs.subPatch);
    if (portOuter && portOuter.opId == opId && !options.portOpSaved)
    {
        // the reload below finds the inner op again by its ref, so it needs one and has to be saved
        if (!port.op.storage || !port.op.storage.ref) port.op.setStorage({ "ref": utils.shortId() });
        subPatchOpUtil.updateSubPatchOpAttachment(portOuter, {
            "oldSubId": port.op.uiAttribs.subPatch,
            "execute": false,
            "next": () => { subPatchOpUtil.addPortToSubpatch(opId, port, { ...options, "portOpSaved": true }); }
        });
        return;
    }

    // loadingModal.setTask("getting ports json");
    gui.savingTitleAnimStart("Adding Subpatch Port...");

    platform.talkerAPI.send(
        TalkerAPI.CMD_GET_OP_ATTACHMENT,
        {
            "opname": opId,
            "name": subPatchOpUtil.blueprintPortJsonAttachmentFilename
        },
        (err, res) =>
        {
            res = res || {};
            res.content = res.content || JSON.stringify({ "ports": [] });
            const js = JSON.parse(res.content) || {};
            js.ports = js.ports || [];

            const newPortJson = subPatchOpUtil.createBlueprintPortJsonElement(port, options.reverseDir);

            js.ports.push(newPortJson);
            js.ports = subPatchOpUtil.sortPortsJsonPorts(js.ports);

            // loadingModal.setTask("saving ports json");

            subPatchOpUtil.savePortJsonSubPatchOpAttachment(js, opId, () =>
            {
                // loadingModal.setTask("reload op1");

                gui.serverOps.execute(opId, (newOps) =>
                {
                    subPatchOpUtil.onSubPatchLoaded(newOps[0].patchId.get(), () =>
                    {
                        const newOp = newOps[0];
                        gui.patchView.unselectAllOps();
                        gui.opParams.refresh();
                        if (subOuter)
                        {
                            // the reloaded op has a new subpatch id, keep the view instead of centering on it
                            gui.patchView._patchRenderer.viewBox.storeCurrentSubPatch(newOp.patchId.get());
                            gui.patchView.setCurrentSubPatch(newOp.patchId.get());
                        }

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

                            gui.corePatch().link(
                                theOp,
                                port.name,
                                gui.corePatch().getSubPatch2InnerOutputOp(newOp.patchId.get()),
                                "innerIn_" + newPortJson.id
                            );
                        }

                        gui.savingTitleAnimEnd();
                        if (options.cb)options.cb(newPortJson, newOp);

                        const outerOp = gui.patchView.getSubPatchOuterOp(newOp.patchId.get());

                        subPatchOpUtil.updateSubPatchOpAttachment(outerOp, { "oldSubId": newOp.patchId.get() });
                    });
                });
            });
        }
    );
};

subPatchOpUtil.getAutoName = (short) =>
{
    let newOpName = "";
    const ns = platform.getPatchOpsNamespace();

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

/** param display choices per port type */
subPatchOpUtil.portDisplays = {
    [Port.TYPE_NUMBER]: [
        { "value": "", "title": "Float" },
        { "value": "range", "title": "Slider" },
        { "value": "int", "title": "Integer" },
        { "value": "bool", "title": "Boolean" }
    ],
    [Port.TYPE_STRING]: [
        { "value": "", "title": "Text" },
        { "value": "file", "title": "URL" },
        { "value": "editor", "title": "Editor" },
        { "value": "switch", "title": "Switch" },
        { "value": "dropdown", "title": "Dropdown" },
        { "value": "gradient", "title": "Gradient" }
    ],
    [Port.TYPE_TRIGGER]: [
        { "value": "", "title": "Trigger" },
        { "value": "button", "title": "Button" }
    ],
    [Port.TYPE_OBJECT]: [],
    [Port.TYPE_ARRAY]: []
};

/**
 * @param {number} type
 * @param {string} current keeps a display that is not in the list, e.g. copied from an existing op port
 */
subPatchOpUtil.getPortDisplayOptions = (type, current) =>
{
    const options = subPatchOpUtil.portDisplays[type] || [];
    if (current && !options.some((o) => { return o.value == current; })) return options.concat([{ "value": current, "title": current }]);
    return options;
};

/**
 * @param {object} port port json
 * @returns {string}
 */
subPatchOpUtil.getPortDisplay = (port) =>
{
    if (port.type == Port.TYPE_OBJECT) return "";
    return port.uiDisplay || "";
};

/**
 * @param {object} port port json, changed in place
 * @param {string} display value from portDisplays
 */
subPatchOpUtil.setPortDisplay = (port, display) =>
{
    if (port.type == Port.TYPE_OBJECT) return;
    delete port.uiDisplay;
    if (display) port.uiDisplay = display;
};

/**
 * @param {object} port port json, changed in place
 * @param {string} objType
 */
subPatchOpUtil.setPortObjType = (port, objType) =>
{
    delete port.objType;
    if (port.type != Port.TYPE_OBJECT) return;
    delete port.uiDisplay;
    objType = (objType || "").trim();
    if (objType) port.objType = objType;
};

/** port ui attributes that have their own fields in the port dialog, stored in addUiAttribs */
subPatchOpUtil.portDialogUiAttribs = ["group", "hideParam", "hidePort", "greyout"];

subPatchOpUtil.portEditDialog = (opId, portId, portData) =>
{
    if (!portId)portId = utils.shortId();

    const uiAttribs = (portData && portData.addUiAttribs) || {};
    let otherUiAttribs = { ...uiAttribs };
    for (let i = 0; i < subPatchOpUtil.portDialogUiAttribs.length; i++) delete otherUiAttribs[subPatchOpUtil.portDialogUiAttribs[i]];
    if (Object.keys(otherUiAttribs).length == 0) otherUiAttribs = undefined;

    const html = getHandleBarHtml("dialog_createport", { "portId": portId, "port": portData, "uiAttribs": uiAttribs, "otherUiAttribs": otherUiAttribs });

    new ModalDialog({ "html": html });

    const eleType = ele.byId("createPortType");
    const eleDisplay = ele.byId("createPortDisplay");
    const eleObjTypeRow = ele.byId("createPortObjTypeRow");

    const fillDisplays = (selected) =>
    {
        const options = subPatchOpUtil.getPortDisplayOptions(parseInt(eleType.value), selected);
        eleDisplay.innerHTML = "";
        for (let i = 0; i < options.length; i++)
        {
            const o = document.createElement("option");
            o.value = options[i].value;
            o.innerText = options[i].title;
            o.selected = options[i].value == selected;
            eleDisplay.appendChild(o);
        }
        eleDisplay.disabled = options.length == 0;
        if (eleType.value == Port.TYPE_OBJECT) ele.show(eleObjTypeRow);
        else ele.hide(eleObjTypeRow);
    };
    fillDisplays(portData ? subPatchOpUtil.getPortDisplay(portData) : "");
    eleType.addEventListener("change", () => { fillDisplays(""); });

    const elSubmit = ele.byId("createPortSubmit");

    elSubmit.addEventListener("click",
        () =>
        {
            const eleDir = ele.byId("createPortDir");
            const eleName = ele.byId("createPortName");
            const eleValue = ele.byId("createPortValue");
            const eleValues = ele.byId("createPortUiAttrValues");

            const eleAddUiAttribs = ele.byId("createPortAddUiAttribs");

            const type = parseInt(eleType.value);
            const values = String(eleValues.value);

            if (!eleName.value)
            {
                eleName.value = eleType.options[eleType.selectedIndex].text;
                if (eleDir.value == 0)eleName.value += " Input";
                else eleName.value += " Output";
            }
            const port =
            {
                "id": portId,
                "title": eleName.value,
                "dir": parseInt(eleDir.value),
                "values": values.split(","),
                "type": type
            };

            let addUiAttribs = {};
            try
            {
                if (eleAddUiAttribs.value) addUiAttribs = JSON.parse(eleAddUiAttribs.value);
            }
            catch (e)
            {
                _log.warn("could not parse add ui attribs...");
            }

            for (let i = 0; i < subPatchOpUtil.portDialogUiAttribs.length; i++) delete addUiAttribs[subPatchOpUtil.portDialogUiAttribs[i]];
            const group = ele.byId("createPortGroup").value.trim();
            if (group) addUiAttribs.group = group;
            if (ele.byId("createPortHideParam").checked) addUiAttribs.hideParam = true;
            if (ele.byId("createPortHidePort").checked) addUiAttribs.hidePort = true;
            if (ele.byId("createPortGreyout").checked) addUiAttribs.greyout = true;
            if (Object.keys(addUiAttribs).length) port.addUiAttribs = addUiAttribs;

            if (type == Port.TYPE_STRING) port.value = eleValue.value;
            if (type == Port.TYPE_NUMBER) port.value = parseFloat(eleValue.value) || 0;

            subPatchOpUtil.setPortDisplay(port, eleDisplay.value);
            subPatchOpUtil.setPortObjType(port, ele.byId("createPortObjType").value);

            subPatchOpUtil.portJsonUtil(opId, portId, { "port": port });
        });
};

subPatchOpUtil._getSubPatchSerialized = function (oldSubId, newSubId)
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

    Patch.replaceOpIds(o, { "parentSubPatchId": newSubId, "refAsId": true, "doNotUnlinkLostLinks": true, "fixLostLinks": true });

    return o;
};

subPatchOpUtil.updateSubPatchOpAttachment = (newOp, options = {}) =>
{
    const oldSubId = options.oldSubId || 0;

    gui.savingTitleAnimStart("Saving Subpatch Op...");

    const ops = gui.patchView.getAllOpsInBlueprint(oldSubId);
    let hasNoSaveError = false;

    /** @type {{txt: string, level: number, id: string, options: any}} */
    let erro = null;

    const a = {};
    gui.patchView._patchRenderer.viewBox.serialize(a);
    const viewbox = a.viewBoxesGl[oldSubId];

    ops.forEach((opBase) =>
    {
        const op = /** @type {UiOp} */ (opBase);
        if (op.hasUiError("subPatchOpNoSaveError"))
        {
            hasNoSaveError = true;
            erro = op.getUiError("subPatchOpNoSaveError");
        }
    });

    if (hasNoSaveError)
    {
        notifyError("Could not save " + erro.txt);
        return;
    }

    const subId = utils.shortId();
    const o = subPatchOpUtil._getSubPatchSerialized(oldSubId, subId);
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();

    const origOpsBounds = gui.patchView.getSubPatchBounds(gui.patchView.getCurrentSubPatch());
    if (origOpsBounds.maxAxis > 10000000)
    {
        CmdPatch.centerOpsInSubpatch();
        gui.patchView._patchRenderer.viewBox.centerSelectedOps();

        this._log.log("subpatch huge... center subpatch...");
    }

    gui.jobs().start({ "id": "updateSubPatchOpAttachment" });
    platform.talkerAPI.send(
        TalkerAPI.CMD_SAVE_OP_ATTACHMENT,
        {
            "opname": newOp.opId,
            "name": subPatchOpUtil.blueprintSubpatchAttachmentFilename,
            "content": JSON.stringify(o, null, "  ")
        },
        (err, res) =>
        {
            gui.jobs().finish("updateSubPatchOpAttachment");
            if (err)
            {
                notifyError("Could not save " + newOp.objName, err.msg, { "force": true });
            }
            else
            {
                notify("Saved " + newOp.objName + " (" + o.ops.length + " ops)");
            }

            if (res && res.data && res.data.updated) gui.patchView.store.setServerDate(res.data.updated);
            if (newOp.patchId) gui.savedState.setSaved("saved bp", newOp.patchId.get());

            if (options.execute !== false)
            {
                if (gui.corePatch().getOpsByObjName(newOp.objName).length > 1)
                {
                    if (options.loadingModal) options.loadingModal.setTask("execute op...");

                    gui.serverOps.execute(newOp.opId,
                        (newOps, refNewOp) =>
                        {
                            gui.corePatch().clearSubPatchCache(refNewOp.uiAttribs.subPatch);
                            gui.corePatch().clearSubPatchCache(newOp.patchId.get());

                            if (refNewOp)
                            {
                                gui.patchView.setCurrentSubPatch(gui.corePatch().getNewSubpatchId(oldSubPatchId), () =>
                                {
                                    gui.patchView._patchRenderer.viewBox.scrollTo(viewbox.x, viewbox.y, false);
                                    gui.patchView._patchRenderer.viewBox.animateZoom(viewbox.z, 0.01);
                                });
                            }

                            if (options.next)options.next();
                            gui.savingTitleAnimEnd();
                        },
                        { "refOldOp": newOp });
                }
                else
                if (options.next)options.next();
                gui.savingTitleAnimEnd();
            }
            else
            {
                gui.savingTitleAnimEnd();
                if (options.next)options.next();
            }

            gui.endModalLoading();
        });
};

subPatchOpUtil.createSubpatchOp = (newOp, oldSubpatchOp, next, options = {}) =>
{
    // const loadingModal = gui.startModalLoading("save op code");

    platform.talkerAPI.send(TalkerAPI.CMD_UPDATE_OP,
        {
            "opname": newOp.objName,
            "update": {
                "code": srcSubPatchOp,
                "coreLibs": ["subpatchop"]
            }
        },
        (err) =>
        {
            if (err)
            {
                this.showApiError(err);
                return;
            }

            if (oldSubpatchOp && newOp)
                newOp.setUiAttrib(
                    { "translate":
                        {
                            "x": oldSubpatchOp.uiAttribs.translate.x,
                            "y": oldSubpatchOp.uiAttribs.translate.y + gluiconfig.newOpDistanceY
                        }
                    });

            gui.patchView.setPositionSubPatchInputOutputOps(oldSubpatchOp.patchId.get());

            subPatchOpUtil.updateSubPatchOpAttachment(
                newOp,
                {
                    "execute": false,
                    "oldSubId": oldSubpatchOp.patchId.get(),
                    "replaceIds": true,
                    "next": () =>
                    {
                        if (!options.doNotExecute)
                            gui.serverOps.execute(newOp.opId,
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

export default subPatchOpUtil;
