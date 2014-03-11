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
