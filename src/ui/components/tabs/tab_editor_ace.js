import { Events, Logger, ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import text from "../../text.js";
import ManageOp from "./tab_manage_op.js";
import { notify, notifyError } from "../../elements/notification.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { contextMenu } from "../../elements/contextmenu.js";
import { userSettings } from "../usersettings.js";

/**
 * tab panel for editing text and source code using the ace editor
 */

export default class EditorTab extends Events
{
    constructor(options)
    {
        super();
        this._log = new Logger("EditorTab");
        this._editor = null;
        if (typeof options.allowEdit === "undefined" || options.allowEdit === null) options.allowEdit = true;

        this._options = options;

        gui.maintabPanel.show();

        let title = gui.maintabPanel.tabs.getUniqueTitle(options.title);

        // check if tab exists?

        this._tab = new Tab(title,
            {
                "icon": null,
                "type": options.syntax,
                "name": options.name,
                "dataId": options.dataId || options.name,
                "infotext": text.editorTab,
                "singleton": options.singleton,
            });

        this._tab.editor = this;

        this._tab.on("onActivate", () =>
        {
            setTimeout(() => { if (this._editor) this._editor.focus(); }, 30);
        });

        this._tab.on("resize", () =>
        {
            if (this._tab) this._tab.updateSize();
            if (this._editor) this._editor.resize();
        });

        const existing = gui.mainTabs.getTabByTitle(title);
        if (existing)
        {
            gui.mainTabs.activateTab(existing.id);
        }
        else
        {
            this._tab.editorObj = options.editorObj;
            gui.mainTabs.addTab(this._tab);
        }

        let style = "";

        if (!options.allowEdit) style = "background-color:#333;";
        const html = "<div id=\"editorcontent" + this._tab.id + "\" style=\"width:100%;height:100%;" + style + "\"><center><br/><br/><br/><br/><span class=\"icon icon-loader\"></span></center></div>";
        this._tab.html(html);

        if (options.hasOwnProperty("content")) this.setContent(options.content);
    }

    /**
     * @param {string} content
     */
    setContent(content, silent = false)
    {
        content = content || "";
        if (!this._editor)
        {
            if (!ele.byId("editorcontent" + this._tab.id))
            {
                this._log.error("ele not found!!", this);
                return;
            }
            this.createEditor("editorcontent" + this._tab.id, content, (editor) =>
            {
                this._editor = editor;

                editor.setFontSize(parseInt(userSettings.get("fontsize_ace")) || 12);
                editor.getSession().setUseWrapMode(userSettings.get("wrapmode_ace") || false);

                if (gui.userSettings.get("ace_keymode"))
                {
                    editor.setKeyboardHandler(gui.userSettings.get("ace_keymode"));

                    ace.config.loadModule("ace/keyboard/vim", (module) =>
                    {
                        let VimApi = module.CodeMirror.Vim;
                        VimApi.defineEx("write", "w", (cm, input) =>
                        {
                            this.save();
                        });
                        VimApi.defineEx("quit", "q", (cm, input) =>
                        {
                            this._tab.remove();
                        });
                        VimApi.defineEx("wq", null, (cm, input) =>
                        {
                            this.save();
                            // this._tab.remove();
                            gui.mainTabs.closeTab(this._tab.id);
                        });
                        VimApi.map("Y", "y$"); // in normal mode
                        VimApi.map("W", "hardWrap"); // in normal mode
                        console.log("${}", VimApi);
                        // defaultKeymap.push({ "keys": "gq", "type": "operator", "operator": "hardWrap" });
                        VimApi.defineOperator("hardWrap", function (cm, operatorArgs, ranges, oldAnchor, newHead)
                        {
                            console.log("_yiooooo");
                            // make changes and return new cursor position
                        });
                    });
                }

                if (this._options.allowEdit)
                {
                    if (this._options.onSave || this._options.showSaveButton) this._tab.addButton(text.editorSaveButton, () =>
                    {
                        this.save();
                    });

                    let hideFormatButton = !!this._options.hideFormatButton;
                    if (!hideFormatButton && this._options.syntax && this._options.syntax === "js") hideFormatButton = false;
                    else hideFormatButton = true;
                    if (!platform.frontendOptions.showFormatCodeButton)hideFormatButton = true;

                    if (this._options.allowEdit && !hideFormatButton) this._tab.addButton(text.editorFormatButton, this.format.bind(this));
                }
                else
                {
                    this._editor.setOptions(
                        {
                            "readOnly": "true",
                            "highlightActiveLine": false,
                            "highlightGutterLine": false
                        });
                    this._editor.renderer.setStyle("disabled", true);
                    this._editor.blur();
                }

                let opname = null;
                this._options.editorObj = this._options.editorObj || {};
                if (this._options.editorObj.type === "op") opname = this._options.editorObj.name;
                if (this._options.editorObj.data && this._options.editorObj.data.opname) opname = this._options.editorObj.data.opname;

                if (!opname)
                {
                    const d = gui.opDocs.getOpDocById(this._options.name);
                    if (d)opname = d.name;
                }

                let opId = null;
                if (opname)
                {
                    const opdoc = gui.opDocs.getOpDocByName(opname);
                    if (opdoc)
                    {
                        opId = opdoc.id;
                    }
                    else
                    {
                        this._log.warn("could not get opdoc:" + opname);
                    }

                    this._tab.addButton("<span class=\"icon icon-op\"></span> Manage Op", () => { new ManageOp(gui.mainTabs, opId); });

                    if (opdoc && opdoc.attachmentFiles && opdoc.attachmentFiles.length)
                    {
                        const el = this._tab.addButton("<span class=\"icon icon-chevron-down\"></span>Op Files", () =>
                        {
                            const items = [];

                            items.push({
                                "title": opdoc.name + ".js",
                                "func": () =>
                                {
                                    gui.serverOps.edit(opdoc.name, false, null, true);
                                }
                            });

                            for (let i = 0; i < opdoc.attachmentFiles.length; i++)
                            {
                                const fn = opdoc.attachmentFiles[i];
                                items.push({
                                    "title": opdoc.attachmentFiles[i],
                                    "func": () =>
                                    {
                                        gui.serverOps.editAttachment(opname, fn);
                                    }
                                });
                            }

                            contextMenu.show({ "items": items }, el);
                        });
                    }

                    this._tab.addButton("Op Docs", () => { window.open(platform.getCablesDocsUrl() + "/op/" + opname); });
                }

                if (platform.frontendOptions.openLocalFiles && this._options.allowEdit)
                {
                    this._tab.addButton("<span class=\"info nomargin icon icon-1_25x icon-folder\" data-info=\"electron_openfolder\" ></span>",
                        (e) =>
                        {
                            if (e.ctrlKey || e.metaKey) CABLES.CMD.ELECTRON.copyOpDirToClipboard(opId);
                            else CABLES.CMD.ELECTRON.openOpDir(opId, opname);
                        });
                }
                this._tab.addButton("<span class=\"nomargin icon icon-1_25x icon-help\"></span>", () => { window.open(platform.getCablesDocsUrl() + "/docs/5_writing_ops/dev_ops/dev_ops"); });

                this._editor.resize();

                const undoManager = this._editor.session.getUndoManager();
                undoManager.reset();
                this._editor.session.setUndoManager(undoManager);

                this._editor.on(
                    "change",
                    (e) =>
                    {
                        gui.mainTabs.setChanged(this._tab.id, true);
                        if (this._options.onChange) this._options.onChange();
                    }
                );

                this._editor.getSession().setUseWorker(true);

                if (this._options.syntax === "md") this._editor.session.setMode("ace/mode/Markdown");
                else if (this._options.syntax === "js") this._editor.session.setMode("ace/mode/javascript");
                else if (this._options.syntax === "glsl") this._editor.session.setMode("ace/mode/glsl");
                else if (this._options.syntax === "css") this._editor.session.setMode("ace/mode/css");
                else if (this._options.syntax === "html") this._editor.session.setMode("ace/mode/html");
                else if (this._options.syntax === "json") this._editor.session.setMode("ace/mode/json");
                else if (this._options.syntax === "sql") this._editor.session.setMode("ace/mode/sql");
                else if (this._options.syntax === "inline-css")
                {
                    this._editor.session.setMode("ace/mode/css");
                    this._editor.getSession().setUseWorker(false);
                }
                else
                {
                    if (this._options.syntax) this._log.warn("unknown syntax highlighter for ace", this._options.syntax);
                    this._editor.session.setMode("ace/mode/plain_text");
                    this._editor.getSession().setUseWorker(false);
                }

                this._tab.addEventListener("close", this._options.onClose);
                this._tab.addEventListener(
                    "onActivate",
                    () =>
                    {
                        this._editor.resize(true);
                        this._editor.focus();
                        if (this._tab.editorObj && this._tab.editorObj.name) userSettings.set("editortab", this._tab.editorObj.name);
                    },
                );

                setTimeout(() =>
                {
                    this._editor.focus();
                    this._tab.updateSize();
                    this._editor.resize(true);
                    if (this._options.onFinished) this._options.onFinished();
                }, 100);
            });
        }
        else
        {
            this._editor.setValue(content, 1);
            if (silent) gui.mainTabs.setChanged(this._tab.id, false);
        }
    }

    focus()
    {
        this._editor.focus();
    }

    format()
    {
        platform.talkerAPI.send(
            "formatOpCode",
            {
                "code": this._editor.getValue(),
            },
            (err, res) =>
            {
                if (!res || !res.success)
                {
                    notifyError("failed to format code, keeping old version");
                    this._log.warn("code formating error", err);
                }
                else
                {
                    this._editor.setValue(res.opFullCode, 1);
                    this._editor.focus();
                }

                if (err)
                {
                    notifyError("failed to format code, keeping old version");
                    this._log.warn("code formating http error", res);
                }
            }
        );
    }

    save()
    {
        function onSaveCb(txt)
        {
            gui.jobs().finish("saveeditorcontent");

            if (txt.toLowerCase().indexOf("error") == 0) notifyError(txt);
            else
            {
                notify(txt);
                gui.mainTabs.setChanged(this._tab.id, false);
            }

            this._editor.focus();
            setTimeout(
                () =>
                {
                    this._editor.focus();
                }, 100);
        }

        const anns = this._editor.getSession().getAnnotations();
        // this._log.log("annotations", anns);

        gui.jobs().start({ "id": "saveeditorcontent", "title": "saving editor content" });
        if (this._options.onSave)
        {
            this._options.onSave(onSaveCb.bind(this), this._editor.getValue(), this._editor);
        }
        else this.emitEvent("save", onSaveCb.bind(this), this._editor.getValue(), this._editor);
    }

    /**
     * @param {string} id
     * @param {string} val
     * @param {function} cb
     */
    createEditor(id, val, cb)
    {
        loadAce(() =>
        {
            const editor = ace.edit(id);
            editor.setValue(""); // need to do this

            editor.setOptions({
                "fontFamily": "SourceCodePro",
                "fontSize": "14px",
                "enableBasicAutocompletion": true,
                "enableLiveAutocompletion": true,
                "enableSnippets": true,
                "showPrintMargin": false,
            });

            editor.setTheme("ace/theme/cables");

            editor.session.setMode("ace/mode/javascript");
            editor.session.on("changeMode", (e, session) =>
            {
                if (session.getMode().$id !== "ace/mode/javascript") return;
                if (session.$worker)
                {
                    session.$worker.send("changeOptions", [{ "strict": false, "esversion": 11, "esnext": false }]);
                }
            });
            editor.$blockScrolling = Infinity;

            editor.commands.bindKey("Ctrl-D", "selectMoreAfter");
            editor.commands.bindKey("Cmd-D", "selectMoreAfter");
            editor.commands.bindKey("Cmd-Ctrl-Up", "movelinesup");
            editor.commands.bindKey("Cmd-Ctrl-Down", "movelinesdown");

            editor.setValue(String(val), -1);

            const snipreq = ace.require("ace/snippets");

            if (!snipreq)
            {
                this._log.error("ace - no snippetmanager ?!");
                alert("ace crash no snippetmanager....");
                return;
            }

            const snippetManager = snipreq.snippetManager;
            const snippets = snippetManager.parseSnippetFile("");

            snippets.push(
                {
                    "content": "setUiError = function (\"${1:id}\",\"${1:message}\")",
                    "name": "inTriggerButton",
                },
                {
                    "content": "inTriggerButton(\"${1:name}\")",
                    "name": "inTriggerButton",
                },
                {
                    "content": "inTrigger(\"${1:name}\")",
                    "name": "inTrigger",
                },

                {
                    "content": "inMultiPort(\"#1\", CABLES.OP_PORT_TYPE_NUMBER)",
                    "name": "inMultiPort",
                },
                {
                    "content": "outTrigger(\"${1:name}\")",
                    "name": "outTrigger",
                },
                {
                    "content": "inBool(\"${1:name}\",${2:false})",
                    "name": "inBool",
                },
                {
                    "content": "inInt(\"${1:name}\",${2:0})",
                    "name": "inInt",
                },
                {
                    "content": "inFloatSlider(\"${1:name}\",${2:0})",
                    "name": "inFloatSlider",
                },
                {
                    "content": "inFloat(\"${1:name}\",${2:0})",
                    "name": "inFloat",
                },
                {
                    "content": "inDropDown(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\)",
                    "name": "inDropDown",
                },
                {
                    "content": "inSwitch(\"${1:name}\",\${2:[\"option a\",\"option b\"]}\,\${3:\"default\"}\)",
                    "name": "inSwitch",
                },
                {
                    "content": "inStringEditor(\"${1:name}\",\"${2:default}\",\"${3:syntax}\")",
                    "name": "inStringEditor",
                },
                {
                    "content": "inString(\"${1:name}\",\"${2:default}\")",
                    "name": "inString",
                },
                {
                    "content": "inObject(\"${1:name}\")",
                    "name": "inObject",
                },
                {
                    "content": "inTexture(\"${1:name}\")",
                    "name": "inTexture",
                },
                {
                    "content": "inArray(\"${1:name}\")",
                    "name": "inArray",
                },
                {
                    "content": "inUrl(\"${1:name}\")",
                    "name": "inUrl",
                },
                {
                    "content": "outNumber(\"${1:name}\")",
                    "name": "outNumber",
                },
                {
                    "content": "outBoolNum(\"${1:name}\")",
                    "name": "outBoolNum",
                },
                {
                    "content": "outString(\"${1:name}\")",
                    "name": "outString",
                },
                {
                    "content": "outObject(\"${1:name}\")",
                    "name": "outObject",
                },
                {
                    "content": "outArray(\"${1:name}\")",
                    "name": "outArray",
                },
                {
                    "content": "outTexture(\"${1:name}\")",
                    "name": "outTexture",
                },
                {
                    "content": "CABLES.map(${1:name})",
                    "name": "CABLES.map",
                },
                {
                    "content": "console.log(\"${1:text}\");",
                    "name": "console.log",
                },
                {
                    "content": "op.setPortGroup(\"${1:name}\",[${2:port},${3:port}]);",
                    "name": "op.setPortGroup",
                },
                {
                    "content": "CABLES.map(${1:value},${2:oldMin},${3:oldMax},${4:newMin},${5:newMax});",
                    "name": "CABLES.map",
                },
                {
                    "content": "op.toWorkPortsNeedToBeLinked(${1:port1},${2:port2});",
                    "name": "op.toWorkPortsNeedToBeLinked",
                },
                {
                    "content": "op.toWorkPortsNeedsString(${1:port1},${2:port2});",
                    "name": "op.toWorkPortsNeedsString",
                },

                {
                    "content": "vec3.create();",
                    "name": "vec3.create",
                },
                {
                    "content": "vec3.set(${1:out},${2:x},${3:y},${4:z});",
                    "name": "vec3.set(out, x, y, z)",
                },
                {
                    "content": "mat4.create();",
                    "name": "mat4.create",
                },
                {
                    "content": "mat4.identity();",
                    "name": "mat4.identity",
                },
                {
                    "content": "mat4.translate(${1:out},${2:a},${3:v});",
                    "name": "mat4.translate(out,a,v);",
                },
                {
                    "content": "CGL.Texture.PFORMATSTR_RGBA32F",
                    "name": "CGL.Texture.PFORMATSTR_RGBA32F",
                },
                {
                    "content": "CGL.Texture.PFORMATSTR_RGBA8UB",
                    "name": "CGL.Texture.PFORMATSTR_RGBA8UB",
                },
                {
                    "content": "CGL.Texture.PIXELFORMATS",
                    "name": "CGL.Texture.PIXELFORMATS",
                },
                {
                    "content": "op.setUiError(\"id\", \"text or null\");",
                    "name": "op.setUiError",
                },
                {
                    "content": "op.patch.isEditorMode()",
                    "name": "op.patch.isEditorMode",
                },

            );
            snippetManager.register(snippets, "javascript");

            const snippetsGlsl = snippetManager.parseSnippetFile("");

            snippetsGlsl.push(
                {
                    "content": "uniform float ${1:varName};",
                    "name": "uniform float ${1:varName};",
                },
                {
                    "content": "uniform sampler2D ${1:texName};",
                    "name": "uniform sampler2D ${1:texName};",
                },
                {
                    "content": "texture(${1:texCoord},${2:samplerTex});",
                    "name": "texture(texCoord,tex);",
                }
            );
            snippetManager.register(snippetsGlsl, "glsl");

            const cssSnippets = [];
            cssSnippets.push({ "name": "background", "content": "background: " });
            cssSnippets.push({ "name": "background-attachment", "content": "background-attachment: " });
            cssSnippets.push({ "name": "background-break", "content": "background-break: " });
            cssSnippets.push({ "name": "background-clip", "content": "background-clip: " });
            cssSnippets.push({ "name": "background-color", "content": "background-color: " });
            cssSnippets.push({ "name": "background-image", "content": "background-image: " });
            cssSnippets.push({ "name": "background-origin", "content": "background-origin: " });
            cssSnippets.push({ "name": "background-position-x", "content": "background-position-x: " });
            cssSnippets.push({ "name": "background-position-y", "content": "background-position-y: " });
            cssSnippets.push({ "name": "background-position", "content": "background-position: " });
            cssSnippets.push({ "name": "background-repeat", "content": "background-repeat: " });
            cssSnippets.push({ "name": "background-size", "content": "background-size: " });
            cssSnippets.push({ "name": "background", "content": "background: " });
            cssSnippets.push({ "name": "filter", "content": "filter: " });
            cssSnippets.push({ "name": "background", "content": "background: " });
            cssSnippets.push({ "name": "border", "content": "border: " });
            cssSnippets.push({ "name": "border-bottom", "content": "border-bottom: " });
            cssSnippets.push({ "name": "border-bottom-color", "content": "border-bottom-color: " });
            cssSnippets.push({ "name": "border-bottom-image", "content": "border-bottom-image: " });
            cssSnippets.push({ "name": "border-bottom-left-image", "content": "border-bottom-left-image: " });
            cssSnippets.push({ "name": "border-bottom-left-radius", "content": "border-bottom-left-radius: " });
            cssSnippets.push({ "name": "border-bottom-right-image", "content": "border-bottom-right-image: " });
            cssSnippets.push({ "name": "border-bottom-right-radius", "content": "border-bottom-right-radius: " });
            cssSnippets.push({ "name": "border-bottom-style", "content": "border-bottom-style: " });
            cssSnippets.push({ "name": "border-bottom-width", "content": "border-bottom-width: " });
            cssSnippets.push({ "name": "border-bottom", "content": "border-bottom: " });
            cssSnippets.push({ "name": "border-break", "content": "border-break: " });
            cssSnippets.push({ "name": "border-collapse", "content": "border-collapse: " });
            cssSnippets.push({ "name": "border-color", "content": "border-color: " });
            cssSnippets.push({ "name": "border-corner-image", "content": "border-corner-image: " });
            cssSnippets.push({ "name": "border-fit", "content": "border-fit: " });
            cssSnippets.push({ "name": "border-image", "content": "border-image: " });
            cssSnippets.push({ "name": "border-left", "content": "border-left: " });
            cssSnippets.push({ "name": "border-left-color", "content": "border-left-color: " });
            cssSnippets.push({ "name": "border-left-image", "content": "border-left-image: " });
            cssSnippets.push({ "name": "border-left-style", "content": "border-left-style: " });
            cssSnippets.push({ "name": "border-left-width", "content": "border-left-width: " });
            cssSnippets.push({ "name": "border-left", "content": "border-left: " });
            cssSnippets.push({ "name": "border-length", "content": "border-length: " });
            cssSnippets.push({ "name": "border-radius", "content": "border-radius: " });
            cssSnippets.push({ "name": "border-right", "content": "border-right: " });
            cssSnippets.push({ "name": "border-right-color", "content": "border-right-color: " });
            cssSnippets.push({ "name": "border-right-image", "content": "border-right-image: " });
            cssSnippets.push({ "name": "border-right-style", "content": "border-right-style: " });
            cssSnippets.push({ "name": "border-right-width", "content": "border-right-width: " });
            cssSnippets.push({ "name": "border-right", "content": "border-right: " });
            cssSnippets.push({ "name": "border-spacing", "content": "border-spacing: " });
            cssSnippets.push({ "name": "border-style", "content": "border-style: " });
            cssSnippets.push({ "name": "border-top", "content": "border-top: " });
            cssSnippets.push({ "name": "border-top-color", "content": "border-top-color: " });
            cssSnippets.push({ "name": "border-top-image", "content": "border-top-image: " });
            cssSnippets.push({ "name": "border-top-left-image", "content": "border-top-left-image: " });
            cssSnippets.push({ "name": "border-corner-image", "content": "border-corner-image: " });
            cssSnippets.push({ "name": "border-top-left-radius", "content": "border-top-left-radius: " });
            cssSnippets.push({ "name": "border-top-right-image", "content": "border-top-right-image: " });
            cssSnippets.push({ "name": "border-top-right-radius", "content": "border-top-right-radius: " });
            cssSnippets.push({ "name": "border-top-style", "content": "border-top-style: " });
            cssSnippets.push({ "name": "border-top-width", "content": "border-top-width: " });
            cssSnippets.push({ "name": "border-top", "content": "border-top: " });
            cssSnippets.push({ "name": "border-width", "content": "border-width: " });
            cssSnippets.push({ "name": "border", "content": "border: " });
            cssSnippets.push({ "name": "bottom", "content": "bottom: " });
            cssSnippets.push({ "name": "box-shadow", "content": "box-shadow: " });
            cssSnippets.push({ "name": "box-sizing", "content": "box-sizing: " });
            cssSnippets.push({ "name": "caption-side", "content": "caption-side: " });
            cssSnippets.push({ "name": "clear", "content": "clear: " });
            cssSnippets.push({ "name": "clip", "content": "clip: " });
            cssSnippets.push({ "name": "color", "content": "color: " });
            cssSnippets.push({ "name": "content", "content": "content: " });
            cssSnippets.push({ "name": "counter-increment", "content": "counter-increment: " });
            cssSnippets.push({ "name": "counter-reset", "content": "counter-reset: " });
            cssSnippets.push({ "name": "cursor", "content": "cursor: " });
            cssSnippets.push({ "name": "display", "content": "display: " });
            cssSnippets.push({ "name": "empty-cells", "content": "empty-cells: " });
            cssSnippets.push({ "name": "expression()", "content": "expression(): " });
            cssSnippets.push({ "name": "float", "content": "float: " });
            cssSnippets.push({ "name": "font", "content": "font: " });
            cssSnippets.push({ "name": "font-effect", "content": "font-effect: " });
            cssSnippets.push({ "name": "font-emphasize-position", "content": "font-emphasize-position: " });
            cssSnippets.push({ "name": "font-emphasize-style", "content": "font-emphasize-style: " });
            cssSnippets.push({ "name": "font-emphasize", "content": "font-emphasize: " });
            cssSnippets.push({ "name": "font-family", "content": "font-family: " });
            cssSnippets.push({ "name": "font-size-adjust", "content": "font-size-adjust: " });
            cssSnippets.push({ "name": "font-size", "content": "font-size: " });
            cssSnippets.push({ "name": "font-smooth", "content": "font-smooth: " });
            cssSnippets.push({ "name": "font-stretch", "content": "font-stretch: " });
            cssSnippets.push({ "name": "font-style", "content": "font-style: " });
            cssSnippets.push({ "name": "font-variant", "content": "font-variant: " });
            cssSnippets.push({ "name": "font-weight", "content": "font-weight: " });
            cssSnippets.push({ "name": "font", "content": "font: " });
            cssSnippets.push({ "name": "height", "content": "height: " });
            cssSnippets.push({ "name": "left", "content": "left: " });
            cssSnippets.push({ "name": "letter-spacing", "content": "letter-spacing: " });
            cssSnippets.push({ "name": "line-height", "content": "line-height: " });
            cssSnippets.push({ "name": "list-style-image", "content": "list-style-image: " });
            cssSnippets.push({ "name": "list-style-position", "content": "list-style-position: " });
            cssSnippets.push({ "name": "list-style-type", "content": "list-style-type: " });
            cssSnippets.push({ "name": "list-style", "content": "list-style: " });
            cssSnippets.push({ "name": "margin-bottom", "content": "margin-bottom: " });
            cssSnippets.push({ "name": "margin-left", "content": "margin-left: " });
            cssSnippets.push({ "name": "margin-right", "content": "margin-right: " });
            cssSnippets.push({ "name": "margin-top", "content": "margin-top: " });
            cssSnippets.push({ "name": "margin", "content": "margin: " });
            cssSnippets.push({ "name": "max-height", "content": "max-height: " });
            cssSnippets.push({ "name": "max-width", "content": "max-width: " });
            cssSnippets.push({ "name": "min-height", "content": "min-height: " });
            cssSnippets.push({ "name": "min-width", "content": "min-width: " });
            cssSnippets.push({ "name": "opacity", "content": "opacity: " });
            cssSnippets.push({ "name": "filter", "content": "filter: " });
            cssSnippets.push({ "name": "-ms-filter", "content": "-ms-filter: " });
            cssSnippets.push({ "name": "orphans", "content": "orphans: " });
            cssSnippets.push({ "name": "outline", "content": "outline: " });
            cssSnippets.push({ "name": "outline-color", "content": "outline-color: " });
            cssSnippets.push({ "name": "outline-offset", "content": "outline-offset: " });
            cssSnippets.push({ "name": "outline-style", "content": "outline-style: " });
            cssSnippets.push({ "name": "outline-width", "content": "outline-width: " });
            cssSnippets.push({ "name": "outline", "content": "outline: " });
            cssSnippets.push({ "name": "overflow-style", "content": "overflow-style: " });
            cssSnippets.push({ "name": "overflow-x", "content": "overflow-x: " });
            cssSnippets.push({ "name": "overflow-y", "content": "overflow-y: " });
            cssSnippets.push({ "name": "overflow", "content": "overflow: " });
            cssSnippets.push({ "name": "padding-bottom", "content": "padding-bottom: " });
            cssSnippets.push({ "name": "padding-left", "content": "padding-left: " });
            cssSnippets.push({ "name": "padding-right", "content": "padding-right: " });
            cssSnippets.push({ "name": "padding-top", "content": "padding-top: " });
            cssSnippets.push({ "name": "padding", "content": "padding: " });
            cssSnippets.push({ "name": "page-break-after", "content": "page-break-after: " });
            cssSnippets.push({ "name": "page-break-before", "content": "page-break-before: " });
            cssSnippets.push({ "name": "page-break-inside", "content": "page-break-inside: " });
            cssSnippets.push({ "name": "position", "content": "position: " });
            cssSnippets.push({ "name": "quotes", "content": "quotes: " });
            cssSnippets.push({ "name": "resize", "content": "resize: " });
            cssSnippets.push({ "name": "right", "content": "right: " });
            cssSnippets.push({ "name": "table-layout", "content": "table-layout: " });
            cssSnippets.push({ "name": "text-align-last", "content": "text-align-last: " });
            cssSnippets.push({ "name": "text-align", "content": "text-align: " });
            cssSnippets.push({ "name": "text-decoration", "content": "text-decoration: " });
            cssSnippets.push({ "name": "text-emphasis", "content": "text-emphasis: " });
            cssSnippets.push({ "name": "text-height", "content": "text-height: " });
            cssSnippets.push({ "name": "text-indent", "content": "text-indent: " });
            cssSnippets.push({ "name": "text-justify", "content": "text-justify: " });
            cssSnippets.push({ "name": "text-outline", "content": "text-outline: " });
            cssSnippets.push({ "name": "text-replace", "content": "text-replace: " });
            cssSnippets.push({ "name": "text-shadow", "content": "text-shadow: " });
            cssSnippets.push({ "name": "text-transform", "content": "text-transform: " });
            cssSnippets.push({ "name": "text-wrap", "content": "text-wrap: " });
            cssSnippets.push({ "name": "top", "content": "top: " });
            cssSnippets.push({ "name": "vertical-align", "content": "vertical-align: " });
            cssSnippets.push({ "name": "visibility", "content": "visibility: " });
            cssSnippets.push({ "name": "white-space-collapse", "content": "white-space-collapse: " });
            cssSnippets.push({ "name": "white-space", "content": "white-space: " });
            cssSnippets.push({ "name": "widows", "content": "widows: " });
            cssSnippets.push({ "name": "width", "content": "width: " });
            cssSnippets.push({ "name": "word-break", "content": "word-break: " });
            cssSnippets.push({ "name": "word-spacing", "content": "word-spacing: " });
            cssSnippets.push({ "name": "word-wrap", "content": "word-wrap: " });
            cssSnippets.push({ "name": "z-index", "content": "z-index: " });
            cssSnippets.push({ "name": "zoom", "content": "zoom: " });
            snippetManager.register(cssSnippets, "css");

            const staticWordCompleterJs = {
                getCompletions(_editor, session, pos, prefix, callback)
                {
                    const wordList = [
                        "op.log",
                        "op.logWarn",
                        "op.logError",
                        "onChange=",
                        "onTriggered=",
                        "onLinkChanged=",
                        "op.toWorkNeedsParent",
                        "op.toWorkShouldNotBeChild",
                        "setUiAttribs",
                        "op.patch.cgl",
                        "CABLES.shuffleArray(arr);",
                        "Math.seededRandom();",
                        "Math.randomSeed=1;",
                        "CABLES.now();",
                    ];
                    callback(
                        null,
                        wordList.map(function (word)
                        {
                            return {
                                "caption": word,
                                "value": word,
                                "meta": "static",
                            };
                        }),
                    );
                },
            };

            editor.completers.push(staticWordCompleterJs);
            editor.resize();
            editor.focus();

            cb(editor);
        });
    }
}

function loadAce(cb)
{
    if (CABLES.loadedAce)
    {
        cb();
    }
    else
    {
        loadjs.ready("acelibs", () =>
        {
            gui.jobs().finish("acelibs");
            gui.jobs().start({ "id": "acemisc", "title": "loading ace editor misc files" });

            try
            {
                loadjs(["js/ace/ext-language_tools.js", "js/ace/theme-cables.js"], "ace");
            }
            catch (e)
            {
                // ignore error when trying to load multiple times
            }
        });

        loadjs.ready("ace", () =>
        {
            gui.jobs().finish("acemisc");
            CABLES.loadedAce = true;
            cb();
        });

        gui.jobs().start({ "id": "acelibs", "title": "loading ace editor lib" });
        try
        {
            loadjs(["js/ace/ace.js"], "acelibs");
        }
        catch (e)
        {
            // ignore error when trying to load multiple times
        }
    }
}
