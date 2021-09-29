CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.OPNAME_SUBPATCH = "Ops.Ui.SubPatch";

CABLES.UI.Patch = function (_gui)
{
    CABLES.EventTarget.apply(this);

    const self = this;
    this.ops = [];
    this.scene = null;
    this.disabled = true;
    const gui = _gui;
    this._svgEle = null;

    let currentProject = null;
    let currentOp = null;
    let spacePressed = false;
    const selectedOps = [];
    let currentSubPatch = 0;


    let mouseRubberBandStartPos = null;
    let mouseRubberBandPos = null;
    const mouseRubberBandSelectedBefore = [];
    let rubberBandRect = null;
    let isLoading = false;

    let timeoutRubberBand = -1;

    let subPatchViewBoxes = [];
    this._serverDate = "";

    this.background = null;
    this._elPatchSvg = null;
    this._elPatch = null;
    this._elBody = null;
    this._viewBox = null;
    this.currentPatchBounds = null;

    this._oldOpParamsId = null;

    this._uiAttrFpsLast = 0;
    this._uiAttrFpsCount = 0;

    this.name = "svgpatch";

    const pastedupdateTimeout = null;


    this.isLoading = function () { return isLoading; };


    // this.saveCurrentProjectAs = function (cb, _id, _name)
    // {
    //     gui.patchView.store.saveAs(cb, _id, _name);
    // };


    this._timeoutLinkWarnings = null;
    this._checkLinkCounter = -1;

    this.checkLinkTimeWarnings = function (cont)
    {
        if (!cont) self._checkLinkCounter = -1;

        clearTimeout(this._timeoutLinkWarnings);
        this._timeoutLinkWarnings = setTimeout(function ()
        {
            const perf = CABLES.UI.uiProfiler.start("checkLinkTimeWarnings");

            self._checkLinkCounter++;
            if (self._checkLinkCounter >= self.ops.length)
            {
                self._checkLinkCounter = -1;
            }
            else
            {
                // console.log(self._checkLinkCounter);
                const op = self.ops[self._checkLinkCounter];

                if (op.op.uiAttribs.subPatch == currentSubPatch)
                {
                    op.op.checkLinkTimeWarnings();
                    op.op._checkLinksNeededToWork();
                }

                self.checkLinkTimeWarnings(true);
            }
            perf.finish();
        }, 2);
    };


    // this.saveCurrentProject = function (cb, _id, _name, _force)
    // {
    //     // for (let i = 0; i < this.ops.length; i++)
    //     //     this.ops[i].removeDeadLinks();

    //     gui.patchView.store.saveCurrentProject(cb, _id, _name, _force);
    // };

    this.getCurrentProject = function ()
    {
        return currentProject;
    };

    this.setCurrentProject = function (proj)
    {
        // if (self.timeLine) self.timeLine.clear();

        currentProject = proj;
        // if (currentProject === null)
        // {
        //     $("#meta_content_files").hide();
        // }
        // else
        // {
        //     $("#meta_content_files").show();
        // }
        // $("#meta_content_files").hover(function (e)
        // {
        //     CABLES.UI.showInfo(CABLES.UI.TEXTS.projectFiles);
        // }, function ()
        // {
        //     CABLES.UI.hideInfo();
        // });
    };

    this.loadingError = false;

    this.setProject = function (proj)
    {
        this.loadingError = false;

        currentSubPatch = 0;
        gui.setProjectName(proj.name);
        self.setCurrentProject(proj);

        gui.corePatch().clear();
    };

    this.show = function (_scene)
    {
        this.scene = _scene;

        this.bindScene(self.scene);
    };


    function doLink() {}

    this.checkOpsInSync = function ()
    {
        console.log("core ops / ui ops: ", gui.corePatch().ops.length, this.ops.length);

        let notFound = 0;
        for (let i = 0; i < gui.corePatch().ops.length; i++)
        {
            let found = false;
            for (let j = 0; j < this.ops.length; j++)
            {
                if (gui.corePatch().ops[i] == this.ops[j].op)
                {
                    found = true;
                    break;
                }
            }
            if (!found)
            {
                notFound++;
                console.log("creating unfound uiop..... ", gui.corePatch().ops[i]);
                this.initUiOp(gui.corePatch().ops[i], true);
            }
        }
    };


    this.bindScene = function (scene)
    {
        // scene.onLoadStart = function ()
        // {
        isLoading = true;
        // };

        let patchLoadEndiD = scene.on("patchLoadEnd", () =>
        {
            scene.off(patchLoadEndiD);
            isLoading = false;
            gui.setStateSaved();

            logStartup("Patch loaded");
        });
    };

    this.getCurrentSubPatch = function ()
    {
        return currentSubPatch;
    };

    this.isOpCurrentSubpatch = function (op)
    {
        return op.uiAttribs.subPatch == currentSubPatch;
    };


    this.getSubPatchPathString = function (subId)
    {
        const arr = this.findSubpatchOp(subId);
        let str = "";

        for (let i = 0; i < arr.length; i++) str += arr[i].name + " ";

        return str;
    };


    this.getSelectedOps = function ()
    {
        return selectedOps;
    };

    this.showSelectedOpsGraphs = function ()
    {
        gui.timeLine().clear();

        let doShow = true;
        let count = 0;
        if (selectedOps.length > 0)
        {
            for (let j = 0; j < selectedOps.length; j++)
            {
                for (let i = 0; i < selectedOps[j].portsIn.length; i++)
                {
                    if (selectedOps[j].portsIn[i].thePort.isAnimated() && selectedOps[j].portsIn[i].thePort.anim)
                    {
                        if (count === 0) doShow = !selectedOps[j].portsIn[i].thePort.anim.stayInTimeline;

                        selectedOps[j].portsIn[i].thePort.anim.stayInTimeline = doShow;
                        self.timeLine.setAnim(selectedOps[j].portsIn[i].thePort.anim);
                        count++;
                    }
                }
            }
        }

        if (!doShow) gui.timeLine().clear();
    };

    this.showProjectParams = function ()
    {
        gui.patchView.showDefaultPanel();
    };


    this.setSize = function (x, y, w, h)
    {
    };


    this.disableEnableOps = function ()
    {
        if (!selectedOps.length) return;
        for (let i = 0; i < self.ops.length; i++) self.ops[i].op.marked = false;

        let newstate = false;
        if (!selectedOps[0].op.enabled) newstate = true;

        for (let j = 0; j < selectedOps.length; j++)
        {
            selectedOps[j].setEnabled(newstate);
        }
    };

    let lastTempOP = null;
    this.tempUnlinkOp = function ()
    {
        if (lastTempOP)
        {
            lastTempOP.op.undoUnLinkTemporary();
            lastTempOP.setEnabled(true);
            lastTempOP = null;
        }
        else
        {
            const op = selectedOps[0];
            if (op)
            {
                op.setEnabled(false);
                op.op.unLinkTemporary();
                lastTempOP = op;
            }
        }
    };
};
