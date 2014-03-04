/*!
 * backbone-relational-hal v0.1.1
 * Copyright (c) 2014 Simon Oulevay
 * Distributed under MIT license
 * https://github.com/AlphaHydrae/backbone-relational-hal
 */
(function(Backbone, _, UriTemplate, $) {

var Collection = Backbone.Collection,
    RelationalModel = Backbone.RelationalModel;

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

var HalModelEmbedded = RelationalModel.extend({

  embedded: function(rel) {
    return this.get(rel);
  }
});

var HalResource = Backbone.RelationalHalResource = RelationalModel.extend({

  url: function() {

    if (this.hasLink('self')) {
      return this.link('self').href();
    } else if (this._cachedHalUrl) {
      return this._cachedHalUrl;
    }

    var halUrl = _.result(this, 'halUrl');
    if (halUrl) {
      $.when(halUrl).then(_.bind(function(url) {
        this._cachedHalUrl = url;
      }, this));
    }

    return halUrl || null;
  },

  link: function(rel) {
    var links = this.get('_links');
    return links ? links.link.apply(links, Array.prototype.slice.call(arguments)) : null;
  },
  
  hasLink: function(rel) {
    return this.has('_links') && this.get('_links').has(rel);
  },

  fetchHalUrl: function(rels) {
    return this._fetchResource(rels.slice(), $.Deferred(), 'url', this);
  },

  fetchResource: function(rels) {
    return this._fetchResource(rels.slice(), $.Deferred(), 'resource', this);
  },

  _fetchResource: function(rels, deferred, fetchType, resource, response, options) {
    if (!rels.length) {
      return deferred.resolve(resource, response, options);
    }

    var relName = rels.shift(),
        rel = _.isObject(relName) ? relName : { name: relName },
        link = resource.link(rel.name);

    if (fetchType == 'url' && !rels.length) {
      return deferred.resolve(link.href(_.omit(rel, 'name')), resource, response, options);
    }

    link.fetchResource({
      model: rel.model || (rel.name == 'self' ? this : null),
      type: rel.type,
      fetch: {
        error: _.bind(deferred.reject, deferred),
        success: _.bind(this._fetchResource, this, rels, deferred, fetchType)
      }
    });

    return deferred;
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

var relationalHalResourceExtend = HalResource.extend;

HalResource.extend = function(options) {

  options = _.defaults({}, options, {
    relations: [],
    halEmbedded: []
  });

  var embedded = HalModelEmbedded.extend({

    relations: _.map(options.halEmbedded, function(halEmbedded) {
      return _.clone(halEmbedded);
    })
  });

  options.relations.push({
    type: Backbone.HasOne,
    key: '_links',
    relatedModel: HalResourceLinks,
    includeInJSON: false,
    parse: true
  });

  options.relations.push({
    type: Backbone.HasOne,
    key: '_embedded',
    relatedModel: embedded,
    includeInJSON: false
  });

  return relationalHalResourceExtend.call(HalResource, options);
};

Backbone.originalSync = Backbone.sync;

Backbone.sync = function(method, model, options) {
  options = _.clone(options) || {};

  var deferred = $.Deferred(),
      failureHandler = _.bind(deferred.reject, deferred);

  // WTF: fix for weird backbone behavior.
  // For some reason, when creating a model, backbone resets empty attributes
  // right after starting to sync with the server. Since the actual sync happens
  // later (after the HAL URL has been fetched), we need to make sure the
  // attributes are passed in the options instead.
  if (!options.attrs) {
    options.attrs = model.toJSON(options);
  }

  var url = options.url || _.result(model, 'url');
  $.when(url).fail(failureHandler).done(function(actualUrl) {
    options.url = actualUrl;
    Backbone.originalSync.call(Backbone, method, model, options).fail(failureHandler).done(_.bind(deferred.resolve, deferred));
  });

  return deferred;
};

})(Backbone, _, UriTemplate, $);
