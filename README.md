# backbone-relational-hal

**Consume [HAL+JSON](http://stateless.co/hal_specification.html) APIs  with [Backbone.js](http://backbonejs.org) and [Backbone-relational.js](https://github.com/PaulUithol/Backbone-relational).**

[![NPM version](https://badge.fury.io/js/backbone-relational-hal.png)](http://badge.fury.io/js/backbone-relational-hal)
[![Build Status](https://secure.travis-ci.org/AlphaHydrae/backbone-relational-hal.png)](http://travis-ci.org/AlphaHydrae/backbone-relational-hal)

## Requirements

**backbone-relational-hal** is currently tested with the following libraries:

* [Underscore](http://underscorejs.org) v1.7.0
* [jQuery](http://jquery.com) v2.1.1
* [uri-templates](https://github.com/geraintluff/uri-templates) v0.1.5
* [Backbone.js](http://backbonejs.org) v1.1.2
* [Backbone-relational.js](http://backbonerelational.org) v0.8.8

## Installation

With bower:

    bower install --save backbone-relational-hal

Builds:

* Development: [backbone-relational-hal.js](https://raw.github.com/AlphaHydrae/backbone-relational-hal/master/backbone-relational-hal.js)
* Production: [backbone-relational-hal.min.js](https://raw.github.com/AlphaHydrae/backbone-relational-hal/master/backbone-relational-hal.min.js)

## Usage

This library adds a new `Backbone.RelationalHalResource` class that you can extend like `Backbone.RelationalModel` or `Backbone.Model`.

```js
var Person = Backbone.RelationalHalResource.extend({
  url: '/people/2'
});
```

**HAL Links**

* [Hyperlinks](#hyperlinks)
* [URI templates](#uri-templates)
* [Generating &lt;a&gt; tags from links](#generating-a-tags-from-links)

**HAL Embedded Resources**

* [Embedding resources](#embedding-resources)

### Hyperlinks

HAL resources can parse HAL+JSON links out of the box.

Let's instantiate the above sample class and fetch data from the server.

```js
var person = new Person();
person.fetch();
```

Assume the server would return this data containing several links.

```json
{
  "_links": {
    "self": { "href": '/people/2' },
    "search": { "href": '/people/2/search{?email}', "templated": true },
    "alternate": [
      { "href": '/people/2.html', "type": 'text/html' },
      { "href": '/people/2.xml', "type": 'application/xml' }
    ]
  },
  "name": "Nobody"
}
```

Use the `link` method of a HAL resource to retrieve useful link objects.

```js
// get a link object
person.link('self'); // => a Backbone.RelationalModel

// get the href of a link
person.link('self').href(); // => '/people/2'

// get a list of links
var alternates = person.link('alternate', { all: true }); // => Backbone.Collection of link objects

// get one of the links in the list
alternates.at(0).href(); // => '/people/2.html'

// find a link matching criteria
// (using Backbone's Underscore proxy methods)
alternates.findWhere({ type: 'application/xml' }).href(); // => '/people/2.xml'
```

### URI Templates

Templated links can be expanded using the [uri-templates](https://github.com/geraintluff/uri-templates) library.

```js
// get a templated link without parameters
person.link('search').href(); // => '/people/2/search'

// expand a link template with parameters
person.link('search').href({ template: { email: 'foo@example.com' } }); // => '/people/2/search?email=foo@example.com'
```

### Generating &lt;a&gt; Tags from Links

The `tag` method of link objects can generate HTML link tags for you.

```js
// simple tag with text content
person.link('self').tag('John'); // => $('<a href="/people/2">John</a>')

// HTML content
var content = $('<strong />').text('Jane');
person.link('self').tag(content, { html: true }); // => $('<a href="/people/2"><strong>Jane</strong></a>')
```

### Embedding Resources

Define embedded resources with the `halEmbedded` property when extending a HAL resource.
Embedded resources are Backbone-relational.js relations and use the same options.

```js
var Company = Backbone.RelationalHalResource.extend({

  halEmbedded: [
    {
      type: Backbone.HasOne,
      key: 'http://example.com/rel/manager',
      relatedModel: Person
    },
    {
      type: Backbone.HasMany,
      key: 'http://example.com/rel/employees',
      relatedModel: Person
    }
  ]
});
```

You can also use an equivalent HAL-like syntax where the key in the `halEmbedded` object is automatically used as the relation key.

```js
var Company = Backbone.RelationalHalResource.extend({

  halEmbedded: {
    'http://example.com/rel/manager': {
      type: Backbone.HasOne,
      relatedModel: Person
    },
    'http://example.com/rel/employees': {
      type: Backbone.HasMany,
      relatedModel: Person
    }
  }
});
```

Assume the server would return this data for a company.

```json
{
  "name": "Initech",
  "_embedded": {
    "http://example.com/rel/manager": {
      "name": "Bill Lumbergh"
    },
    "http://example.com/rel/employees": [
      {
        "name": "Peter Gibbons"
      },
      {
        "name": "Michael Bolton"
      },
      {
        "name": "Samir Nagheenanajar"
      }
    ]
  }
}
```

You can retrieve embedded resources with the `embedded` method.

```js
// get an embedded resource
company.embedded('http://example.com/rel/manager'); // => Person
company.embedded('http://example.com/rel/manager').get('name'); // => 'Bill Lumbergh'

// get a Backbone.Collection of embedded resources
var employees = company.embedded('http://example.com/rel/employees'); // => Backbone.Collection

// get one of the resources in the collection
employees.at(0); // => Person
employees.at(0).get('name'); // => 'Peter Gibbons'
```

## Meta

* **Author:** Simon Oulevay (Alpha Hydrae)
* **License:** MIT (see [LICENSE.txt](https://raw.github.com/AlphaHydrae/backbone-relational-hal/master/LICENSE.txt))
