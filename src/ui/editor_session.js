"use strict";
CABLES = CABLES || {};

/**
 * stores opened editors to reopen when loading ui
 * @namespace CABLES.EditorSession
 * @memberof CABLES
 * @class
 */
CABLES.EditorSession=function()
{
    this._openEditors=[];
    this._listeners={};
}

CABLES.EditorSession.prototype.store=function()
{
    CABLES.UI.userSettings.set("openEditors", this._openEditors);

    
    // console.log('tab.title',tab.title);
    // var tab=gui.editor().getCurrentTab();
    // console.log(tab);

}

/**
 * remove a editor session
 * @name CABLES.EditorSession#remove
 * @param {string} type
 * @param {string} name
 * @function
 */
CABLES.EditorSession.prototype.remove=function(name,type)
{
    var found=true;
    while (found) {
        found = false;
        for (var i = 0; i < this._openEditors.length; i++) {
            if (this._openEditors[i].name == name && this._openEditors[i].type == type)
            {
                index = i;
                found = true;
                this._openEditors.splice(index, 1);
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
CABLES.EditorSession.prototype.rememberOpenEditor=function(type,name,data)
{
    for (var i = 0; i < this._openEditors.length; i++)
    {
        if (this._openEditors[i].name == name && this._openEditors[i].type == type ) //&& this._openEditors[i].uuid == uuid 
        {
            return;
        }
    }
    var obj={"name":name,"type":type,"data":data||{}};
    this._openEditors.push(obj);
    this.store();
    CABLES.UI.userSettings.set("editortab", name);

    return obj;
}

/**
 * reopen saved editors
 * @name CABLES.EditorSession#open
 * @function
 */
CABLES.EditorSession.prototype.open=function()
{
    var sessions = CABLES.UI.userSettings.get("openEditors");

    if (sessions)
    {
        for (var i = 0; i < sessions.length; i++)
            if(this._listeners[sessions[i].type])
                this._listeners[sessions[i].type]( sessions[i].name, sessions[i].data||{} );
    
        if(sessions.length>0)
            if(!CABLES.UI.loaded)
            {
                var showMainTabs=CABLES.UI.userSettings.get("maintabsVisible");
                if(showMainTabs) gui.maintabPanel.show(true);
            }
    }
}

/**
 * add listener, a callback will be executed for this type when editor is reopened.
 * @name CABLES.EditorSession#addListener
 * @function
 */
CABLES.EditorSession.prototype.addListener=function(type,cb)
{
    this._listeners[type]=cb;
}

CABLES.editorSession=new CABLES.EditorSession();