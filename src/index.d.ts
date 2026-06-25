declare global {

    const CABLESUILOADER:any
    const logStartup:typeof Function
    const incrementStartup:typeof Function

    const chroma:any
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
