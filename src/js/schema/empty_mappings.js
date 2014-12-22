
/*global define*/
define([ 'jquery', 'mapper' ], function($, Mapper) {
    'use strict';
    return {
        id: '',
        header: '',
        blockElements: [],
        entities: {
            person: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            org: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            place: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            title: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            correction: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            link: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            date: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            note: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            citation: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            keyword: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            },
            event: {
                parentTag: '',
                textTag: '',
                mapping: function(entity) {},
                reverseMapping: function(xml) {},
                annotation: function(entity, format) {}
            }
        }
    };
});
