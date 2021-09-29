/**
 * stores opened editors to reopen when loading ui
 * @namespace CABLES.EditorSession
 * @memberof CABLES
 * @class
 */
export default class EditorSession
{
    constructor()
    {
        this._openEditors = [];
        this._listeners = {};
    }

    store()
    {
        CABLES.UI.userSettings.set("openEditors", this._openEditors);
    }

    openEditors()
    {
        return this._openEditors;
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
            if (this._openEditors[i].name == name && this._openEditors[i].type == type) // && this._openEditors[i].uuid == uuid
            {
                return;
            }
        }
        const obj = { "name": name, "type": type, "data": data || {} };
        this._openEditors.push(obj);
        this.store();
        if (!skipSetEditorTab)
        {
            CABLES.UI.userSettings.set("editortab", name);
        }

        return obj;
    }

    /**
     * reopen saved editors
     * @name CABLES.EditorSession#open
     * @function
     */
    open()
    {
        const sessions = CABLES.UI.userSettings.get("openEditors");

        if (sessions)
        {
            for (let i = 0; i < sessions.length; i++)
                if (this._listeners[sessions[i].type])
                    this._listeners[sessions[i].type](sessions[i].name, sessions[i].data || {});

            if (sessions.length > 0)
                if (!CABLES.UI.loaded)
                {
                    const showMainTabs = CABLES.UI.userSettings.get("maintabsVisible");
                    if (showMainTabs) gui.maintabPanel.show(true);
                }
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
