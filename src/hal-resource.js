var HalResource = Backbone.RelationalHalResource = RelationalModel.extend({

  url: function() {
    return this.hasLink('self') ? this.link('self').href() : null;
  },

  link: function() {

    var links = this.get('_links');
    if (!links) {
      throw new Error('Resource has no _links property.');
    }

    return links.link.apply(links, Array.prototype.slice.call(arguments));
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

    return this.link('self').get('href') == other.link('self').get('href');
  },

  isNew: function() {
    return !this.hasLink('self');
  }
});

var relationalHalResourceExtend = HalResource.extend;

HalResource.extend = function(options) {

  options = _.defaults({}, options, {
    relations: [],
    halLinks: [],
    halEmbedded: []
  });

  var links = HalResourceLinks.extend({

    relations: _.map(options.halLinks, function(halLink) {
      return _.defaults({}, _.isObject(halLink) ? halLink : { key: halLink }, {
        type: Backbone.HasOne,
        relatedModel: HalLink
      });
    })
  });

  var embedded = HalModelEmbedded.extend({

    relations: _.map(options.halEmbedded, function(halEmbedded) {
      return _.clone(halEmbedded);
    })
  });

  options.relations.push({
    type: Backbone.HasOne,
    key: '_links',
    relatedModel: links,
    includeInJSON: false
  });

  options.relations.push({
    type: Backbone.HasOne,
    key: '_embedded',
    relatedModel: embedded,
    includeInJSON: false
  });

  return relationalHalResourceExtend.call(HalResource, options);
};
