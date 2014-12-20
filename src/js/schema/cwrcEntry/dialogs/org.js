/*jshint browser: true*/
/*global define*/
define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jsqueryUi, DialogForm) {
    'use strict';
    return function(id, writer) {
        var w = writer;
        var html = '' +
            '<div id="' + id + 'Dialog" class="annotationDialog">' +
            '<div>' +
            '<label for="' + id + '_input">Standard name</label>' +
            '<input type="text" id="' + id + '_input" data-type="textbox" data-mapping="STANDARD" />' +
            '</div>' +
            '</div>';
        var dialog = new DialogForm({
            writer: w,
            id: id,
            width: 200,
            height: 150,
            type: 'org',
            title: 'Tag Organization',
            html: html
        });

        return {
            show: function(config) {
                dialog.show(config);
            }
        };
    };
});
