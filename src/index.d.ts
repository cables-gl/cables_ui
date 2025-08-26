import Gui from "./ui/gui.js"
import { Platform } from "./ui/platform.js"

declare global {

    const CABLESUILOADER:any
    const logStartup:typeof Function
    const incrementStartup:typeof Function

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
        logStartup:typeof Function
    }

}
