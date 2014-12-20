/*jshint browser: true*/
(function(exports, undefined) {
    'use strict';
    var modules = {};

    function require(ids, callback) {
        var module,
            defs = [],
            i;

        for (i = 0; i < ids.length; ++i) {
            module = modules[ids[i]] || resolve(ids[i]);
            if (!module) {
                throw 'module definition dependency not found: ' + ids[i];
            }

            defs.push(module);
        }

        callback.apply(null, defs);
    }

    function define(id, dependencies, definition) {
        if (typeof id !== 'string') {
            throw 'invalid module definition, module id must be defined and be a string';
        }

        if (dependencies === undefined) {
            throw 'invalid module definition, dependencies must be specified';
        }

        if (definition === undefined) {
            throw 'invalid module definition, definition function must be specified';
        }

        require(dependencies, function() {
            modules[id] = definition.apply(null, arguments);
        });
    }

    function defined(id) {
        return !!modules[id];
    }

    function resolve(id) {
        var fi,
            target = exports,
            fragments = id.split(/[.\/]/);

        for (fi = 0; fi < fragments.length; ++fi) {
            if (!target[fragments[fi]]) {
                return;
            }
            target = target[fragments[fi]];
        }
        return target;
    }

    function expose(ids) {
        var fi,
            fragments,
            id,
            target,
            i;
        for (i = 0; i < ids.length; i++) {
            target = exports;
            id = ids[i];
            fragments = id.split(/[.\/]/);

            for (fi = 0; fi < fragments.length - 1; ++fi) {
                if (target[fragments[fi]] === undefined) {
                    target[fragments[fi]] = {};
                }

                target = target[fragments[fi]];
            }
            target[fragments[fragments.length - 1]] = modules[id];
        }
    }

    define('tinymce/cwrcpath/CWRCPath', [
        'tinymce/ui/Path',
        'tinymce/EditorManager',
        'jquery'
    ], function(Path, EditorManager, $) {
        return Path.extend({
            postRender: function() {
                var self = this, editor = EditorManager.activeEditor;

                function isBogus(elm) {
                    return elm.nodeType === 1 && (elm.nodeName === 'BR' || !!elm.getAttribute('data-mce-bogus'));
                }

                self.on('select', function(e) {
                    var parents = [], node = editor.selection.getNode(), body = editor.getBody();

                    while (node) {
                        if (!isBogus(node)) {
                            parents.push(node);
                        }

                        node = node.parentNode;
                        if (node === body) {
                            break;
                        }
                    }

                    editor.focus();
                    editor.selection.select(parents[parents.length - 1 - e.index]);
                    editor.nodeChanged();
                });

                editor.on('nodeChange', function(e) {
                    var parents = [],
                        selectionParents = e.parents,
                        i = selectionParents.length,
                        name;

                    while (i--) {
                        if (!isBogus(selectionParents[i])) {
                            name = $(selectionParents[i]).attr('_tag');
                            parents.push({ name: name });
                        }
                    }
                    self.data(parents);
                });
                return self._super();
            }
        });
    });

    define('tinymce/cwrcpath/Plugin', [
        'tinymce/PluginManager',
        'tinymce/cwrcpath/CWRCPath'
    ], function(PluginManager, CWRCPath) {
        PluginManager.add('cwrcpath', function(editor) {
            var self = this;
            self.path = new CWRCPath(editor);
        });
    });

    expose([ 'tinymce/cwrcpath/CWRCPath', 'tinymce/cwrcpath/Plugin' ]);
})(this);
