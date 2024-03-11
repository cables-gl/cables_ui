import gluiconfig from "../glpatch/gluiconfig";
import WatchPortVisualizer from "./opparampanel/watchportvisualizer";

export default class opCleaner
{
    constructor(ops, glpatch)
    {
        if (ops.length == 0) return;

        this._glpatch = glpatch;
        this.ops = ops;
        const entranceOps = [];
        const unconnectedOps = [];
        const otherOps = [];
        let startPosX = ops[0].uiAttribs.translate.x;
        let startPosY = ops[0].uiAttribs.translate.y;

        let longestOpPorts = 0;


        for (let i = 0; i < ops.length; i++)
        {
            startPosX = Math.min(startPosX, ops[i].uiAttribs.translate.x);
            startPosY = Math.min(startPosY, ops[i].uiAttribs.translate.y);

            longestOpPorts = Math.max(longestOpPorts, ops[i].portsIn.length);
            longestOpPorts = Math.max(longestOpPorts, ops[i].portsOut.length);

            ops[i].setTempOpPos(
                ops[i].uiAttribs.translate.x,
                ops[i].uiAttribs.translate.y,
                glpatch.getGlOp(ops[i]).w,
                glpatch.getGlOp(ops[i]).h
            );

            if (!ops[i].hasAnyInLinked() && ops[i].hasAnyOutLinked())
            {
                entranceOps.push(ops[i]);
                continue;
            }

            if (ops[i].isInLinkedToOpOutside(ops))
            {
                entranceOps.push(ops[i]);
                continue;
            }

            if (!ops[i].hasLinks())
            {
                unconnectedOps.push(ops[i]);
                continue;
            }
            otherOps.push(ops[i]);
        }

        let theOpWidth = gui.patchView.snapOpPosX((longestOpPorts + 1) * (gluiconfig.portWidth + gluiconfig.portPadding));

        for (let i = 0; i < ops.length; i++)
            ops[i].setTempOpPos(startPosX, startPosY);

        // //////


        ops.sort((a, b) => { return a.getTempPosY() - b.getTempPosY(); });


        // /apply rules...


        let cont = false;


        // order by parent y position

        do
        {
            cont = false;
            for (let i = 0; i < ops.length; i++) cont = cont || this.checkCollisionXTopOps(ops[i]);
        } while (cont);


        do
        {
            cont = false;
            for (let i = 0; i < ops.length; i++) cont = cont || this.checkVerticalOrder(ops[i]);
        } while (cont);

        // move op on x axis


        do
        {
            cont = false;
            for (let i = 0; i < ops.length; i++)
                cont = cont || this.checkCollisionY(ops[i]);
        } while (cont);

        for (let j = 0; j < 100; j++)
            for (let i = 0; i < ops.length; i++)
                this.checkHorizontalPos(ops[i]);

        // check collisions and move op fown if collidibng

        do
        {
            cont = false;
            for (let i = 0; i < ops.length; i++)
                cont = cont || this.checkCollisionY(ops[i]);
        } while (cont);


        // //////////////////////


        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            if (op.uiAttribs.translateTemp)
            {
                gui.patchView.setOpPos(op, op.getTempPosX(), op.getTempPosY());
                delete op.uiAttribs.translateTemp;
            }
        }
    }


    // only test collision on ops that have no inputs, but output links
    checkCollisionXTopOps(op)
    {
        const other = op.testTempCollision(gui.corePatch().getSubPatchOps(gui.patchView.getCurrentSubPatch()), this._glpatch);
        if (other)
        {
            console.log("yes colliding...", gluiconfig.newOpDistanceY);

            if (op.hasAnyOutLinked() && !op.hasAnyInLinked()) // eg mainloop
            {
                if (other.hasAnyOutLinked() && !other.hasAnyInLinked()) // eg mainloop
                {
                    op.setTempOpPosX(op.getTempPosX() + 3 * (gluiconfig.portWidth + gluiconfig.portPadding));
                    return true;
                }
            }
        }
    }


    checkCollisionY(op)
    {
        const other = op.testTempCollision(gui.corePatch().ops, this._glpatch);
        if (other)
        {
            console.log("yes colliding...", gluiconfig.newOpDistanceY);

            if (op.hasAnyOutLinked() && !op.hasAnyInLinked()) // eg mainloop
            {
                // if (other.hasAnyOutLinked() && !other.hasAnyInLinked()) // eg mainloop
                // {
                //     op.setTempOpPosX(op.getTempPosX() + 3 * (gluiconfig.portWidth + gluiconfig.portPadding));
                //     return true;
                // }
            }
            else
            if (!op.hasAnyOutLinked() && !op.hasAnyInLinked())
            {
                op.setTempOpPosY(op.getTempPosY() - gluiconfig.newOpDistanceY);
                return true;
            }
            else
            {
                op.setTempOpPosY(op.getTempPosY() + gluiconfig.newOpDistanceY);
                return true;
            }
        }
    }

    checkVerticalOrder(op)
    {
        // should be lower than the first input link parent op
        if (op.hasAnyInLinked())
        {
            const parentOp = op.getLowestLinkedInOp();
            if (parentOp)
            {
                let mul = 1;
                let offsetY = 0;
                if (parentOp.hasMultipleOutLinked())
                {
                    mul = 2;
                }
                offsetY = mul * gluiconfig.newOpDistanceY;

                // move one line below parent...
                // if (parentOp.getTempPosY() >= op.getTempPosY())

                let newpos = parentOp.getTempPosY() + offsetY;
                if (op.getTempPosY() != newpos)
                {
                    op.setTempOpPosY(newpos);
                    return true;
                }
            }
        }
    }

    getOutLinkPortIndex(parent, op)
    {
        for (let i = 0; i < parent.portsOut.length; i++)
        {
            if (parent.portsOut[i].isLinked())
            {
                for (let j = 0; j < parent.portsOut[i].links.length; j++)
                {
                    if (parent.portsOut[i].links[j].getOtherPort(parent.portsOut[i]).op == op)
                    {
                        return j;
                    }
                }
            }
        }
        return 0;
    }

    checkHorizontalPos(op)
    {
        // position on x axis depending on parent op position and port index...

        const parent = op.getFirstLinkedInOp();

        if (parent && op.hasAnyInLinked())
        {
            if (!parent.hasMultipleOutLinked())
            {
                // parent has one child...
                op.setTempOpPosX(parent.getTempPosX() + this.getOutLinkPortIndex(parent, op) * (gluiconfig.portWidth + gluiconfig.portPadding));
            }
            else
            {
                // parent has multiple childs!

                let count = 0;
                let found = false;
                for (let i = 0; i < parent.portsOut.length; i++)
                {
                    if (parent.portsOut[i].isLinked())
                    {
                        for (let j = 0; j < parent.portsOut[i].links.length; j++)
                        {
                            if (parent.portsOut[i].links[j].getOtherPort(parent.portsOut[i]) == op.getFirstLinkedInPort())
                            {
                                found = true;
                                break;
                            }

                            count++;
                        }
                    }
                    if (found) break;
                }

                count *= (gluiconfig.portWidth + gluiconfig.portPadding);


                // const s = op.getChildsBoundings(this._glpatch, null, op);
                // console.log(s);

                // if (s.maxx != null)
                // {
                //     if (op.getTempPosX() != s.maxx)
                //     {
                //         op.setTempOpPosX(s.maxx);
                //         return true;
                //     }
                // }

                do
                {
                    op.setTempOpPosX(parent.getTempPosX() + count);
                    count += 4 * (gluiconfig.portWidth + gluiconfig.portPadding);
                    // if (count > 1000)
                    // {
                    // break;
                }
                while (op.testTempCollision(this.ops, this._glpatch));
            }
        }
    }
}
