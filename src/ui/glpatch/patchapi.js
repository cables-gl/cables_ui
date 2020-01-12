var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPatchAPI=class
{
    constructor(patch,glpatch)
    {
        this._patch=patch;
        this._glPatch=glpatch;
        this._glPatch.patchAPI=this;

        this._patch.addEventListener("onOpAdd",this._onAddOp.bind(this));
        this._patch.addEventListener("onOpDelete",this._onDeleteOp.bind(this));

        this._patch.addEventListener("onLink",this._onLink.bind(this));
        this._patch.addEventListener("onUnLink",this._onUnLink.bind(this));
    }

    _initPatch()
    {
        console.log("patch.ops.length",this._patch.ops.length);
        var i=0;
        for(i=0;i<this._patch.ops.length;i++)
        {
            const op=this._patch.ops[i];
            this._glPatch.addOp(op);
        }
        for(i=0;i<this._patch.ops.length;i++)
        {
            const op=this._patch.ops[i];

            for(var ip=0;ip<op.portsIn.length;ip++)
            {
                for(var il=0;il<op.portsIn[ip].links.length;il++)
                {
                    const link=op.portsIn[ip].links[il];
                    const l=new CABLES.GLGUI.GlLink(
                        this._glPatch,
                        link.id,
                        link.portIn.parent.id,
                        link.portOut.parent.id,
                        link.portIn.name,
                        link.portOut.name,

                        link.portIn.id,
                        link.portOut.id,
                        link.portIn.type);
                }
            }
        }
    }

    updateFlowModeActivity()
    {
        for(var i=0;i<this._patch.ops.length;i++)
        {
            const op=this._patch.ops[i];

            for(var ip=0;ip<op.portsIn.length;ip++)
            {
                for(var il=0;il<op.portsIn[ip].links.length;il++)
                {
                    const link=op.portsIn[ip].links[il];
                    this._glPatch.links[link.id].setFlowModeActivity(link.activityCounter);
                    link.activityCounter=0;
                }
            }
        }
    }

    reset()
    {
        this._initPatch();
    }

    _onLink(p1,p2,link)
    {
        if(p1.direction!=0)
        {
            var t=p2;
            p2=p1;
            p1=t;
        }
        const l=new CABLES.GLGUI.GlLink(this._glPatch,link.id,p1.parent.id,p2.parent.id,
            p1.name,p2.name,
            p1.id,p2.id,
            p1.type);
    }

    _onUnLink(a,b,link)
    {
        if(!link)return;
        this._glPatch.deleteLink(link.id);
    }

    _onAddOp(op)
    {
        this._glPatch.addOp(op);
    }

    _onDeleteOp(op)
    {
        this._glPatch.deleteOp(op.id);
    }

    showOpParams(opid)
    {
        const op=gui.scene().getOpById(opid);
        gui.patch().showOpParams(op);
    }

    unlinkPort(opid,portid)
    {
        const op=gui.scene().getOpById(opid);
        const p= op.getPortById(portid);
        p.removeLinks();
    }
    
    removeLink(opIdIn,opIdOut,portIdIn,portIdOut)
    {
        const opIn=gui.scene().getOpById(opIdIn);
        const pIn= opIn.getPortById(portIdIn);
        const opOut=gui.scene().getOpById(opIdOut);
        const pOut= opOut.getPortById(portIdOut);
        const l=pOut.getLinkTo(pIn);

        l.remove();
    }

    addOpIntoLink(opIdIn,opIdOut,portIdIn,portIdOut)
    {
        const opIn=gui.scene().getOpById(opIdIn);
        const pIn= opIn.getPortById(portIdIn);
        const opOut=gui.scene().getOpById(opIdOut);
        const pOut= opOut.getPortById(portIdOut);
        const link=pOut.getLinkTo(pIn);

        gui.opSelect().show({x:0,y:0},null,null,link);
    }

    deleteOp(id)
    {
        gui.scene().deleteOp(id,true);
    }

    setOpUiAttribs(opid,attrName,val)
    {
        const op=gui.scene().getOpById(opid);
        var attr={};
        attr[attrName]=val;
        op.setUiAttrib(attr);
    }

    _watchOp(op)
    {
    }

    alignSelectedOps(opids)
    {
        const ops=gui.scene().getOpsById(opids);
        console.log("align ops!",ops.length);
        CABLES.UI.TOOLS.alignOps(ops);
        

    }

    linkPortToOp(e,opid,pid,op2id)
    {
        const op1=this._patch.getOpById(opid);
        const op2=this._patch.getOpById(op2id);
        const p=op1.getPort(pid);

        new CABLES.UI.SuggestPortDialog(op2,p,e,(p2n)=>
        {
            this._patch.link(op1,pid,op2,p2n);

        });

        // this._patch.link(op1,pid,op2,p2id);
    }

    linkPortsToOp(e,opid,opids,portnames)
    {
        const op1=this._patch.getOpById(opid);
        var op2=this._patch.getOpById(opids[0]);
        var p=op2.getPort(portnames[0]);

        new CABLES.UI.SuggestPortDialog(op1,p,e,(suggport)=>
        {
            for(let i=0;i<portnames.length;i++)
            {
                op2=this._patch.getOpById(opids[i]);
                const pname=portnames[i];

                // console.log(op2.title,pname,ports);
        
                this._patch.link(op2,pname,op1,suggport);
            }


        });

        // this._patch.link(op1,pid,op2,p2id);
    }

    linkPorts(opid,pid,op2id,p2id)
    {
        const op1=this._patch.getOpById(opid);
        const op2=this._patch.getOpById(op2id);


        this._patch.link(op1,pid,op2,p2id);
    }


    
}