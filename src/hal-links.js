var HalLink = RelationalModel.extend({

  href: function() {
    return this.get('href');
  },

  tag: function(contents, options) {
    options = options || {};
    return $('<a />').attr('href', this.get('href'))[options.html ? 'html' : 'text'](contents);
  }
});

var HalLinkCollection = Collection.extend({
  model: HalLink
});

var HalResourceLinks = RelationalModel.extend({

  link: function(rel, options) {
    options = _.extend({}, options);

    if (options.required && !this.has(rel)) {
      throw new Error('No link found with relation ' + rel);
    }

    var links = this.get(rel);
    if (typeof(links.length) == 'undefined') {
      return links;
    }

    var type = options.type;
    var matching = links.filter(function(link) {
      return link.has('type') && link.get('type') == type;
    });

    if (!matching.length) {
      throw new Error('No link found with relation ' + rel + ' and type ' + type);
    } else if (matching.length >= 2) {
      throw new Error('Multiple links found with relation ' + rel + ' and type ' + type);
    }

    return _.first(matching);
  }
});
