/*jshint browser: true*/
/*global require, tinymce*/
(function(tinymce) {
    'use strict';
    // make sure snippet is available
    var $ = require('jquery');
    require([ 'jquery.snippet' ]);

    tinymce.create('tinymce.plugins.ViewSource', {
        init: function(ed, url) {
            var that = this;
            that.url = url;
            that.editor = ed;

            ed.addCommand('viewSource', function() {
                var content = ed.writer.converter.getDocumentContent(false);
                var source = '<pre>' + that.htmlEncode(content) + '</pre>';
                var dialog = $('#viewSourceDialog');
                dialog.html(source);
                dialog.find('> pre').snippet('html', {
                    style: 'typical',
                    transparent: true,
                    showNum: false,
                    menu: false
                });
                that.d.dialog('open');
            });
            $(document.body).append('' +
                '<div id="viewSourceDialog">' +
                '</div>'
            );
            that.d = $('#viewSourceDialog');
            that.d.dialog({
                title: 'View Source',
                modal: true,
                resizable: true,
                closeOnEscape: true,
                height: 480,
                width: 640,
                autoOpen: false,
                buttons: {
                    'Ok': function() {
                        that.d.dialog('close');
                    }
                }
            });
        },
        htmlEncode: function(str) {
            return str.replace(/[&<>"']/g, function($0) {
                return '&' + {
                    '&': 'amp',
                    '<': 'lt',
                    '>': 'gt',
                    '\'': 'quot',
                    '"': '#39'
                }[$0] + ';';
            });
        },
        createControl: function(n, cm) {
            var that = this,
                url = that.url + '/../../img/';
            if (n === 'viewsource') {
                return cm.createButton('viewSourceButton', {
                    title: 'View Source',
                    image: url + 'viewsource.gif',
                    'class': 'wideButton',
                    onclick: function() {
                        that.editor.execCommand('removeHighlights');
                        that.editor.execCommand('viewSource');
                    }
                });
            }
            return null;
        }
    });
    tinymce.PluginManager.add('viewsource', tinymce.plugins.ViewSource);
})(tinymce);
