# cables UI

* the preferred way of developing cables locally is using the cables_dev repository: https://github.com/cables-gl/cables_dev
* that repo contains scripts that do the necessary work for you

## Dev notes

### Adding tooltip-infos

* Tooltip infos will be shown next to an element when hovering and can be attached to any element by adding a `class` and `data`-attribute to the element.*
  * Add `class="tt"`
  * Add `data-tt="YOUR TEXT"`
  * E.g. `<div class="tt" data-tt="Infos about this div"></div>`

