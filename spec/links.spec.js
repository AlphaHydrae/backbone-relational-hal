describe("HalRelationalResource", function() {

  var TestResource = undefined,
      res = undefined,
      json = {
        _links: {
          self: {
            href: "http://example.com/self"
          },
          search: {
            href: "http://example.com/search{?a,b,c}",
            templated: true
          },
          alternate: [
            {
              href: "http://example.com/self.html",
              hreflang: "en",
              type: "text/html"
            },
            {
              href: "http://example.com/self.md",
              hreflang: "en",
              type: "text/x-markdown"
            },
            {
              href: "http://example.com/self.txt",
              hreflang: "ja",
              type: "text/plain"
            }
          ]
        },
        prop: "value"
      };

  beforeEach(function() {
    TestResource = Backbone.RelationalHalResource.extend({});
    res = new TestResource(json);
  });

  describe("#hasLink", function() {

    it("should find a simple link", function() {
      expect(res.hasLink('self')).toBe(true);
    });

    it("should not find an unknown link", function() {
      expect(res.hasLink('unknown')).toBe(false);
    });
  }),

  describe("#link", function() {

    it("should find a simple link", function() {
      expect(res.link('self')).not.toBe(null);
    });

    it("should not find an unknown link", function() {
      expect(res.link('unknown')).toBe(null);
    });

    it("should return the href of a link", function() {
      expect(res.link('self').href()).toBe('http://example.com/self');
    });

    it("should expand an href that is a URI template", function() {
      expect(res.link('search').href({ template: { a: 'foo', c: 'bar' } })).toBe('http://example.com/search?a=foo&c=bar');
    });

    it("should expand an href that is a URI template with no parameters by default", function() {
      expect(res.link('search').href()).toBe('http://example.com/search');
    });

    it("should return the first element of an array of links", function() {
      expect(res.link('alternate').href()).toBe('http://example.com/self.html');
    });

    describe("with the 'all' option", function() {

      it("should return a backbone collection of links", function() {

        var links = res.link('alternate', { all: true });

        expect(links.length).toBe(3);
        expect(links.at(0).href()).toBe('http://example.com/self.html');
        expect(links.at(1).href()).toBe('http://example.com/self.md');
        expect(links.at(2).href()).toBe('http://example.com/self.txt');
        
        var matchingLink = links.findWhere({ type: 'text/html' });
        expect(matchingLink.href()).toBe('http://example.com/self.html');

        matchingLink = links.find(function(link) {
          return link.get('type') == 'text/x-markdown';
        });
        expect(matchingLink.href()).toBe('http://example.com/self.md');

        var matchingLinks = links.where({ hreflang: 'en' });
        expect(matchingLinks.length).toBe(2);
        expect(matchingLinks[0].href()).toBe('http://example.com/self.html');
        expect(matchingLinks[1].href()).toBe('http://example.com/self.md');

        matchingLinks = links.filter(function(link) {
          return link.get('type') == 'text/plain';
        });
        expect(matchingLinks.length).toBe(1);
        expect(matchingLinks[0].href()).toBe('http://example.com/self.txt');
      });

      it("should return a backbone collection even for one link", function() {
        var links = res.link('self', { all: true });
        expect(links.length).toBe(1);
        expect(links.at(0).href()).toBe('http://example.com/self');
      });

      it("should return an empty backbone collection for no links", function() {
        var links = res.link('unknown', { all: true });
        expect(links.length).toBe(0);
      });
    });
  });

  describe("#isNew", function() {

    it("should return false if the resource has a self link", function() {
      expect(new TestResource({ _links: { self: { href: 'http://example.com/self' } }, foo: 'bar' }).isNew()).toBe(false);
    });

    it("should return true if the resource has no self link", function() {
      expect(new TestResource({ foo: 'bar' }).isNew()).toBe(true);
    });
  });

  describe("#url", function() {

    it("should have no URL by default", function() {
      expect(new TestResource().url()).toBe(null);
    });

    it("should use the href of its self link as the URL", function() {
      expect(new TestResource({ _links: { self: { href: 'http://example.com/self' } } }).url()).toBe('http://example.com/self');
    });
  });
});
