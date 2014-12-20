var require = {
    paths: {
        'text': 'lib/require/text', // require.js text plugin
        'jquery': [ 'http://code.jquery.com/jquery-1.9.1.min', 'lib/jquery/jquery-1.9.1' ],
        'jquery-ui': [ 'lib/jquery/jquery-ui-1.10.4.min' ],
        'jquery-migrate': [ 'lib/jquery/jquery-migrate-1.2.1' ],
        'jquery.layout': 'lib/jquery/jquery.layout-latest.min',
        'jquery.tablayout': 'lib/jquery/jquery.layout.resizeTabLayout-1.3',
        'jquery.contextmenu': 'lib/jquery/jquery.contextmenu',
        'jquery.tmpl': 'lib/jquery/jquery.tmpl.min',
        'jquery.watermark': 'lib/jquery/jquery.watermark.min',
        'jquery.jstree': 'lib/jstree/jstree.3.0.0',
        'jquery.snippet': 'lib/snippet/jquery.snippet.min',
        'jquery.xpath': 'lib/jquery/jquery.xpath',

        'tinymce': 'lib/tinymce/tiny_mce_src',
        'tinymce-copyevent': 'lib/tinymce/copy_event',

        'objtree': 'lib/objtree/ObjTree',
        'moment': 'lib/moment/moment.min',

        'octokit': 'lib/octokit/octokit',

        'schemaManager': 'schema/schemaManager',
        'mapper': 'schema/mapper',

        'dialogForm': 'dialogs/dialogForm',
        'attributeWidget': 'dialogs/attributeWidget',

        // cwrcDialogs
        'knockout': [
            'http://cdnjs.cloudflare.com/ajax/libs/knockout/2.3.0/knockout-min',
            'lib/knockout/knockout-2.3.0'
        ],
        'bootstrap': [ 'lib/bootstrap/bootstrap.min' ],
        'bootstrap-datepicker': 'lib/bootstrap/bootstrap-datepicker',
        'cwrc-api': 'cwrcDialogs/cwrc-api',
        'cwrcDialogs': 'cwrcDialogs/cD'
    },
    shim: {
        'jquery-ui': [ 'jquery' ],
        'jquery.layout': [ 'jquery' ],
        'jquery.tablayout': [ 'jquery.layout' ],
        'jquery.contextmenu': [ 'jquery' ],
        'jquery.tmpl': [ 'jquery' ],
        'jquery.watermark': [ 'jquery' ],
        'jquery.snippet': [ 'jquery', 'jquery-migrate' ],
        'jquery.xpath': [ 'jquery' ],
        'tinymce': {
            exports: 'tinymce',
            init: function() {
                'use strict';
                this.tinymce.DOM.events.domLoaded = true;
                return this.tinymce;
            }
        },
        'tinymce-copyevent': [ 'tinymce' ],
        'bootstrap': [ 'jquery', 'jquery-ui' ],
        'bootstrap-datepicker': [ 'bootstrap' ],
        'cwrcDialogs': {
            deps: [
                'jquery',
                'jquery-ui',
                'knockout',
                'bootstrap',
                'bootstrap-datepicker',
                'cwrc-api'
            ]
        }
    },
    map: {
        // '*' means all modules will get 'jquery-private'
        // for their 'jquery' dependency.
        '*': { 'jquery': 'jquery-private' },
        'jquery-private': { 'jquery': 'jquery' }
    }
    // cache busting
    // urlArgs: "bust=" +  (new Date()).getTime(),
};
