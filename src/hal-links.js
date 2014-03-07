var HalLink = RelationalModel.extend({

  href: function(options) {
    options = _.extend({}, options);

    var href = this.get('href');

    if (this.get('templated')) {
      href = new UriTemplate(href);
      href = href.fillFromObject(options.template || {});
    }

    return href;
  },

  tag: function(contents, options) {
    options = options || {};
    return $('<a />').attr('href', this.href(options.href))[options.html ? 'html' : 'text'](contents);
  },

  model: function(options) {
    options = _.extend({}, options);

    var model = options.model || (options.type ? new options.type() : new (Backbone.RelationalHalResource.extend({}))());

    return model;
  },

  fetchResource: function(options) {
    options = _.extend({}, options);

    var fetchOptions = _.extend({}, options.fetch, { url: this.href(options.href) });

    return this.model(options).fetch(fetchOptions);
  }
});

var HalLinkCollection = Collection.extend({
  model: HalLink
});

var HalResourceLinks = RelationalModel.extend({

  parse: function(response) {
    return _.reduce(response, function(memo, data, name) {
      memo[name] = _.isArray(data) ? new HalLinkCollection(data) : new HalLink(data);
      return memo;
    }, {});
  },

  link: function(rel, options) {
    options = _.extend({}, options);

    var data = this.get(rel);
    if (!data) {
      return options.all ? new HalLinkCollection() : null;
    } else if (data instanceof HalLinkCollection) {
      return options.all ? data : data.at(0);
    } else {
      return options.all ? new HalLinkCollection([ data ]) : data;
    }
  }
});
