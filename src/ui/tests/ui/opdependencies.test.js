/**
 * @param {import("../index.js").TestContext} t
 */
export default function (t)
{
    describe("ui: op dependencies", () =>
    {
        const createdOps = [];

        afterEach(() =>
        {
            for (let i = 0; i < createdOps.length; i++)
                if (t.gui.corePatch().getOpById(createdOps[i])) t.gui.corePatch().deleteOp(createdOps[i]);
            createdOps.length = 0;
        });

        /**
         * @param {String} opName
         */
        const loadOpDependencies = (opName) =>
        {
            return new Promise((resolve) => { t.gui.serverOps.loadOpDependencies(opName, resolve); });
        };

        /**
         * @param {any} opThing
         * @param {String[]} checked
         */
        const expectDepsLoaded = async (opThing, checked = []) =>
        {
            const deps = t.gui.serverOps.getOpDeps(opThing);
            for (let i = 0; i < deps.length; i++)
            {
                const dep = deps[i];
                const src = Array.isArray(dep.src) ? dep.src[0] : dep.src;
                if (dep.type === "npm") continue;

                if (dep.type === "op")
                {
                    t.expect(CABLES.OPS[src], dep.op + ": op dependency " + src + " code loaded").to.exist;
                    if (checked.includes(src)) continue;
                    checked.push(src);
                    await expectDepsLoaded({ "opId": src }, checked);
                    continue;
                }

                let libName = src;
                if (libName.startsWith("./")) libName = dep.op + libName.substring(1);
                const state = t.gui.serverOps.libLoader._libStates[libName];
                t.expect(state, dep.op + ": " + dep.type + " dependency " + libName + " was loaded").to.exist;
                t.expect(await state, dep.op + ": " + dep.type + " dependency " + libName + " loaded successfully").to.equal(true);
            }
        };

        /**
         * @param {String} opName
         */
        const addOpWithDeps = async (opName) =>
        {
            await loadOpDependencies(opName);
            await expectDepsLoaded(opName);

            const op = t.gui.corePatch().addOp(opName);
            t.expect(op, opName + " created").to.exist;
            createdOps.push(op.id);
            t.expect(op.hasUiError("instancingError"), opName + " instanced without error").to.not.be.ok;
            return op;
        };

        it("libs: Ops.Math.PerlinNoise", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Math.PerlinNoise");
            t.expect(window.noise, "perlin.js global").to.exist;
        });

        it("commonjs: Ops.Math.PerlinNoise_v2", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Math.PerlinNoise_v2");
            t.expect(window.noise, "perlin.js global").to.exist;
        });

        it("commonjs: Ops.Devices.TouchGesture", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Devices.TouchGesture");
            t.expect(window.Hammer, "hammer.js global").to.exist;
        });

        it("op: Ops.Devices.Mobile.Pinch", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Devices.Mobile.Pinch");
            t.expect(window.Hammer, "hammer.js global from op dependency").to.exist;
        });

        it("op: Ops.Array.PerlinArray", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Array.PerlinArray");
            t.expect(window.noise, "perlin.js global from op dependency").to.exist;
        });

        it("coreLibs: Ops.Vars.VarSetTexture_v2", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Vars.VarSetTexture_v2");
            t.expect(CABLES.VarSetOpWrapper, "vargetset corelib").to.exist;
        });

        it("corelib: Ops.Extension.ShaderGraph.Lang.Multiply", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Extension.ShaderGraph.Lang.Multiply");
            t.expect(CABLES.ShaderGraphProgram, "shadergraph corelib").to.exist;
        });

        it("module: Ops.Gl.Textures.ExrTexture", async function ()
        {
            this.timeout(30000);
            await addOpWithDeps("Ops.Gl.Textures.ExrTexture");
            t.expect(window.EXR, "exrloader.js module export").to.exist;
        });

        it("npm: Ops.Extension.Standalone.Net.OscSend", async function ()
        {
            if (!t.platform.isElectron()) this.skip();
            this.timeout(60000);
            const op = await addOpWithDeps("Ops.Extension.Standalone.Net.OscSend");
            t.expect(op.require("osc"), "osc npm module").to.exist;
            t.expect(op.hasUiError("oprequire"), "no require error").to.not.be.ok;
        });
    });
}
