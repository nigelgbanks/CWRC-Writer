/*jshint browser: true*/
/*global tinymce, require*/
(function() {
    'use strict';
    var Event = tinymce.dom.Event,
        each = tinymce.each,
        DOM = tinymce.DOM,
        $ = require('jquery');
    /**
     * This plugin a context menu to TinyMCE editor instances.
     *
     * @class tinymce.plugins.ContextMenu
     */
    tinymce.create('tinymce.plugins.EntityContextMenu', {
        /**
         * Initializes the plugin, this will be executed after the plugin has been created.
         * This call is done before the editor instance has finished it's initialization so use the onInit event
         * of the editor instance to intercept that event.
         *
         * @method init
         * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
         * @param {string} url Absolute URL to where the plugin is located.
         */
        init: function(ed, url) {
            var t = this, showMenu, hideMenu, contextmenuNeverUseNative, realCtrlKey;
            t.url = url;
            t.editor = ed;
            t.showContextMenu = false; // whether to trigger the context menu (needed on mac)
            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            contextmenuNeverUseNative = ed.settings.contextmenu_never_use_native;
            // jscs:enabled requireCamelCaseOrUpperCaseIdentifiers
            /**
             * This event gets fired when the context menu is shown.
             *
             * @event onContextMenu
             * @param {tinymce.plugins.EntityContextMenu} sender Plugin instance sending the event.
             * @param {tinymce.ui.DropMenu} menu Drop down menu to fill with more items if needed.
             */
            t.onContextMenu = new tinymce.util.Dispatcher(this);

            hideMenu = function(e) {
                hide(ed, e);
            };

            showMenu = ed.onContextMenu.add(function(ed, e) {
                // Block TinyMCE menu on ctrlKey and work around Safari issue
                if ((realCtrlKey !== 0 ? realCtrlKey : e.ctrlKey) && !contextmenuNeverUseNative) {
                    return;
                }

                Event.cancel(e);

                if (tinymce.isMac) {
                    t.showContextMenu = true;
                } else {
                    show(ed, e);
                }
            });

            ed.onRemove.add(function() {
                if (t._menu) {
                    t._menu.removeAll();
                }
            });

            function show(ed, e) {
                // Select the image if it's clicked. WebKit would other wise expand the selection
                var x, y;

                if (e.target.nodeName === 'IMG') {
                    ed.selection.select(e.target);
                }

                x = e.clientX || e.pageX;
                y = e.clientY || e.pageY;

                ed.currentBookmark = ed.selection.getBookmark(1);
                
                t._getMenu(ed).showMenu(x, y);
            }

            function hide(ed, e) {
                realCtrlKey = 0;

                // Since the contextmenu event moves
                // the selection we need to store it away
                if (e && e.button === 2) {
                    realCtrlKey = e.ctrlKey;
                }
                
                if (t._menu) {
                    t._menu.removeAll();
                    t._menu.destroy();
                    t._menu = null;
                }
            }
            ed.addCommand('hideContextMenu', function(ed, e) {
                hideMenu(e);
            });

            ed.onMouseUp.add(function(ed, e) {
                if (tinymce.isMac && t.showContextMenu) {
                    t.showContextMenu = false;
                    t.hideDebug = true;
                    show(ed, e);
                }
            });
            ed.onMouseDown.add(hide);
            ed.onKeyDown.add(hide);
            ed.onKeyDown.add(function(ed, e) {
                if (e.shiftKey && !e.ctrlKey && !e.altKey && e.keyCode === 121) {
                    Event.cancel(e);
                    showMenu(ed, e);
                }
            });
        },

        _getMenu: function(ed) {
            var changeTagMenu;
            var tagMenu;
            var url;
            var t = this,
                m = t._menu,
                se = ed.selection,
                col = se.isCollapsed(),
                el = se.getNode() || ed.getBody(),
                am,
                p1;

            if (m) {
                m.removeAll();
                m.destroy();
            }

            p1 = DOM.getPos(ed.getContentAreaContainer());
            
            m = ed.controlManager.createDropMenu('contextmenu', {
                offset_x: p1.x + ed.getParam('contextmenu_offset_x', 0),
                offset_y: p1.y + ed.getParam('contextmenu_offset_y', 0),
                constrain: 1,
                keyboard_focus: true
            }, tinymce.ui.ScrollingDropMenu);
            
            t._menu = m;

            url = t.url + '/../../img/';
            m.add({
                title: 'Tag Person',
                icon_src: url + 'user.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('person');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Place',
                icon_src: url + 'world.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('place');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Date',
                icon_src: url + 'calendar.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('date');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Organization',
                icon_src: url + 'group.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('org');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Citation',
                icon_src: url + 'vcard.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('citation');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Note',
                icon_src: url + 'note.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('note');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Text/Title',
                icon_src: url + 'book.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('title');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Correction',
                icon_src: url + 'error.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('correction');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Keyword',
                icon_src: url + 'page_key.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('keyword');
                }
            }).setDisabled(col);
            m.add({
                title: 'Tag Link',
                icon_src: url + 'link.png',
                onclick: function() {
                    ed.writer.tagger.addEntity('link');
                }
            }).setDisabled(col);
            
            m.addSeparator();
            tagMenu = m.addMenu({
                id: 'structTagsContextMenu',
                title: 'Structural Tags',
                icon_src: url + 'tag.png',
                menuType: 'filterMenu'
            });
            tagMenu.beforeShowMenu.add(function(m) {
                m.element.addClass('defaultSkin');
                m.element.addClass('mceDropDown');
            });
            ed.execCommand('createSchemaTagsControl', { menu: tagMenu, disabled: col });
            m.addSeparator();
            
            col = (ed.writer.entitiesManager.getCurrentEntity() === null && ed.currentStruct === null);
            
            changeTagMenu = m.addMenu({
                id: 'changeTagContextMenu',
                title: 'Change Tag',
                icon_src: url + 'tag_blue_edit.png',
                menuType: 'filterMenu'
            });
            changeTagMenu.beforeShowMenu.add(function(m) {
                m.element.addClass('defaultSkin');
                m.element.addClass('mceDropDown');
            });
            ed.execCommand('createSchemaTagsControl', {
                menu: changeTagMenu,
                disabled: col,
                mode: 'change'
            });

            m.add({
                title: 'Edit Tag',
                icon_src: url + 'tag_blue_edit.png',
                onclick: function() {
                    ed.execCommand('editTag', null);
                }
            }).setDisabled(col);
            m.add({
                title: 'Remove Tag',
                icon_src: url + 'tag_blue_delete.png',
                onclick: function() {
                    ed.execCommand('removeTag');
                }
            }).setDisabled(col);
            m.addSeparator();
            col = ed.writer.entitiesManager.getCurrentEntity() === null;
            m.add({
                title: 'Copy Entity',
                icon_src: url + 'tag_blue_copy.png',
                onclick: function() {
                    ed.execCommand('copyEntity', null);
                }
            }).setDisabled(col);
            col = ed.entityCopy === null;
            m.add({
                title: 'Paste Entity',
                icon_src: url + 'tag_blue_paste.png',
                onclick: function() {
                    ed.execCommand('pasteEntity', null);
                }
            }).setDisabled(col);

            t.onContextMenu.dispatch(t, m, el, col);

            return m;
        }
    });

    // Register plugin
    tinymce.PluginManager.add('entitycontextmenu', tinymce.plugins.EntityContextMenu);
})();
