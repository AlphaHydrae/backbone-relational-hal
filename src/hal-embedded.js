var HalModelEmbedded = RelationalModel.extend({

  toJSON: function() {
    return _.omit(RelationalModel.prototype.toJSON.apply(this, arguments), 'id');
  },

  embedded: function(rel) {
    return this.get(rel) || null;
  }
});
