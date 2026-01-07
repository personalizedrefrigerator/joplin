import highlightedCodeBlock from './highlighted-code-block'
import strikethrough from './strikethrough'
import tables from './tables'
import taskListItems from './task-list-items'
import alerts from './alerts'

function gfm (turndownService) {
  turndownService.use([
    highlightedCodeBlock,
    strikethrough,
    tables,
    taskListItems,
    alerts,
  ])
}

export { gfm, highlightedCodeBlock, strikethrough, tables, taskListItems, alerts }
