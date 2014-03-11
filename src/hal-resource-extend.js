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
