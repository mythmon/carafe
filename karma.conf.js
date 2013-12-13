// Karma configuration
// Generated on Fri Dec 13 2013 12:02:29 GMT-0800 (PST)

module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['mocha', 'chai', 'browserify'],

    files: [
      'node_modules/d3/d3.js',
      'node_modules/d3.chart/d3.chart.js',
      'test/**/*.js'
    ],

    exclude: [],

    preprocessors: {
      'test/**/*.js': ['browserify'],
    },

    browserify: {
      watch: true,
      debug: true,
    },

    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    captureTimeout: 60000,
    singleRun: false
  });
};
