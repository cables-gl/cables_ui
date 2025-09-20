import defaultOps from "../defaultops.js";
import { gui } from "../gui.js";
import namespaceutils from "../namespaceutils.js";
import { platform } from "../platform.js";
import { escapeHTML } from "../utils/helper.js";

/**
 * @typedef PatchStructureItem
 * @property {string} [title]
 * @property {string} [id]
 * @property {string|number} [order]
 * @property {array} [childs]
 * @property {string} [icon]
 * @property {string} [rowClass]
 * @property {string} [iconBgColor]
 * @property {string|number} [subPatchId]
 * @property {number} [subPatchVer]
 */

/**
 * @typedef PatchStructureQueryIncludeOptions
 * @property {boolean} [include.all]
 * @property {boolean} [include.areas]
 * @property {boolean} [include.comments]
 * @property {boolean} [include.customOps]
 * @property {boolean} [include.commented]
 * @property {boolean} [include.bookmarks]
 * @property {boolean} [include.animated]
 * @property {boolean} [include.selected]
 * @property {boolean} [include.colored]
 * @property {boolean} [include.subpatches]
 * @property {boolean} [include.portsAnimated]
 */

/**
 * @typedef PatchStructureQueryOnlyOptions
 * @property {boolean} [include.selected]
 */

/**
 * @typedef PatchStructureQueryOptions
 * @property {PatchStructureQueryIncludeOptions} [include]
 * @property {PatchStructureQueryOnlyOptions} [only]
 */
export class patchStructureQuery
{

    /** @type {PatchStructureQueryOptions} */
    options = {};

    /**
     * @param {PatchStructureQueryOptions} [options]
     */
    constructor(options)
    {
        this.setOptions(options);
    }

    /**
     * @param {PatchStructureQueryOptions} options
     */
    setOptions(options)
    {
        this.options = options || {};
        this.options.only = this.options.only || {};
        this.options.include = this.options.include || {};
    }

    /**
     * @param {string|number} patchId
     */
    _getUserImagesStringSubpatch(patchId)
    {
        let str = "";
        if (!gui.socket) return "";
        const userIds = gui.socket.state.getUserInSubpatch(patchId);

        for (let i = 0; i < userIds.length; i++)
        {
            str += "<img style='height:15px;border-radius:100%;margin-left:10px;' src=\"" + platform.getCablesUrl() + "/api/avatar/" + userIds[i] + "/mini\"/>";
        }

        return str;
    }

    /**
     * @param {string|number} patchId
     */
    getHierarchy(patchId = 0)
    {
        let mainTitle = "Patch ";
        if (!gui.savedState.isSavedSubPatch(0))mainTitle += " (*) ";

        mainTitle += this._getUserImagesStringSubpatch(0);

        /** @type {PatchStructureItem} */
        let sub =
        {
            "title": mainTitle,
            "id": "0",
            "order": 0,
            "subPatchId": "0",
            "childs": [],
            "icon": "folder"

        };

        if (gui.patchView.getCurrentSubPatch() == 0)sub.rowClass = "active";

        let subs = [sub];

        if (patchId && patchId != "0")
        {
            const subOp = gui.patchView.getSubPatchOuterOp(patchId);
            if (!subOp) return console.warn("no sub ob", patchId);

            sub.iconBgColor = subOp.uiAttribs.color,
            sub.title = subOp.getTitle();
            sub.id = subOp.id;
            if (!gui.savedState.isSavedSubPatch(patchId))sub.title += " (*) ";

            sub.title += this._getUserImagesStringSubpatch(patchId);

            // html += "!!";

            if (subOp.uiAttribs.comment)sub.title += " <span style=\"color: var(--color-special);\">// " + patchStructureQuery.sanitizeComment(subOp.uiAttribs.comment) + "</span>";

            sub.subPatchId = patchId;
            sub.id = subOp.id;
            if (subOp.uiAttribs && subOp.uiAttribs.translate) sub.order = subOp.getTitle() + (subOp.uiAttribs.translate.x * subOp.uiAttribs.translate.y);
            else sub.order = subOp.getTitle();

            sub.subPatchVer = subOp.storage.subPatchVer || 0;

            if (gui.patchView.getCurrentSubPatch() == sub.subPatchId) sub.rowClass = "active";
            else sub.rowClass = "";

            if (subOp.isSubPatchOp() || subOp.isInBlueprint2())
            {
                sub.blueprintVer = subOp.isSubPatchOp();
                sub.icon = "folder";
            }
        }

        const ops = gui.patchView.getAllSubPatchOps(patchId || 0);

        for (let i = 0; i < ops.length; i++)
        {
            let included = false;
            let includeReasons = [];

            if (this.options.include.subpatches && ops[i].patchId && ops[i].patchId.get() !== 0)
            {
                includeReasons.push("includeSubpatches");
                included = true;
            }
            if (this.options.include.colored && ops[i].uiAttribs.color)
            {
                includeReasons.push("includeColored");
                included = true;
            }
            if (this.options.include.areas && ops[i].objName.indexOf(defaultOps.defaultOpNames.uiArea) > -1)
            {
                includeReasons.push("includeAreas");
                included = true;
            }
            if (this.options.include.bookmarks && ops[i].uiAttribs.bookmarked)
            {
                includeReasons.push("includeBookmarks ");
                included = true;
            }
            if (this.options.include.comments && ops[i].uiAttribs.comment_title)
            {
                includeReasons.push("includeComments");
                included = true;
            }
            if (this.options.include.commented && ops[i].uiAttribs.comment)
            {
                includeReasons.push("includeCommented ");
                included = true;
            }
            if (this.options.include.customOps && namespaceutils.isPrivateOp(ops[i].objName))
            {
                includeReasons.push("includeCustomOps");
                included = true;
            }
            if (this.options.include.animated && ops[i].hasAnimPort)
            {
                includeReasons.push("includeAnim");
                included = true;
            }
            if (this.options.include.selected && ops[i].uiAttribs.selected)
            {
                includeReasons.push("includeSelected");
                included = true;
            }
            if (this.options.include.all)
            {
                includeReasons.push("all");
                included = true;
            }

            if (this.options.only.selected && !ops[i].uiAttribs.selected) included = false;

            if (included)
            {
                if (ops[i].patchId && ops[i].patchId.get() !== 0)
                {
                    sub.childs.push(this.getHierarchy(ops[i].patchId.get()));
                }
                else
                {
                    let icon = "bookmark";
                    if (this.options.include.commented && ops[i].uiAttribs.comment) icon = "message";
                    if (this.options.include.colored && ops[i].uiAttribs.color) icon = "op";
                    if (this.options.include.comments && ops[i].objName.indexOf("Ops.Ui.Comment") > -1 && ops[i].uiAttribs.comment_title) icon = "message-square-text";
                    if (this.options.include.areas && ops[i].objName.indexOf("Ops.Ui.Area") > -1) icon = "box-select";
                    if (this.options.include.animated && ops[i].hasAnimPort) icon = "clock";

                    let title = ops[i].uiAttribs.comment_title || ops[i].getTitle();
                    if (ops[i].uiAttribs.comment)title += " <span style=\"color: var(--color-special);\">// " + patchStructureQuery.sanitizeComment(ops[i].uiAttribs.comment) + "</span>";

                    const s = { "title": title, "icon": icon, "id": ops[i].id, "order": title + ops[i].id, "iconBgColor": ops[i].uiAttribs.color };

                    if (this.options.include.portsAnimated)
                    {
                        s.ports = [];
                        for (let jj = 0; jj < ops[i].portsIn.length; jj++)
                        {
                            if (ops[i].portsIn[jj].isAnimated())s.ports.push({ "name": ops[i].portsIn[jj].name });
                        }

                    }

                    sub.childs.push(s);
                }
            }
        }

        if (patchId == 0) return subs;
        else return sub;
    }

    /**
     * @param {string} _cmt
     */
    static sanitizeComment(_cmt)
    {
        let cmt = escapeHTML(_cmt);

        if (cmt.length > 30)cmt = cmt.substring(0, 30) + "...";

        return cmt;
    }
}
