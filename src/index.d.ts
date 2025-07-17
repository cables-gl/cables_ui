import Gui from "./ui/gui.js"
import { Platform } from "./ui/platform.js"

declare global {

    const CABLESUILOADER:any
    const gui:Gui

    const logStartup:typeof function
    const incrementStartup:typeof function

    const chroma:any
    const Handlebars:any
    const hljs:any
    const iziToast:any
    const loadjs:any
    const marked:any
    const moment:any
    const platformLib:any
    const QRCode:any
    interface Window {
        Handlebars:any
        logStartup:typeof function
    }

}
