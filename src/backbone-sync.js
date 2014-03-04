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
