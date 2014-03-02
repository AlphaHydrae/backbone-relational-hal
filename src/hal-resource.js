var HalResource = Backbone.RelationalHalResource = RelationalModel.extend({

  url: function() {
    return this.hasLink('self') ? this.link('self').href() : null;
  },

  link: function(rel) {
    var links = this.get('_links');
    return links ? links.link.apply(links, Array.prototype.slice.call(arguments)) : null;
  },
  
  hasLink: function(rel) {
    return this.has('_links') && this.get('_links').has(rel);
  },

  embedded: function(rel) {
    var embedded = this.get('_embedded');
    return embedded ? embedded.embedded.apply(embedded, Array.prototype.slice.call(arguments)) : null;
  },

  hasEmbedded: function(rel) {
    return this.has('_embedded') && this.get('_embedded').has(rel);
  },

  hasSameUri: function(other) {
    if (!other) {
      return false;
    }

    return this.link('self').href() == other.link('self').href();
  },

  isNew: function() {
    return !this.hasLink('self');
  }
});
