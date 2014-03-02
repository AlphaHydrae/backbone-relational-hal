var HalLink = RelationalModel.extend({

  href: function(options) {
    options = _.extend({}, options);

    var href = this.get('href');

    if (this.get('templated')) {
      href = new UriTemplate(href);
      href = href.fillFromObject(options.template || {});
    }

    return href;
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
