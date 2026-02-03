export default function alerts (turndownService) {
  turndownService.addRule('alerts', {
    filter: function (node) {
      return node.nodeName === 'DIV' && node.classList.contains('markdown-alert');
    },
    replacement: function (content, node, _options) {
      const alertTypes = [ 'note', 'tip', 'important', 'warning', 'caution' ];
      let marker = 'NOTE';
      for (const alertType of alertTypes) {
        if (node.classList.contains(`markdown-alert-${alertType}`)) {
          marker = alertType.toUpperCase();
          break;
        }
      }

      content = content.replace(/^\n+|\n+$/g, '');
      content = content.replace(/\n/g, `\n> `);
      return `> [!${marker}]${content}`;
    }
  });
  turndownService.addRule('alerts-title', {
    filter: function (node) {
        return (node.nodeName === 'P' || node.nodeName === 'DIV')
            && node.classList.contains('markdown-alert-title')
            && node.parentElement && node.parentElement.classList
            && node.parentElement.classList.contains('markdown-alert');
    },
    replacement: function(content) {
        content = content.trim();
        if (content) {
          return ` ${content}`;
        }

        return '\n';
    },
  });
}
