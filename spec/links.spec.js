describe("HAL links", function() {

  var res = undefined,
      json = {
        _links: {
          self: {
            href: "http://example.com/self"
          }
        },
        prop: 'value'
      };

  beforeEach(function() {

    var TestResource = Backbone.RelationalHalResource.extend({
      halLinks: [ 'self' ]
    });

    res = new TestResource(json);
  });

  it("should find a simple link", function() {
    expect(res.link('self').href()).toBe('http://example.com/self');
  });
});
