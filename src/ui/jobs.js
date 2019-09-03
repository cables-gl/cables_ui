CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};
CABLES.UI.Jobs=CABLES.UI.Jobs ||

function()
{
    var jobs=[];
    var lastIndicator=null;

    function updateJobListing()
    {
        var str='';
        var indicator=null;

        if(CABLES.sandbox.isOffline()) str+='<b>Offline! No internet connection.</b><br/><br/>';


        for(var i in jobs)
        {
            if(jobs[i].indicator)indicator=jobs[i].indicator;
            str+='<div><i class="fa fa-circle-o-notch fa-spin"></i>&nbsp;&nbsp;'+jobs[i].title+'';
            str+='<div id="jobprogress'+jobs[i].id+'" style="width:'+(jobs[i].progress||0)+'%;background-color:white;height:3px;margin-top:3px;margin-bottom:7px;"></div>';
            str+='</div>';
        }

        

        if(jobs.length==0)
        {
            str+='All server jobs finished...';
            $('.cables-logo .icon-cables').removeClass('blinkanim');
        }

        

        if(indicator)
        {
            gui.setWorking(true,indicator);
            lastIndicator=indicator;
        }
        else
        {
            if(lastIndicator) gui.setWorking(false,lastIndicator);
        }

        $('#jobs').html(str);
    }

    this.update=function(job,func)
    {
        for(var i in jobs)
        {
            if(jobs[i].id==job.id)
            {
                jobs[i].title=job.title;
                break;
            }
        }
        updateJobListing();
    };

    this.start=function(job,func)
    {
        for(var i in jobs)
        {
            if(jobs[i].id==job.id)
            {
                jobs.splice(i,1);
                break;
            }
        }

        $('.cables-logo .icon-cables').addClass('blinkanim');


        jobs.push(job);
        updateJobListing();

        if(func)
        {
            setTimeout(func,30);
        }
    };

    this.updateProgressMainBar=function()
    {
        $('#uploadprogress').css({"width":options.complete+'%'});        
    }

    this.setProgress=function(jobId,progress)
    {
        for(var i in jobs)
        {
            if(jobs[i].id==jobId)
            {
                jobs[i].progress=progress;

                document.getElementById('jobprogress'+jobs[i].id).style.width=progress+'%';
                break;
            }
        }
    }

    this.finish=function(jobId)
    {

        setTimeout(function()
        {
            for(var i in jobs)
            {
                if(jobs[i].id==jobId)
                {
                    if(jobs[i].title.indexOf('file')>=0)
                    {
                        // gui.updateProjectFiles();
                        // CABLES.UI.fileSelect.load();
                        gui.showFileManager();
                
                    }
                    jobs.splice(i,1);
                    break;
                }
            }



            if(jobs.length===0)
            {
                $('.cables .logo').addClass('cablesLogo');
                $('.cables .logo').removeClass('fa fa-circle-o-notch fa-spin');
            }
            updateJobListing();

        },250);

    };
};
