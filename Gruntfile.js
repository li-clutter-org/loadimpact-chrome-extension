/*jshint camelcase: false*/

'use strict';

var mountFolder = function(connect, dir) {
    return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dev: 'dev',
        dist: 'dist'
    };

    grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
        yeoman: yeomanConfig,
        watch: {
            options: {
                spawn: false
            },
            less: {
                files: ['<%= yeoman.app %>/styles/{,*/}*.less'],
                tasks: ['less']
            }
        },
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            }
        },
        clean: {
            dev: {
                files: [{
                    dot: true,
                    src: [
                        '<%= yeoman.dev %>/*'
                    ]
                }]
            },
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/{,*/}*.js',
                'test/spec/{,*/}*.js'
            ]
        },
        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ['http://localhost:<%= connect.options.port %>/index.html']
                }
            }
        },
        neuter: {
            options: {
                includeSourceURL: true,
                includeSourceMap: true,
                template: '{%= src %}'
            },
            libackground: {
                files: {
                    '.tmp/scripts/background.js': '<%= yeoman.app %>/scripts/background.js'
                }
            },
            lieditor: {
                files: {
                    '.tmp/scripts/editor.js': '<%= yeoman.app %>/scripts/editor.js'
                }
            },
            lioptions: {
                files: {
                    '.tmp/scripts/options.js': '<%= yeoman.app %>/scripts/options.js'
                }
            },
            lipopup: {
                files: {
                    '.tmp/scripts/popup.js': '<%= yeoman.app %>/scripts/popup.js'
                }
            }
        },
        emberTemplates: {
            options: {
                templateName: function(sourceFile) {
                    return sourceFile.replace(/app\/templates\//, '').replace(/\.html/, '');
                }
            },
            '<%= yeoman.app %>/templates/compiled.js': ['<%= yeoman.app %>/templates/{,*/}*.html']
        },
        less: {
            dev: {
                options: {
                    paths: ['<%= yeoman.app %>/styles'],
                    cleancss: true
                },
                files: {
                    '.tmp/styles/main.css': ['<%= yeoman.app %>/styles/main.less']
                }
            },
            dist: {
                options: {
                    paths: ['<%= yeoman.app %>/styles'],
                    cleancss: true
                },
                files: {
                    '.tmp/styles/main.css': '<%= yeoman.app %>/styles/main.less'
                }
            }
        },
        // not used since Uglify task does concat,
        // but still available if needed
        /*concat: {
            dist: {}
        },*/
        uglify: {
            dev: {
                options: {
                    beautify: false,
                    compress: false,
                    mangle: false
                },
                files: {
                    '<%= yeoman.dev %>/scripts/background.js': ['.tmp/scripts/background.js'],
                    '<%= yeoman.dev %>/scripts/editor.js': ['.tmp/scripts/editor.js'],
                    '<%= yeoman.dev %>/scripts/options.js': ['.tmp/scripts/options.js'],
                    '<%= yeoman.dev %>/scripts/popup.js': ['.tmp/scripts/popup.js']
                }
            },
            dist: {
                options: {
                    compress: false,
                    mangle: true
                },
                files: {
                    '<%= yeoman.dist %>/scripts/background.js': ['.tmp/scripts/background.js'],
                    '<%= yeoman.dist %>/scripts/editor.js': ['.tmp/scripts/editor.js'],
                    '<%= yeoman.dist %>/scripts/options.js': ['.tmp/scripts/options.js'],
                    '<%= yeoman.dist %>/scripts/popup.js': ['.tmp/scripts/popup.js']
                }
            }
        },
        useminPrepare: {
            options: {
                dest: '<%= yeoman.dist %>'
            },
            html: [
                '<%= yeoman.app %>/background.html',
                '<%= yeoman.app %>/popup.html',
                '<%= yeoman.app %>/options.html',
                '<%= yeoman.app %>/editor.html'
            ]
        },
        usemin: {
            options: {
                dirs: ['<%= yeoman.dist %>']
            },
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css']
        },
        imagemin: {
            dev: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dev %>/images'
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        cssmin: {
            dev: {
                files: {
                    '<%= yeoman.dev %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/lib/codemirror/lib/codemirror.css',
                        '<%= yeoman.app %>/styles/{,*/}*.css'
                    ]
                }
            },
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/lib/codemirror/lib/codemirror.css',
                        '<%= yeoman.app %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        htmlmin: {
            dev: {
                options: {
                    removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>',
                    src: '*.html',
                    dest: '<%= yeoman.dev %>'
                }]
            },
            dist: {
                options: {
                    removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>',
                    src: '*.html',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },
        // Put files not handled in other tasks here
        copy: {
            dev: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dev %>',
                    src: [
                        '*.{ico,png,txt,json}',
                        'images/{,*/}*.{webp,gif}',
                        'fonts/{,*/}*.{woff,ttf,svg,eot}',
                        '_locales/{,*/}*.json'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dev %>/images',
                    src: [
                        'generated/*'
                    ]
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt,json}',
                        'images/{,*/}*.{webp,gif}',
                        'fonts/{,*/}*.{woff,ttf,svg,eot}',
                        '_locales/{,*/}*.json'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: [
                        'generated/*'
                    ]
                }]
            }
        },
        concurrent: {
            server: [
                'less:dist',
                'watch'
            ],
            test: [
                'less:dist'
            ],
            dev: [
                'less:dev',
                'imagemin:dev',
                'htmlmin:dev'
            ],
            dist: [
                'less:dist',
                'imagemin:dist',
                'svgmin',
                'htmlmin:dist'
            ]
        },
        compress: {
            dist: {
                options: {
                    archive: 'package/Load Impact User Scenario Recorder v<%= pkg.version %>.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: ''
                }]
            }
        }
    });

    grunt.registerTask('test', [
        'clean:server',
        'concurrent:test',
        'connect:test',
        'mocha'
    ]);

    grunt.registerTask('dev', [
        'clean:dev',
        'emberTemplates',
        'neuter',
        'concurrent:dev',
        'cssmin:dev',
        'uglify:dev',
        'copy:dev'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'emberTemplates',
        'neuter',
        'useminPrepare',
        'concurrent:dist',
        'cssmin:dist',
        //'concat',
        'uglify:dist',
        'copy:dist',
        'usemin',
        'compress'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'test',
        'build'
    ]);
};
