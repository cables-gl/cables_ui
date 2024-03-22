import Platform from "./platform.js";

export default class PlatformStandalone extends Platform
{
    constructor(cfg)
    {
        super(cfg);
        this.features.npm = true;
    }
}
