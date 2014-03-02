/*!
 * backbone-relational-hal v0.1.0
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

    var model = options.model || (options.type ? new options.type() : new Backbone.RelationalHalResource());
    model.url = this.href(options.href);

    return model;
  },

  fetchResource: function(options) {
    return this.model(options).fetch();
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

Backbone.fetchHalHref = function(refs, source, deferred) {

  deferred = deferred || $.Deferred();

  var url;
  if (source) {

    if (!_.isObject(source._links)) {
      throw new Error('Expected source to have a links in the _links property, got ' + JSON.stringify(source));
    }

    var ref = refs.shift();

    var link = source._links[ref.rel];
    if (!link) {
      throw new Error('Expected source links to have a ' + ref.rel + ' link, got ' + _.keys(source._links).join(', '));
    } else if (!link.href) {
      throw new Error('Expected source link ' + ref.rel + ' to have an href property, got ' + JSON.stringify(link));
    } else if (ref.template && !link.templated) {
      throw new Error('Template parameters were given for link ' + ref.rel + ' but it is not templated, got ' + JSON.stringify(link));
    }

    url = link.href;
    if (ref.template) {
      url = new UriTemplate(url);
      url = url.fillFromObject(ref.template);
    }
  } else {
    url = ApiPath.build();
  }

  if (!refs.length) {
    App.debug('HAL link is ' + url);
    deferred.resolve(url);
    return deferred;
  }

  App.debug('Fetching HAL link ' + refs[0].rel + ' from ' + url);

  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json'
  }).done(function(response) {
    Backbone.fetchHalHref(refs, response, deferred);
  }).fail(function() {
    deferred.reject('Could not GET ' + url);
  });

  return deferred;
};

Backbone.originalSync = Backbone.sync;
Backbone.sync = function(method, model, options) {
  options = _.clone(options) || {};

  var url = null;

  try {
    url = options.url || _.result(model, 'url');
  } catch (e) {
    // nothing to do
  }

  var cachedUrl = _.result(model, 'halCachedUrl');
  if (!cachedUrl && !model.halUrl) {
    cachedUrl = _.result(model.collection, 'halCachedUrl');
  }

  if (!url && cachedUrl) {
    url = cachedUrl;
    options.url = cachedUrl;
  }

  if (url) {
    return Backbone.originalSync.apply(Backbone, Array.prototype.slice.call(arguments));
  }

  var halUrl = _.result(model, 'halUrl'),
      halUrlSource = model;

  if (!halUrl) {
    halUrl = _.result(model.collection, 'halUrl');
    halUrlSource = model.collection;
  }

  if (!halUrl) {
    throw new Error('Model/collection must have url or halUrl.');
  }

  // WTF: fix for weird backbone behavior.
  // For some reason, when creating a model, backbone resets empty attributes
  // right after starting to sync with the server. Since the actual sync happens
  // later (after the HAL URL has been fetched), we need to make sure the
  // attributes are passed in the options instead.
  if (!options.attrs) {
    options.attrs = model.toJSON(options);
  }

  var args = Array.prototype.slice.call(arguments),
      deferred = $.Deferred();

  Backbone.fetchHalHref(halUrl.slice()).fail(_.bind(deferred.reject, deferred)).done(function(url) {
    options.url = url;
    halUrlSource.halCachedUrl = url;
    Backbone.originalSync.apply(Backbone, args).done(_.bind(deferred.resolve, deferred)).fail(_.bind(deferred.reject, deferred));
  });

  return deferred;
};

})(Backbone, _, UriTemplate, $);
