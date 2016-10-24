module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        paths: {
            dev: 'dev'
        },
        uglify: {
            options: {
                mangle: false
            },
            build: {
                files: {
                    'build/js/steve-zimmer.min.js': ['dev/js/steve-zimmer.js']
                }
            }
        },
        cssmin: {
            target: {
                files: {
                    'build/css/styles.min.css': 'dev/css/styles.css'
                }
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: {
                src: ['dev/js/*.js']
            }
        },
        jscs: {
            src: ['dev/js/*.js'],
            options: {
                config: '.jscsrc'
            }
        },
        copy: {
            dev: {
                files: [{
                    src: [
                        '*.svg'
                    ],
                    expand: true,
                    cwd: 'dev/svg',
                    dest: 'build/svg/'
                },
                {
                    src: [
                        '*.{jpg,gif,png}'
                    ],
                    expand: true,
                    cwd: 'dev/img',
                    dest: 'build/img/'
                },
                {
                    src: [
                        '*.{html,php}'
                    ],
                    expand: true,
                    cwd: 'dev',
                    dest: 'build/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jscs');

    grunt.registerTask('lint', ['jshint', 'jscs']);
    grunt.registerTask('default', ['jshint', 'jscs', 'uglify', 'cssmin', 'copy']);
};
