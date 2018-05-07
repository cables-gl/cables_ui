CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.FileSelect = function() {
    var currentTab = '';
    var assetPath = '';
    var apiPath = '';
    var inputId = '';
    var filterType = '';
    this._viewClass = 'icon';
    var self = this;
    this.currentOpid = null;
    this.visible = false;

    this.setFile = function(_id, _url, fileid) {
        $(_id).val(_url);
        $(_id).trigger('input');

        var highlightBg = "#fff";
        var originalBg = $(_id).css("background-color");
        $(_id).stop().css("opacity", 0);
        $(_id).animate({
            "opacity": 1
        }, 1000);

        if (this.currentOpid) {
            gui.patch().showOpParams(gui.scene().getOpById(this.currentOpid));
        }

        CABLES.UI.fileSelect.showPreview(_url, fileid);
    };

    this.setTab = function(which) {
        if (!gui.patch().getCurrentProject() || !gui.patch().getCurrentProject()._id) return;

        if (which == 'projectfiles') {
            assetPath = '/assets/' + gui.patch().getCurrentProject()._id;
            apiPath = 'project/' + gui.patch().getCurrentProject()._id + '/files/';
        }
        if (which == 'library') {
            assetPath = '/assets/library/';
            apiPath = 'library/';
        }

        $('#tab_' + currentTab).removeClass('active');

        currentTab = which;
        this.load();
    };


    this.showPreview = function(val, id) {
        var html = '';

        if (!gui.patch().getCurrentProject) return;

        if (!val) {

        } else
        if (id) {
            if(window.process && window.process.versions.electron) return;
            CABLES.api.get(
                'project/' + gui.patch().getCurrentProject()._id + '/file/info/' + id,
                function(r) {
                    html = CABLES.UI.getHandleBarHtml('library_preview_full', {
                        "projectId": gui.patch().getCurrentProject()._id,
                        "file": r
                    });

                    // console.log(r);
                    // console.log(r);
                    $('#lib_preview').html(html);
                });
        } else {
            var opts = {};

            if (val.endsWith('.jpg') || val.endsWith('.png')) {
                opts.previewImageUrl = val;
            }

            html = CABLES.UI.getHandleBarHtml('library_preview', opts);

        }

        $('#lib_preview').html(html);
    };

    this.setView = function(v) {
        CABLES.UI.userSettings.set("fileListClass",v);

        this._viewClass = v;
        this.load();
    };

    this.hide = function() {
        $('#library').hide();
        CABLES.UI.userSettings.set("fileViewOpen",false);
        this.visible = false;
        gui.setLayout();
    };

    this.toggle = function() {
        if (!this.visible) this.show();
        else this.hide();
    };

    this.show = function(_inputId, _filterType, _opid) {
        CABLES.UI.userSettings.set("fileViewOpen",true);
        this.visible = true;
        $('#library').show();
        this.currentOpid = _opid;

        var filter='';

        if(_opid) filter+='click a file to apply to op '+gui.scene().getOpById(this.currentOpid).objName+' ';
        if(_filterType) 
        {
            filter+=" - filter: "+_filterType;
        }

        this.setView(CABLES.UI.userSettings.get("fileListClass")||'list');

        $('#lib_head').html(CABLES.UI.getHandleBarHtml('library_head',
            {
                "filter":filter
            }));

        inputId = _inputId;
        filterType = _filterType;

        this.load();

        var val = $(_inputId).val();
        this.showPreview(val);
        gui.setLayout();
    };

    this.refresh =
    this.load = function() {
        if (currentTab === '') {
            this.setTab('projectfiles');
            return;
        }

        $('#lib_files').html('<div style="text-align:center;margin-top:50px;"><div class="loading"></div><div>');
        $('#tab_' + currentTab).addClass('active');

        function getFileList(filterType, files, p) {
            if (!p) p = assetPath;

            var html = '';

            if (currentTab != 'library') html = CABLES.UI.getHandleBarHtml('library_uploadfile', {
                file: files[i],
                inputId: inputId,
                filterType: filterType
            });
            if(self._viewClass=='list')html+='<table class="table">';

            for (var i in files) {
                if (!files[i]) continue;

                if(files[i].t=='image')files[i].icon="file-image-o";
                else if(files[i].t=='video')files[i].icon="file-video-o";
                else if(files[i].t=='audio')files[i].icon="file-audio-o";
                else if(files[i].t=='dir')files[i].icon="file-folder-open-o";
                else if(files[i].t=='font')files[i].icon="file-excel-o";
                else if(files[i].t.indexOf('3d')>-1)files[i].icon="cube";
                else if(files[i].t=='JSON' || files[i].t.indexOf('shader')>-1)files[i].icon="file-code-o";
                else files[i].icon="file-o";


                files[i].selectableClass = '';
                if (!files[i].d) {
                    if (filterType && files[i].t && files[i].t.toLowerCase().indexOf( filterType.toLowerCase()) !=-1)
                    {
                        files[i].selectableClass = 'selectable';
                    } else {
                        if (filterType) continue;
                        files[i].selectableClass = 'unselectable';
                    }
                }

                if (!files[i].p) files[i].p = p + files[i].n;


                html += CABLES.UI.getHandleBarHtml('library_file_' + self._viewClass, {
                    file: files[i],
                    inputId: inputId,
                    filterType: filterType
                });
                if (files[i].d) {
                    html += getFileList(filterType, files[i].c, p + files[i].n + '/');
                }

            }
            if(self._viewClass=='list')html+='</table>';
            return html;
        }

        CABLES.api.get(apiPath, function(files) {
            setTimeout(function() {
                var html = getFileList(filterType, files);


                $('#lib_files').html(html);

            }, 0);
        });

    };


    this.contextMenu=function(ele)
    {
        CABLES.contextMenu.show(
            {items:
                [
                    {
                        title:'upload file',
                        func:CABLES.CMD.PATCH.uploadFile
                    },
                    {
                        title:'create new file',
                        func:CABLES.CMD.PATCH.createFile
                    }
                ]},ele);

    };

    this.contextMenuFile=function(e,fileid,filename,filetype)
    {
        var items=[];

        if(filetype=='JSON' || filetype=='CSV' || filetype=='shader' || filetype=='textfile')
        {
            items.push(
                {
                    title:'edit file',
                    func:function()
                    {
                        CABLES.UI.fileSelect.editFile(fileid,filename);
                    }
                }
            );
        }

        items.push(
            {
                title:'open file in new window',
                func:function()
                {
                    window.open('/assets/'+gui.patch().getCurrentProject()._id+'/'+filename,'_blank');
                }
            });

        items.push(
            {
                title:'download file',
                func:function()
                {
                    var link = document.createElement("a");
                    link.download = filename;
                    link.href = '/assets/'+gui.patch().getCurrentProject()._id+'/'+filename;
                    link.click();
                }
            });

        items.push(
            {
                title:'delete file',
                func:function()
                {
                    if(confirm('really delete '+filename+' ?'))
                    {
                        CABLES.api.delete('project/'+gui.patch().getCurrentProject()._id+'/file/'+fileid,null,
                            function()
                            {
                                CABLES.UI.fileSelect.refresh();
                            });
                            $('#lib_preview').html('');
                    }
                }
            });
        

                


        CABLES.contextMenu.show({"items":items},e);
    };


    this.editFile = function(fileid,filename) {
        var editorObj = {
            "type": 'file',
            "fileid": fileid,
            "name": filename
        };
        // saveOpenEditor(editorObj);

        CABLES.api.clearCache();

        gui.showEditor();

        var toolbarHtml = '';
        // if (!readOnly) toolbarHtml += '<a class="button" onclick="gui.serverOps.execute(\'' + opname + '\');">execute</a>';

        console.log("edit att"+filename);


        CABLES.ajax(
            '/assets/' + gui.patch().getCurrentProject()._id + '/' + filename,
            function(err,_data,xhr)
            {
                var content = _data || '';
                var syntax = "text";

                if (filename.endsWith(".frag")) syntax = "glsl";
                if (filename.endsWith(".vert")) syntax = "glsl";
                if (filename.endsWith(".json")) syntax = "json";
                if (filename.endsWith(".css")) syntax = "css";

                gui.editor().addTab({
                    content: content,
                    title: filename,
                    syntax: syntax,
                    editorObj: editorObj,
                    toolbarHtml: toolbarHtml,
                    onSave: function(setStatus, content) {
                        CABLES.api.put(

                            'project/' + gui.patch().getCurrentProject()._id + '/'+filename, {
                                content: content
                            },
                            function(res) {
                                setStatus('saved');
                                console.log('res', res);
                            },
                            function(res) {
                                setStatus('error: not saved');
                                console.log('err res', res);
                            }
                        );
                    },
                    onClose: function(which) {
                        // removeOpenEditor(which.editorObj);
                    },

                });
            },"GET",function()
        {
            console.error("err..."+filename);
            // removeOpenEditor(editorObj);
        }
        );
    };


};

CABLES.UI.fileSelect = new CABLES.UI.FileSelect();

    
