import libchroma from "chroma-js";

declare global {

    const CABLESUILOADER:any
    const logStartup:typeof Function
    const incrementStartup:typeof Function

    const chroma:libchroma
    const Handlebars:any
    const hljs:any
    const iziToast:any
    const introJS:any
    const loadjs:any
    const marked:any
    const moment:any
    const platformLib:any
    const QRCode:any
    const pako:any
    const MathParser:any
    const socketClusterClient:any
    const tinysort:any
    const UndoManager:any
    const Sortable:any
    interface Window {
        Handlebars:any
        logStartup:typeof Function
    }

}

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

export {};
