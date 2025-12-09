import paramsHelper from "../../components/opparampanel/params_helper.js";
import ItemManager from "../../components/tabs/tab_item_manager.js";
import WelcomeTab from "../../components/tabs/tab_welcome.js";
import { userSettings } from "../../components/usersettings.js";
import { gui } from "../../gui.js";

/**
 * stores opened editors to reopen when loading ui
 */
export default class EditorSession
{
    #openEditors;
    #listeners;

    /**
     * @param {boolean} userInteraction
     */
    constructor(userInteraction)
    {
        this.#openEditors = [];
        this.#listeners = {};
        this._loadingCount = 0;
        this._loadedCurrentTab = false;

        this.addListener("param", (name, data) =>
        {
            paramsHelper.openParamStringEditor(data.opid, data.portname, null, userInteraction);
        });

        this.addListener("welcometab", (name, data) =>
        {
            new WelcomeTab(gui.mainTabs);
        });
    }

    store()
    {
        userSettings.set("openEditors", this.#openEditors);
    }

    loaded()
    {
        return this._loadingCount == 0;
    }

    openEditors()
    {
        return this.#openEditors;
    }

    startLoadingTab()
    {
        this._loadingCount++;
    }

    finishLoadingTab()
    {
        this._loadingCount--;

        setTimeout(() =>
        {
            if (this._loadingCount == 0 && !this._loadedCurrentTab)
            {
                gui.mainTabs.loadCurrentTabUsersettings();
                this._loadedCurrentTab = true;
            }
        }, 100);
    }

    /**
     * remove a editor session
     * @name remove
     * @param {string} type
     * @param {string} name
     * @function
     */
    remove(type, name)
    {
        let found = true;
        while (found)
        {
            found = false;
            for (let i = 0; i < this.#openEditors.length; i++)
            {
                if (this.#openEditors[i].name == name && this.#openEditors[i].type == type)
                {
                    found = true;
                    this.#openEditors.splice(i, 1);
                    break;
                }
            }
        }
        this.store();
    }

    /**
     * remember an open editor
     * @name rememberOpenEditor
     * @param {string} type
     * @param {string} name
     * @param {object} data
     * @param {boolean} skipSetEditorTab
     * @function
     */
    rememberOpenEditor(type, name, data, skipSetEditorTab)
    {
        for (let i = 0; i < this.#openEditors.length; i++)
        {
            if (this.#openEditors[i].name == name && this.#openEditors[i].type == type)
            {
                if (data)
                {
                    this.#openEditors[i].data = data;
                    this.store();
                    userSettings.set("editortab", name);
                }
                return;
            }
        }

        const obj = { "name": name, "type": type, "data": data || {} };
        this.#openEditors.push(obj);
        this.store();
        if (!skipSetEditorTab)
            userSettings.set("editortab", name);

        return obj;
    }

    /**
     * reopen saved editors
     * @name open
     * @function
     */
    open()
    {
        const sessions = userSettings.get("openEditors");

        if (sessions)
        {
            for (let i = 0; i < sessions.length; i++)
            {
                if (this.#listeners[sessions[i].type]) this.#listeners[sessions[i].type](sessions[i].name, sessions[i].data || {});
                else console.warn("no editorsession listener for " + sessions[i].type + " (" + sessions[i].name + ")");
            }
        }
    }

    /**
     * add listener, a callback will be executed for this type when editor is reopened.
     * @name addListener
     * @function
     */
    addListener(type, cb)
    {
        this.#listeners[type] = cb;
    }
}

/**
 * @type {EditorSession}
 */
let editorSession = new EditorSession();
export { editorSession };
