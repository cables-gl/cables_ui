import libchroma from "chroma-js";
import Gui from "../../src/ui/gui";

declare global {

    const CABLESUILOADER:any
    var CABLES:any
    // var gui:Gui
    const logStartup:typeof Function
    const incrementStartup:typeof Function

    const chroma:libchroma
    const Handlebars:any
    const ColorRick:any
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

    const mat2: typeof import("gl-matrix").mat2
    const mat3: typeof import("gl-matrix").mat3
    const mat4: typeof import("gl-matrix").mat4
    const quat: typeof import("gl-matrix").quat
    const vec2: typeof import("gl-matrix").vec2
    const vec3: typeof import("gl-matrix").vec3
    const vec4: typeof import("gl-matrix").vec4

    interface Window {
        Handlebars:any
        logStartup:typeof Function
        // gui:Gui
    }

}

export {};
