import { ele } from "cables-shared-client";
import EditorTab from "../tabs/tab_editor.js";
import SpreadSheetTab from "../tabs/tab_spreadsheet.js";
import { gui } from "../../gui.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";

const paramsHelper =
{
    "valueChangerSetSliderCSS": (v, eleInput) =>
    {
        if (eleInput.dataset.min || eleInput.dataset.max)
            v = CABLES.map(v, parseFloat(eleInput.dataset.min), parseFloat(eleInput.dataset.max), 0, 1);

        v = Math.max(0, v);
        v = Math.min(1, v);
        const cssv = v * 100;
        const grad = "linear-gradient(0.25turn, var(--numberinput-bar), var(--numberinput-bar) " + cssv + "%, var(--numberinput-bg) " + cssv + "%)";

        eleInput.style.background = grad;
    },

    "inputListenerMousewheel": (event) =>
    {
        event.preventDefault();
        let delta = -event.deltaY || event.deltaX;
        if (ele.hasFocus(event.target))
        {
            if (delta > 0)
            {
                if (event.shiftKey) event.target.value = paramsHelper.inputIncrement(event.target.value, 0.1, event);
                else event.target.value = paramsHelper.inputIncrement(event.target.value, 1, event);
            }
            else
            {
                if (event.shiftKey) event.target.value = paramsHelper.inputIncrement(event.target.value, -0.1, event);
                else event.target.value = paramsHelper.inputIncrement(event.target.value, -1, event);
            }
            event.target.dispatchEvent(new Event("input"));

            return false;
        }
    },

    "inputListenerCursorKeys": (e) =>
    {
        e.target.value = e.target.value.replaceAll(",", ".");

        switch (e.which)
        {
        case 38: // up
            e.target.value = paramsHelper.inputIncrement(e.target.value, 1, e);
            e.target.dispatchEvent(new Event("input"));
            return false;

        case 40: // down
            e.target.value = paramsHelper.inputIncrement(e.target.value, -1, e);
            e.target.dispatchEvent(new Event("input"));
            return false;
        }
    },

    "inputIncrement": (v, dir, e) =>
    {
        if (e.target.type == "search") return v;

        gui.savedState.setUnSaved("paramsInputIncrement", gui.opParams.op.getSubPatch());

        if (v == "true") return "false";
        if (v == "false") return "true";

        const val = parseFloat(v);
        if (val != val) return v;

        let add = 0.1;

        if (e.target.classList.contains("inc_int"))add = 1;

        if (e && e.shiftKey && e.metaKey)add = 0.001;
        else if (e && e.altKey && e.shiftKey) add = 10;
        else if (e && e.shiftKey) add = 0.01;
        else if (e && e.altKey) add = 1;

        let r = val + (add * dir);

        if (isNaN(r)) r = 0.0;
        else r = Math.round(1000 * r) / 1000;
        return r;
    },

    "checkDefaultValue": (port, index, panelid) =>
    {
        if (port.defaultValue !== undefined && port.defaultValue !== null)
        {
            const resetEl = ele.byQuery("#portTitle_in_" + index + "_reset");
            const titleEl = ele.byId("portTitle_in_" + index);
            const isDefault = port.get() == port.defaultValue || port.isLinked();
            if (titleEl) titleEl.classList.toggle("nonDefaultValue", !isDefault);

            if (resetEl)
            {
                if (isDefault)
                {
                    resetEl.classList.add("reset_hidden");
                    resetEl.removeAttribute("tabindex");
                }
                else
                {
                    resetEl.classList.remove("reset_hidden");
                    resetEl.setAttribute("tabindex", 0);
                }
            }
        }
    },

    "togglePortValBool": (which, checkbox) =>
    {
        // gui.setStateUnsaved();
        gui.savedState.setUnSaved("paramsTogglePortValBool", gui.opParams.op.getSubPatch());
        const inputEle = document.getElementById(which);
        const checkBoxEle = document.getElementById(checkbox);

        if (!inputEle || !checkBoxEle) return;
        let bool_value = inputEle.value == "true";
        bool_value = !bool_value;

        if (bool_value)
        {
            checkBoxEle.classList.add("checkbox-active");
            checkBoxEle.classList.remove("checkbox-inactive");
        }
        else
        {
            checkBoxEle.classList.add("checkbox-inactive");
            checkBoxEle.classList.remove("checkbox-active");
        }

        inputEle.value = bool_value;
        inputEle.dispatchEvent(new Event("input"));
    },

    "openParamSpreadSheetEditor": (opid, portname, cb) =>
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op) return console.warn("paramedit op not found");

        const port = op.getPortByName(portname);
        if (!port) return console.warn("paramedit port not found");

        new SpreadSheetTab(gui.mainTabs, port, port.get(), {
            "title": gui.mainTabs.getUniqueTitle("Array " + portname),
            "onchange": (content) =>
            {
                port.set(content);
                gui.emitEvent("portValueEdited", op, port, content);
            }
        });
    },

    "updateLinkedColorBoxes": (thePort, thePort1, thePort2, panelid, idx) =>
    {
        const id = "watchcolorpick_in_" + idx + "_" + panelid;
        const portNum = idx;
        const colEle = ele.byId(id);

        if (colEle && thePort1 && thePort && thePort2)
        {
            const inputElements =
            [
                ele.byId("portval_" + portNum + "_" + panelid),
                ele.byId("portval_" + (portNum + 1) + "_" + panelid),
                ele.byId("portval_" + (portNum + 2) + "_" + panelid)
            ];

            if (!inputElements[0] || !inputElements[1] || !inputElements[2])
            {
                colEle.style.backgroundColor = chroma(
                    Math.round(255 * thePort.get()),
                    Math.round(255 * thePort1.get()),
                    Math.round(255 * thePort2.get()),
                ).hex();
            }
        }
    },

    "setPortAnimated": (op, index, targetState, defaultValue) =>
    {
        const isOpen = gui.patchView.getSelectedOps()[0] ? op.id === gui.patchView.getSelectedOps()[0].id : false;

        const elVal = ele.byId("portval_" + index);

        if (!targetState)
        {
            // const val = gui.timeLine().removeAnim(op.portsIn[index].anim);
            op.portsIn[index].setAnimated(false);

            // gui.timeLine().setAnim(null);

            if (isOpen && elVal)
            {
                // elVal.value = val;
                elVal.dispatchEvent(new Event("input"));
                elVal.focus();
            }

            op.portsIn[index].op.refreshParams();
            return;
        }

        const portAnimEle = ele.byId("portanim_in_" + index);
        if (isOpen && portAnimEle) portAnimEle.classList.add("timingbutton_active");

        op.portsIn[index].toggleAnim();
        const animOptions = {
            "opid": op.id,
            "name": op.getTitle() + ": " + op.portsIn[index].name,
            "defaultValue": defaultValue
        };
        // gui.timeLine().setAnim(op.portsIn[index].anim, animOptions);
        op.portsIn[index].op.refreshParams();
    },

    "openParamStringEditor": (opid, portname, cb, userInteraction) =>
    {
        const op = gui.corePatch().getOpById(opid);
        if (!op) return console.warn("paramedit op not found", opid);
        editorSession.startLoadingTab();

        const port = op.getPortByName(portname);
        if (!port) return console.warn("paramedit port not found", portname);

        let name = gui.mainTabs.getUniqueTitle(op.name + " " + port.name);

        const dataId = opid + portname;
        const existingTab = gui.mainTabs.getTabByDataId(dataId);
        if (existingTab)
        {
            console.log("existing tab");
            gui.mainTabs.activateTabByName(existingTab.title);
            gui.maintabPanel.show(userInteraction);
            return;
        }

        const editorObj = editorSession.rememberOpenEditor("param", name, { "opid": opid, "portname": portname });

        if (editorObj)
        {
            const t = new EditorTab(
                {
                    "title": name,
                    "dataId": dataId,
                    "content": port.get() + "",
                    "name": editorObj.name,
                    "syntax": port.uiAttribs.editorSyntax,
                    "hideFormatButton": port.uiAttribs.hideFormatButton,
                    "editorObj": editorObj,
                    "onClose": function (which)
                    {
                        editorSession.remove(which.editorObj.type, which.editorObj.name);
                    },
                    "onSave": function (setStatus, content)
                    {
                        setStatus("updated " + port.name);
                        // gui.setStateUnsaved();
                        gui.savedState.setUnSaved("saveeditorcontent", op.getSubPatch());
                        gui.jobs().finish("saveeditorcontent");
                        port.setRef(content);
                        gui.emitEvent("portValueEdited", op, port, content);
                    },
                    "onChange": function (e)
                    {
                        // gui.setStateUnsaved();
                        gui.savedState.setUnSaved("editorOnChange", op.getSubPatch());
                    },
                    "onFinished": () =>
                    {
                        gui.mainTabs.activateTabByName(name);
                    }
                });

            gui.corePatch().on("onOpDelete", (deletedOp) =>
            {
                if (deletedOp.id == opid) gui.mainTabs.closeTab(t._tab.id);
            });
        }
        else
        {
            gui.mainTabs.activateTabByName(name);
        }

        if (cb)cb();
        else gui.maintabPanel.show(userInteraction);

        editorSession.finishLoadingTab();
    },

};

export default paramsHelper;
