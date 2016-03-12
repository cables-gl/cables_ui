CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};
CABLES.UI.Jobs=CABLES.UI.Jobs ||

function()
{
    var jobs=[];

    function updateJobListing()
    {
        var str='';

        for(var i in jobs)
        {
            str+='<li><i class="fa fa-circle-o-notch fa-spin"></i>&nbsp;&nbsp;'+jobs[i].title+'</li>';
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

        $('.cables .logo').removeClass('cablesLogo');
        $('.cables .logo').addClass('fa fa-circle-o-notch fa-spin');

        jobs.push(job);
        updateJobListing();

        if(func)
        {
            setTimeout(func,30);
        }
    };

    this.finish=function(jobId)
    {
        for(var i in jobs)
        {
            if(jobs[i].id==jobId)
            {
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

    };
};
