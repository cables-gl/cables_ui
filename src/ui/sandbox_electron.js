export default class SandboxElectron extends CABLES.EventTarget
{
    constructor()
    {
        super();
        console.log("starting electron sandbox");

        const ipc = require("electron").ipcRenderer; // for communication with electron main thread

        /**
         * called when open patch was clicked
         * @param event
         * @param message Object with filepath of patch and patch data as string – { path: '/Users/Ulf/somePatch.cables', patchAsString: '...'}
         */
        ipc.on("loadPatch", function (event, message)
        {
            console.log("patchContentAsString: ", message.patchAsString);
            const patch = JSON.parse(message.patchAsString);

            gui.patchView.setProject(patch);

            // gui.patch.filename = message.path; // store the path, so we can oversave it without a select-file prompt later
            const projectName = gui.patchView.store.getProjectnameFromFilename(message.path);
            gui.setProjectName(projectName);
        });
    }

    showStartupChangelog()
    {
        gui.closeModal(); // quickfix to hide empty modal on startup
    }

    getUrlOpsCode()
    {
        return "code.js";
    }

    isOffline()
    {
        return true;
    }

    /**
     * Returns the local cables folder if it is set in user settings or the default one if not set
     * e.g. `Users/ulf/cables`
     */
    getLocalCablesFolder()
    {
    // TODO: Let users define their cables-home dir
        const os = require("os");
        const path = require("path");

        const homeDir = os.homedir();
        return path.join(homeDir, "cables");
    }

    getLocalOpCode()
    {
        const fs = require("fs");
        const path = require("path");

        const cablesFolder = this.getLocalCablesFolder();
        const cablesOpsFolder = path.join(cablesFolder, "ops");

        if (fs.existsSync(cablesOpsFolder))
        {
            let localOpCode = "";
            fs.readdirSync(cablesOpsFolder).forEach(function (opName)
            {
                console.log("cables op: ", opName);
                const opJsPath = path.join(cablesOpsFolder, opName, opName + ".js"); // e.g. /Users/ulf/cables/ops/Ops.Foo/Ops.Foo.js
                if (fs.existsSync(opJsPath))
                {
                    const opCode = fs.readFileSync(opJsPath, "utf8");
                    console.log("opCode: ", opCode);
                    // localOpCode += '\n/*\n';
                    // localOpCode += ' * -----------------------------------------\n';
                    // localOpCode += ' * ' + opName.toUpperCase + ' START\n';
                    // localOpCode += ' * -----------------------------------------\n\n';

                    localOpCode += opCode;

                // localOpCode += '\n/*\n';
                // localOpCode += ' * -----------------------------------------\n';
                // localOpCode += ' * ' + opName.toUpperCase + ' END\n';
                // localOpCode += ' * -----------------------------------------\n\n';
                }
            });
            return localOpCode;
        }
        return null;
    }

    initRouting(cb)
    {
        if (!gui.serverOps || !gui.serverOps.finished())
        {
        // wait for userops finished loading....
            setTimeout(function ()
            {
                CABLES.sandbox.initRouting(cb);
            }, 100);
            // console.log("wait...");
            return;
        }

        gui.setProject(
            {
                "users": [],
                "tags": [],
                "ops": []
            });
        cb();
    }

    getUrlApiPrefix(id)
    {
        return "";
    }
}
