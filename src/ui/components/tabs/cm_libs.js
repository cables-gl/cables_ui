/*
 * all codemirror imports, loaded with import("./cm_libs.js") when the first editor opens,
 * so codemirror is not part of the main bundle
 */
export { linter, lintGutter, forEachDiagnostic, setDiagnosticsEffect } from "@codemirror/lint";
export { EditorView, highlightActiveLineGutter, highlightActiveLine, lineNumbers, keymap, drawSelection, Decoration, showPanel } from "@codemirror/view";
export { Transaction, EditorSelection, EditorState, Compartment } from "@codemirror/state";
export { syntaxTree, bracketMatching, indentOnInput, indentUnit } from "@codemirror/language";
export { autocompletion, closeBrackets, closeBracketsKeymap, snippetCompletion } from "@codemirror/autocomplete";
export { searchKeymap, highlightSelectionMatches, selectNextOccurrence } from "@codemirror/search";
export { indentWithTab, toggleComment, history, historyKeymap, defaultKeymap, insertNewlineAndIndent } from "@codemirror/commands";
export { MergeView } from "@codemirror/merge";
export { oneDark } from "@codemirror/theme-one-dark";

export { markdown } from "@codemirror/lang-markdown";
export { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
export { glsl } from "codemirror-lang-glsl";
export { css } from "@codemirror/lang-css";
export { json, jsonParseLinter } from "@codemirror/lang-json";
export { html } from "@codemirror/lang-html";
export { xml } from "@codemirror/lang-xml";
export { sql } from "@codemirror/lang-sql";
export { python } from "@codemirror/lang-python";
