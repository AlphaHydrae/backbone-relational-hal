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
    includeInJSON: false,
    parse: true
  });

  return relationalHalResourceExtend.call(HalResource, options);
};
