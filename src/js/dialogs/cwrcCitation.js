/*global define*/
define([
    'jquery',
    'jquery-ui',
    'dialogs/cwrcDialogBridge'
], function($, jqueryUi, CwrcDialogBridge) {
    'use strict';
    return function(writer) {
        return new CwrcDialogBridge(writer, {
            label: 'Citation',
            localDialog: 'citation',
            cwrcType: 'title'
        });
    };
});
