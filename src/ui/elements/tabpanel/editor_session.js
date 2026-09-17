import { ParamInputListeners } from "../../components/opparampanel/params_helper.js";
import WelcomeTab from "../../components/tabs/tab_welcome.js";
import { UserSettings, userSettings } from "../../components/usersettings.js";
import { gui } from "../../gui.js";

/**
 * @typedef cbData
 * @property {string} [opId]
 * @property {string} [portname]
 * @property {string} [opname]
 * @property {string} [name]
 */

/**
* @callback editorReopenCallback
* @param {string} type
* @param {cbData} data
*/

/**
 * @typedef EditorSessionOptions
 * @property {string} type
 * @property {object} data
 * @property {string} name
 */

/**
 * stores opened editors to reopen when loading ui
 */
export default class EditorSession
{
    #openEditors = [];

    /** @type {Object<String,editorReopenCallback>} */
    #listeners = {};

    /**
     * @param {boolean} [userInteraction]
     */
    constructor(userInteraction = false)
    {
        this._loadingCount = 0;
        this._loadedCurrentTab = false;

        this.addListener("param", (name, data) =>
        {
            ParamInputListeners.OpenParamStringEditor(data.opId, data.portname, null, userInteraction);
        });

        this.addListener("welcometab", (name, data) =>
        {
            new WelcomeTab(gui.mainTabs);
        });
    }

    store()
    {
        userSettings.set(UserSettings.PREF_OPEN_EDITORS, this.#openEditors);
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
     * @param {string} type
     * @param {string} name
     * @param {object} [data]
     * @param {boolean} [skipSetEditorTab]
     * @returns {EditorSessionOptions}
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
                    userSettings.set(UserSettings.PREF_EDITORTAB, name);
                }
                return;
            }
        }

        const obj = { "name": name, "type": type, "data": data || {} };
        this.#openEditors.push(obj);
        this.store();
        if (!skipSetEditorTab)
            userSettings.set(UserSettings.PREF_EDITORTAB, name);

        return obj;
    }

    /**
     * reopen saved editors
     * @name open
     * @function
     */
    open()
    {
        const sessions = userSettings.get(UserSettings.PREF_OPEN_EDITORS);

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
     * @param {string} type
     * @param {editorReopenCallback} cb
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
window.dispatchEvent(new CustomEvent(CABLES.UI_EVENT_EDITORSESSION_INIT));
