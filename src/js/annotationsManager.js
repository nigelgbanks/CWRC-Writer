/*jshint browser: true, devel: true*/
/*global define*/
define([ 'jquery' ], function($) {
    'use strict';
    /**
     * @class AnnotationsManager
     * @param {Writer} writer
     */
    function AnnotationsManager(writer) {
        this.w = writer;
    }

    AnnotationsManager.prefixMap = {
        'bibo': 'http://purl.org/ontology/bibo/',
        'cnt': 'http://www.w3.org/2011/content#',
        'cw': 'http://cwrc.ca/ns/cw#',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'dcterms': 'http://purl.org/dc/terms/',
        'foaf': 'http://xmlns.com/foaf/0.1/',
        'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
        'oa': 'http://www.w3.org/ns/oa#',
        'owl': 'http://www.w3.org/2002/07/owl#',
        'prov': 'http://www.w3.org/ns/prov#',
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'skos': 'http://www.w3.org/2004/02/skos/core#',
        'time': 'http://www.w3.org/2006/time#',
        'xsd': 'http://www.w3.org/2001/XMLSchema#'
    };

    AnnotationsManager.types = {
        person: 'foaf:Person',
        org: 'foaf:Organization',
        place: 'geo:SpatialThing',
        title: 'dcterms:title',
        date: 'time:TemporalEntity',
        note: 'bibo:Note',
        citation: 'dcterms:BibliographicResource',
        correction: 'oa:editing',
        keyword: 'skos:Concept',
        link: 'oa:linking'
    };

    /**
     * Creates a common annotation object.
     * @param {Entity} entity The entity.
     * @param {Array} types The annotation type(s).
     * @param {Array} [motivations] The annotation motivations(s).
     * @param {String} format The annotation format to return: 'json' or 'xml'.
     * @returns {JSON|XML}
     */
    AnnotationsManager.commonAnnotation = function(entity, types, motivations, format) {
        var uris = entity.getUris();
        var annotatedById;
        var annotation;
        var annotationId;
        var attributes = entity.getAttributes();
        var body = '';
        var certainty = entity.getAttribute('cert') || entity.getAttribute('certainty') || entity.getAttribute('CERTAINTY');
        var certaintyString;
        var cwrcAttributes;
        var cwrcAttributesString;
        var cwrcInfo = entity.getLookupInfo();
        var cwrcInfoString;
        var date = new Date().toISOString();
        var docId;
        var entityId;
        var motivationParts;
        var motivationsString;
        var namespace;
        var namespaceString;
        var prefix;
        var range = entity.getRange();
        var selectorId;
        var selectorString;
        var targetId;
        var typeParts;
        var typesString = '';
        var userMbox = '';
        var userName = '';
        var namespaces = {
            'rdf': 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
            'oa': 'xmlns:oa="http://www.w3.org/ns/oa#"',
            'cw': 'xmlns:cw="http://cwrc.ca/ns/cw#"'
        };
        var i;

        annotatedById = uris.userId;
        annotationId = uris.annotationId;
        docId = uris.docId;
        entityId = uris.entityId;
        selectorId = uris.selectorId;
        targetId = uris.targetId;

        format = format || 'xml';
        if (!$.isArray(types)) {
            types = [ types ];
        }

        if (motivations === null) {
            motivations = [ 'oa:tagging', 'oa:identifying' ];
        }

        if (!$.isArray(motivations)) {
            motivations = [ motivations ];
        }

        if (format === 'xml') {
            for (i = 0; i < types.length; i++) {
                typeParts = types[i].split(':');
                prefix = typeParts[0];
                namespace = AnnotationsManager.prefixMap[prefix];
                namespaces[prefix] = 'xmlns:' + prefix + '="' + namespace + '"';
                typesString += '<rdf:type rdf:resource="' + namespace + typeParts[1] + '"/>';
            }

            motivationsString = '';
            for (i = 0; i < motivations.length; i++) {
                motivationParts = motivations[i].split(':');
                prefix = motivationParts[0];
                namespace = AnnotationsManager.prefixMap[prefix];
                namespaces[prefix] = 'xmlns:' + prefix + '="' + namespace + '"';
                motivationsString += '<oa:motivatedBy rdf:resource="' + namespace + motivationParts[1] + '"/>';
            }

            namespaceString = '';
            for (prefix in namespaces) {
                if (namespaces.hasOwnProperty(prefix)) {
                    namespaceString += ' ' + namespaces[prefix];
                }
            }

            certaintyString = '';
            if (certainty !== null) {
                // fix for discrepancy between schemas
                if (certainty === 'reasonably certain') {
                    certainty = 'reasonable';
                }
                certaintyString = '<cw:hasCertainty rdf:resource="http://cwrc.ca/ns/cw#' + certainty + '"/>';
            }

            selectorString = '' +
                '<rdf:Description rdf:about="' + targetId + '">' +
                '<oa:hasSource rdf:resource="' + docId + '"/>' +
                '<rdf:type rdf:resource="http://www.w3.org/ns/oa#SpecificResource"/>' +
                '<oa:hasSelector rdf:resource="' + selectorId + '"/>' +
                '</rdf:Description>';
            if (range.end) {
                selectorString += '' +
                    '<rdf:Description rdf:about="' + selectorId + '">' +
                    '<oa:start>xpointer(string-range(' + range.start + ',"",' + range.startOffset + '))</oa:start>' +
                    '<oa:end>xpointer(string-range(' + range.end + ',"",' + range.endOffset + '))</oa:end>' +
                    '<rdf:type rdf:resource="http://www.w3.org/ns/oa#TextPositionSelector"/>' +
                    '</rdf:Description>';
            } else {
                selectorString += '' +
                    '<rdf:Description rdf:about="' + selectorId + '">' +
                    '<rdf:value>xpointer(' + range.start + ')</rdf:value>' +
                    '<rdf:type rdf:resource="http://www.w3.org/ns/oa#FragmentSelector"/>' +
                    '</rdf:Description>';
            }

            cwrcInfoString = '';
            if (cwrcInfo !== undefined) {
                delete cwrcInfo.data; // remove extra XML data
                cwrcInfo = JSON.stringify(cwrcInfo);
                cwrcInfoString = '<cw:cwrcInfo>' + cwrcInfo + '</cw:cwrcInfo>';
            }

            cwrcAttributesString = '';
            if (attributes !== null) {
                cwrcAttributes = JSON.stringify(attributes);
                cwrcAttributesString = '<cw:cwrcAttributes>' + cwrcAttributes + '</cw:cwrcAttributes>';
            }

            annotation = $($.parseXML('' +
                    '<rdf:RDF' + namespaceString + '>' +
                    '<rdf:Description rdf:about="' + annotationId + '">' +
                    '<oa:hasTarget rdf:resource="' + targetId + '"/>' +
                    '<oa:hasBody rdf:resource="' + entityId + '"/>' +
                    '<oa:annotatedBy rdf:resource="' + annotatedById + '"/>' +
                    '<oa:annotatedAt>' + date + '</oa:annotatedAt>' +
                    '<oa:serializedBy rdf:resource=""/>' +
                    '<oa:serializedAt>' + date + '</oa:serializedAt>' +
                    '<rdf:type rdf:resource="http://www.w3.org/ns/oa#Annotation"/>' +
                    motivationsString +
                    certaintyString +
                    cwrcInfoString +
                    cwrcAttributesString +
                    '</rdf:Description>' +
                    '<rdf:Description rdf:about="' + entityId + '">' +
                    '<rdf:type rdf:resource="http://www.w3.org/ns/oa#SemanticTag"/>' +
                    typesString +
                    '</rdf:Description>' +
                    selectorString +
                    '</rdf:RDF>'
            ));
        } else if (format === 'json') {
            types.push('oa:SemanticTag');

            annotation = {
                '@context': 'http://www.w3.org/ns/oa/oa.ttl',
                '@id': annotationId,
                '@type': 'oa:Annotation',
                'motivatedBy': motivations,
                'annotatedAt': date,
                'annotatedBy': {
                    '@id': annotatedById,
                    '@type': 'foaf:Person',
                    'mbox': {
                        '@id': userMbox
                    },
                    'name': userName
                },
                'serializedAt': date,
                'serializedBy': '',
                'hasBody': {
                    '@id': entityId,
                    '@type': types
                },
                'hasTarget': {
                    '@id': docId,
                    '@type': 'oa:SpecificResource',
                    'hasSource': {
                        '@id': docId,
                        '@type': 'dctypes:Text',
                        'format': 'text/xml'
                    }
                }
            };

            if (certainty !== undefined) {
                annotation.hasCertainty = 'cw:' + certainty;
            }

            if (cwrcInfo !== undefined) {
                annotation.cwrcInfo = cwrcInfo;
            }

            if (attributes !== undefined) {
                annotation.cwrcAttributes = attributes;
            }

            if (range.end) {
                annotation.hasTarget.hasSelector = {
                    '@id': selectorId,
                    '@type': 'oa:TextPositionSelector',
                    'dcterms:conformsTo': 'http://tools.ietf.org/rfc/rfc3023',
                    'oa:start': 'xpointer(string-range(' + range.start + ',"",' + range.startOffset + '))',
                    'oa:end': 'xpointer(string-range(' + range.end + ',"",' + range.endOffset + '))'
                };
            } else {
                annotation.hasTarget.hasSelector = {
                    '@id': selectorId,
                    '@type': 'oa:FragmentSelector',
                    'dcterms:conformsTo': 'http://tools.ietf.org/rfc/rfc3023',
                    'rdf:value': 'xpointer(' + range.start + ')'
                };
            }
        }
        return annotation;
    };

    AnnotationsManager.prototype = {
        constructor: AnnotationsManager,
        getResp: function() {
            return 'PLACEHOLDER_USER';
        },

        /**
         * Returns the entity type, using a annotation string.
         * @param {String} annotation The annotation string, e.g. 'foaf:Person'
         * @returns {String}
         */
        getEntityTypeForAnnotation: function(annotation) {
            var prefix, uri, entityType;
            if (annotation.indexOf('http://') !== -1) {
                // convert uri to prefixed form
                for (prefix in AnnotationsManager.prefixMap) {
                    if (AnnotationsManager.prefixMap.hasOwnProperty(prefix)) {
                        uri = AnnotationsManager.prefixMap[prefix];
                        if (annotation.indexOf(uri) === 0) {
                            annotation = annotation.replace(uri, prefix + ':');
                            break;
                        }
                    }
                }
            }
            for (entityType in AnnotationsManager.types) {
                if (AnnotationsManager.types.hasOwnProperty(entityType)) {
                    if (AnnotationsManager.types[entityType] === annotation) {
                        return entityType;
                    }
                }
            }
            return null;
        },

        /**
         * Get the annotation object for the entity.
         * @param {Entity} entity The entity.
         * @param {Object} entity.annotation The annotation data associated with the entity.
         * @param {String} format The annotation format ('xml' or 'json').
         * @returns {Object} The annotation object.
         */
        getAnnotation: function(entity, format) {
            var type = entity.getType();
            var annoMappings = this.w.schemaManager.mapper.getMappings().entities;
            var e = annoMappings[type];
            var anno;
            format = format || 'xml';
            if (e && e.annotation !== undefined) {
                anno = e.annotation(entity, format);
                if (format === 'xml') {
                    anno = anno[0].firstChild; // convert from jquery obj
                }
            }
            return anno;
        }
    };
    return AnnotationsManager;
});
