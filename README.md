# cables UI

*For instructions on how to set up cables on your own see the readme in the [cables_api](https://bitbucket.org/undev/cables_api) repository.*  

## Dev notes

### Adding tooltip-infos

*Tooltip infos will be shown next to an element when hovering and can be attached to any element by adding a `class` and `data`-attribute to the element.*    

-  Add `class="tt"` 
- Add `data-tt="YOUR TEXT"`

E.g. `<div class="tt" data-tt="Infos about this div"></div>`

### Adding info-panel infos

*The information panel can display advanced information on how to use a certain element, shortcuts and so on.*  

- Open `cables_ui/src/ui/text.js`
- Add a variable to hold your information, e.g. `bookmark_added: "Bookmark added!",` (this does not need to match the element-id)


-  Open `cables_ui/src/ui/ui.js` and copy paste the hover-function

Example:  

```javascript
$('#sidebar-menu').hover(function(e) {
  CABLES.UI.showInfo(CABLES.UI.TEXTS.sidebarMenu);
}, function() {
  CABLES.UI.hideInfo();
});
```

