describe("HAL embedded resources", function() {

  var Person = Backbone.RelationalHalResource.extend({});

  var Company = Backbone.RelationalHalResource.extend({

    halEmbedded: [
      {
        type: Backbone.HasOne,
        key: 'brh:manager',
        relatedModel: Person
      },
      {
        type: Backbone.HasMany,
        key: 'brh:employees',
        relatedModel: Person
      }
    ]
  });

  var json = {
    name: 'Initech',
    _embedded: {
      'brh:manager': { name: 'Bill Lumbergh' },
      'brh:employees': [
        { name: 'Peter Gibbons' },
        { name: 'Michael Bolton' },
        { name: 'Samir Nagheenanajar' }
      ]
    }
  };

  var company;
  beforeEach(function() {
    company = new Company(json);
  });

  describe("#hasEmbedded", function() {

    it("should find an embedded resource", function() {
      expect(company.hasEmbedded('brh:manager')).toBe(true);
    });

    it("should find a collection of embedded resources", function() {
      expect(company.hasEmbedded('brh:employees')).toBe(true);
    });

    it("should not find an unknown embedded resource", function() {
      expect(company.hasEmbedded('brh:unknown')).toBe(false);
    });
  });

  describe("#embedded", function() {

    it("should find an embedded resource", function() {
      expect(company.embedded('brh:manager')).not.toBe(null);
      expect(company.embedded('brh:manager') instanceof Person).toBe(true);
      expect(company.embedded('brh:manager').get('name')).toBe('Bill Lumbergh');
    });

    it("should not find an unknown embedded resource", function() {
      expect(company.embedded('brh:unknown')).toBe(null);
    });

    it("should find a collection of embedded resources", function() {
      expect(company.embedded('brh:employees')).not.toBe(null);
      expect(company.embedded('brh:employees') instanceof Backbone.Collection).toBe(true);
      expect(company.embedded('brh:employees').length).toBe(3);
      expect(company.embedded('brh:employees').at(0).get('name')).toBe('Peter Gibbons');
      expect(company.embedded('brh:employees').at(1).get('name')).toBe('Michael Bolton');
      expect(company.embedded('brh:employees').at(2).get('name')).toBe('Samir Nagheenanajar');
    });
  });
});
