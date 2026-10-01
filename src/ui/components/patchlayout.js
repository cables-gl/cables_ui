import uiconfig from "../uiconfig.js";
import gluiconfig from "../glpatch/gluiconfig.js";
import { UiOp } from "../core_extend_op.js";

const GRID_X = uiconfig.snapX;
const GRID_Y = uiconfig.snapY;
const GAP_X = 2 * GRID_X;
const GAP_Y = GRID_Y;
const FANOUT_GAP_X = 4 * GRID_X;
const FANOUT_MIN_CHILDREN = 3;
const SMALL_BRANCH_FACTOR = 2;
const MAX_SEARCH_STEPS = 400;
const LINK_GAP_MIN_LINKS = 2;
const LINK_GAP_MAX_LINKS = 10;
const LINK_GAP_MIN_OPS = 2;
const LINK_GAP_MAX_OPS = 5;

/**
 * @typedef {{x:number,y:number,w:number,h:number}} LayoutRect
 * @typedef {{chain:UiOp[],anchor:UiOp,link:{parent:UiOp,portOut:any,portIn:any},above:UiOp}} SideChain
 * @typedef {{portOut:any,children:UiOp[]}} PortChildren
 */

/**
 * @param {number} v
 * @param {number} grid
 */
function snapUp(v, grid)
{
    return Math.ceil(v / grid) * grid;
}

/**
 * @param {number} v
 * @param {number} grid
 */
function snapDown(v, grid)
{
    return Math.floor(v / grid) * grid;
}

/**
 * @param {number} v
 * @param {number} grid
 */
function snapNearest(v, grid)
{
    return Math.round(v / grid) * grid;
}

/**
 * @param {LayoutRect} a
 * @param {LayoutRect} b
 */
function rectsTooClose(a, b)
{
    return a.x < b.x + b.w + GAP_X && b.x < a.x + a.w + GAP_X && a.y < b.y + b.h + GAP_Y && b.y < a.y + a.h + GAP_Y;
}

/**
 * @param {{left:number,right:number}} ext
 */
function extentWidth(ext)
{
    return ext.right - ext.left;
}

export default class PatchLayout
{
    #glPatch = null;

    /** @type {Set<UiOp>} */
    #set = new Set();

    /** @type {Map<UiOp,SideChain>} */
    #sideChains = new Map();

    #extents = new Map();

    /** @type {Map<UiOp,{x:number,index:number,parent:UiOp}>} */
    #fanSlots = new Map();

    /** @type {LayoutRect[]} */
    #fixed = [];

    /** @type {Set<UiOp>} */
    #selected = new Set();

    /**
     * @param {import("../glpatch/glpatch.js").default} glPatch
     */
    constructor(glPatch)
    {
        this.#glPatch = glPatch;
    }

    /**
     * @param {UiOp[]} ops
     * @param {UiOp[]} allOps
     * @returns {Map<UiOp,LayoutRect>|string}
     */
    layout(ops, allOps = [])
    {
        this.#selected = new Set(ops);

        const all = [];
        for (const o of ops) all.push(o);
        for (const o of allOps)
            if (!this.#selected.has(o) && o.uiAttribs.translate && !o.uiAttribs.hidden && this.#glPatch.getGlOp(o)) all.push(o);

        this.#fixed = [];
        for (const o of all)
            if (!this.#selected.has(o)) this.#fixed.push(this.#opRect(o));

        const result = new Map();
        for (const group of this.#connectedGroups(all))
        {
            let hasSelected = false;
            for (const o of group) if (this.#selected.has(o)) hasSelected = true;
            if (!hasSelected) continue;

            const pos = this.#layoutGroup(group);
            if (typeof pos == "string") return pos;

            for (const o of pos.keys())
            {
                if (!this.#selected.has(o)) continue;
                result.set(o, pos.get(o));
                this.#fixed.push(pos.get(o));
            }
        }
        return result;
    }

    /**
     * @param {UiOp[]} ops
     * @returns {UiOp[][]}
     */
    #connectedGroups(ops)
    {
        this.#set = new Set(ops);
        const groupOf = new Map();
        const groups = [];
        for (const start of ops)
        {
            if (groupOf.has(start)) continue;
            const group = [];
            const todo = [start];
            groupOf.set(start, group);
            while (todo.length)
            {
                const o = todo.pop();
                group.push(o);

                const linked = [];
                for (const link of this.#linksFromSet(o)) linked.push(link.parent);
                for (const child of this.#childOpsInSet(o)) linked.push(child);

                for (const other of linked)
                    if (!groupOf.has(other))
                    {
                        groupOf.set(other, group);
                        todo.push(other);
                    }
            }
            groups.push(group);
        }
        return groups.sort((a, b) => b.length - a.length);
    }

    /**
     * @param {UiOp[]} ops
     * @returns {Map<UiOp,LayoutRect>|string}
     */
    #layoutGroup(ops)
    {
        this.#set = new Set(ops);
        this.#extents = new Map();
        this.#sideChains = this.#findSideChains(ops);
        let layers = this.#layerOps(ops);
        if (!layers)
        {
            this.#sideChains = new Map();
            layers = this.#layerOps(ops);
        }
        if (!layers) return "the links between the ops form a cycle";

        let top = Infinity;
        for (const o of ops) top = Math.min(top, o.uiAttribs.translate.y);
        const startY = snapNearest(top, GRID_Y);

        const firstPos = this.#placeOps(layers, startY, new Map(), new Map());
        if (typeof firstPos == "string") return firstPos;

        return this.#placeOps(layers, startY, this.#sourceHints(ops, firstPos), this.#fanRows(firstPos));
    }

    /**
     * @param {UiOp} op
     */
    #linksFromSet(op)
    {
        const result = [];
        for (const portIn of op.portsIn)
            for (const link of portIn.links)
            {
                const parent = /** @type {UiOp} */ (link.portOut.op);
                if (this.#set.has(parent)) result.push({ "parent": parent, "portOut": link.portOut, "portIn": portIn });
            }
        return result;
    }

    /**
     * @param {UiOp} op
     * @returns {UiOp}
     */
    #primaryParent(op)
    {
        const links = this.#linksFromSet(op);
        return links.length ? links[0].parent : null;
    }

    /**
     * @param {UiOp} op
     * @returns {UiOp[]}
     */
    #childOpsInSet(op)
    {
        const children = [];
        for (const portOut of op.portsOut)
            for (const link of portOut.links)
            {
                const child = /** @type {UiOp} */ (link.portIn.op);
                if (this.#set.has(child) && !children.includes(child)) children.push(child);
            }
        return children;
    }

    /**
     * @param {UiOp} o
     */
    #isUnconnected(o)
    {
        return !this.#linksFromSet(o).length && !this.#childOpsInSet(o).length;
    }

    /**
     * @param {UiOp} o
     * @param {number} [x]
     * @param {number} [y]
     * @returns {LayoutRect}
     */
    #opRect(o, x = o.uiAttribs.translate.x, y = o.uiAttribs.translate.y)
    {
        const glOp = this.#glPatch.getGlOp(o);
        return { "x": x, "y": y, "w": glOp.w, "h": glOp.h };
    }

    /**
     * @param {UiOp} op
     * @param {any} port
     */
    #portCenterX(op, port)
    {
        return op.getPortPosX(port.name, null, true) || 0;
    }

    /**
     * @param {UiOp} parent
     * @param {UiOp} child
     */
    #outLinkIndex(parent, child)
    {
        let index = 0;
        for (const portOut of parent.portsOut)
            for (const link of portOut.links)
            {
                if (link.portIn.op == child) return index;
                index++;
            }
        return index;
    }

    /**
     * @param {UiOp} o
     * @returns {UiOp[]}
     */
    #parentsForLayers(o)
    {
        const parents = [];
        for (const link of this.#linksFromSet(o)) parents.push(link.parent);
        if (this.#sideChains.has(o)) parents.push(this.#sideChains.get(o).above);
        return parents;
    }

    /**
     * @param {UiOp[]} ops
     * @returns {UiOp[][]}
     */
    #layerOps(ops)
    {
        const layer = new Map();
        for (const o of ops) layer.set(o, 0);

        for (let pass = 0; pass <= ops.length; pass++)
        {
            let changed = false;
            for (const o of ops)
                for (const parent of this.#parentsForLayers(o))
                    if (layer.get(o) < layer.get(parent) + 1)
                    {
                        layer.set(o, layer.get(parent) + 1);
                        changed = true;
                    }

            if (!changed)
            {
                this.#pullDownToChildren(ops, layer);

                const layers = [];
                for (const o of ops)
                {
                    const l = layer.get(o);
                    if (!layers[l]) layers[l] = [];
                    layers[l].push(o);
                }

                const result = [];
                for (const row of layers) if (row) result.push(row);
                return result;
            }
        }
        return null;
    }

    /**
     * @param {UiOp[]} ops
     * @param {Map<UiOp,number>} layer
     */
    #pullDownToChildren(ops, layer)
    {
        const children = new Map();
        for (const o of ops) children.set(o, this.#childOpsInSet(o));
        for (const source of this.#sideChains.keys()) children.get(this.#sideChains.get(source).above).push(source);

        for (let pass = 0; pass <= ops.length; pass++)
        {
            let changed = false;
            for (const o of ops)
            {
                if (!children.get(o).length) continue;

                let above = Infinity;
                for (const c of children.get(o)) above = Math.min(above, layer.get(c) - 1);
                if (layer.get(o) < above)
                {
                    layer.set(o, above);
                    changed = true;
                }
            }
            if (!changed) return;
        }
    }

    /**
     * @param {LayoutRect} rect
     * @param {LayoutRect[]} placed
     */
    #isFree(rect, placed)
    {
        for (const p of placed) if (rectsTooClose(rect, p)) return false;
        return true;
    }

    /**
     * @param {LayoutRect} rect
     * @param {LayoutRect[]} placed
     * @param {boolean} allowLeft
     * @param {boolean} allowUp
     */
    #moveToNearestFreeSpot(rect, placed, allowLeft, allowUp)
    {
        const startX = rect.x;
        const startY = rect.y;
        for (let distance = 0; distance <= MAX_SEARCH_STEPS; distance++)
            for (let stepsY = 0; stepsY <= distance; stepsY++)
            {
                const stepsX = distance - stepsY;
                for (const dirX of stepsX ? [1, -1] : [1])
                    for (const dirY of stepsY ? [1, -1] : [1])
                    {
                        if ((dirX < 0 && !allowLeft) || (dirY < 0 && !allowUp)) continue;
                        rect.x = startX + dirX * stepsX * GRID_X;
                        rect.y = startY + dirY * stepsY * GRID_Y;
                        if (this.#isFree(rect, placed)) return true;
                    }
            }
        return false;
    }

    /**
     * @param {UiOp[]} ops
     * @returns {Map<UiOp,SideChain>}
     */
    #findSideChains(ops)
    {
        const sideChains = new Map();
        const inChain = new Set();
        for (const anchor of ops)
        {
            const above = this.#primaryParent(anchor);
            if (!above) continue;

            for (const link of this.#linksFromSet(anchor))
            {
                const last = link.parent;
                if (last == above || inChain.has(last)) continue;
                if (this.#childOpsInSet(last).length != 1 && this.#linksFromSet(last).length) continue;

                const chain = [last];
                for (;;)
                {
                    const parents = [];
                    for (const l of this.#linksFromSet(chain[0])) if (!parents.includes(l.parent)) parents.push(l.parent);
                    if (parents.length != 1 || parents[0] == above || chain.includes(parents[0]) || this.#childOpsInSet(parents[0]).length != 1) break;
                    chain.unshift(parents[0]);
                }
                for (const o of chain) inChain.add(o);
                sideChains.set(chain[0], { "chain": chain, "anchor": anchor, "link": link, "above": above });
            }
        }
        return sideChains;
    }

    /**
     * @param {UiOp} source
     * @param {SideChain} sideChain
     * @param {Map<UiOp,LayoutRect>} pos
     * @param {Map} fanSlots
     * @returns {LayoutRect}
     */
    #sideChainRect(source, sideChain, pos, fanSlots)
    {
        const above = pos.get(sideChain.above);
        const last = sideChain.chain[sideChain.chain.length - 1];

        let chainOffset = 0;
        for (let i = 1; i < sideChain.chain.length; i++) chainOffset += this.#childOffsetX(sideChain.chain[i]);

        const x = this.#childX(sideChain.anchor, pos, fanSlots) + this.#portCenterX(sideChain.anchor, sideChain.link.portIn) - this.#portCenterX(last, sideChain.link.portOut) - chainOffset;

        let y = above.y + above.h + GAP_Y;
        for (const link of this.#linksFromSet(source))
        {
            const p = pos.get(link.parent);
            y = Math.max(y, p.y + p.h + this.#childGap(link.parent));
        }
        return this.#opRect(source, snapNearest(x, GRID_X), snapUp(y, GRID_Y));
    }

    /**
     * @param {Map<UiOp,LayoutRect>} firstPos
     * @returns {Map<UiOp,number>}
     */
    #fanRows(firstPos)
    {
        const rows = new Map();
        for (const child of this.#fanSlots.keys())
        {
            const parent = this.#fanSlots.get(child).parent;
            const dy = firstPos.get(child).y - firstPos.get(parent).y;
            if (!rows.has(parent) || rows.get(parent) < dy) rows.set(parent, dy);
        }
        return rows;
    }

    /**
     * @param {UiOp[]} ops
     * @param {Map<UiOp,LayoutRect>} firstPos
     */
    #sourceHints(ops, firstPos)
    {
        const hints = new Map();
        for (const source of ops)
        {
            if (!this.#selected.has(source) || this.#primaryParent(source) || this.#sideChains.has(source)) continue;
            const sourceChildren = this.#childOpsInSet(source);
            if (!sourceChildren.length) continue;

            let highestChild = Infinity;
            for (const c of sourceChildren) highestChild = Math.min(highestChild, firstPos.get(c).y);

            const first = firstPos.get(source);
            hints.set(source, { "x": first.x, "y": snapDown(highestChild - first.h - this.#childGap(source), GRID_Y) });
        }
        return hints;
    }

    /**
     * @param {UiOp} parent
     * @returns {number}
     */
    #childGap(parent)
    {
        let links = 0;
        for (const portOut of parent.portsOut)
            for (const link of portOut.links)
                if (this.#set.has(/** @type {UiOp} */ (link.portIn.op))) links++;
        if (links < LINK_GAP_MIN_LINKS) return GAP_Y;

        const t = (Math.min(links, LINK_GAP_MAX_LINKS) - LINK_GAP_MIN_LINKS) / (LINK_GAP_MAX_LINKS - LINK_GAP_MIN_LINKS);
        return (LINK_GAP_MIN_OPS + t * (LINK_GAP_MAX_OPS - LINK_GAP_MIN_OPS)) * gluiconfig.opHeight;
    }

    /**
     * @param {UiOp} o
     * @param {Map<UiOp,LayoutRect>} pos
     * @param {number} startY
     * @param {Map} hints
     */
    #opY(o, pos, startY, hints)
    {
        const links = this.#linksFromSet(o);
        if (links.length)
        {
            let y = -Infinity;
            for (const link of links)
            {
                const p = pos.get(link.parent);
                y = Math.max(y, p.y + p.h + this.#childGap(link.parent));
            }
            return snapUp(y, GRID_Y);
        }
        if (hints.has(o)) return hints.get(o).y;
        if (!this.#childOpsInSet(o).length) return snapNearest(o.uiAttribs.translate.y, GRID_Y);
        return startY;
    }

    /**
     * @param {UiOp[][]} layers
     * @param {number} startY
     * @param {Map} hints
     * @param {Map<UiOp,number>} fanRows
     * @returns {Map<UiOp,LayoutRect>|string}
     */
    #placeOps(layers, startY, hints, fanRows)
    {
        const placed = [];
        for (const rect of this.#fixed) placed.push(rect);
        const pos = new Map();
        const fanSlots = new Map();
        this.#fanSlots = fanSlots;

        for (const row of layers)
        {
            const desired = new Map();
            const order = new Map();
            for (const o of row)
            {
                const parent = this.#primaryParent(o);
                if (!this.#selected.has(o)) desired.set(o, o.uiAttribs.translate.x);
                else if (this.#sideChains.has(o)) desired.set(o, this.#sideChainRect(o, this.#sideChains.get(o), pos, fanSlots).x);
                else if (parent) desired.set(o, this.#childX(o, pos, fanSlots));
                else desired.set(o, hints.has(o) ? hints.get(o).x : snapNearest(o.uiAttribs.translate.x, GRID_X));
                order.set(o, parent ? this.#outLinkIndex(parent, o) : 0);
            }
            row.sort((a, b) => (desired.get(a) - desired.get(b)) || (order.get(a) - order.get(b)) || (a.uiAttribs.translate.x - b.uiAttribs.translate.x));

            const lastChild = new Map();
            for (const o of row)
            {
                if (this.#isUnconnected(o)) continue;
                if (!this.#selected.has(o))
                {
                    pos.set(o, this.#opRect(o));
                    this.#addFanSlots(o, pos.get(o), fanSlots);
                    continue;
                }
                const parent = this.#primaryParent(o);
                const fanSlot = fanSlots.get(o);
                const sideChain = this.#sideChains.get(o);
                const sibling = parent && !fanSlot && !sideChain ? lastChild.get(parent) : null;
                const rect = sideChain ? this.#sideChainRect(o, sideChain, pos, fanSlots) : this.#opRect(o, desired.get(o), this.#opY(o, pos, startY, hints));
                if (sibling) rect.x = Math.max(rect.x, snapUp(this.#siblingMinX(sibling, o), GRID_X));
                if (fanSlot && fanRows.has(fanSlot.parent)) rect.y = Math.max(rect.y, snapUp(pos.get(fanSlot.parent).y + fanRows.get(fanSlot.parent), GRID_Y));

                const allowLeft = !sibling && !(fanSlot && fanSlot.index > 0);
                if (!this.#moveToNearestFreeSpot(rect, placed, allowLeft, !parent && !sideChain)) return "no free place found for op " + o.getTitle();
                placed.push(rect);
                pos.set(o, rect);
                if (parent && !fanSlot && !sideChain) lastChild.set(parent, { "x": rect.x, "op": o });
                this.#addFanSlots(o, rect, fanSlots);
            }
        }

        for (const row of layers)
            for (const o of row)
            {
                if (!this.#isUnconnected(o)) continue;
                if (!this.#selected.has(o))
                {
                    pos.set(o, this.#opRect(o));
                    continue;
                }
                const rect = this.#opRect(o, snapNearest(o.uiAttribs.translate.x, GRID_X), snapNearest(o.uiAttribs.translate.y, GRID_Y));
                if (!this.#moveToNearestFreeSpot(rect, placed, true, true)) return "no free place found for op " + o.getTitle();
                placed.push(rect);
                pos.set(o, rect);
            }
        return pos;
    }

    /**
     * @param {UiOp} o
     * @param {Map<UiOp,LayoutRect>} pos
     * @param {Map} fanSlots
     */
    #childX(o, pos, fanSlots)
    {
        if (fanSlots.has(o)) return fanSlots.get(o).x;
        return snapNearest(pos.get(this.#primaryParent(o)).x + this.#childOffsetX(o), GRID_X);
    }

    /**
     * @param {UiOp} op
     * @returns {PortChildren[]}
     */
    #childrenByPort(op)
    {
        const seen = new Set();
        const result = [];
        for (const portOut of op.portsOut)
        {
            const children = [];
            for (const link of portOut.links)
            {
                const c = /** @type {UiOp} */ (link.portIn.op);
                if (seen.has(c) || !this.#set.has(c) || this.#primaryParent(c) != op || this.#sideChains.has(c)) continue;
                seen.add(c);
                children.push(c);
            }
            result.push({ "portOut": portOut, "children": children });
        }
        return result;
    }

    /**
     * @param {UiOp} child
     */
    #childOffsetX(child)
    {
        const link = this.#linksFromSet(child)[0];
        return this.#portCenterX(link.parent, link.portOut) - this.#portCenterX(child, link.portIn);
    }

    /**
     * @param {UiOp[]} children
     */
    #fanWidth(children)
    {
        let total = (children.length - 1) * FANOUT_GAP_X;
        for (const c of children) total += extentWidth(this.#subtreeExtent(c));
        return total;
    }

    /**
     * @param {UiOp} o
     * @returns {{left:number,right:number}}
     */
    #subtreeExtent(o)
    {
        if (this.#extents.has(o)) return this.#extents.get(o);
        const ext = { "left": 0, "right": this.#opRect(o).w };
        this.#extents.set(o, ext);

        for (const sideChain of this.#sideChains.values())
        {
            if (sideChain.anchor != o) continue;
            const last = sideChain.chain[sideChain.chain.length - 1];
            const x = this.#portCenterX(o, sideChain.link.portIn) - this.#portCenterX(last, sideChain.link.portOut);

            let chainWidth = 0;
            for (const c of sideChain.chain) chainWidth = Math.max(chainWidth, this.#opRect(c).w);

            ext.left = Math.min(ext.left, x);
            ext.right = Math.max(ext.right, x + chainWidth);
        }

        let prev = null;
        for (const byPort of this.#childrenByPort(o))
        {
            if (byPort.children.length >= FANOUT_MIN_CHILDREN)
            {
                const total = this.#fanWidth(byPort.children);
                const start = this.#portCenterX(o, byPort.portOut) - total / 2;
                ext.left = Math.min(ext.left, start);
                ext.right = Math.max(ext.right, start + total);
                continue;
            }

            for (const child of byPort.children)
            {
                const childExt = this.#subtreeExtent(child);
                let x = this.#childOffsetX(child);
                if (prev) x = Math.max(x, this.#siblingMinX(prev, child));
                ext.left = Math.min(ext.left, x + childExt.left);
                ext.right = Math.max(ext.right, x + childExt.right);
                prev = { "x": x, "op": child };
            }
        }
        return ext;
    }

    /**
     * @param {UiOp} o
     * @returns {number}
     */
    #subtreeSize(o)
    {
        let size = 1;
        for (const sideChain of this.#sideChains.values()) if (sideChain.anchor == o) size += sideChain.chain.length;
        for (const byPort of this.#childrenByPort(o))
            for (const c of byPort.children) size += this.#subtreeSize(c);
        return size;
    }

    /**
     * @param {{x:number,op:UiOp}} prev
     * @param {UiOp} o
     */
    #siblingMinX(prev, o)
    {
        const small = this.#subtreeSize(o) * SMALL_BRANCH_FACTOR <= this.#subtreeSize(prev.op);
        const prevRight = small ? prev.x + this.#opRect(prev.op).w : prev.x + this.#subtreeExtent(prev.op).right;
        return prevRight + GAP_X - this.#subtreeExtent(o).left;
    }

    /**
     * @param {UiOp} op
     * @param {LayoutRect} rect
     * @param {Map} fanSlots
     */
    #addFanSlots(op, rect, fanSlots)
    {
        for (const byPort of this.#childrenByPort(op))
        {
            if (byPort.children.length < FANOUT_MIN_CHILDREN) continue;

            let x = rect.x + this.#portCenterX(op, byPort.portOut) - this.#fanWidth(byPort.children) / 2;
            for (let i = 0; i < byPort.children.length; i++)
            {
                const ext = this.#subtreeExtent(byPort.children[i]);
                fanSlots.set(byPort.children[i], { "x": snapNearest(x - ext.left, GRID_X), "index": i, "parent": op });
                x += extentWidth(ext) + FANOUT_GAP_X;
            }
        }
    }
}
