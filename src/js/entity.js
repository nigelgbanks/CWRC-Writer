/*jshint browser: true*/
/*global define*/
define([], function() {
    'use strict';
    /**
     * @class Entity
     * @param {Object} config
     */
    function Entity(config) {

        /**
         * The ID of the entity.
         * @type String
         */
        this.id = undefined;

        /**
         * The type of the entity, e.g. person, place, date.
         * @type String
         */
        this.type = undefined;

        /**
         * The parent tag of the entity.
         * @type String
         */
        this.tag = undefined;

        /**
         * The text content of the entity.
         * @type String
         */
        this.content = undefined;

        /**
         * A label for use when displaying information about the entity.
         * Typically will be a concatenated version of the content.
         * @type String
         */
        this.title = undefined;

        /**
         * Values that can be directly mapped onto the entity's tag.
         * @type Object
         */
        this.attributes = {};

        /**
         * Values that can't be directly mapped onto the entity's tag.
         */
        this.customValues = {};

        /**
         * URIs used to create the annotation object.
         * @type Object
         * @params annotationId
         * @params entityId
         * @params docId
         * @params selectorId
         * @params targetId
         * @params userId
         */
        this.annotationUris = {};

        /**
         * Values used to identify the text range of the entity.
         * @type Object
         */
        this.annotationRange = {};

        /**
         * Values associated with the CWRC-Dialogs lookup.
         * @type Object
         * @params id
         * @params name
         * @params repository
         */
        this.cwrcLookupInfo = undefined;

        this.id = config.id;
        this.type = config.type;
        this.tag = config.tag;

        if (config.content !== undefined) {
            this.setContent(config.content);
        }
        if (config.attributes !== undefined) {
            this.attributes = config.attributes;
        }
        if (config.customValues !== undefined) {
            this.customValues = config.customValues;
        }
        if (config.cwrcLookupInfo !== undefined) {
            this.cwrcLookupInfo = config.cwrcLookupInfo;
        }
        if (config.uris !== undefined) {
            this.annotationUris = config.uris;
        }
        if (config.range !== undefined) {
            this.annotationRange = config.range;
        }
    }

    Entity.getTitleFromContent = function(content) {
        var title = content.replace(/\s+/g, ' ');
        if (title.length <= 34) {
            return title;
        }
        return title.substring(0, 34) + '&#8230;';
    };

    Entity.prototype = {
        constructor: Entity,
        getId: function() {
            return this.id;
        },
        getType: function() {
            return this.type;
        },
        getTag: function() {
            return this.tag;
        },
        setTag: function(tag) {
            this.tag = tag;
        },
        getContent: function() {
            return this.content;
        },
        setContent: function(content) {
            this.content = content;
            this.title = Entity.getTitleFromContent(this.content);
        },
        getTitle: function() {
            return this.title;
        },
        getAttribute: function(key) {
            return this.attributes[key];
        },
        getAttributes: function() {
            return this.attributes;
        },
        setAttribute: function(name, value) {
            this.attributes[name] = value;
        },
        setAttributes: function(attObj) {
            this.attributes = attObj;
        },
        getCustomValue: function(key) {
            return this.customValues[key];
        },
        getCustomValues: function() {
            return this.customValues;
        },
        setCustomValue: function(name, value) {
            this.customValues[name] = value;
        },
        setCustomValues: function(propOjb) {
            this.customValues = propOjb;
        },
        getUris: function() {
            return this.annotationUris;
        },
        setUris: function(urisObj) {
            this.annotationUris = urisObj;
        },
        getLookupInfo: function() {
            return this.cwrcLookupInfo;
        },
        setLookupInfo: function(infoObj) {
            this.cwrcLookupInfo = infoObj;
        },
        getRange: function() {
            return this.annotationRange;
        },
        setRange: function(rangeObj) {
            this.annotationRange = rangeObj;
        },
        clone: function() {
            var prop,
                key,
                clone = Object.create(Entity.prototype);
            for (key in this) {
                if (this.hasOwnProperty(key)) {
                    prop = this[key];
                    if (typeof prop !== 'function') {
                        clone[key] = prop;
                    }
                }
            }
            return clone;
        }
    };
    return Entity;
});
