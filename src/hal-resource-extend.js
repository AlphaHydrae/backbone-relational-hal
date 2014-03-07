var relationalHalResourceExtend = HalResource.extend;

HalResource.extend = function(options) {

  options = _.defaults({}, options, {
    relations: [],
    halEmbedded: []
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
  }

  var EmbeddedModel = HalModelEmbedded.extend({

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
    relatedModel: EmbeddedModel,
    includeInJSON: false
  });

  return relationalHalResourceExtend.call(HalResource, options);
};
