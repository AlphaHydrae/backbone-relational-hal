/*!
 * backbone-relational-hal v0.1.2
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

var HalModelEmbedded = RelationalModel.extend({

  toJSON: function() {
    return _.omit(RelationalModel.prototype.toJSON.apply(this, arguments), 'id');
  },

  embedded: function(rel) {
    return this.get(rel) || null;
  }
});

var n = 1;

var HalResource = Backbone.RelationalHalResource = RelationalModel.extend({

  initialize: function(attrs, options) {

    this.halEmbeddedId = n++;

    if (this.has('_embedded') && !this.get('_embedded').id) {
      this.get('_embedded').set({ id: this.halEmbeddedId }, { silent: true });
    }

    _.extend(this, _.pick(options || {}, 'halUrlTemplate'));

    this.initializeResource.apply(this, arguments);
  },

  initializeResource: function() {},

  parse: function(response) {

    if (response._embedded) {
      response._embedded.id = this.halEmbeddedId;
    }

    return response;
  },

  url: function() {

    if (this.hasLink('self')) {

      var options = {};
      if (this.halUrlTemplate) {
        options.template = _.result(this, 'halUrlTemplate');
      }

      return this.link('self').href(options);
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

var customExtend = function(options) {

  options = _.defaults({}, options, {
    relations: []
  });

  var embeddedRelations;
  if (_.isArray(options.halEmbedded)) {
    embeddedRelations = _.map(options.halEmbedded, function(rel) {
      return _.clone(rel);
    });
  } else if (_.isObject(options.halEmbedded)) {
    embeddedRelations = _.reduce(options.halEmbedded, function(memo, rel, key) {
      memo.push(_.extend({}, rel, { key: key }));
      return memo;
    }, []);
  } else if (typeof(options.halEmbedded) != 'undefined') {
    throw new Error('halEmbedded must be an array or object');
  } else {

    var previousEmbedded = _.findWhere(this.prototype.relations, { key: '_embedded' });
    if (previousEmbedded && previousEmbedded.relatedModel) {
      embeddedRelations = (previousEmbedded.relatedModel.prototype.relations || []).slice();
    }
  }

  var EmbeddedModel = HalModelEmbedded.extend({
    relations: embeddedRelations
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
    relatedModel: EmbeddedModel,
    includeInJSON: false
  });

  var res = relationalHalResourceExtend.call(this, options);
  res.extend = customExtend;

  return res;
};

HalResource.extend = customExtend;

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
