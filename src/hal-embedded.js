var HalModelEmbedded = RelationalModel.extend({

  embedded: function(rel) {
    return this.get(rel);
  }
});
