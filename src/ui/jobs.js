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

        for(var i in jobs)
        {
            if(jobs[i].indicator)indicator=jobs[i].indicator;
            str+='<li><i class="fa fa-circle-o-notch fa-spin"></i>&nbsp;&nbsp;'+jobs[i].title+'</li>';
        }
            

        if(jobs.length==0)
        {
            str+='<li>no background jobs...</li>';
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

        // $('.cables .logo').addClass('fa fa-circle-o-notch fa-spin');

        jobs.push(job);
        updateJobListing();

        if(func)
        {
            setTimeout(func,30);
        }
    };

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
