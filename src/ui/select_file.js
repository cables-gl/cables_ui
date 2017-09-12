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

        // $(_id).animate({backgroundColor:'#fff'}, 300);//.animate({backgroundColor:'#555'}, 100);

        if (this.currentOpid) {
            // console.log(this.currentOpid);
            // console.log(gui.scene().getOpById(this.currentOpid));
            gui.patch().showOpParams(gui.scene().getOpById(this.currentOpid));
        }

        CABLES.UI.fileSelect.showPreview(_url, fileid);
    };

    this.setTab = function(which) {
        if (!gui.patch().getCurrentProject()) return;

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
            CABLES.api.get(
                'project/' + gui.patch().getCurrentProject()._id + '/file/info/' + id,
                function(r) {
                    html = CABLES.UI.getHandleBarHtml('library_preview_full', {
                        "projectId": gui.patch().getCurrentProject()._id,
                        "file": r
                    });
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
        this._viewClass = v;
        this.load();
    };

    this.hide = function() {
        $('#library').hide();
        this.visible = false;
        gui.setLayout();
    };

    this.toggle = function() {
        if (!this.visible) this.show();
        else this.hide();
    };

    this.show = function(_inputId, _filterType, _opid) {
        this.visible = true;
        $('#library').show();
        this.currentOpid = _opid;

        $('#lib_head').html(CABLES.UI.getHandleBarHtml('library_head'));

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

            for (var i in files) {
                if (!files[i]) continue;

                files[i].selectableClass = '';
                if (!files[i].d) {
                    if (files[i].t == filterType) {
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
            return html;
        }

        CABLES.api.get(apiPath, function(files) {
            setTimeout(function() {
                var html = getFileList(filterType, files);


                $('#lib_files').html(html);

            }, 0);
        });

    };


};

CABLES.UI.fileSelect = new CABLES.UI.FileSelect();
