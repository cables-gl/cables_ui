CABLES = CABLES || {};

CABLES.Editor=function()
{
    this._tabs=[];
    this._currentTabId='';

    // this._editor=CABLES.Editor.createEditor("ace_editor");

    // Hover text
    // $('#ace_editor').hover(function (e)
    // {
    //     CABLES.UI.showInfo(CABLES.UI.TEXTS.editor);
    // },function()
    // {
    //     CABLES.UI.hideInfo();
    // });

    this.resize=function()
    {
        for(var i=0;i<this._tabs.length;i++)
            this._tabs[i].editor.resize();
    };

    this._updateTabs=function()
    {
        var html='';
        html+=CABLES.UI.getHandleBarHtml('editor_bar',{contents:this._tabs});
        $('#editorbar').html(html);
    }

    this.closeCurrentTab=function()
    {
        for(var i=0;i<this._tabs.length;i++)
        {
            if(this._tabs[i].id==this._currentTabId)
            {
                if(this._tabs[i].onClose)
                    this._tabs[i].onClose(this._tabs[i]);

                this._tabs.splice(i,1);

                this._updateTabs();
                if(this._tabs.length>0)
                {
                    this.setTab(this._tabs[0].id);
                }
                else
                {
                    $('#editorbar').html('');
                    // this._editor.setValue('nothing to edit right now :/',-1);
                    gui.closeEditor();
                }
                return;
            }
        }
    };

    this.addTab=function(c)
    {
        for(var i in this._tabs)
        {
            if(this._tabs[i].title==c.title)
            {
                this.setTab(this._tabs[i].id);
                return;
            }
        }

        c.id=CABLES.generateUUID();

        $('#ace_editors').append('<div class="ace_tab_content" style="height:100%;width:100%;" id="tab_'+c.id+'"></div>');
        c.editor=CABLES.Editor.createEditor('tab_'+c.id);
        c.editor.setValue(c.content+'HUND',-1);

        const session = c.editor.getSession();
        const undoManager = session.getUndoManager();
        undoManager.reset();
        session.setUndoManager(undoManager);
    

        console.log('addtab!!!',c);

        this._tabs.push(c);
        this._updateTabs();
        this.setTab(c.id);
        gui.setLayout();
        return c;
    };

    this.save=function()
    {
        function onSaveCb(txt)
        {
            gui.jobs().finish('saveeditorcontent');
            if(txt.toLowerCase().indexOf('error')==0) CABLES.UI.notifyError(txt);
            else CABLES.UI.notify(txt);
        }

        const tab=this.getCurrentTab();

        this.setCurrentTabContent();
        // for(var i=0;i<this._tabs.length;i++)
        // {
            if(tab && tab.onSave) // && this._tabs[i].id==this._currentTabId
            {
                gui.jobs().start({id:'saveeditorcontent',title:'saving editor content'});

                tab.onSave(onSaveCb,tab.editor.getValue());
            }
        // }
    };

    this.setCurrentTabContent=function()
    {
        const tab=this.getCurrentTab();

        if(tab)
        {
            tab.content=tab.editor.getValue();
        }
        // for(var i=0;i<this._tabs.length;i++)
        // {
        //     if(this._tabs[i].id==this._currentTabId)
        //     {
        //         this._tabs[i].content=this._editor.getValue();
        //     }
        // }
    };

    this.setTabByTitle=function(title)
    {
        for(var i=0;i<this._tabs.length;i++)
            if(this._tabs[i].title==title)
                this.setTab(this._tabs[i].id);
    };

    this.setTab=function(id)
    {
        this.setCurrentTabContent();

        for(var i=0;i<this._tabs.length;i++)
        {
            var tab=this._tabs[i];
            if(tab && tab.id==id)
            {
                this._currentTabId=id;
                CABLES.UI.userSettings.set('editortab',tab.title);
                
                $('.ace_tab_content').hide();
                $('#tab_'+tab.id).show();


                $('#editortab'+tab.id).addClass('active');

                if(tab.syntax=='md') tab.editor.session.setMode("ace/mode/Markdown");
                else if(tab.syntax=='js') tab.editor.session.setMode("ace/mode/javascript");
                else if(tab.syntax=='glsl') tab.editor.session.setMode("ace/mode/glsl");
                else if(tab.syntax=='css') tab.editor.session.setMode("ace/mode/css");
                else tab.editor.session.setMode("ace/mode/Text");

                tab.editor.focus();

                // console.log('editor syntax:',contents[i].syntax);

                // tab.editor.setValue(String(tab.content),-1);
                tab.editor.setReadOnly(tab.readOnly);

                if(tab.readOnly)$('.editorsavebutton').hide();
                    else $('.editorsavebutton').show();

                $('#editorbar .iconbar .editortoolbar').html(tab.toolbarHtml || '');
            }
            else
            {
                $('#editortab'+tab.id).removeClass('active');
            }
        }
    };

    this.focus=function()
    {
        const tab=this.getCurrentTab();
        if(tab) tab.editor.focus();
    };

    this.contextMenu=function(ele)
    {
        var items=[];

        for(var i=0;i<this._tabs.length;i++)
        {
            var mItem=
                {
                    "title":this._tabs[i].title,
                    "fileId":this._tabs[i].id,
                    "func":
                        function()
                        {
                            console.log(this);
                            gui.editor().setTab(this.fileId);
                        }
                };
            items.push(mItem);
        }
        CABLES.contextMenu.show({items: items},ele);
    }
};

CABLES.Editor.prototype.getCurrentTab=function()
{
    for(var i=0;i<this._tabs.length;i++)
    {
        if(this._tabs[i].id==this._currentTabId)
        {
            return this._tabs[i];
        }
    }
    return null;
}

CABLES.Editor.createEditor=function(id)
{
    var editor = ace.edit(id);
    editor.setValue('');

    editor.setOptions({
		"fontFamily": "SourceCodePro",
		"fontSize": "14px",

        "enableBasicAutocompletion": true,
        "enableSnippets": true,
        "enableLiveAutocompletion": true,
        "showPrintMargin": false
    });

    editor.setTheme("ace/theme/cables");
    editor.session.setMode("ace/mode/javascript");
    editor.$blockScrolling = Infinity;

    editor.commands.bindKey("Cmd-D", "selectMoreAfter");
    editor.commands.bindKey("Cmd-Ctrl-Up", "movelinesup");
    editor.commands.bindKey("Cmd-Ctrl-Down", "movelinesdown");

    var staticWordCompleter = {
        getCompletions: function(editor, session, pos, prefix, callback) {
            var wordList = [
                "op.log",

                "onChange",
                "onTriggered",
                /* in functions */
                "inFunction",
                "inFunctionButton",
                /* in number / string / bool  */
                "inValue",
                "inValueBool",
                "inValueInt",
                "inValueString",
                "inValueSlider",
                "inValueSelect",
                /* in object / texture / array / file  */
                "inObject",
                "inTexture",
                "inArray",
                "inFile",
                /* out functions */
                "outFunction",
                /* out number / string / bool  */
                "outValue",
                "outValueBool",
                "outValueString",
                /* out object / texture / array  */
                "outObject",
                "outTexture",
                "outArray",

                "patch.cgl",
            ];
            callback(null, wordList.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    meta: "static"
                };
            }));

        }
    };

    // or
    editor.completers = [staticWordCompleter];
    editor.resize();
    editor.focus();
    return editor;

}