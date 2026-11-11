import { TalkerAPI } from "cables-shared-client";
import { Patch, Port } from "cables";
import undo from "../utils/undo.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import namespace from "../namespaceutils.js";

const NUM_FRAMES = 30;
const LOAD_TIMEOUT = 20000;
const FRAMES_TIMEOUT = 10000;
const IGNORE_ERRORS = ["multimainloop"];

// example and op test patches are always loaded from the dev server
export const TEST_SERVER = { "serverUrl": "https://dev.cables.gl", "assetUrl": "https://devsandbox.cables.gl" };

/**
 * @typedef OpExample
 * @property {string} projectId
 * @property {string[]} opNames
 */

/**
 * @returns {OpExample[]}
 */
export function getOpExamples()
{
    const byId = {};
    const examples = [];
    const docs = gui.opDocs.getAll();
    for (let i = 0; i < docs.length; i++)
    {
        const id = docs[i].exampleProjectId;
        if (!id || !namespace.isCoreOp(docs[i].name)) continue;
        if (!byId[id])
        {
            byId[id] = { "projectId": id, "opNames": [] };
            examples.push(byId[id]);
        }
        byId[id].opNames.push(docs[i].name);
    }
    return examples;
}

/**
 * @param {string} projectId
 * @returns {Promise<void>}
 */
export async function runOpExample(projectId)
{
    await runPatch(await loadProject(projectId, TEST_SERVER));
}

/**
 * @param {string} projectId
 * @param {{serverUrl: string, assetUrl: string}} [server] load the patch from this server instead of the platform default
 * @returns {Promise<any>}
 */
export async function loadProject(projectId, server = null)
{
    const project = await loadPatch(projectId, server);
    if (!project || !project.ops) throw new Error("could not load patch " + projectId);

    return new Promise((resolve) => { gui.serverOps.loadProjectDependencies(project, resolve); });
}

/**
 * @param {string} projectId
 * @param {{serverUrl: string, assetUrl: string}} [server]
 * @returns {Promise<any>}
 */
async function loadPatch(projectId, server = null)
{
    if (!server && !platform.isElectron())
    {
        return new Promise((resolve) =>
        {
            platform.talkerAPI.send(TalkerAPI.CMD_GET_PATCH, { "id": projectId }, (err, project) => { resolve(err ? null : project); });
        });
    }

    const serverUrl = server ? server.serverUrl : platform.getCablesDocsUrl();
    const response = await fetch(serverUrl + "/api/project/" + encodeURIComponent(projectId) + "/patch.json");
    if (!response.ok) return null;
    const project = await response.json();
    const assetUrl = server ? server.assetUrl : platform.getCommunitySandboxUrl();

    for (let i = 0; i < project.ops.length; i++)
    {
        const portsIn = project.ops[i].portsIn || [];
        for (let j = 0; j < portsIn.length; j++)
        {
            const value = portsIn[j].value;
            if (typeof value != "string") continue;
            if (value.startsWith("/assets/")) portsIn[j].value = assetUrl + value;
            else if (value.startsWith("assets/")) portsIn[j].value = assetUrl + "/" + value;
        }
    }
    return project;
}

/**
 * @typedef PatchTest
 * @property {string[]} ignoreErrors
 * @property {(patch: Patch) => void} start
 * @property {(patch: Patch) => Promise<void>} wait
 * @property {() => string[]} getErrors
 * @property {() => void} stop
 */

/**
 * @param {any} project
 * @param {PatchTest} [test]
 */
export async function runPatch(project, test = null)
{
    const patch = gui.corePatch();
    const addedIds = [];
    const errors = [];

    undo.pause();
    patch.clear();
    undo.resume();
    gui.patchView.setCurrentSubPatch(Patch.DEFAULT_SUBPATCHID);

    /** @type {Object<string, boolean>} */
    const oldJobIds = {};
    const oldJobs = patch.loading.getList();
    for (let i = 0; i < oldJobs.length; i++) oldJobIds[oldJobs[i].id] = true;

    const listenAdd = patch.on(Patch.EVENT_OP_ADDED, (op) => { addedIds.push(op.id); });
    const listenException = patch.on(Port.EVENT_EXCEPTION, (ex, op) => { errors.push("exception in " + op.objName + ": " + ex.message); });

    // errors outside of port callbacks (timers, loaders, promises) only reach the window
    /** @param {ErrorEvent} e */
    const onWindowError = (e) => { errors.push(e.message); };

    /** @param {PromiseRejectionEvent} e */
    const onRejection = (e) => { errors.push("unhandled rejection: " + (e.reason && e.reason.message ? e.reason.message : String(e.reason))); };
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onRejection);
    if (test) test.start(patch);

    undo.pause();
    try
    {
        Patch.replaceOpIds(project, { "parentSubPatchId": Patch.DEFAULT_SUBPATCHID });
        patch.deSerialize(project);

        // ops that could not be created are skipped by the core without an error
        for (let i = 0; i < project.ops.length; i++)
            if (!patch.getOpById(project.ops[i].id)) errors.push("op not found: " + (project.ops[i].objName || project.ops[i].opId));

        await waitLoaded(patch, oldJobIds);
        if (test) await test.wait(patch);
        else await waitFrames(patch, NUM_FRAMES);

        for (let i = 0; i < addedIds.length; i++)
        {
            const op = patch.getOpById(addedIds[i]);
            if (!op || !op.hasUiErrors) continue;
            for (const id in op.uiErrors)
            {
                const err = op.uiErrors[id];
                if (err.level < 2 || IGNORE_ERRORS.includes(id)) continue;
                if (test && test.ignoreErrors.includes(id)) continue;
                errors.push(op.objName + ": " + err.txt);
            }
        }

        if (test) errors.push(...test.getErrors());
    }
    finally
    {
        for (let i = addedIds.length - 1; i >= 0; i--)
            if (patch.getOpById(addedIds[i])) patch.deleteOp(addedIds[i]);

        const jobs = patch.loading.getList();
        for (let i = 0; i < jobs.length; i++)
            if (!oldJobIds[jobs[i].id] && !jobs[i].finished) patch.loading.finished(jobs[i].id);

        patch.off(listenAdd);
        patch.off(listenException);
        window.removeEventListener("error", onWindowError);
        window.removeEventListener("unhandledrejection", onRejection);
        if (test) test.stop();
        undo.resume();
    }

    if (errors.length > 0) throw new Error(errors.join("\n"));
}

/**
 * @param {Patch} patch
 * @param {Object<string, boolean>} oldJobIds
 */
function waitLoaded(patch, oldJobIds)
{
    const startTime = performance.now();
    return new Promise((resolve, reject) =>
    {
        const check = () =>
        {
            const unfinished = [];
            const jobs = patch.loading.getList();
            for (let i = 0; i < jobs.length; i++)
                if (!oldJobIds[jobs[i].id] && !jobs[i].finished) unfinished.push(jobs[i].type + " " + jobs[i].name);

            if (unfinished.length == 0) return resolve();
            if (performance.now() - startTime > LOAD_TIMEOUT) return reject(new Error("loading timeout: " + unfinished.join(", ")));
            setTimeout(check, 100);
        };
        check();
    });
}

/**
 * @param {Patch} patch
 * @param {number} numFrames
 */
function waitFrames(patch, numFrames)
{
    const startTime = performance.now();
    const startFrame = patch.getFrameNum();
    return new Promise((resolve, reject) =>
    {
        const check = () =>
        {
            const frames = patch.getFrameNum() - startFrame;
            if (frames >= numFrames) return resolve();
            if (performance.now() - startTime > FRAMES_TIMEOUT) return reject(new Error("no frames rendered (" + frames + "/" + numFrames + ")"));
            setTimeout(check, 50);
        };
        check();
    });
}
