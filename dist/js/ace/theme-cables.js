ace.define("ace/theme/cables", ["require", "exports", "module", "ace/lib/dom"], function (e, t, n)
{
    // eslint-disable-next-line no-unused-expressions
    t.isDark = !0, t.cssClass = "ace-idle-fingers", t.cssText = "" +

    ".ace_editor * {color:var(--textedit-default)}" +
    ".ace-idle-fingers .ace_gutter {background: #222; color: #555;}" +
    ".ace_autocomplete {background: #333 !important; border:none !important;}" +
    ".ace_autocomplete .ace_active-line{background: #777 !important; border:none !important;}" +
    ".ace_completion-highlight {color: #eee !important;}" +
    ".ace_gutter-cell .ace_gutter {background: #222; color: #555 !important;}" +
    ".ace-idle-fingers .ace_print-margin {width: 1px;background: #3b3b3b}" +
    ".ace-idle-fingers { background-color: #1c1c1c;color: #FFFFFF}" +
    ".ace-idle-fingers .ace_cursor {color: #e98c41}" +

    ".ace-idle-fingers .ace_marker-layer .ace_selection {background: rgba(60,60,60, 0.88)}" +
    ".ace-idle-fingers.ace_multiselect .ace_selection.ace_start {box-shadow: 0 0 3px 0px #323232;}" +
    ".ace-idle-fingers .ace_marker-layer .ace_step {background: rgb(102, 82, 0)}" +
    ".ace-idle-fingers .ace_marker-layer .ace_bracket {margin: -1px 0 0 -1px;border: 1px solid #404040}" +
    ".ace-idle-fingers .ace_marker-layer .ace_active-line {background: #2a2a2a}" +
    ".ace-idle-fingers .ace_gutter-active-line {background-color: #353637}" +
    ".ace-idle-fingers .ace_marker-layer .ace_selected-word {border: 1px solid rgba(90, 100, 126, 0.88)}" +
    ".ace-idle-fingers .ace_invisible {color: #404040}" +
    ".ace-idle-fingers .ace_keyword,.ace-idle-fingers .ace_meta {color: var(--textedit-keyword)}" +
    ".ace-idle-fingers .ace_constant,.ace-idle-fingers .ace_constant.ace_character,.ace-idle-fingers .ace_constant.ace_character.ace_escape,.ace-idle-fingers .ace_constant.ace_other,.ace-idle-fingers " +
    ".ace_support.ace_constant {color: #418ce9}" +
    ".ace-idle-fingers .ace_invalid {color: #FFFFFF;background-color: #FF0000}" +
    ".ace-idle-fingers .ace_fold {background-color: #CC7833;border-color: #FFFFFF}" +
    ".ace-idle-fingers .ace_support.ace_function {color: var(--textedit-function)}" +
    ".ace-idle-fingers .ace_variable.ace_parameter {font-style: italic}" +

    ".ace-idle-fingers .ace_string.ace_regexp {color: #CCCC33}" +
    ".ace-idle-fingers .ace_comment {font-style: italic;color: var(--textedit-comment)}" +
    ".ace-idle-fingers .ace_meta.ace_tag {color: #FFE5BB}" +
    ".ace-idle-fingers .ace_entity.ace_name {color: #6c9fde}" +
    ".ace-idle-fingers .ace_collab.ace_user1 {color: #323232;background-color: #FFF980}" +

    ".ace-idle-fingers .ace_numeric {color: var(--textedit-numeric) !important}" +
    ".ace-idle-fingers .ace_string {color: var(--textedit-string)}" +


    ".ace-idle-fingers .ace_indent-guide {background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWMwMjLyZYiPj/8PAAreAwAI1+g0AAAAAElFTkSuQmCC) right repeat-y}";
    let r = e("../lib/dom");
    r.importCssString(t.cssText, t.cssClass);
});

