import { ele, Logger, TalkerAPI } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import ModalDialog from "../../dialogs/modaldialog.js";
import { gui } from "../../gui.js";
import { platform } from "../../platform.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import { contextMenu } from "../../elements/contextmenu.js";

export default class ElectronOpDirs
{
    static TABSESSION_NAME = "opdirs";

    constructor(tabs)
    {
        this._log = new Logger("ElectronOpDirsTab");

        this._count = 0;
        this._timeout = null;

        this._tab = new Tab("Op Directories", { "icon": "folder", "singleton": true, "infotext": "tab_profiler", "padding": true });
        tabs.addTab(this._tab, true);
        this.show();

        editorSession.rememberOpenEditor(ElectronOpDirs.TABSESSION_NAME, ElectronOpDirs.TABSESSION_NAME, {}, true);
        this._tab.on(Tab.EVENT_CLOSE, () => { editorSession.remove(ElectronOpDirs.TABSESSION_NAME, ElectronOpDirs.TABSESSION_NAME); });

        this._tab.on("onActivate", this.show);
    }

    show()
    {
        if (!this._tab) return;
        platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_GET_PROJECT_OPDIRS, {}, (err, r) =>
        {
            if (!err && r.data)
            {
                const templateVars = [];
                r.data.forEach((dir) =>
                {
                    if (dir.removeable) dir.showOptions = true;
                    templateVars.push(dir);
                });
                const html = getHandleBarHtml("tab_electron_opdirs", { "dirs": templateVars });
                this._tab.html(html);

                const addButton = this._tab.contentEle.querySelector("#addOpDir");

                if (addButton)
                {
                    addButton.addEventListener("click", () =>
                    {
                        platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_ADD_OPDIR, {}, (dirErr, _dirRes) =>
                        {
                            if (!dirErr)
                            {
                                this.show();
                                this._loadOpsInDirs();
                            }
                            else
                            {
                                new ModalDialog({ "showOkButton": true, "warning": true, "title": "Warning", "text": dirErr.msg });
                                this._log.info(dirErr.msg);
                            }
                        });
                    });
                }

                ele.clickables(this._tab.contentEle, ".opdirthreedot", (e, dataset) =>
                {
                    const contextItems = [];
                    contextItems.push({
                        "title": "Remove",
                        "func": () =>
                        {
                            const dir = dataset.dir;
                            platform.talkerAPI.send(TalkerAPI.CMD_ELECTRON_REMOVE_OPDIR, dir, () =>
                            {
                                this.show();
                                this._loadOpsInDirs();
                            });
                        }
                    });
                    contextMenu.show({ "items": contextItems }, e.target);
                });
            }
        });
    }

    _loadOpsInDirs()
    {
        platform.talkerAPI.send(TalkerAPI.CMD_GET_ALL_OPDOCS, { "projectId": gui.patchId }, (_err, _data) =>
        {
            if (_err)
            {
                this._log.error("preloading error", _err);
            }
            else
            {
                if (gui.opDocs)
                {
                    gui.opDocs.addOpDocs(_data.opDocs);
                }
                gui.opSelect().reload();
            }
        }, (response) =>
        {
            this._log.error("preloading error", response);
        });
    }
}

editorSession.addListener(ElectronOpDirs.TABSESSION_NAME, () => { platform.openOpDirsTab(); });
