import ele from "../utils/ele";

export default class Jobs
{
    constructor()
    {
        CABLES.EventTarget.apply(this);

        this._jobs = [];
        this._finishedJobs = [];
        this._lastIndicator = null;
        this._jobsEle = ele.byId("jobs");
        this._listenerStarted = false;
    }

    startListener()
    {
        this._listenerStarted = true;

        if (gui.socket && gui.socket.chat)
        {
            gui.socket.chat.addEventListener("updated", () =>
            {
                if (this._jobsEle.style.display === "block") this.updateJobListing();
            });
        }
    }

    getList()
    {
        let arr = [];
        for (const i in this._jobs)
        {
            arr.push(this._jobs[i]);
        }
        arr = arr.concat(this._finishedJobs);
        return arr;
    }

    updateJobListing()
    {
        if (!window.gui) return;

        let str = "";

        if (CABLES.sandbox.isOffline()) str += "<b>Offline! No internet connection.</b><br/><br/>";

        if (this._jobs.length === 0)
        {
            str += "All server jobs finished...";
            this._visibleJobAnim = false;
            gui.showLoadingProgress(false);
        }
        else this._visibleJobAnim = true;

        this._updateVisibility();
    }

    update(job, func)
    {
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == job.id)
            {
                this._jobs[i].title = job.title;
                break;
            }
        }
        this.updateJobListing();
    }

    hasJob(id)
    {
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == id)
            {
                return true;
            }
        }
    }

    start(job, func)
    {
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == job.id)
            {
                this._jobs.splice(i, 1);
                break;
            }
        }

        if (!job.id)
        {
            console.error("job undefined", job);
            console.error((new Error()).stack);
        }

        gui.showLoadingProgress(true);

        gui.on("uiloaded", () =>
        {
            this.updateJobListing();
        });

        if (!job.timeStart) job.timeStart = Date.now();

        this._jobs.push(job);
        this.updateJobListing();
        this.emitEvent("taskAdd");

        if (func)
        {
            setTimeout(func, 30);
        }


        gui.corePatch().loading.on("finishedTask", this.updateAssetProgress.bind(this));
        gui.corePatch().loading.on("addTask", this.updateAssetProgress.bind(this));
        gui.corePatch().loading.on("startTask", this.updateAssetProgress.bind(this));
    }

    _updateVisibility()
    {
        const elContainer = ele.byId("uploadprogresscontainer");
        if (this._visibleProgressBar)
            elContainer.classList.remove("hidden");
        else
            elContainer.classList.add("hidden");


        if (gui.isRemoteClient)
        {
            if (!this._visibleJobAnim && !this._visibleProgressBar) ele.byId("menubar").classList.add("hidden");
            else ele.byId("menubar").classList.remove("hidden");
        }
    }

    updateAssetProgress()
    {
        clearTimeout(this.removeProgressTo);
        let prog = gui.corePatch().loading.getProgress();
        // console.log("loading progress", prog);

        const elContainer = ele.byId("uploadprogresscontainer");
        ele.byId("uploadprogress").style.width = prog * 100 + "%";

        if (prog === 1)
        {
            this.removeProgressTo = setTimeout(() =>
            {
                this._visibleProgressBar = false;
                this._updateVisibility();
            }, 100);
        }
        else
        {
            if (gui.corePatch().loading.getNumAssets() > 2)
            {
                this._visibleProgressBar = true;
                this._updateVisibility();
            }

            setTimeout(this.updateAssetProgress.bind(this), 300);
        }
    }

    setProgress(jobId, progress)
    {
        const elContainer = ele.byId("uploadprogresscontainer");
        this._visibleProgressBar = progress != 100;

        let avg = 0;
        let avgCount = 0;
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == jobId)
            {
                this._jobs[i].progress = progress;
                // ele.byId("jobprogress" + this._jobs[i].id).style.width = progress + "%";
            }

            if (this._jobs[i].progress)
            {
                avgCount++;
                avg += this._jobs[i].progress;
            }
        }
        if (avgCount)
        {
            const prog = avg / avgCount;
            ele.byId("uploadprogress").style.width = prog + "%";

            this._visibleProgressBar = prog != 100;
        }
        this._updateVisibility();
    }

    finish(jobId)
    {
        setTimeout(() =>
        {
            for (const i in this._jobs)
            {
                if (this._jobs[i].id == jobId)
                {
                    if (this._jobs[i].title.indexOf("file") >= 0)
                    {
                        // gui.updateProjectFiles();
                        // CABLES.UI.fileSelect.load();
                        // gui.showFileManager();
                    }
                    this._jobs[i].finished = true;
                    this._jobs[i].timeEnd = Date.now();

                    this._finishedJobs.push(this._jobs[i]);
                    this._jobs.splice(i, 1);
                    this.emitEvent("taskFinish");

                    break;
                }
            }

            if (this._jobs.length === 0)
            {
                const logo = document.querySelector(".cables .logo");
                if (logo)
                {
                    logo.classList.add("cablesLogo");
                    logo.classList.remove("fa");
                    logo.classList.remove("fa-circle-o-notch");
                    logo.classList.remove("fa-spin");
                }
            }
            this.updateJobListing();
            this.emitEvent("taskFinish");
        }, 150);
    }
}
