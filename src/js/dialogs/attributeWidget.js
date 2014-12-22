/*jshint devel:true*/
/*global define*/
define([ 'jquery' ], function($) {
    'use strict';
    function AttributeWidget(config) {
        this.w = config.writer;
        this.parentId = config.parentId;
        this.dialogForm = config.dialogForm;

        this.mode = AttributeWidget.ADD;

        this.isDirty = false;

        this.$parent = $('#' + this.parentId);
        this.$parent.addClass('attributeWidget');
        this.$parent.append('' +
            '<div class="attributeSelector">' +
            '<h2>Attributes</h2>' +
            '<ul></ul>' +
            '</div>' +
            '<div class="attsContainer">' +
            '<div class="level1Atts"></div>' +
            '<div class="highLevelAtts"></div>' +
            '</div>');

        // add listeners for other form elements
        $('[data-mapping]', this.dialogForm.$el).each($.proxy(function(index, el) {
            var formEl = $(el);
            var type = formEl.data('type');
            var mapping = formEl.data('mapping');
            var isCustom = mapping.indexOf('custom.') === 0;
            if (!isCustom) {
                var changeEl;
                if (type === 'radio') {
                    changeEl = $('input', formEl);
                } else {
                    changeEl = formEl;
                }
                if (changeEl !== undefined) {
                    changeEl.change($.proxy(function(mapping, e) {
                        var dataObj = {};
                        dataObj[mapping] = $(e.target).val();
                        this.setData(dataObj);
                    }, this, mapping));
                }
            }
        }, this));
    }

    AttributeWidget.ADD = 0;
    AttributeWidget.EDIT = 1;

    AttributeWidget.disallowedAttributes = [
        'annotationid',
        'offsetid'
    ];

    AttributeWidget.prototype = {
        constructor: AttributeWidget,

        buildWidget: function(atts, previousVals) {
            previousVals = previousVals || {};

            $('.attributeSelector ul, .level1Atts, .highLevelAtts, .schemaHelp', this.$parent).empty();
            isDirty = false;

            // build atts
            var level1Atts = '';
            var highLevelAtts = '';
            var attributeSelector = '';
            var att, currAttString;
            var isLevel1 = false;
            for (var i = 0; i < atts.length; i++) {
                att = atts[i];
                currAttString = '';
                if (att.level === 0 || att.required) {
                    isLevel1 = true; // required attributes should be displayed by default
                } else {
                    isLevel1 = false;
                }

                if (AttributeWidget.disallowedAttributes.indexOf(att.name.toLowerCase()) === -1) {
                    var display = 'block';
                    var requiredClass = att.required ? ' required' : '';
                    if (isLevel1 || (this.mode === AttributeWidget.EDIT && previousVals[att.name])) {
                        display = 'block';
                        attributeSelector += '<li data-name="' + att.name + '" class="selected' + requiredClass + '">' + att.name + '</li>';
                    } else {
                        display = 'none';
                        attributeSelector += '<li data-name="' + att.name + '">' + att.name + '</li>';
                    }
                    currAttString += '<div data-name="form_' + att.name + '" style="display:' + display + ';"><label>' + att.name + '</label>';
                    if (att.documentation !== '') {
                        currAttString += '<ins class="ui-icon ui-icon-help" title="' + att.documentation + '">&nbsp;</ins>';
                    }
                    currAttString += '<br/>';
                    if (this.mode === AttributeWidget.EDIT) {
                        att.defaultValue = previousVals[att.name] || '';
                    }
                    // TODO add list support
//                if ($('list', attDef).length > 0) {
//                    currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
//                } else if ($('choice', attDef).length > 0) {
                    if (att.choices) {
                        currAttString += '<select name="' + att.name + '">';
                        var attVal, selected;
                        for (var j = 0; j < att.choices.length; j++) {
                            attVal = att.choices[j];
                            selected = att.defaultValue === attVal ? ' selected="selected"' : '';
                            currAttString += '<option value="' + attVal + '"' + selected + '>' + attVal + '</option>';
                        }
                        currAttString += '</select>';
//                } else if ($('ref', attDef).length > 0) {
//                    currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
                    } else {
                        currAttString += '<input type="text" name="' + att.name + '" value="' + att.defaultValue + '"/>';
                    }
                    if (att.required) {
                        currAttString += ' <span class="required">*</span>';
                    }
                    currAttString += '</div>';

                    if (isLevel1) {
                        level1Atts += currAttString;
                    } else {
                        highLevelAtts += currAttString;
                    }
                }
            }

            $('.attributeSelector ul', this.$parent).html(attributeSelector);
            $('.level1Atts', this.$parent).html(level1Atts);
            $('.highLevelAtts', this.$parent).html(highLevelAtts);

            $('.attributeSelector li', this.$parent).click(function() {
                if ($(this).hasClass('required')) {
                    return;
                }

                var name = $(this).data('name').replace(/:/g, '\\:');
                var div = $('[data-name="form_' + name + '"]', this.$parent);
                $(this).toggleClass('selected');
                if ($(this).hasClass('selected')) {
                    div.show();
                } else {
                    div.hide();
                }
            });

            $('ins', this.$parent).tooltip({
                tooltipClass: 'cwrc-tooltip'
            });

            $('input, select, option', this.$parent).change(function(event) {
                isDirty = true;
            });

            $('select, option', this.$parent).click(function(event) {
                isDirty = true;
            });
        },
        reset: function() {
            $('.attributeSelector li', this.$parent).each(function(el, index) {
                $(this).removeClass('selected');
                var name = $(this).data('name').replace(/:/g, '\\:');
                var div = $('[data-name="form_' + name + '"]', this.$parent);
                div.hide();
            });
            $('.attsContainer input, .attsContainer select', this.$parent).val('');
        },
        setData: function(data) {
            var wasDataSet = false;
            for (var key in data) {
                var val = data[key];
                wasDataSet = true;
                $('.attributeSelector li[data-name="' + key + '"]', this.$parent).addClass('selected');
                var div = $('[data-name="form_' + key + '"]', this.$parent);
                $('input, select', div).val(val);
                div.show();
            }
            return wasDataSet;
        },
        getData: function() {
            // collect values then close dialog
            var attributes = {};
            $('.attsContainer > div > div:visible', this.$parent).children('input[type!="hidden"], select').each(function(index, el) {
                var val = $(this).val();
                if (val !== '') { // ignore blank values
                    attributes[$(this).attr('name')] = val;
                }
            });

            // validation
            var invalid = [];
            $('.attsContainer span.required', this.$parent).parent().children('label').each(function(index, el) {
                if (attributes[$(this).text()] === '') {
                    invalid.push($(this).text());
                }
            });
            if (invalid.length > 0) {
                for (var i = 0; i < invalid.length; i++) {
                    var name = invalid[i];
                    $('.attsContainer *[name="' + name + '"]', this.$parent).css({ borderColor: 'red' }).keyup(function(event) {
                        $(this).css({ borderColor: '#ccc' });
                    });
                }
                return;
            }

            return attributes;
        },
        destroy: function() {
            try {
                $('ins', this.$parent).tooltip('destroy');
            } catch (e) {
                if (console) {
                    console.log('error destroying tooltip');
                }
            }
        }
    };
    return AttributeWidget;
});
