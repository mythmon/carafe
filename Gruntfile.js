module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      target: {
        src: ['src/**/*.js', 'test/**/*.js'],
      },
    },

    browserify: {
      carafe: {
        files: {
          'carafe.js': 'src/carafe.js',
        },
        options: {
          standalone: 'carafe',
        },
      },
    },

    uglify: {
      target: {
        src: ['carafe.js'],
        dest: 'carafe.min.js',
      },
    },
    
    watch: {
      scripts: {
        files: [
          'Gruntfile.js',
          'karma.conf.js',
          'src/**/*.js',
          'test/**/*.js'
        ],
      },
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', ['jshint', 'browserify', 'uglify']);
  grunt.registerTask('test', ['jshint', 'karma']);
};
