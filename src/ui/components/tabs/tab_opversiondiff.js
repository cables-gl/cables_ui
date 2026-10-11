import { utils } from "cables";
import { ele, TalkerAPI } from "cables-shared-client";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { glsl } from "codemirror-lang-glsl";
import { oneDark } from "@codemirror/theme-one-dark";
import { MergeView } from "@codemirror/merge";
import Tab from "../../elements/tabpanel/tab.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import opNames from "../../opnameutils.js";

export default class TabOpVersionDiff
{
    static TABSESSION_NAME = "opVersionDiff";
    static UNCHANGED_MARGIN = 3;
    static UNCHANGED_MIN_SIZE = 6;
    static DIFF_SCAN_LIMIT = 1000000;
    static DIFF_TIMEOUT_MS = 1000;
    static OP_CODE_FILE = "";

    #tab;
    #id = utils.shortId();
    #opName;
    #previousName;
    #fileName;

    /** @type {MergeView} */
    #mergeView = null;

    /**
     * @param {import("../../elements/tabpanel/tabpanel.js").default} tabs
     * @param {string} opName
     * @param {string} [attachmentName]
     */
    constructor(tabs, opName, attachmentName)
    {
        this.#opName = opName;
        this.#previousName = TabOpVersionDiff.getPreviousVersionName(opName);
        this.#fileName = attachmentName || TabOpVersionDiff.OP_CODE_FILE;

        const title = "Diff " + opNames.getShortName(opName);
        const existingTab = tabs.getTabByTitle(title);
        if (existingTab)
        {
            tabs.activateTab(existingTab.id);
            return;
        }

        this.#tab = new Tab(title, { "icon": "op", "infotext": "tab_opversiondiff" });
        tabs.addTab(this.#tab, true);
        this.#tab.on(Tab.EVENT_CLOSE, () =>
        {
            editorSession.remove(TabOpVersionDiff.TABSESSION_NAME, this.#opName);
            this.#destroy();
        });

        if (!this.#previousName)
        {
            editorSession.remove(TabOpVersionDiff.TABSESSION_NAME, opName);
            this.#tab.html("<div style=\"padding:8px 10px;\">" + opName + " has no previous version</div>");
            return;
        }

        this.#rememberSession();

        let html = "<div style=\"padding:8px 10px;\">";
        html += "<b>" + this.#previousName + "</b> &rarr; <b>" + opName + "</b> ";
        html += "<select id=\"" + this.#id + "_file\"></select> ";
        html += "<span id=\"" + this.#id + "_status\">loading...</span>";
        html += "</div>";
        html += "<div id=\"" + this.#id + "\" style=\"height:calc(100% - 44px);\"></div>";
        this.#tab.html(html);

        ele.byId(this.#id + "_file").addEventListener("change", (e) =>
        {
            this.#fileName = e.target.value;
            this.#rememberSession();
            this.#loadFile();
        });

        this.#loadFileList();
        this.#loadFile();
    }

    /**
     * @param {string} opName
     * @returns {string}
     */
    static getPreviousVersionName(opName)
    {
        const docs = gui.opDocs.getOpDocByName(opName);
        if (!docs || !docs.versions) return null;

        let previous = null;
        for (let i = 0; i < docs.versions.length; i++)
        {
            if (docs.versions[i].name == opName) return previous;
            previous = docs.versions[i].name;
        }
        return null;
    }

    #rememberSession()
    {
        editorSession.rememberOpenEditor(TabOpVersionDiff.TABSESSION_NAME, this.#opName, {
            "opname": this.#opName,
            "attachmentName": this.#fileName
        }, true);
    }

    #loadFileList()
    {
        platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_INFO, { "opName": this.#previousName }, (previousErr, previousRes) =>
        {
            platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_INFO, { "opName": this.#opName }, (currentErr, currentRes) =>
            {
                const previousFiles = previousRes?.attachmentFiles || [];
                const currentFiles = currentRes?.attachmentFiles || [];
                const selectEle = ele.byId(this.#id + "_file");
                if (!selectEle) return;

                const files = [];
                for (let i = 0; i < previousFiles.length; i++) files.push(previousFiles[i]);
                for (let i = 0; i < currentFiles.length; i++)
                    if (!files.includes(currentFiles[i])) files.push(currentFiles[i]);
                files.sort();

                this.#addFileOption(selectEle, TabOpVersionDiff.OP_CODE_FILE, opNames.getShortName(this.#opName) + ".js");
                for (let i = 0; i < files.length; i++)
                {
                    let label = files[i];
                    if (!previousFiles.includes(files[i])) label += " (new)";
                    else if (!currentFiles.includes(files[i])) label += " (removed)";
                    this.#addFileOption(selectEle, files[i], label);
                }
                selectEle.value = this.#fileName;
            });
        });
    }

    /**
     * @param {HTMLSelectElement} selectEle
     * @param {string} value
     * @param {string} label
     */
    #addFileOption(selectEle, value, label)
    {
        const option = document.createElement("option");
        option.value = value;
        option.innerText = label;
        selectEle.appendChild(option);
    }

    /**
     * @param {string} opName
     * @param {function(string):void} cb
     */
    #loadFileOf(opName, cb)
    {
        if (this.#fileName == TabOpVersionDiff.OP_CODE_FILE)
        {
            const docs = gui.opDocs.getOpDocByName(opName);
            platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_CODE, { "opname": docs ? docs.id : opName, "projectId": gui.patchId }, (err, res) =>
            {
                if (err || !res) cb(null);
                else cb(res.code);
            });
        }
        else
        {
            platform.talkerAPI.send(TalkerAPI.CMD_GET_OP_ATTACHMENT, { "opname": opName, "name": this.#fileName }, (err, res) =>
            {
                if (err || !res) cb(null);
                else cb(res.content || "");
            });
        }
    }

    #loadFile()
    {
        const fileName = this.#fileName;
        this.#setStatus("loading...");

        this.#loadFileOf(this.#previousName, (previousText) =>
        {
            this.#loadFileOf(this.#opName, (currentText) =>
            {
                if (fileName != this.#fileName) return;
                if (previousText === null || currentText === null)
                {
                    this.#setStatus("could not load " + (fileName || "op code"));
                    return;
                }
                this.#createMergeView(previousText, currentText);
            });
        });
    }

    /**
     * @param {string} text
     */
    #setStatus(text)
    {
        const statusEle = ele.byId(this.#id + "_status");
        if (statusEle) statusEle.innerText = text;
    }

    #getLanguage()
    {
        const name = this.#fileName;
        if (name == TabOpVersionDiff.OP_CODE_FILE) return javascript();
        if (name.endsWith(".js") || name.endsWith(".json")) return javascript();
        if (name.endsWith(".frag") || name.endsWith(".vert") || name.endsWith(".glsl") || name.endsWith(".wgsl")) return glsl();
        return [];
    }

    /**
     * @param {string} previousText
     * @param {string} currentText
     */
    #createMergeView(previousText, currentText)
    {
        const parent = ele.byId(this.#id);
        if (!parent) return;

        this.#destroy();

        const extensions = [
            lineNumbers(),
            this.#getLanguage(),
            oneDark,
            EditorState.readOnly.of(true),
            EditorView.editable.of(false)
        ];

        this.#mergeView = new MergeView({
            "a": { "doc": previousText, "extensions": extensions },
            "b": { "doc": currentText, "extensions": extensions },
            "parent": parent,
            "gutter": true,
            "diffConfig": { "scanLimit": TabOpVersionDiff.DIFF_SCAN_LIMIT, "timeout": TabOpVersionDiff.DIFF_TIMEOUT_MS },
            "collapseUnchanged": { "margin": TabOpVersionDiff.UNCHANGED_MARGIN, "minSize": TabOpVersionDiff.UNCHANGED_MIN_SIZE }
        });
        this.#mergeView.dom.style.height = "100%";

        const numChanges = this.#mergeView.chunks.length;
        if (numChanges == 0) this.#setStatus("no changes");
        else if (numChanges == 1) this.#setStatus("1 change");
        else this.#setStatus(numChanges + " changes");
    }

    #destroy()
    {
        if (this.#mergeView) this.#mergeView.destroy();
        this.#mergeView = null;
    }
}

window.addEventListener(CABLES.UI_EVENT_EDITORSESSION_INIT, () =>
{
    editorSession.addListener(TabOpVersionDiff.TABSESSION_NAME, (name, data) =>
    {
        new TabOpVersionDiff(gui.mainTabs, data.opname || name, data.attachmentName);
    });
});
