/*global define*/
define([
    'jquery',
    'jquery-ui',
    'dialogs/cwrcDialogBridge'
], function($, jqueryUi, CwrcDialogBridge) {
    'use strict';
    return function(writer) {
        return new CwrcDialogBridge(writer, {
            label: 'Title',
            localDialog: 'title',
            cwrcType: 'title'
        });
    };
});
