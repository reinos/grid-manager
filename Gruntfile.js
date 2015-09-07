'use strict';

module.exports = function(grunt) {
    grunt.initConfig({

        less: {
            options: {
                compress: false
            },

            dev: {
                files: {
                    'src/css/gridmanager.css': 'src/less/gridmanager.less'
                }
                //options: {
                //    sourceMap: true,
                //    outputSourceFiles: true,
                //    sourceMapFilename: 'public/src/css/main.css.map',
                //    sourceMapURL: '/src/css/main.css.map',
                //    sourceMapRootpath: '/'
                //}
            }
        },



        //uglify: {
        //    options: {
        //        mangle: true,
        //        compress: true,
        //        preserveComments: false
        //    }
        //    prod: {
        //        files: {
        //            'public/dist/js/jexiaBundle.js':
        //                ['public/dist/js/jexiaBundle.js'],
        //            'public/dist/js/libsBundle.js':
        //                ['public/dist/js/libsBundle.js'],
        //            'public/dist/js/login.js':
        //                ['public/dist/js/login.js']
        //        }
        //    }
        //},

        //jshint: {
        //    all: [
        //        'Gruntfile.js',
        //        'node_modules/jexia/**/*.js',
        //        '!node_modules/jexia/theme/**/*.js'
        //    ],
        //    options: {
        //        jshintrc: true
        //    }
        //},

        watch: {
            options: {
                nospawn: true
            },

            css: {
                files: ['src/less/*.less'],
                tasks: ['css-dev']
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('css-dev', ['less:dev']);

    grunt.registerTask('dev', ['watch']);

    // 'build' will be the task to prepare everything for production (dist)
    //grunt.registerTask('build', [
    //    'css-prod',
    //    'css-login-prod',
    //    'copy:prod',
    //    'js-prod'
    //]);
};
