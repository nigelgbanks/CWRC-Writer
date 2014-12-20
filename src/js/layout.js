/*jshint browser: true*/
/*global require*/
function setupLayoutAndModules(w, EntitiesList, Relations, Selection, StructureTree, Validation) {
    'use strict';
    var doneLayout;
    var isLoading;
    var $ = require('jquery');
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    w.layout = $('#cwrc_wrapper').layout({
        defaults: {
            maskIframesOnResize: true,
            resizable: true,
            slidable: false
        },
        north: {
            size: 35,
            minSize: 35,
            maxSize: 60
        },
        south: {
            size: 34,
            spacing_open: 0,
            spacing_closed: 0
        },
        west: {
            size: 'auto',
            minSize: 325,
            onresize: function(region, pane, state, options) {
                var tabsHeight = $('#westTabs').find('> ul').outerHeight();
                $('#westTabsContent').height(state.layoutHeight - tabsHeight);
            }
        }
    });
    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
    w.layout.panes.center.layout({
        defaults: {
            maskIframesOnResize: true,
            resizable: true,
            slidable: false
        },
        center: {
            onresize: function(region, pane, state, options) {
                var uiHeight = $('#' + w.editor.id + '_tbl tr.mceFirst').outerHeight() + 2;
                $('#' + w.editor.id + '_ifr').height(state.layoutHeight - uiHeight);
            }
        },
        south: {
            size: 250,
            resizable: true,
            initClosed: true,
            activate: function(event, ui) {
                $.layout.callbacks.resizeTabLayout(event, ui);
            },
            onresize: function(region, pane, state, options) {
                var tabsHeight = $('#southTabs').find('> ul').outerHeight();
                $('#southTabsContent').height(state.layoutHeight - tabsHeight);
            }
        }
    });
    
    $('#cwrc_header').find('h1').click(function() {
        window.location = 'http://www.cwrc.ca';
    });
    // jshint -W031
    new StructureTree({ writer: w, parentId: 'westTabsContent' });
    new EntitiesList({ writer: w, parentId: 'westTabsContent' });
    new Relations({ writer: w, parentId: 'westTabsContent' });
    new Validation({ writer: w, parentId: 'southTabsContent' });
    new Selection({ writer: w, parentId: 'southTabsContent' });
    // jshint +W031
    $('#westTabs').tabs({
        active: 1,
        activate: function(event, ui) {
            $.layout.callbacks.resizeTabLayout(event, ui);
        },
        create: function(event, ui) {
            $('#westTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
        }
    });
    $('#southTabs').tabs({
        active: 1,
        activate: function(event, ui) {
            $.layout.callbacks.resizeTabLayout(event, ui);
        },
        create: function(event, ui) {
            $('#southTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
        }
    });
    
    isLoading = false;
    doneLayout = false;
    function onLoad() {
        isLoading = true;
    }
    function onLoadDone() {
        isLoading = false;
        if (doneLayout) {
            $('#cwrc_loadingMask').fadeOut();
            w.event('documentLoaded').unsubscribe(onLoadDone);
        }
    }
    w.event('loadingDocument').subscribe(onLoad);
    w.event('documentLoaded').subscribe(onLoadDone);
    
    setTimeout(function() {
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        w.layout.options.onresizeall_end = function() {
            doneLayout = true;
            if (isLoading === false) {
                $('#cwrc_loadingMask').fadeOut();
                w.layout.options.onresizeall_end = null;
            }
        };
        // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
        w.layout.resizeAll(); // now that the editor is loaded, set proper sizing
    }, 250);
}
