/*jshint browser: true, devel: true*/
/*global define, require*/
define([
    'jquery',
    'jquery-ui',
    'cwrcDialogs',
    'dialogs/addSchema', 'dialogs/fileManager', 'dialogs/header', 'dialogs/message', 'dialogs/triple',
    'dialogs/cwrcPerson', 'dialogs/cwrcOrg', 'dialogs/cwrcPlace', 'dialogs/cwrcTitle', 'dialogs/cwrcCitation',
    'dialogs/schemaTags', 'dialogs/help'
], function($, jqueryui, cD, AddSchema, FileManager, Header, Message, Triple, CwrcPerson, CwrcOrg, CwrcPlace, CwrcTitle, CwrcCitation, SchemaTags, Help) {
    'use strict';
    // add event listeners to all of our jquery ui dialogs
    $.extend($.ui.dialog.prototype.options, {
        create: function(event) {
            $(event.target).on('dialogopen', function(event) {
                // wrap our dialogs in the cwrc css scope
                var docHeight;
                $(event.target).parent('.ui-dialog').prev('.ui-widget-overlay').andSelf().wrapAll('<div class="cwrc" />');
                // centre the dialog
                $(this).dialog('option', 'position', { my: 'center', at: 'center', of: window });
                // resize if necessary
                docHeight = $(document).height();
                if ($(this).dialog('option', 'height') >= docHeight) {
                    $(this).dialog('option', 'height', docHeight * 0.85);
                }
            }).on('dialogclose', function(event) {
                $(event.target).parent('.ui-dialog').unwrap();
            });
        }
    });
    // do the same for tooltips
    $.extend($.ui.tooltip.prototype.options, {
        create: function(event) {
            $(event.target).on('tooltipopen', function(event, ui) {
                $(ui.tooltip).wrap('<div class="cwrc" />');
            }).on('tooltipclose', function(event, ui) {
                $(ui.tooltip).unwrap();
            });
        }
    });

    /**
     * @class DialogManager
     * @param {Writer} writer
     */
    return function(writer) {
        var pm;
        var w = writer,
            conf,
            schemaDialogs = {},
            dialogs = {
                message: new Message(w),
                help: new Help(w),
                triple: new Triple(w),
                header: new Header(w),
                filemanager: new FileManager(w),
                addschema: new AddSchema(w),
                person: new CwrcPerson(w),
                org: new CwrcOrg(w),
                title: new CwrcTitle(w),
                citation: new CwrcCitation(w),
                place: new CwrcPlace(w),
                schemaTags: new SchemaTags(w)
            },
            dialogNames = [
                'citation',
                'correction',
                'date',
                'keyword',
                'link',
                'note',
                'org',
                'person',
                'place',
                'title'
            ];

        // log in for CWRC-Dialogs
        if (w.initialConfig.cwrcDialogs !== undefined) {
            conf = w.initialConfig.cwrcDialogs;
            if (conf.cwrcApiUrl) {
                cD.setCwrcApi(conf.cwrcApiUrl);
            }
            if (conf.geonameUrl) {
                cD.setGeonameUrl(conf.geonameUrl);
            }
            if (conf.viafUrl) {
                cD.setViafUrl(conf.viafUrl);
            }
            if (conf.googleGeocodeUrl) {
                cD.setGoogleGeocodeUrl(conf.googleGeocodeUrl);
            }
            if (conf.schemas) {
                if (conf.schemas.person) {
                    cD.setPersonSchema(conf.schemas.person);
                }
                if (conf.schemas.place) {
                    cD.setPlaceSchema(conf.schemas.place);
                }
                if (conf.schemas.organization) {
                    cD.setOrganizationSchema(conf.schemas.organization);
                }
            }
        }

        function loadSchemaDialogs() {
            var schemaId = w.schemaManager.schemaId;
            var schemaMappingsId = w.schemaManager.getCurrentSchema().schemaMappingsId;
            var parent;
            var schemaDialogNames;

            // TODO destroy previously loaded dialogs
            if (schemaDialogs[schemaMappingsId] === null) {
                parent = schemaDialogs[schemaMappingsId] = {};
                schemaDialogNames = [];
                schemaDialogNames = $.map(dialogNames, function(name, i) {
                    return 'schema/' + schemaMappingsId + '/dialogs/' + name;
                });
                require(schemaDialogNames, function() {
                    if (arguments.length !== schemaDialogNames.length) {
                        alert('error loading schema dialogs');
                    } else {
                        for (var i = 0; i < arguments.length; i++) {
                            var name = dialogNames[i];
                            var id = schemaId + '_' + name + 'Form';
                            parent[name] = new arguments[i](id, w);
                        }
                    }
                });
            }
        };

        w.event('schemaLoaded').subscribe(loadSchemaDialogs);

        pm = {
            show: function(type, config) {
                var typeParts;
                if (type.indexOf('schema/') === 0) {
                    typeParts = type.split('/');
                    type = typeParts[1];
                    schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type].show(config);
                } else {
                    if (dialogs[type]) {
                        dialogs[type].show(config);
                    } else if (schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type]) {
                        schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type].show(config);
                    }
                }
            },
            confirm: function(config) {
                dialogs.message.confirm(config);
            }
        };

        $.extend(pm, dialogs);

        return pm;
    };

});
