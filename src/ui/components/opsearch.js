import { Events } from "cables-shared-client";
import defaultOps from "../defaultops.js";

/**
 * search through opdocs, e.g. for opselect
 *
 * @export
 * @class OpSearch
 * @extends {Events}
 */
export default class OpSearch extends Events
{
    constructor()
    {
        super();
        this._list = null;
        this._wordsDb = null;
    }

    get list()
    {
        return this._list;
    }

    resetList()
    {
        this._list = null;
    }

    _buildList()
    {
        const perf = CABLES.UI.uiProfiler.start("opsearch.getlist");

        const codeOpNames = this._getOpsNamesFromCode([], "Ops", Ops, "");
        let items = this._createListItemsByNames(codeOpNames);

        const docOpName = gui.opDocs.getOpDocs().map((ext) => { return ext.name; });
        items = items.concat(this._createListItemsByNames(docOpName, items));

        const extensionNames = gui.opDocs.getExtensions().map((ext) => { return ext.name; });
        items = items.concat(this._createListItemsByNames(extensionNames, items));

        const teamNamespaces = gui.opDocs.getTeamNamespaces().map((ext) => { return ext.name; });
        items = items.concat(this._createListItemsByNames(teamNamespaces, items));

        const namespace = defaultOps.getPatchOpsNamespace();
        const patchOpNames = gui.opDocs.getNamespaceDocs(namespace).map((ext) => { return ext.name; });
        items = items.concat(this._createListItemsByNames(patchOpNames, items));

        const newList = {};
        items.forEach((item) =>
        {
            if (!newList.hasOwnProperty(item.opId))
            {
                newList[item.opId] = item;
            }
        });

        this._list = Object.values(newList);
        this._list.sort((a, b) => { return b.pop - a.pop; });
        perf.finish();

        /// --------------

        let maxPop = 0;

        for (let i = 0; i < this._list.length; i++)
        {
            if (!this._list[i].shortName) this._list[i].shortName = this._list[i].name;

            maxPop = Math.max(this._list[i].pop || 0, maxPop);
            this._list[i].id = i;
            this._list[i].summary = this._list[i].summary || "";
            this._list[i]._summary = this._list[i].summary.toLowerCase();
            this._list[i]._shortName = this._list[i].shortName.toLowerCase();
            this._list[i]._lowerCaseName = this._list[i].name.toLowerCase();
            this._list[i]._nameSpace = this._list[i].nameSpace.toLowerCase() + ".";
            this._list[i]._nameSpaceFull = this._list[i].nameSpace.toLowerCase() + "." + this._list[i].shortName.toLowerCase();

            const opdoc = gui.opDocs.getOpDocByName(this._list[i].name);
            if (defaultOps.isDeprecatedOp(this._list[i].name) || (opdoc && opdoc.oldVersion)) this._list[i].old = true;
        }
        // console.log("opselect build list...");
        this._rebuildWordList();

        CABLES.UI.OPSELECT.maxPop = maxPop;
    }


    _searchWord(wordIndex, orig, list, query)
    {
        if (!query || query === " " || query === "") return;

        const perf = CABLES.UI.uiProfiler.start("opsearch._searchWord");

        for (let i = 0; i < list.length; i++)
        {
            if (wordIndex > 0 && list[i].score === 0) continue; // when second word was found, but first was not

            let scoreDebug = "<b>Query: " + query + " </b><br/>";
            let found = false;
            let points = 0;

            if (list[i].lowercasename.indexOf(query) > -1)
            {
                if (list[i].name === "Ops.Gl.MainLoop")
                {
                    found = true;
                    scoreDebug += "+2 vip op<br/>";
                    points += 2;
                }
            }

            if (list[i].abbrev && list[i].abbrev.indexOf(orig) === 0)
            {
                found = true;
                let p = 2;
                if (orig.length === 2)p = 6;
                if (orig.length === 3)p = 4;
                scoreDebug += "+" + p + " abbreviation<br/>";
                points += p;
            }

            if (list[i].userOp && this._hideUserOps)
            {
                continue;
            }

            if (list[i]._summary.indexOf(query) > -1)
            {
                found = true;
                points += 1;
                scoreDebug += "+1 found in summary (" + query + ")<br/>";
            }

            if (list[i]._nameSpace.indexOf(query) > -1)
            {
                found = true;
                points += 1;
                scoreDebug += "+1 found in namespace (" + query + ")<br/>";
            }

            if (list[i]._shortName.indexOf(query) > -1)
            {
                found = true;
                points += 4;
                scoreDebug += "+4 found in shortname (" + query + ")<br/>";
            }

            if (list[i]._shortName == query)
            {
                found = true;
                points += 5;
                scoreDebug += "+5 query quals shortname<br/>";
            }


            if (orig.length > 1 && list[i]._lowerCaseName.indexOf(orig) > -1)
            {
                found = true;
                points += 2;
                scoreDebug += "+2 found full namespace (" + query + ")<br/>";
            }


            if (points == 0)
            {
                if (list[i]._lowerCaseName.indexOf(query) > -1)
                {
                    found = true;
                    points += 2;
                    scoreDebug += "+2 found full namespace (" + query + ")<br/>";
                }
            }

            if (list[i].collectionOpNames && list[i].collectionOpNames.indexOf(orig) > -1)
            {
                found = true;
                points += 1;
                scoreDebug += "+1 is op in collection (" + query + ")<br/>";
            }

            if (found)
            {
                if (this._newOpOptions)
                {
                    const firstportfitspoints = 3;
                    const firstportfitsText = "+3 First Port fits<br/>";

                    const docs = gui.opDocs.getOpDocByName(list[i].name);

                    if (docs && docs.hasOwnProperty("version"))
                    {
                        const p = docs.version * 0.01;
                        points += p;
                        scoreDebug += "+" + p + " version<br/>";
                    }


                    if (docs && docs.layout && docs.layout.portsIn && docs.layout.portsOut && docs.layout.portsIn.length > 0 && docs.layout.portsOut.length > 0)
                    {
                        // when inserting into link - find fitting ports
                        if (this._newOpOptions.linkNewLink)
                        {
                            let foundPortTypeIn = false;
                            for (let j = 0; j < docs.layout.portsIn.length; j++)
                            {
                                if (docs.layout.portsIn[j] &&
                                    this._newOpOptions.linkNewLink.portIn &&
                                    docs.layout.portsIn[j].type == this._newOpOptions.linkNewLink.portIn.type)
                                {
                                    foundPortTypeIn = true;
                                    break;
                                }
                            }

                            let foundPortTypeOut = false;
                            for (let j = 0; j < docs.layout.portsOut.length; j++)
                            {
                                if (docs.layout.portsOut[j].type == this._newOpOptions.linkNewLink.portOut.type)
                                {
                                    foundPortTypeOut = true;
                                    break;
                                }
                            }

                            if (
                                docs.layout.portsIn[0].type == this._newOpOptions.linkNewLink.portOut.type &&
                                docs.layout.portsOut[0].type == this._newOpOptions.linkNewLink.portIn.type
                            )
                            {
                                points += firstportfitspoints;
                                scoreDebug += firstportfitsText;
                            }

                            if (!foundPortTypeOut && !foundPortTypeIn)
                            {
                                points -= 5.0; // seems harsh, but is only used when dragging a port, so it should be fine...
                                scoreDebug += "-5.0 no compatible port found<br/>";
                            }
                        }

                        // when dragging a port - find fitting  input/output port
                        if (this._newOpOptions.linkNewOpToPort)
                        {
                            let foundPortType = false;
                            if (this._newOpOptions.linkNewOpToPort.direction === CABLES.PORT_DIR_OUT)
                            {
                                if (docs.layout.portsIn[0].type == this._newOpOptions.linkNewOpToPort.type)
                                {
                                    points += firstportfitspoints;
                                    scoreDebug += firstportfitsText;
                                }

                                for (let j = 0; j < docs.layout.portsIn.length; j++)
                                {
                                    if (docs.layout.portsIn[j].type == this._newOpOptions.linkNewOpToPort.type)
                                    {
                                        foundPortType = true;
                                        break;
                                    }
                                }
                            }
                            else
                            {
                                if (docs.layout.portsOut[0].type == this._newOpOptions.linkNewOpToPort.type)
                                {
                                    points += firstportfitspoints;
                                    scoreDebug += firstportfitsText;
                                }


                                for (let j = 0; j < docs.layout.portsOut.length; j++)
                                {
                                    if (docs.layout.portsOut[j].type == this._newOpOptions.linkNewOpToPort.type)
                                    {
                                        foundPortType = true;
                                        break;
                                    }
                                }
                            }

                            if (!foundPortType)
                            {
                                points -= 10.0; // seems harsh, but is only used when dragging a port, so it should be fine...
                                scoreDebug += "-10.0 no comparible port found<br/>";
                            }
                        }
                    }
                }

                if (list[i]._shortName.indexOf(orig) === 0)
                {
                    points += 2.5;
                    scoreDebug += "+2.5 found in shortname at beginning (" + query + ")<br/>";

                    if (list[i]._shortName == orig)
                    {
                        points += 2;
                        scoreDebug += "+2 exact name (" + query + ")<br/>";
                    }
                }


                if (list[i]._nameSpace.indexOf("ops.math") > -1)
                {
                    points += 1;
                    scoreDebug += "+1 is math op (" + query + ")<br/>";
                }
                else if (list[i]._nameSpace.indexOf("ops.patch") > -1)
                {
                    points += 3;
                    scoreDebug += "+1 is patch op (" + query + ")<br/>";
                }
                else if (list[i]._nameSpace.indexOf("ops.team") > -1)
                {
                    points += 2;
                    scoreDebug += "+2 is team op (" + query + ")<br/>";
                }


                const shortnessPoints = 2 * Math.round((1.0 - Math.min(1, (list[i]._nameSpace + list[i]._shortName).length / 100)) * 100) / 100;
                points += shortnessPoints;
                scoreDebug += "+" + shortnessPoints + " shortness namespace<br/>";
            }

            if (found && this._list[i].old)
            {
                points -= 1;
                scoreDebug += "-1 outdated<br/>";
            }

            if (found && list[i].pop > 0)
            {
                points += (list[i].pop || 2) / CABLES.UI.OPSELECT.maxPop || 1;
            }

            if (found && this._list[i].notUsable)
            {
                points = 0.1;
                scoreDebug += "0.1 not usable<br/>";
            }

            if (!found) points = 0;

            if (points === 0 && list[i].score > 0) list[i].score = 0;
            else list[i].score += points;

            list[i].scoreDebug = (list[i].scoreDebug || "") + scoreDebug + " (" + Math.round(points * 100) / 100 + " points)<br/><br/>";
        }

        perf.finish();
    }

    search(query)
    {
        document.getElementById("realsearch").innerHTML = "";
        document.getElementById("opOptions").innerHTML = "";
        if (!query) return;

        const origQuery = query;
        if (this._wordsDb) // search through word db
        {
            let q = query;
            const queryParts = [];
            let found = false;
            do
            {
                found = false;
                for (let i = 0; i < this._wordsDb.length; i++)
                {
                    const idx = q.indexOf(this._wordsDb[i]);
                    if (idx > -1) // && queryParts.indexOf(this._wordsDb[i])==-1
                    {
                        found = true;
                        queryParts.push(this._wordsDb[i]);
                        q = q.substr(0, idx) + " " + q.substr(idx + this._wordsDb[i].length, q.length - idx);
                        break;
                    }
                }
            }
            while (found);

            if (queryParts.length > 0)
            {
                let nquery = queryParts.join(" ");
                nquery += " " + q;

                if (nquery !== query) document.getElementById("realsearch").innerHTML = "Searching for: <b>" + nquery + "</b>";

                query = nquery;
            }
            else document.getElementById("realsearch").innerHTML = "";
        }
        if (query.length > 1 && this._list)
        {
            for (let i = 0; i < this._list.length; i++)
            {
                this._list[i].score = 0;
                this._list[i].scoreDebug = "";
            }

            if (query.indexOf(" ") > -1)
            {
                const words = query.split(" ");
                for (let i = 0; i < words.length; i++) { this._searchWord(i, origQuery, this._list, words[i]); }
            }
            else
            {
                this._searchWord(0, query, this._list, query);
            }
        }
    }

    _rebuildWordList()
    {
        if (!this._list) return;
        const buildWordDB = {};
        for (let i = 0; i < this._list.length; i++)
        {
            const res = this._list[i].name.split(/(?=[A-Z,0-9,/.])/);

            for (let j = 0; j < res.length; j++)
            {
                if (res[j][res[j].length - 2] === "_") res[j] = res[j].substr(0, res[j].length - 2);
                if (res[j][0] === ".") res[j] = res[j].substr(1);
                if (res[j].length > 2) buildWordDB[res[j].toLowerCase()] = 1;
            }


            let shortName = "";
            const ccParts = this._list[i].shortName.split(/(?=[A-Z,0-9,/.])/);
            for (let j = 0; j < ccParts.length; j++)
                shortName += ccParts[j].substr(0, 1);
            this._list[i].abbrev = shortName.toLocaleLowerCase();
        }


        this._wordsDb = Object.keys(buildWordDB);
        this._wordsDb.sort((a, b) => { return b.length - a.length; });
    }


    _getOpsNamesFromCode(opNames, ns, val, parentname)
    {
        if (Object.prototype.toString.call(val) === "[object Object]")
        {
            for (const propertyName in val)
            {
                if (val.hasOwnProperty(propertyName))
                {
                    const opName = ns + "." + parentname + propertyName;
                    if (typeof (CABLES.Patch.getOpClass(opName)) === "function") opNames.push(opName);
                    opNames = this._getOpsNamesFromCode(opNames, ns, val[propertyName], parentname + propertyName + ".");
                }
            }
        }
        return opNames;
    }

    _createListItemsByNames(opNames, listItems = [])
    {
        if (!opNames) return;
        const items = [];
        for (let i = 0; i < opNames.length; i++)
        {
            const opName = opNames[i];
            if (!opName) continue;
            const parts = opName.split(".");
            const lowerCaseName = opName.toLowerCase() + "_" + parts.join("").toLowerCase();
            const opDoc = gui.opDocs.getOpDocByName(opName);
            let shortName = parts[parts.length - 1];
            let hidden = false;
            let opDocHidden = false;
            let opId = null;

            if (opDoc)
            {
                opId = opDoc.id;
                opDocHidden = opDoc.hidden;
                hidden = opDoc.hidden;

                if (defaultOps.isNonCoreOp(opName))
                {
                    shortName = opDoc.shortName;
                }
                else
                {
                    shortName = opDoc.shortNameDisplay;
                }
            }

            if (hidden)
            {
                if (defaultOps.isAdminOp(opName) && !gui.user.isAdmin) hidden = true;
            }

            if (defaultOps.isDevOp(opName) && !CABLES.platform.isDevEnv()) hidden = true;
            if (defaultOps.isStandaloneOp(opName) && !CABLES.platform.isStandalone()) hidden = true;

            parts.length -= 1;
            const nameSpace = parts.join(".");

            if (defaultOps.isCollection(opName))
            {
                const inUse = listItems && listItems.some((op) => { return op.name.startsWith(opName); });
                if (inUse)
                {
                    hidden = true;
                }
            }

            if (!hidden)
            {
                let oldState = "";
                if (hidden)oldState = "OLD";
                if (opDocHidden)oldState = "OLD";
                if (defaultOps.isDeprecatedOp(opName)) oldState = "DEPREC";
                if (defaultOps.isAdminOp(opName)) oldState = "ADMIN";

                let popularity = -1;
                let summary = gui.opDocs.getSummary(opName);
                let type = "op";
                if (defaultOps.isTeamNamespace(opName)) type = "teamnamespace";
                if (defaultOps.isExtension(opName)) type = "extension";
                if (defaultOps.isPatchOp(opName)) type = "patchop";


                const isTeamOp = defaultOps.isTeamOp(opName);

                const isCollection = defaultOps.isCollection(opName);

                let collectionOpNames = null;
                if (isCollection)
                {
                    const a = gui.opDocs.getNamespaceDocs(opName);
                    if (a && a.length > 0 && a[0].ops) collectionOpNames = a[0].ops.join(" ").toLowerCase();
                }

                const op = {
                    "opId": opId || CABLES.simpleId(),
                    "name": opName,
                    "summary": summary,
                    "collectionOpNames": collectionOpNames,
                    "nscolor": defaultOps.getNamespaceClassName(opName),
                    "isOp": !defaultOps.isCollection(opName),
                    "userOp": defaultOps.isUserOp(opName),
                    "devOp": defaultOps.isDevOp(opName),
                    "standaloneOp": defaultOps.isStandaloneOp(opName),
                    "extensionOp": defaultOps.isExtensionOp(opName),
                    "teamOp": defaultOps.isTeamOp(opName),
                    "patchOp": defaultOps.isPatchOp(opName),
                    "isExtension": defaultOps.isExtension(opName),
                    "isTeamNamespace": isTeamOp,
                    "shortName": shortName,
                    "nameSpace": nameSpace,
                    "oldState": oldState,
                    "lowercasename": lowerCaseName,
                    "isCollection": isCollection,
                    "buttonText": isCollection ? "Load" : "Add",
                    "type": type,
                    "pop": popularity,

                };
                if (opDoc && opDoc.notUsable)
                {
                    op.notUsable = true;
                    op.notUsableReasons = opDoc.notUsableReasons;
                }
                if (defaultOps.isCollection(opName))
                {
                    op.isOp = false;
                    op.pop = 1;
                    if (opDoc)
                    {
                        op.summary = opDoc.summary;
                        op.description = opDoc.description;
                        op.teamName = opDoc.teamName;
                        op.teamLink = opDoc.teamLink;
                        op.numOps = opDoc.numOps;
                        op.ops = opDoc.ops || [];
                    }
                }
                items.push(op);
            }
        }
        return items;
    }
}
