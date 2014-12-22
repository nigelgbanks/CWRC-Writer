
/*global define*/
define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jqueryUi, DialogForm) {
    'use strict';
    return function(id, writer) {
        var w = writer;
        var html = '' +
            '<div id="' + id + 'Dialog" class="annotationDialog">' +
            '<div id="' + id + '_certainty" data-transform="buttonset" data-type="radio" data-mapping="custom.tag">' +
            '<p>Type of place:</p>' +
            '<input type="radio" id="' + id + '_address" name="' + id + '_type_place" value="ADDRESS" data-default="true" /><label for="' + id + '_address">Address</label>' +
            '<input type="radio" id="' + id + '_area" name="' + id + '_type_place" value="AREA" /><label for="' + id + '_area">Area</label>' +
            '<input type="radio" id="' + id + '_geog" name="' + id + '_type_place" value="GEOG" /><label for="' + id + '_geog">Geog</label>' +
            '<input type="radio" id="' + id + '_placename" name="' + id + '_type_place" value="PLACENAME" /><label for="' + id + '_placename">Placename</label>' +
            '<input type="radio" id="' + id + '_region" name="' + id + '_type_place" value="REGION" /><label for="' + id + '_region">Region</label>' +
            '<input type="radio" id="' + id + '_settlement" name="' + id + '_type_place" value="SETTLEMENT" /><label for="' + id + '_settlement">Settlement</label>' +
            '</div>' +
            '</div>';

        var dialog = new DialogForm({
            writer: w,
            id: id,
            type: 'place',
            title: 'Tag Place',
            height: 150,
            width: 450,
            html: html
        });

        return {
            show: function(config) {
                dialog.show(config);
            }
        };
    };
});
