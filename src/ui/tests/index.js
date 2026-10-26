import mocha from "mocha/mocha.js";
import { expect } from "chai";
import { TalkerAPI } from "cables-shared-client/index.js";
import Gui from "../gui.js";
import talkerApiPatchTests from "./talkerapi/patch.test.js";
import talkerApiOpsTests from "./talkerapi/ops.test.js";
import electronTests from "./electron/electron.test.js";
import guiTests from "./ui/gui.test.js";
import subPatchOpTests from "./ui/subpatchop.test.js";
import { Platform } from "../platform.js";

/**
 * @typedef TestContext
 * @property {Gui} gui
 * @property {Platform} platform
 * @property {TalkerAPI} TalkerAPI
 * @property {any} expect
 */

const testFiles = [
    talkerApiPatchTests,
    talkerApiOpsTests,
    electronTests,
    guiTests,
    subPatchOpTests
];

let isSetup = false;

/**
 * @param {{gui: any, platform: any, TalkerAPI: any}} env
 */
function setup(env)
{
    if (isSetup) return;
    isSetup = true;

    mocha.setup({ "ui": "bdd", "reporter": function () {}, "timeout": 10000 });
    mocha.cleanReferencesAfterRun(false);

    /** @type {TestContext} */
    const ctx = {
        "gui": env.gui,
        "platform": env.platform,
        "TalkerAPI": env.TalkerAPI,
        "expect": expect
    };

    for (let i = 0; i < testFiles.length; i++) testFiles[i](ctx);
}

/**
 * @param {string} [grep]
 */
function run(grep)
{
    mocha.grep(grep || "");
    return mocha.run();
}

const testEvents = mocha.constructor.Runner.constants;

export { setup, run, testEvents };
