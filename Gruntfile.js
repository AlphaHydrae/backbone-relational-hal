module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    meta: {
      banner: '/*!\n' +
              ' * backbone-relational-hal v<%= pkg.version %>\n' +
              ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
              ' * Distributed under MIT license\n' +
              ' * <%= pkg.homepage %>\n' +
              ' */\n'
    },

    jshint: {
      standard: {
        src: [ 'src/*.js' ],
        globals: {
          Backbone: true,
          _: true
        }
      }
    },

    concat: {
      standard: {
        options: {
          banner: '<%= meta.banner %>'
        },
        src: [
          'res/header.js',
          'src/hal-links.js',
          'src/hal-embedded.js',
          'src/hal-resource.js',
          'src/hal-resource-extend.js',
          'src/backbone-sync.js',
          'res/footer.js'
        ],
        dest: 'backbone-relational-hal.js'
      }
    },

    jasmine: {
      standard: {
        src: [
          'backbone-relational-hal.js'
        ],
        options: {
          vendor: [
            'vendor/underscore.js',
            'vendor/jquery.js',
            'vendor/uri-templates.js',
            'vendor/backbone.js',
            'vendor/backbone-relational.js'
          ],
          helpers: 'spec/helpers/*.js',
          specs: 'spec/**/*.spec.js'
        }
      }
    },

    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      build: {
        src: '<%= pkg.name %>.js',
        dest: '<%= pkg.name %>.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  grunt.registerTask('default', [ 'jshint', 'concat', 'jasmine', 'uglify' ]);
};
