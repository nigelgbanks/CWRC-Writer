/*global define*/
define([
    'jquery',
    'jquery-ui',
    'dialogs/cwrcDialogBridge',
    'cwrcDialogs'
], function($, jqueryUi, CwrcDialogBridge, cD) {
    'use strict';
    return function(writer) {
        var w = writer;
        var schema = null;
        if (w.initialConfig.cwrcDialogs !== null && w.initialConfig.cwrcDialogs.schemas !== null) {
            schema = w.initialConfig.cwrcDialogs.schemas.place;
        }
        if (schema === null) {
            schema = 'js/cwrcDialogs/schemas/entities.rng';
        }
        cD.setPlaceSchema(schema);
        return new CwrcDialogBridge(w, {
            label: 'Place',
            localDialog: 'place',
            cwrcType: 'place'
        });
    };
});
