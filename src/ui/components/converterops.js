import { Port } from "cables";
import defaultOps from "../defaultops.js";
import gluiconfig from "../glpatch/gluiconfig.js";
import { gui } from "../gui.js";

export function convertPorts(p1, p2, converter)
{
    console.log("convertports", p1, p2);
    let found = false;
    let pFrom = null;
    let pTo = null;

    if (p1.type == converter.typeFrom && p2.type == converter.typeTo && p1.direction == Port.DIR_OUT)
    {
        pFrom = p1;
        pTo = p2;
        found = true;
    }
    if (p2.type == converter.typeFrom && p1.type == converter.typeTo && p1.direction == Port.DIR_IN)
    {
        pFrom = p2;
        pTo = p1;
        found = true;
    }

    gui.patchView.addOp(converter.op,
        {
            "onOpAdd": (newOp) =>
            {
                gui.corePatch().link(pFrom.op, pFrom.getName(), newOp, converter.portIn);
                gui.corePatch().link(pTo.op, pTo.getName(), newOp, converter.portOut);

                newOp.setUiAttrib({ "translate": { "x": pTo.op.uiAttribs.translate.x, "y": pTo.op.uiAttribs.translate.y - gluiconfig.newOpDistanceY } });
            }
        });
}

/**
 * @param {Port} p1
 * @param {Port} p2
 */
export function getConverters(p1, p2)
{
    const converters = [];

    if (p1.direction == p2.direction) return converters;

    for (let i = 0; i < defaultOps.converterOps.length; i++)
    {
        let found = false;
        if (!p1) return converters;

        if (p1.type == defaultOps.converterOps[i].typeFrom && p2.type == defaultOps.converterOps[i].typeTo && p1.direction == Port.DIR_OUT)
            found = true;

        if (p2.type == defaultOps.converterOps[i].typeFrom && p1.type == defaultOps.converterOps[i].typeTo && p1.direction == Port.DIR_IN)
            found = true;

        if (found)
            converters.push(defaultOps.converterOps[i]);
    }
    return converters;
}
