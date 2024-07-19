import chroma from "chroma-js";
import loadjs from "loadjs";
import introJs from "intro.js";
import iziToast from "izitoast";
import { marked } from "marked";
import moment from "moment-mini";
import pako from "pako";
import Raphael from "raphael";
import socketClusterClient from "socketcluster-client";
import ErrorStackParser from "error-stack-parser";
import tinysort from "tinysort";
import QRCode from "davidshimjs-qrcodejs";
import Sortable from "sortablejs";
import platform from "platform";
import Handlebars from "./handlebars.cjs";
import hljs from "./highlight_min.cjs";
import colorrick from "./colorrick.cjs";
import MathParser from "./mathparser.js";
import UndoManager from "./undomanager.js";

window.chroma = chroma;
window.ColorRick = colorrick;
window.Handlebars = Handlebars;
window.hljs = hljs;
window.introJs = introJs;
window.iziToast = iziToast;
window.loadjs = loadjs;
window.marked = marked;
window.MathParser = MathParser;
window.moment = moment;
window.pako = pako;
window.QRCode = QRCode;
window.Raphael = Raphael;
window.socketClusterClient = socketClusterClient;
window.ErrorStackParser = ErrorStackParser;
window.tinysort = tinysort;
window.UndoManager = UndoManager;
window.Sortable = Sortable;
window.platform = platform;
