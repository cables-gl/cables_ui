// asset imports bundled via raw-loader into plain strings (see webpack.config.js)
// NOTE: these wildcard ambient module declarations only work in a global script
// file (no import/export at top level) - keep this file free of real imports.

declare module "*.frag" {
    const content: string;
    export default content;
}
declare module "*.vert" {
    const content: string;
    export default content;
}
declare module "*.wgsl" {
    const content: string;
    export default content;
}
declare module "*.txt" {
    const content: string;
    export default content;
}
