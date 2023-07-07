import userSettings from "../../components/usersettings";

/**
 * stores opened editors to reopen when loading ui
 * @namespace CABLES.EditorSession
 * @memberof CABLES
 * @class
 */
export default class EditorSession
{
    constructor(userInteraction)
    {
        this._openEditors = [];
        this._listeners = {};
        this._loadingCount = 0;
        this._loadedCurrentTab = false;

        this.addListener("param", (name, data) =>
        {
            CABLES.UI.paramsHelper.openParamStringEditor(data.opid, data.portname, null, userInteraction);
        });
    }

    store()
    {
        userSettings.set("openEditors", this._openEditors);
    }

    loaded()
    {
        return this._loadingCount == 0;
    }

    openEditors()
    {
        return this._openEditors;
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
     * @name CABLES.EditorSession#remove
     * @param {string} type
     * @param {string} name
     * @function
     */
    remove(name, type)
    {
        let found = true;
        while (found)
        {
            found = false;
            for (let i = 0; i < this._openEditors.length; i++)
            {
                if (this._openEditors[i].name == name && this._openEditors[i].type == type)
                {
                    found = true;
                    this._openEditors.splice(i, 1);
                    break;
                }
            }
        }
        this.store();
    }

    /**
     * remember an open editor
     * @name CABLES.EditorSession#rememberOpenEditor
     * @param {string} type
     * @param {string} name
     * @function
     */
    rememberOpenEditor(type, name, data, skipSetEditorTab)
    {
        for (let i = 0; i < this._openEditors.length; i++)
        {
            if (this._openEditors[i].name == name && this._openEditors[i].type == type)
            {
                return;
            }
        }
        const obj = { "name": name, "type": type, "data": data || {} };
        this._openEditors.push(obj);
        this.store();
        if (!skipSetEditorTab)
            userSettings.set("editortab", name);

        return obj;
    }

    /**
     * reopen saved editors
     * @name CABLES.EditorSession#open
     * @function
     */
    open()
    {
        const sessions = userSettings.get("openEditors");

        if (sessions)
        {
            for (let i = 0; i < sessions.length; i++)
                if (this._listeners[sessions[i].type])
                    this._listeners[sessions[i].type](sessions[i].name, sessions[i].data || {});
                else console.warn("no editorsession listener for " + sessions[i].type + " (" + sessions[i].name + ")");
        }
    }

    /**
     * add listener, a callback will be executed for this type when editor is reopened.
     * @name CABLES.EditorSession#addListener
     * @function
     */
    addListener(type, cb)
    {
        this._listeners[type] = cb;
    }
}
