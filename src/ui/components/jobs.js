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
            gui.showLoadingProgress(false);
        }
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
                elContainer.classList.add("hidden");
            }, 100);
        }
        else
        {
            if (gui.corePatch().loading.getNumAssets() > 2)
                elContainer.classList.remove("hidden");

            setTimeout(this.updateAssetProgress.bind(this), 300);
        }
    }

    setProgress(jobId, progress)
    {
        const elContainer = ele.byId("uploadprogresscontainer");
        if (progress != 100) elContainer.classList.remove("hidden");
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

            if (prog === 100) elContainer.classList.add("hidden");
            else elContainer.classList.remove("hidden");
        }
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
