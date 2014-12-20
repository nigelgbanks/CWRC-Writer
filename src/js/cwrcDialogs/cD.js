/*jshint browser: true, devel: true*/
/*global define, CwrcApi, ko*/
define('cwrcDialogs', [ 'jquery', 'jquery-ui', 'bootstrap-datepicker' ], function($) {
    'use strict';
    var cD = {};
    (function() {
        var popSearch;
        var search;
        var popCreate;
        var lastCount;
        var cwrcApi = null,
            geonameUrl = null,
            viafUrl = null,
            googleGeocodeUrl = null,
            dialogType = '',
            datepicker = $.fn.datepicker.noConflict(),
            button = $.fn.button.noConflict(),
            tooltip = $.fn.tooltip.noConflict(),
            entity = {},
            params = {
                lang: 'a:en',
                modalOptions: {
                    show: false,
                    keyboard: true,
                    backdrop: false
                }
            };
        ///////////////////////////////////////////////////////////////////////
        // Public Functions
        ///////////////////////////////////////////////////////////////////////
        cD.setCwrcApi = function(url) {
            cwrcApi = new CwrcApi(url, $);
        };
        cD.setGeonameUrl = function(url) {
            geonameUrl = url;
        };
        cD.setViafUrl = function(url) {
            viafUrl = url;
        };
        cD.setGoogleGeocodeUrl = function(url) {
            googleGeocodeUrl = url;
        };

        // fix conflicts with jQuery UI.
        $.fn.bsDatepicker = datepicker;
        $.fn.bsButton = button;
        $.fn.bsTooltip = tooltip;

        ///////////////////////////////////////////////////////////////////////
        // Helpers
        ///////////////////////////////////////////////////////////////////////
        function last(array) {
            return array[array.length - 1];
        }

        function initialize() {
            entity.initialize();
            search.initialize();
        }

        function setHelp() {
            $('.cwrc-help').bsTooltip({
                placement: 'right',
                trigger: 'click',
                delay: { show: 100, hide: 100 }
            });
        }

        ///////////////////////////////////////////////////////////////////////
        // Entities
        ///////////////////////////////////////////////////////////////////////
        entity.viewModel = ko.observable({});
        entity.viewModel().interfaceFields = ko.observableArray([]);
        entity.viewModel().dialogTitle = ko.observable('');
        entity.viewModel().validated = ko.observable(true);
        entity.viewModel().showSavingMessage = ko.observable('');
        entity.selfWorking = $.parseXML('<entity></entity>');
        entity.elementPath = [];
        entity.startValuePath = [];
        entity.currentPadding = '0';
        entity.viewModel().modsFields = ko.observable({
            modsTypes: [
                { name: 'Audio' },
                { name: 'Book (part)' },
                { name: 'Book (whole)' },
                { name: 'Correspondence' },
                { name: 'Journal (part)' },
                { name: 'Journal (whole)' },
                { name: 'Manuscript' },
                { name: 'Video' },
                { name: 'Web resource' }
            ],
            modsType: ko.observable('Audio'),
            title: ko.observable(),
            author: ko.observableArray([
            ]),
            date: ko.observable(),
            project: ko.observable(),
            validation: {
                title: ko.observable(true),
                date: ko.observable(true)
            },
            addNewAuthor: function() {
                var author = {
                    name: ko.observable('')
                };

                entity.viewModel().modsFields().author.push(author);

                return author;
            },
            removeThisAuthor: function(author) {
                entity.viewModel().modsFields().author.remove(author);
            }
        }); // Added to create mods entries

        entity.person = {};
        entity.person.schema = '';
        entity.person.success = null;

        entity.organization = {};
        entity.organization.schema = '';
        entity.organization.success = null;

        entity.place = {};
        entity.place.schema = '';
        entity.place.success = null;

        entity.title = {};
        entity.title.schema = '';
        entity.title.success = null;

        entity.editing = false;
        entity.editingPID = '';

        // XXX Add namespace
        entity.setPersonSchema = function(url) {
            $.ajax({
                type: 'GET',
                async: false,
                url: url,
                dataType: 'xml',
                success: function(xml) {
                    entity.person.schema = xml;
                }
            });
        };

        cD.setPersonSchema = entity.setPersonSchema;

        entity.setOrganizationSchema = function(url) {
            $.ajax({
                type: 'GET',
                async: false,
                url: url,
                dataType: 'xml',
                success: function(xml) {
                    entity.organization.schema = xml;
                }
            });
        };

        cD.setOrganizationSchema = entity.setOrganizationSchema;

        entity.setPlaceSchema = function(url) {
            $.ajax({
                type: 'GET',
                async: false,
                url: url,
                dataType: 'xml',
                success: function(xml) {
                    entity.place.schema = xml;
                }
            });
        };

        cD.setPlaceSchema = entity.setPlaceSchema;

        cD.setSchema = {
            person: cD.setPersonSchema,
            organization: cD.setOrganizationSchema,
            place: cD.setPlaceSchema
        };

        entity.initialize = function() {
            var newTitleDialogTemplate,
                newDialogTemplate,
                entityTemplates;

            entityTemplates = '' +
                '		<script type="text/htmlify" id="quantifier">' +
                '			<div class="quantifier" data-bind="style:{margin : fieldPadding()}">' +
                '			<div>' +
                // '				<h2><span data-bind="text: header"></span></h2>' +
                '				<span data-bind="text: label"></span>' +
                '				<span  data-bind="if: isGrowable()">' +
                '					<span data-bind="if: showAddButton()">' +
                '						<button data-bind="click: addGroup" class="btn btn-default btn-xs"><span class="fa fa-plus"</span></button>' +
                '					</span>' +
                '				</span>' +
                '			</div>' +
                '			</div>' +
                '			<div class="interfaceFieldsContainer" data-bind="template:{name: $root.displayMode, foreach: interfaceFields}"> ' +
                '			</div>' +
                '		</script>' +
                '		<script type="text/html" id="seed">' +
                '			<!--seed-->' +
                '			<div>' +
                '				<span data-bind="template:{name: $root.displayMode, foreach: interfaceFields}"></span>' +
                '				<span data-bind="if: $parent.showRemoveThisButton()">' +
                '					<button data-bind="click: $parent.removeThisGroup" class="btn btn-default btn-xs">' +
                '						<span class="fa fa-minus"></span>' +
                '					</button>' +
                '				</span>' +
                '			</div>' +
                '		</script>' +
                '		<script type="text/html" id="textField">' +
                '			<!--textField-->' +
                '			<span data-bind="style:{margin : fieldPadding()}">' +
                '				<span data-bind="text: label"></span> ' +
                '				<input data-bind="value: value" /> ' +
                '				<span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '				<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
                '			</span>' +
                '		</script>' +
                '		<script type="text/html" id="header">' +
                '			<!--header-->' +
                '			<span>' +
                '				<h4><span data-bind="text: label, style:{margin : fieldPadding()}"></span></h4>' +
                '			</span>' +
                '		</script>' +
                '		<script type="text/html" id="datePicker">' +
                '			<!-- datePicker -->' +
                '			<span>' +
                '				<span data-bind="text: label"></span> ' +
                '				<div class="input-append date" data-date="2014-01-01">' +
                '					<input placeholder="YYYY-MM-DD" type="text" class="span2" data-date="2014-01-01" data-bind="datepicker: value">' +
                '					<button data-date="2014-01-01" class=" add-on btn btn-default btn-xs"><span class="fa fa-calendar"></span></button>' +
                '					<span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '				</div>' +
                '				<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
                '			</span>' +
                '		</script>' +
                '		<script type="text/html" id="dialogue">' +
                '			<!--dialogue-->' +
                '			<span data-bind="style:{margin : fieldPadding()}">' +
                '				<span class="cwrc-help" data-bind="text: label, attr:{\'title\': help}"></span> ' +
                '			</span>' +
                '		</script>' +
                '		<script type="text/html" id="textArea">' +
                '			<!--textArea-->' +
                '			<span data-bind="style:{margin : fieldPadding()}">' +
                '				<span data-bind="text: label"></span> ' +
                '				<textarea rows="4" cols="50" data-bind="value: value"></textarea> ' +
                '				<span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '				<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
                '			</span>' +
                '		</script>' +
                '		<script type="text/html" id="radioButton">' +
                '			<span data-bind="style:{margin : fieldPadding()}">' +
                '				<span data-bind="text: label"></span>' +
                '				<ul data-bind="foreach: options">' +
                '					<li>' +
                '						<input type="radio" data-bind="attr: { value: value, name : $parent.path }, checked: $parent.value"> ' +
                '						<span data-bind="text:content"></span> ' +
                '					</li>' +
                '				</ul>' +
                '				<span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '			</span>' +
                '		</script>' +
                '		<script type="text/html" id="dynamicCheckbox">' +
                '			<span data-bind="style:{margin : fieldPadding()}">' +
                '				<span data-bind="text: label"></span>' +
                '				<ul data-bind="foreach: options">' +
                '					<li>' +
                '						<input type="checkbox" data-bind="attr: { value: value, name : $parent.path }, checked: $parent.value"> ' +
                '						<span data-bind="text:content"></span> ' +
                '					</li>' +
                '				</ul>' +
                '				<span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '			</span>' +
                '		</script>' +
                '		<script type="text/html" id="dropDown">' +
                '			<span data-bind="style:{margin : fieldPadding()}">' +
                '			<select data-bind="value: value, options: options, optionsText: \'content\', optionsValue: \'value\'"></select>' +
                '				<span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '			</span>' +
                '		</script>';

            newDialogTemplate = '' +
                '<div id="newDialogue" class="bootstrap-scope cwrcDialog" title="">' +
                '<div class="modal fade" id="cwrcEntityModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
                '	<div class="modal-dialog">' +
                '		<div class="modal-content">' +
                '			<div class="modal-header">' +
                '				<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                '				<span><h5 class="modal-title pull-right"><span data-bind="text: showSavingMessage"></span> <i id="showSavingIcon"></i>&nbsp;</h5></span>' +
                '				<h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
                '			</div>' +
                '			<div class="modal-body modal-body-area">' +
                '				<div data-bind="template: { name: displayMode , foreach: interfaceFields }">' +
                '				</div>' +
                '			</div>' +
                '			<div class="modal-footer">' +
                '				<div class="label label-danger" data-bind="ifnot: validated"> Form is not valid</div>' +
                '				<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
                '				<button type="button" class="btn btn-primary" data-bind="click: $root.processCallback">Ok</button>' +
                '			</div>' +
                '		</div>' +
                '	</div>' +
                '</div>' +
                '</div>';

            newTitleDialogTemplate = '' +
                '<div id="newTitleDialogue" class="bootstrap-scope cwrcDialog" title="">' +
                '<div class="modal fade" id="cwrcTitleModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
                '	<div class="modal-dialog">' +
                '		<div class="modal-content">' +
                '			<div class="modal-header">' +
                '				<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                '				<span><h5 class="modal-title pull-right"><span data-bind="text: showSavingMessage"></span> <i id="showSavingIcon"></i>&nbsp;</h5></span>' +
                '				<h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
                '			</div>' +
                '			<div class="modal-body modal-body-area" data-bind="with: modsFields">' +
                //Type of Resource
                '				<div class="quantifier">' +
                '					<div>' +
                '						<span>Type of resource</span>' +
                '					</div>' +
                '					<div class="interfaceFieldsContainer"> ' +
                '						<select data-bind="options: modsTypes, optionsText: \'name\', optionsValue: \'name\', value: modsType">' +
                '						</select>' +
                '					</div>' +
                '				</div>' +
                //Title
                '				<div class="quantifier">' +
                '					<div>' +
                '						<span>Title</span>' +
                '					</div>' +
                '					<div class="interfaceFieldsContainer"> ' +
                '						<input data-bind="value: title">' +
                '						<div class="label label-info" data-bind="if:validation.title">Required value</div>' +
                '						<div class="label label-danger" data-bind="ifnot:validation.title">Required value</div>' +
                '					</div>' +
                '				</div>' +
                //Authors
                '				<div class="quantifier">' +
                '					<div>' +
                '						<span>Author</span>' +
                '							<span>' +
                '								<span>' +
                '									<button data-bind="click: addNewAuthor" class="btn btn-default btn-xs"><span class="fa fa-plus"</span></button>' +
                '								</span>' +
                '							</span>' +
                '						</div>' +
                '					<div class="interfaceFieldsContainer" data-bind="foreach: author"> ' +
                '						<div>' +
                '							<span>' +
                '								<input data-bind="value: name" /> ' +
                '								<!--<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>-->' +
                '							</span>' +
                '							<span data-bind="if: $index">' +
                '								<button data-bind="click: $parent.removeThisAuthor" class="btn btn-default btn-xs">' +
                '									<span class="fa fa-minus"></span>' +
                '								</button>' +
                '							</span>' +
                '						</div>' +
                '					</div>' +
                '				</div>' +
                //Date
                '				<div class="quantifier">' +
                '					<div>' +
                '						<span>Date</span>' +
                '					</div>' +
                '					<div class="interfaceFieldsContainer"> ' +
                //'						<div class="input-append date">' +
                '							<input placeholder="YYYY-MM-DD" type="text" class="span2" data-bind="value: date">' +
                //'							<button class=" add-on btn btn-default btn-xs"><span class="fa fa-calendar"></span></button>' +
                '							<span class="cwrc-help fa fa-question-circle" title="Date must be in the form of YYYY, YYYY-MM or YYYY-MM-DD."></span>' +
                //'						</div>' +
                '						<div class="label label-danger" data-bind="ifnot:validation.date">Invalid date</div>' +
                '					</div>' +
                '				</div>' +

                //Project
                '				<div class="quantifier">' +
                '					<div>' +
                '						<span>Project</span>' +
                '					</div>' +
                '					<div class="interfaceFieldsContainer"> ' +
                '						<input data-bind="value: project">' +
                '						<!--<div class="label label-info" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}">Required value</div>-->' +
                '					</div>' +
                '				</div>' +

                '			</div>' +
                '			<div class="modal-footer">' +
                '				<div class="label label-danger" data-bind="ifnot: validated"> Form is not valid</div>' +
                '				<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
                '				<button type="button" class="btn btn-primary" data-bind="click: $root.processCallback">Ok</button>' +
                '			</div>' +
                '		</div>' +
                '	</div>' +
                '</div>' +
                '</div>';

            $('head').append(entityTemplates);
            $('body').append(newDialogTemplate);
            $('body').append(newTitleDialogTemplate);
            $('#cwrcEntityModal').modal(params.modalOptions);
            $('#cwrcEntityModal').draggable({
                handle: '.modal-header'
            });
            $('#cwrcTitleModal').modal(params.modalOptions);
            $('#cwrcTitleModal').draggable({
                handle: '.modal-header'
            });

            $('#cwrcEntityModal').on('show.bs.modal', function() {
                $('.modal-body-area').css('max-height', $(window).height() * 0.7);
            });
            $('#cwrcTitleModal').on('show.bs.modal', function() {
                $('.modal-body-area').css('max-height', $(window).height() * 0.7);
            });

            ko.applyBindings(entity.viewModel, $('#newDialogue')[0]);
            ko.applyBindings(entity.viewModel, $('#newTitleDialogue')[0]);
        };

        ///////////////////////////////////////////////////////////////////////
        // Entity Helpers
        ///////////////////////////////////////////////////////////////////////

        function savingMessageOn() {
            entity.viewModel().showSavingMessage('Saving ');
            entity.viewModel().showSavingMessage.valueHasMutated();
            $('#showSavingIcon').addClass('fa fa-spin fa-refresh');
        }

        function savingMessageOff() {
            entity.viewModel().showSavingMessage('');
            entity.viewModel().showSavingMessage.valueHasMutated();
            $('#showSavingIcon').removeClass('fa fa-spin fa-refresh');
        }

        function initializeQuantifiers() {
            var startingInterleave;
            entity[dialogType].nodeStack = [];
            entity[dialogType].workingContainers = [];
            entity[dialogType].shouldValidate = [];
            entity.viewModel().interfaceFields([]);
            startingInterleave = interleaveModel();
            startingInterleave.path = 'entity';
            entity.viewModel().interfaceFields.push(startingInterleave);
            entity[dialogType].workingContainers.push(startingInterleave);
            entity.viewModel().validated(true);
        }

        function completeTitleDialog(opts, data) {
            entity[dialogType].success = opts.success ? opts.success : $.noop;
            entity[dialogType].error = opts.error ? opts.error : $.noop;
            newTitleDialog(opts, data);
            setHelp();
        }

        function newTitleDialog(opts, data) {
            var modsFields;
            initializeQuantifiers();

            modsFields = entity.viewModel().modsFields();
            if (data && data !== null) {
                modsFields.modsType(data.modsType);
                modsFields.title(data.title);
                modsFields.date(data.date ? data.date : '');
                modsFields.project(data.project ? data.project : '');
                modsFields.author([]);

                if (data.author && data.author !== null && data.author.length > 0) {
                    data.author.forEach(function(author) {
                        var a = modsFields.addNewAuthor();
                        a.name(author.name);
                    });
                } else {
                    modsFields.addNewAuthor();
                }
            } else {
                modsFields.modsType('Audio');
                if (opts.startValue && opts.startValue.trim() !== '') {
                    modsFields.title(opts.startValue);
                } else {
                    modsFields.title('');
                }
                modsFields.author([]);
                modsFields.date('');
                modsFields.project('');

                modsFields.addNewAuthor();
            }

            modsFields.validation.title(true);
            modsFields.validation.date(true);
        }

        function completeDialog(opts) {
            entity[dialogType].success = opts.success ? opts.success : $.noop;
            entity[dialogType].error = opts.error ? opts.error : $.noop;
            newDialog();
            setHelp();
        }

        function newDialog() {
            var interfaceOrder,
                root;
            initializeQuantifiers();
            interfaceOrder = $(entity.person.schema).find('interface-order[type=' + dialogType + ' ]');
            entity.elementPath = $(interfaceOrder).attr('path').split('/');
            interfaceOrder.children('ref').each(function() {
                var defName = $(this).attr('name');
                $(entity[dialogType].schema).find('define[name=' + defName + ' ]')
                    .children().each(function(i, child) {
                        visit(child);
                    });
            });
            root = entity[dialogType].workingContainers[0];
            root.interfaceFields.push(root.seed);
            entity.viewModel().interfaceFields(entity[dialogType].workingContainers[0]); // startingIterfaceField
        }

        function visit(node) {
            if (node.nodeType === 1) { // ELEMENT_NODE
                entity[dialogType].nodeStack.push(node);
                // working with node
                processNode(node);
                entity[dialogType].nodeStack.pop();
            }
        }

        function processNode(node) {
            var nodeName = node.nodeName.toLowerCase(),
                visitChildren = true;
            switch (nodeName) {
                case 'element':
                    processElement(node);
                    break;
                case 'ref':
                    processRef(node);
                    break;
                case 'xs:annotation':
                    processXSAnnotation(node);
                    visitChildren = false;
                    break;
                case 'choice':
                    visitChildren = true;
                    break;
                case 'oneormore':
                case 'zeroormore':
                case 'optional':
                case 'interleave':
                    processQuantifier(node);
                    break;
            }
            if (visitChildren) {
                // visit all children
                $(node).children().each(function(i, child) {
                    visit(child);
                });
            }
            // post process
            switch (nodeName) {
                case 'element':
                    postprocessElement(node);
                    break;
                case 'oneormore':
                case 'zeroormore':
                case 'optional':
                    // case 'interleave':
                    postprocessQuantifier();
                    break;
                case 'interleave':
                    postprocessInterleave();
                    break;
            }
        }

        function processElement(node) {
            entity.elementPath.push($(node).attr('name'));
        }

        function postprocessElement(node) {
            entity.elementPath.pop();
        }

        function processRef(node) {
            var defName = $(node).attr('name'),
                defNode = $(entity[dialogType].schema).find('define[name=' + defName + ' ]')[0];
            visit(defNode);
        }

        function isSamePath(currentPath) {
            var len = currentPath.length,
                orPaths,
                same,
                i,
                j;
            if (currentPath[len - 1].indexOf('@') !== -1) {
                len -= 1;
            }
            if (len !== entity.elementPath.length) {
                return false;
            }
            for (i = 0; i < len; ++i) {
                orPaths = currentPath[i].split('|');
                same = false;
                for (j = 0; j < orPaths.length; ++j) {
                    if (entity.elementPath[i] === orPaths[j]) {
                        same = true;
                        break;
                    }
                }
                if (!same) {
                    return false;
                }
            }
            return true;
        }

        function setQuantifierLabel(label) {
            var lastContainer = last(entity[dialogType].workingContainers);
            lastContainer.label = label;
        }

        function addOptions(newInput, appInfo) {
            var type = dialogType,
                lang = params.lang,
                values = $(appInfo).children('values[type=' + type + ' ]')[0],
                valuesURL;

            if (!values) {
                values = $(appInfo).children('values')[0];
            } else {
                valuesURL = $(values).attr('url');
                if (valuesURL) {
                    addRemoteOptions(newInput, valuesURL);
                }
                $(values).find('value').each(function(i, e) {
                    newInput.options.push({
                        'content': $(e).attr(lang),
                        'value': $(e).text()
                    });
                });
            }
        }

        function addRemoteOptions(newInput, url) {
            var lang = params.lang;
            $.ajax({
                url: url,
                async: false,
                dataType: 'json'
            }).done(function(data) {
                $.each(data, function(i, option) {
                    newInput.options.push({
                        'content': option.content[lang],
                        'value': option.value
                    });
                });
            });
        }

        function processXSAnnotation(node) {
            // ADD WIDGET HERE
            var appInfoNode = $(node).children('xs\\:appinfo');
            // check all children for path XXX
            var isStartValue = '';
            var leftPadding = '';
            $(appInfoNode).children('interface-field').each(function(i, e) {
                var lastContainer;
                var parent;
                var inputType;
                var newInput;
                var currentPath = $(e).attr('path').split('/');
                isStartValue = $(e).attr('startValue');
                leftPadding = $(e).attr('leftPadding');
                if (isSamePath(currentPath)) {
                    // if same path XXX
                    // check what widget to add XXX
                    inputType = '';
                    if ($(e).children('input').first().text() !== '') {
                        inputType = $(e).children('input').first().text();
                    }
                    switch (inputType) {
                        case 'textField' :
                            newInput = textInputModel();
                            break;
                        case 'textArea' :
                            newInput = textAreaModel();
                            break;
                        case 'radioButton' :
                            newInput = radioButtonModel();
                            //XXX Get Options
                            addOptions(newInput, appInfoNode);
                            // new entry
                            newInput.defaultValue = true;
                            newInput.value(newInput.options[0].value);
                            break;
                        case 'dynamicCheckbox' :
                            newInput = dynamicCheckboxModel();
                            //XXX Get Options
                            addOptions(newInput, appInfoNode);
                            break;
                        case 'dropDown' :
                        case 'slider' : //XXX Implement
                        case 'combobox' : //XXX Implement
                            newInput = dropDownModel();
                            addOptions(newInput, appInfoNode);
                            break;
                        case 'dialogue' :
                            newInput = dialogueInputModel();
                            break;
                        case 'datePicker' :
                            newInput = datePickerInputModel();
                            break;
                        case 'header' :
                            newInput = headerInputModel();
                            break;
                        case '' : // Label
                            var quantifierLabel = $(e).children('label').first().text();
                            setQuantifierLabel(quantifierLabel);
                            break;
                        default:
                            newInput = textInputModel();
                    }
                    if (newInput) {
                        newInput.path = entity.elementPath.toString();
                        // check if it should be stored as an attribute
                        parent = $(node).parent()[0];
                        if (parent.nodeName === 'attribute') {
                            newInput.attributeName = $(parent).attr('name') + '';
                            newInput.path += ',' + newInput.attributeName;
                        }
                        newInput.label = $(e).children('label').first().text();
                        newInput.help = $(e).children('help-text').first().text();
                        lastContainer = last(entity[dialogType].workingContainers);

                        if (lastContainer.isRequired()) {
                            newInput.nodeMessage('Required value');
                        }

                        if (isStartValue === 'true') {
                            entity.startValuePath = currentPath.map(function(p) {
                                return { name: p, count: 1 };
                            });
                        }

                        if (leftPadding && leftPadding.trim() !== '') {
                            entity.currentPadding = leftPadding;
                        }
                        // console.log(entity.currentPadding)
                        // XXX in progress
                        // newInput.fieldPadding("0px 0px 0px "+entity.currentPadding+"px")

                        lastContainer.seed.interfaceFields.push(newInput);

                    }
                }
            });
        }

        function processQuantifier(node) {

            var newQuantifier;
            var nodeName = node.nodeName.toLowerCase();
            switch (nodeName) {
                case 'oneormore':
                    newQuantifier = oneOrMoreModel();
                    break;
                case 'zeroormore':
                    newQuantifier = zeroOrMoreModel();
                    break;
                case 'optional':
                    newQuantifier = optionalModel();
                    break;
                case 'interleave':
                    newQuantifier = interleaveModel();
                    break;
            }

            ///////////////

            newQuantifier.path = entity.elementPath.toString();

            ///////////////

            // add to latestWorking quantifier
            last(entity[dialogType].workingContainers).seed.interfaceFields.push(newQuantifier);
            // add to quantifier list
            entity[dialogType].workingContainers.push(newQuantifier);
        }

        function isInterfaceIsPresent(item) {
            switch (item.input) {
                case 'textField':
                case 'textArea':
                case 'dropDown':
                case 'dynamicCheckbox':
                case 'radioButton':
                case 'combobox':
                case 'slider':
                case 'dialogue':
                case 'datePicker':
                case 'header':
                case '':
                    return true;
            }
            return false;
        }

        function postprocessInterleave(node) {
            var parent;
            var lastContainer = last(entity[dialogType].workingContainers);

            if (lastContainer.seed.interfaceFields().length >= 1) {
                lastContainer.hasInterface = true;
            }

            if (lastContainer.hasInterface) {
                lastContainer.interfaceFields.push(lastContainer.seed.clone());
                entity[dialogType].workingContainers.pop();

            } else {
                entity[dialogType].workingContainers.pop();
                parent = last(entity[dialogType].workingContainers);
                parent.seed.interfaceFields.remove(lastContainer);
            }
        }

        function postprocessQuantifier(node) {
            var parent;
            var lastContainer = last(entity[dialogType].workingContainers);

            $.each(lastContainer.seed.interfaceFields(), function(index, item) {

                if (isInterfaceIsPresent(item)) {
                    lastContainer.hasInterface = true;
                }
            });

            if (lastContainer.hasInterface) {

                lastContainer.label = lastContainer.seed.interfaceFields()[0].label;
                lastContainer.seed.interfaceFields()[0].label = '';

                if (lastContainer.minItems === 1) {
                    // lastContainer.interfaceFields.push(lastContainer.seed.clone());
                    lastContainer.addGroup();
                }
                entity[dialogType].workingContainers.pop();
            } else {
                entity[dialogType].workingContainers.pop();
                parent = last(entity[dialogType].workingContainers);
                moveInterfaceElements(lastContainer, parent);
            }
        }

        function moveInterfaceElements(from, to) {
            $.each(from.seed.interfaceFields(), function(index, item) {
                // if (item.hasInterface) {

                to.seed.interfaceFields.push(item);

            });

            // XXX Needed ?
            if (to.label === '') {
                to.label = from.label;
            }
            // alert(to.path + " + " + from.path)
            // to.path = from.path
            to.seed.interfaceFields.remove(from);
        }

        function visitStringifyResult(node) {
            var maxItems;
            var minItems;
            var validate;
            if (node.input === 'quantifier' || node.input === 'seed') {
                if (node.input === 'quantifier') {
                    minItems = node.minItems;
                    maxItems = node.maxItems;
                    entity[dialogType].shouldValidate.push(node.isRequired());
                    /*
                     if (node.isRequired()) {
                     entity[dialogType].shouldValidate.push(true);
                     } else {
                     entity[dialogType].shouldValidate.push(false);
                     }
                     */

                }
                $.each(node.interfaceFields(), function(index, node) {
                    visitStringifyResult(node);
                });
                if (node.input === 'quantifier') {
                    entity[dialogType].shouldValidate.pop();
                }
            } else if (node.input !== 'label' && node.input !== 'header') {
                // CREATE NODE
                validate = last(entity[dialogType].shouldValidate);
                if (validate && $.trim(node.value()) === '') {
                    node.nodeMessageClass('label label-danger');
                    entity.viewModel().validated(false);
                } else {

                    node.nodeMessageClass('label label-info');
                }
                createNode(node);
            }
        }

        function createNode(node) {
            var pathString = node.path,
                fullPath = pathString.split(','),
                maxDepth = fullPath.length,
                path,
                thisPathString,
                selector,
                newElement,
                i,
                entry,
                newText;

            if (node.attributeName !== '') {
                fullPath.pop();
                pathString = fullPath.toString();
                maxDepth = fullPath.length;
            }

            if (node.attributeName !== '') {
                --maxDepth;
            }

            for (i = 0; i < maxDepth; i++) {
                path = pathString.split(',');
                thisPathString = path.splice(0, i + 1) + '';
                selector = thisPathString.replace(/,/g, ' > ');
                entry = $(entity.selfWorking).find(selector);
                // entry if not found (needs to create it) or if at maxDepth
                if (entry.size() === 0 || i === fullPath.length - 1) {
                    path = pathString.split(',');
                    thisPathString = path.splice(0, i) + '';
                    selector = thisPathString.replace(/,/g, ' > ');
                    newElement = entity.selfWorking.createElement(fullPath[i]);
                    $(entity.selfWorking).find(selector).last().append(newElement);
                }
            }
            // set value
            if (node.attributeName !== '') {
                // set attribute value
                thisPathString = path.splice(0, i) + '';
                selector = thisPathString.replace(/,/g, ' > ');
                $(entity.selfWorking).find(selector).last().attr(node.attributeName, node.value());
            } else {
                // set text value
                newText = entity.selfWorking.createTextNode(node.value());
                $(newElement).append(newText);
            }

        }

        function validateModsInfo(xml) {
            var rx;
            var testDate;
            var modsFields = entity.viewModel().modsFields();

            if (modsFields.title().trim().length < 1) {
                modsFields.validation.title(false);
                entity.viewModel().validated(false);
            } else {
                modsFields.validation.title(true);
            }

            testDate = modsFields.date().trim();
            // Tests that the date can be eirther YYYY, YYYY-MM, or YYYY-MM-DD.
            rx = /^\d{1,4}(-(0[1-9]|1[012])(-(0[1-9]|[12][0-9]|3[01]))?)?$/;

            if (testDate.length > 0 && !rx.test(testDate)) {
                modsFields.validation.date(false);
                entity.viewModel().validated(false);
            } else {
                modsFields.validation.date(true);
            }
            modsFields.date(testDate);
        }

        function addModsInfo(xml) {
            var recordChangeDate;
            var recordCreationDate;
            var recordContentSource;
            var recordInfo;
            var now;
            var accessCondition;
            var dateIssued;
            var originInfo;
            var relatedItem;
            var genre;
            var accessConditionText = 'Use of this public-domain resource is governed by the <a href="http://creativecommons.org/licenses/by-nc/3.0/" rel="license">Creative Commons Attribution-NonCommercial 3.0 Unported License</a>.';
            var mods = $(xml).find('mods');
            var modsFields = entity.viewModel().modsFields();

            // Create the title element
            var titleInfo = entity.selfWorking.createElement('titleInfo');
            var title = entity.selfWorking.createElement('title');
            title.appendChild(entity.selfWorking.createTextNode(modsFields.title()));
            $(titleInfo).append(title);
            mods.append(titleInfo);

            // Create the author names
            modsFields.author().forEach(function(author) {
                var roleTerm;
                var namePart;
                var role;
                var name;
                if (author.name().trim().length > 0) {
                    name = entity.selfWorking.createElement('name');
                    name.setAttribute('type', 'personal');
                    namePart = entity.selfWorking.createElement('namePart');
                    namePart.appendChild(entity.selfWorking.createTextNode(author.name()));
                    $(name).append(namePart);

                    role = entity.selfWorking.createElement('role');
                    roleTerm = entity.selfWorking.createElement('roleTerm');
                    roleTerm.setAttribute('type', 'text');
                    roleTerm.setAttribute('authority', 'marcrealtor');
                    roleTerm.appendChild(entity.selfWorking.createTextNode('Author'));
                    $(role).append(roleTerm);

                    $(name).append(role);
                    mods.append(name);
                }
            });

            // Create genre element
            genre = entity.selfWorking.createElement('genre');
            genre.setAttribute('type', 'formatType');
            genre.appendChild(entity.selfWorking.createTextNode(modsFields.modsType()));
            mods.append(genre);

            // create origin info or related item info
            if (modsFields.date().trim().length > 0) {
                relatedItem = entity.selfWorking.createElement('relatedItem');
                originInfo = entity.selfWorking.createElement('originInfo');

                dateIssued = entity.selfWorking.createElement('dateIssued');
                dateIssued.setAttribute('encoding', 'w3cdtf');
                dateIssued.setAttribute('keyDate', 'yes');
                dateIssued.appendChild(entity.selfWorking.createTextNode(modsFields.date()));
                $(originInfo).append(dateIssued);

                switch (modsFields.modsType()) {
                    case 'Audio':
                    case 'Book (whole)':
                    case 'Correspondence':
                    case 'Journal (whole)':
                    case 'Manuscript':
                    case 'Video':
                    case 'Web resource':
                        mods.append(originInfo);
                        break;

                    case 'Book (part)':
                        $(relatedItem).append(originInfo);
                        mods.append(relatedItem);
                        break;

                    case 'Journal (part)':
                        var part = entity.selfWorking.createElement('part');

                        var date = entity.selfWorking.createElement('date');
                        date.setAttribute('encoding', 'w3cdtf');
                        date.appendChild(entity.selfWorking.createTextNode(modsFields.date()));
                        $(part).append(date);

                        $(relatedItem).append(part);
                        mods.append(relatedItem);
                        break;
                }
            }

            // create access condition

            accessCondition = entity.selfWorking.createElement('accessCondition');
            accessCondition.setAttribute('type', 'use and reproduction');
            $(accessCondition).html(accessConditionText);

            mods.append(accessCondition);

            // create record info
            now = new Date();
            recordInfo = entity.selfWorking.createElement('recordInfo');

            if (modsFields.project().trim().length > 0) {
                recordContentSource = entity.selfWorking.createElement('recordContentSource');
                recordContentSource.appendChild(entity.selfWorking.createTextNode(modsFields.project()));
                $(recordInfo).append(recordContentSource);
            }

            recordCreationDate = entity.selfWorking.createElement('recordCreationDate');
            recordCreationDate.setAttribute('encoding', 'w3cdtf');
            recordCreationDate.appendChild(entity.selfWorking.createTextNode(now.toISOString().substring(0, 10)));
            $(recordInfo).append(recordCreationDate);

            recordChangeDate = entity.selfWorking.createElement('recordChangeDate');
            recordChangeDate.setAttribute('encoding', 'w3cdtf');
            recordChangeDate.appendChild(entity.selfWorking.createTextNode(now.toISOString().substring(0, 10)));
            $(recordInfo).append(recordChangeDate);

            mods.append(recordInfo);
        }

        function addRecordInfo(xml) {
            var accessConditionText = 'Use of this public-domain resource is governed by the <a href="http://creativecommons.org/licenses/by-nc/3.0/" rel="license">Creative Commons Attribution-NonCommercial 3.0 Unported License</a>.';
            var recordInfo = entity.selfWorking.createElement('recordInfo');
            var accessCondition = entity.selfWorking.createElement('accessCondition');
            var originInfo = entity.selfWorking.createElement('originInfo');
            var recordCreationDate = entity.selfWorking.createElement('recordCreationDate');
            var recordChangeDate = entity.selfWorking.createElement('recordChangeDate');
            var type = entity.selfWorking.createElement(dialogType);
            var selector = 'entity';
            var todayText;
            var creationText = '';
            accessCondition.setAttribute('type', 'use and reproduction');
            $(xml).find(selector).append(type);

            selector = 'entity > ' + dialogType;
            $(xml).find(selector).append(recordInfo);
            selector = 'entity > ' + dialogType + ' > recordInfo';
            // var selector = 'entity > ';

            // accessCondition.attr('type', 'use and reproduction');
            // var newText = entity.selfWorking.createTextNode(accessConditionText);
            $(accessCondition).html(accessConditionText);
            $(xml).find(selector).append(accessCondition);
            // $(accessCondition).append(newText);

            $(xml).find(selector).append(originInfo);
            selector = 'entity > ' + dialogType + ' > recordInfo > originInfo';
            todayText = entity.viewModel().paddedToday();
            // XXX Change when editing
            if (!entity.editing) {
                creationText = todayText;
            }

            $(recordCreationDate).append(creationText);
            $(recordChangeDate).append(todayText);
            $(xml).find(selector).append(recordCreationDate);
            $(xml).find(selector).append(recordChangeDate);

        }

        function getWorkingXML() {
            var result = null;
            var startingXML = '<?xml version="1.0" encoding="UTF-8"?>';

            switch (dialogType) {
                case 'person' :
                case 'organization' :
                case 'place' :
                    startingXML += '<?xml-model href="http://cwrc.ca/schemas/entities.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>';
                    break;
                case 'title' :
                    startingXML += '<mods xmlns="http://www.loc.gov/mods/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/mods.xsd">';
                    break;
            }

            if (dialogType === 'title') {
                entity.selfWorking = $.parseXML(startingXML + '</mods>');
                validateModsInfo();
                addModsInfo(entity.selfWorking);

                result = xmlToString(entity.selfWorking);
                result = result.replace(/xmlns=''/g, '');
            } else {
                entity.selfWorking = $.parseXML(startingXML + '<entity></entity>');
                addRecordInfo(entity.selfWorking);
                visitStringifyResult(entity[dialogType].workingContainers[0]);
                result = xmlToString(entity.selfWorking);
            }

            return result;
        }

        entity.viewModel().processCallback = function() {
            savingMessageOn();
            setTimeout((function() {
                var result;
                var response;
                var xml;
                entity.viewModel().validated(true);
                xml = getWorkingXML();
                // console.log(xml);
                if (entity.viewModel().validated()) {
                    if (entity.editing) {
                        response = cwrcApi[dialogType].modifyEntity(entity.editingPID, xml);
                    } else {
                        response = cwrcApi[dialogType].newEntity(xml);
                    }
                    result = { response: response, data: xml };

                    entity[dialogType].success(result);

                    if (dialogType === 'title') {
                        $('#cwrcTitleModal').modal('hide');
                    } else {
                        $('#cwrcEntityModal').modal('hide');
                    }
                } else {
                    entity[dialogType].error('Form not valid');
                }
                savingMessageOff();
            }), 200);

        };

        function xmlToString(xmlData) {
            var xmlString;
            if (window.ActiveXObject) { // IE
                xmlString = xmlData.xml;
            } else { // code for Mozilla, Firefox, Opera, etc.
                xmlString = (new XMLSerializer()).serializeToString(xmlData);
            }
            return xmlString;
        }

        // models
        entity.viewModel().displayMode = function(field) {
            return field.input;
        };

        entity.viewModel().paddedToday = function() {
            var date = new Date();
            var pad = '00';
            var month = '' + (date.getMonth() + 1);
            var day = '' + date.getDate();
            month = pad.substring(0, pad.length - month.length) + month;
            day = pad.substring(0, pad.length - day.length) + day;
            return date.getFullYear() + '-' + month + '-' + day;
        };

        ///////////////////////////////////////////////////////////////////////
        // Entity models
        ///////////////////////////////////////////////////////////////////////

        function quantifierModel() {
            // var self = this;
            var that = {};
            that.input = 'quantifier';
            that.path = '';
            that.label = '';
            that.header = '';
            that.minItems = 0;
            that.maxItems = Number.MAX_VALUE; // infinity;
            that.interfaceFields = ko.observableArray();
            that.seed = seedModel();
            that.fieldPadding = ko.observable('0px 0px 0px 0px');
            // 1 1 Interleave
            // 0 1 Optional
            // 1 INF One or more
            // 0 INF Zero or more
            that.isGrowable = function() {
                return !(that.minItems === 1 && that.maxItems === 1);
            };

            that.showAddButton = function() {
                return (that.interfaceFields().length < that.maxItems);
            };

            that.showDelButton = function() {
                return (that.interfaceFields().length > that.minItems);
            };

            that.showRemoveThisButton = function() {
                return (that.interfaceFields().length > that.minItems);
            };

            that.addGroup = function() {
                var newClone;
                if (that.interfaceFields().length < that.maxItems) {
                    newClone = that.seed.clone();
                    newClone.interfaceFields()[0].label = '';
                    that.interfaceFields.push(newClone);
                    setHelp();
                }
            };

            that.delGroup = function() {
                if (that.interfaceFields().length > that.minItems) {
                    that.interfaceFields.pop();
                }
            };

            that.removeThisGroup = function(group) {
                if (that.interfaceFields().length > that.minItems) {
                    that.interfaceFields.remove(group);
                }
            };

            that.isInterleave = function() {
                return (that.minItems === 1 && that.maxItems === 1);
            };

            that.isOptional = function() {
                return (that.minItems === 0 && that.maxItems === 1);
            };

            that.isOneOrMore = function() {
                return (that.minItems === 1 && that.maxItems === Number.MAX_VALUE);
            };

            that.isZeroOrMore = function() {
                return (that.minItems === 0 && that.maxItems === Number.MAX_VALUE);
            };

            that.isRequired = function() {
                return that.isOneOrMore() || that.isInterleave();
            };

            that.clone = function() {
                var result = quantifierModel();
                result.minItems = this.minItems;
                result.maxItems = this.maxItems;
                result.seed = this.seed.clone();
                result.path = this.path;
                result.label = this.label;
                result.header = this.header;
                result.fieldPadding = ko.observable(this.fieldPadding);
                // result.elements = this.elements;
                // take label
                // result.label = result.seed.interfaceFields()[0].label;
                if (result.minItems === 1) {
                    //XXX clone to interfaceFields
                    result.interfaceFields.push(this.seed.clone());
                    // _.last(result.interfaceFields()).interfaceFields()[0].label='';
                }
                // result.seed.interfaceFields()[0].label = '';
                return result;
            };

            return that;
        }

        function interleaveModel() {
            var that = quantifierModel();
            that.minItems = 1;
            that.maxItems = 1;
            return that;
        }

        function optionalModel() {
            var that = quantifierModel();
            that.minItems = 0;
            that.maxItems = 1;
            return that;
        }

        function zeroOrMoreModel() {
            var that = quantifierModel();
            that.minItems = 0;
            that.maxItems = Number.MAX_VALUE;
            return that;
        }

        function oneOrMoreModel() {
            var that = quantifierModel();
            that.minItems = 1;
            that.maxItems = Number.MAX_VALUE;
            return that;
        }

        function seedModel() {
            var that = {};
            that.input = 'seed';
            that.interfaceFields = ko.observableArray();
            that.clone = function() {
                var result = seedModel();
                $.each(that.interfaceFields(), function(index, field) {
                    result.interfaceFields.push(field.clone());
                });

                return result;
            };
            return that;
        }

        function inputModel() {
            var that = {};
            that.input = '';
            that.path = '';
            that.label = '';
            that.help = '';
            that.attributeName = '';
            that.value = ko.observable('');
            that.defaultValue = false;
            that.constructor = inputModel;
            that.nodeMessage = ko.observable('');
            that.nodeMessageClass = ko.observable('label label-info');
            that.options = [];
            that.isSet = false;
            that.fieldPadding = ko.observable('0px 0px 0px 0px');
            that.clone = function() {
                var result = that.constructor();
                result.label = that.label;
                result.path = that.path;
                result.help = that.help;
                result.attributeName = that.attributeName;
                result.options = that.options;
                result.defaultValue = that.defaultValue;
                result.nodeMessage = ko.observable(that.nodeMessage());
                result.nodeMessageClass = ko.observable(that.nodeMessageClass());
                result.isSet = that.isSet;
                result.fieldPadding = ko.observable(that.fieldPadding());
                if (result.defaultValue) {
                    result.value(that.value());
                }
                return result;
            };
            return that;
        }

        function textInputModel() {
            var that = inputModel();
            that.input = 'textField';
            that.constructor = textInputModel;
            that.value = ko.observable();
            return that;
        }

        function datePickerInputModel() {
            var that = inputModel();
            that.input = 'datePicker';
            that.constructor = datePickerInputModel;
            return that;
        }

        function headerInputModel() {
            var that = inputModel();
            that.input = 'header';
            that.constructor = headerInputModel;
            return that;
        }

        function dialogueInputModel() {
            var that = inputModel();
            that.input = 'dialogue';
            that.constructor = dialogueInputModel;
            return that;
        }

        function textAreaModel() {
            var that = inputModel();
            that.input = 'textArea';
            that.constructor = textAreaModel;
            return that;
        }

        function radioButtonModel() {
            var that = inputModel();
            that.input = 'radioButton';
            that.constructor = radioButtonModel;
            return that;
        }

        function dynamicCheckboxModel() {
            var that = inputModel();
            that.input = 'dynamicCheckbox';
            that.value = ko.observableArray();
            that.constructor = dynamicCheckboxModel;
            return that;
        }

        function dropDownModel() {
            var that = inputModel();
            that.input = 'dropDown';
            that.constructor = dropDownModel;
            return that;
        }

        ///////////////////////////////////////////////////////////////////////
        // cD entity interface
        ///////////////////////////////////////////////////////////////////////

        function initializeWithCookie(name) {
            cwrcApi.initializeWithCookie(name);
        }

        cD.initializeWithCookie = initializeWithCookie;

        function initializeWithLogin(username, password) {
            cwrcApi.initializeWithLogin(username, password);
        }

        cD.initializeWithLogin = initializeWithLogin;

        function initializeWithCookieData(data) {
            cwrcApi.initializeWithCookieData(data);
        }

        cD.initializeWithCookieData = initializeWithCookieData;

        // population functions
        function populateDialog(opts) {
            switch (opts.repository) {
                case 'cwrc':
                    populateCWRC(opts);
                    break;
            }
        }

        function visitChildrenPopulate(children, path) {
            var i;
            for (i = 0; i < children.length; ++i) {

                if (path.length > 0 && children[i].nodeName === last(path).name) {
                    last(path).count++;
                } else {
                    path.push({ name: children[i].nodeName, count: 1 });
                }

                visitNodeCWRCPopulate(children[i], path);

                if ((path.length > 0 && i < children.length - 1 && children[i + 1].nodeName !== last(path).name) ||
                    i === children.length - 1) {
                    path.pop();
                }
            }
        }

        function populateCWRC(opts) {
            var workingXML = $.parseXML(opts.data);
            var path = [];
            visitChildrenPopulate(workingXML.childNodes, path);
        }

        function extractTitleMODS(opts) {
            var genre;
            var mods = $(opts.data);
            var modsFields = entity.viewModel().modsFields();
            var element;
            var result = {
                author: []
            };

            // Create the title element
            element = mods.find('titleInfo>title');
            result.title = element.text();

            // Create the author names
            mods.find('name>namePart').each(function() {
                result.author.push({
                    name: $(this).text()
                });
            });

            // Create genre element
            genre = mods.find('genre').text();
            result.modsType = genre;

            // create origin info or related item info
            switch (genre) {
                case 'Book (part)':
                    element = mods.find('relatedItem > originInfo > dateIssued');
                    break;

                case 'Journal (part)':
                    element = mods.find('relatedItem > part > date');
                    break;

                default:
                    element = mods.find('originInfo > dateIssued');
                    break;
            }
            if (element.length > 0) {
                result.date = element.text();
            }

            element = mods.find('recordInfo > recordContentSource');
            if (element.length > 0) {
                result.project = element.text();
            }

            return result;
        }

        function visitNodeCWRCPopulate(node, path) {
            var nodeValue;
            var parentPath;
            visitChildrenPopulate(node.childNodes, path);

            parentPath = path.slice(0, path.length - 1);
            nodeValue = $.trim(node.nodeValue);
            if (node.nodeType === 3 && nodeValue !== '') {
                foundAndFilled(nodeValue, parentPath, entity.viewModel().interfaceFields());
            }
        }

        function getFromFields(currentSection, field) {
            var result;
            var nodeNumber = currentSection.count;
            var currentCount = 0;
            console.log('GETTING FROM FIELDS');
            if (field.input === 'quantifier') {
                result = null;
                ko.utils.arrayForEach(field.interfaceFields(), function(currentSeed) {

                    ko.utils.arrayForEach(currentSeed.interfaceFields(), function(currentField) {
                        var pathArray = currentField.path.split(',');
                        console.log(currentSection.toSource() + ' ' + pathArray.toSource());
                        if ($.inArray(currentSection.name, pathArray) >= 0) {
                            if (currentField.input !== 'header') {
                                console.log('>>>>>>>>>>>>>>>>>>>> RETURNING ' + currentField.input);
                                result = currentField;
                                return false;
                            }
                        } else {
                            console.log('xx xxx xx not found ' + currentSection);
                        }
                    });

                    if (result !== null) {
                        return false;
                    }

                });
                console.log('RESULT :::::: ' + result);
                return result;
            } else {
                console.log('UNHANDLED INPUT     ' + field.input);
            }
        }

        function foundOnSeed(field, parentPath) {
            var result = false;
            var pathNames = parentPath.map(function(p) {
                return p.name;
            });
            $.each(field.seed.interfaceFields(), function(i, currentField) {
                if (pathNames.toString().indexOf(currentField.path) === 0) {
                    result = true;
                    return false;
                }
            });
            return result;
        }

        lastCount = 0;

        function foundAndFilled(nodeValue, parentPath, field) {
            var lastfield;
            var foundOnFields;
            var lastField;
            var pathNames = parentPath.map(function(p) {
                return p.name;
            });
            var foundOnSeedCheck = false,
                currentCount = 0;
            if (field.input === 'quantifier') {
                // check path if sub continue
                if (pathNames.toString().indexOf(field.path) === 0) {
                    // console.log("++++ "  + field.path)
                    lastField = last(field.path.split(','));
                    lastCount = 0;
                    $.each(parentPath, function(i, path) {
                        if (path.name === lastField) {
                            lastCount = path.count;
                            return false;
                        }
                    });

                    foundOnFields = false;
                    $.each(field.interfaceFields(), function(i, currentField) {
                        if (foundAndFilled(nodeValue, parentPath, currentField)) {
                            foundOnFields = true;
                            return false; // break out of loop
                        }
                    });
                    if (foundOnFields) {
                        return true;
                    }
                    if (!foundOnFields) {
                        if (foundOnSeed(field, parentPath)) {
                            field.addGroup();
                            lastfield = last(field.interfaceFields());
                            return foundAndFilled(nodeValue, parentPath, lastfield);
                        }
                    }
                }

            } else if (field.input === 'seed') {
                $.each(field.interfaceFields(), function(i, currentField) {

                    if (foundAndFilled(nodeValue, parentPath, currentField)) {
                        // currentCount += 1;
                        // if (currentCount == lastCount){
                        foundOnSeedCheck = true;
                        return false; // break out of loop
                        // }
                    }
                });

                if (foundOnSeedCheck) {
                    return true;
                }

            } else if (field.input !== 'header') {
                // set value
                if (field.path === pathNames) {

                    if (!field.isSet) {
                        field.isSet = true;
                        if (field.input === 'radioButton' || field.input === 'dynamicCheckbox') {
                            field.value(nodeValue.split(','));
                        } else {
                            field.value(nodeValue);
                        }
                    } else if (field.isSet) {
                        return false;
                    }
                    return true;
                }
            }
        }

        function addStartValue(value, path) {
            // clear ors |
            var i;
            for (i = 0; i < path.length; ++i) {
                if (path[i].name.indexOf('|') !== -1) {
                    path[i].name = dialogType;
                }
            }
            foundAndFilled(value, path, entity.viewModel().interfaceFields());
        }

        // pop create
        function popCreateEntity(opts) {
            if (!opts.editing) {
                entity.editing = false;
                entity.editingPID = '';
            }
            completeDialog(opts);
            // set default value

            if (opts.startValue && opts.startValue.trim() !== '') {
                addStartValue(opts.startValue, entity.startValuePath);
            }
            $('#cwrcEntityModal').modal('show');
            // hackish
            setTimeout(function() {
                $('.modal-body-area').scrollTop(0);
            }, 5);
        }

        function popCreatePerson(opts) {
            dialogType = 'person';
            entity.viewModel().dialogTitle('Add Person');
            popCreateEntity(opts);
        }

        cD.popCreatePerson = popCreatePerson;

        function popCreateOrganization(opts) {
            dialogType = 'organization';
            entity.viewModel().dialogTitle('Add Organization');
            popCreateEntity(opts);
        }

        cD.popCreateOrganization = popCreateOrganization;

        function popCreatePlace(opts) {
            dialogType = 'place';
            entity.viewModel().dialogTitle('Add Place');
            popCreateEntity(opts);
        }

        cD.popCreatePlace = popCreatePlace;

        function popCreateTitle(opts, data) {
            dialogType = 'title';
            if (!opts.editing) {
                entity.editing = false;
                entity.editingPID = '';
            }
            entity.viewModel().dialogTitle(entity.editing ? 'Edit ' + data.title : 'Add Title');
            completeTitleDialog(opts, data);
            $('#cwrcTitleModal').modal('show');
            // hackish
            setTimeout(function() {
                $('.modal-body-area').scrollTop(0);
            }, 5);
        }

        cD.popCreateTitle = popCreateTitle;

        popCreate = {
            person: popCreatePerson,
            organization: popCreateOrganization,
            place: popCreatePlace,
            title: popCreateTitle
        };

        cD.popCreate = popCreate;

        // pop edit
        function prepareEditingDialog(opts) {
            entity.editing = true;
            entity.editingPID = opts.id;
            opts.editing = entity.editing;
        }

        function popEditPerson(opts) {
            prepareEditingDialog(opts);
            cD.popCreatePerson(opts);
            populateDialog(opts);
        }

        cD.popEditPerson = popEditPerson;

        function popEditOrganization(opts) {
            prepareEditingDialog(opts);
            cD.popCreateOrganization(opts);
            populateDialog(opts);
        }

        cD.popEditOrganization = popEditOrganization;

        function popEditPlace(opts) {
            prepareEditingDialog(opts);
            cD.popCreatePlace(opts);
            populateDialog(opts);
        }

        cD.popEditPlace = popEditPlace;

        function popEditTitle(opts) {
            prepareEditingDialog(opts);
            cD.popCreateTitle(opts, extractTitleMODS(opts));
        }

        cD.popEditTitle = popEditTitle;

        cD.popEdit = {
            person: popEditPerson,
            organization: popEditOrganization,
            place: popEditPlace,
            title: popEditTitle
        };

        ///////////////////////////////////////////////////////////////////////
        // Search
        ///////////////////////////////////////////////////////////////////////
        search = {};
        search.buttons = ko.observableArray([]);
        // search.infoTitle = ko.observable('');
        search.dialogTitle = ko.observable('');

        search.getLinkedDataSource = function(specs) {
            var that = {
                results: ko.observableArray([]),
                ajaxRequest: null,
                name: specs.name === null ? '' : specs.name,
                processSearch: specs.processSearch === null ? function(queryString) {
                } : specs.processSearch,
                // scrape : specs.scrape,
                htmlify: specs.htmlify,
                datatype: specs.datatype,
                showPanel: ko.observable(true),
                page: ko.observable(0),
                paginate: specs.paginate === null ? $.noop : function(scope, event) {
                    var page = parseInt($(event.currentTarget).attr('data'));
                    if (page <= that.maxPage() && page >= 0) {
                        specs.paginate(page, that);
                    }
                },
                maxPage: ko.observable(0),
                showPaginate: ko.observable(specs.paginate !== null),
                paginateNumber: function(index) {
                    if (that.page() < 3) {
                        return index;
                    } else if (that.page() >= (that.maxPage() - 3)) {
                        return index + that.maxPage() - 5;
                    }
                    return index - 2 + that.page();
                }
            };
            return that;
        };

        search.processCWRCSearch = function(queryString, page) {
            var perPage = 100;
            search.linkedDataSources.cwrc.page(page);

            $('.linkedDataMessage').text('');
            $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
            $('#CWRCDataMessage').addClass('fa fa-spin fa-refresh');
            search.processData = cwrcApi[dialogType].getEntity;
            search.linkedDataSources.cwrc.ajaxRequest = cwrcApi[dialogType].searchEntity({
                limit: perPage,
                page: page ? page : 0,
                query: queryString,
                success: function(result) {
                    var top;
                    var bottom;
                    $.each(result.response.objects, function(i, doc) {
                        search.linkedDataSources.cwrc.results.push(search.getResultFromCWRC(doc));
                    });
                    $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
                    //$("#CWRCDataMessage").text("Results: " + search.linkedDataSources.cwrc.results().length );

                    // Calculate the range displayed in the message
                    bottom = 1 + (perPage * page);
                    top = (page + 1) * perPage;
                    top = result.response.numFound < top ? result.response.numFound : top;

                    $('#CWRCDataMessage').text('Results: ' + bottom + ' - ' + top);

                    search.linkedDataSources.cwrc.maxPage(Math.floor(result.response.numFound / perPage));
                },
                error: function(result) {
                    console.log(result);
                }
            });
        };

        search.processGeoNameData = function(id) {
            return xmlToString(search.linkedDataSources.geonames.response[id]);
        };

        search.processGoogleGeocodeData = function(id) {
            return xmlToString(search.linkedDataSources.googlegeocode.response[id]);
        };

        search.processViafData = function(id) {
            var url = viafUrl + '/' + id + '/viaf.xml';
            var result = '';
            $.ajax({
                url: url,
                dataType: 'text',
                async: false,
                success: function(response) {
                    result = response;
                },
                error: function() {
                    alert('error');
                }
            });
            return result;
        };

        search.processVIAFSearch = function(queryString, page) {
            // Calculate Page Information
            var quotedQueryString;
            var viafPrefix;
            var viafSearchUrl;
            var perPage = 100;
            var bottom = 1 + (page * perPage);
            search.linkedDataSources.viaf.page(page);

            $('.linkedDataMessage').text('');
            $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
            $('#VIAFDataMessage').addClass('fa fa-spin fa-refresh');
            search.processData = search.processViafData;
            viafSearchUrl = viafUrl + '/search';
            viafPrefix = '';

            switch (dialogType) {
                case 'person' :
                    viafPrefix = 'local.personalNames+all+';
                    break;
                case 'organization':
                    viafPrefix = 'local.corporateNames+all+';
                    break;
                case 'place':
                    viafPrefix = 'local.geographicNames+all+';
                    break;
                case 'title':
                    viafPrefix = 'local.uniformTitleWorks+=';
                    break;
            }
            quotedQueryString = '"' + queryString + '"';
            search.linkedDataSources.viaf.ajaxRequest = $.ajax({
                url: viafSearchUrl,
                // dataType : 'json',
                dataType: 'xml',
                processData: false,
                data: 'query=' + viafPrefix + quotedQueryString + '&maximumRecords=' + perPage + '&startRecord=' + bottom + '&httpAccept=text/xml',
                success: function(response) {
                    var totalResults,
                        top;
                    $('searchRetrieveResponse record', response).each(function(index, spec) {
                        search.linkedDataSources.viaf.results.push(search.getResultFromVIAF(spec, index));
                    });
                    $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
                    $('#VIAFDataMessage').text('Results: ' + search.linkedDataSources.viaf.results().length);

                    // Calculate the range displayed in the message
                    totalResults = parseInt($('searchRetrieveResponse numberOfRecords', response).text());
                    top = (page + 1) * perPage;
                    top = totalResults < top ? totalResults : top;

                    $('#VIAFDataMessage').text('Results: ' + bottom + ' - ' + top);

                    search.linkedDataSources.viaf.maxPage(Math.floor(totalResults / perPage));
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    if (ajaxOptions !== 'abort') {
                        console.log('Error ' + ajaxOptions);
                    }
                }
            });
        };

        search.processGeoNameSearch = function(queryString) {
            var quotedQueryString;
            $('.linkedDataMessage').text('');
            $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
            $('#GeoNamesDataMessage').addClass('fa fa-spin fa-refresh');
            search.processData = search.processGeoNameData;
            quotedQueryString = encodeURI(queryString);
            search.linkedDataSources.viaf.ajaxRequest = $.ajax({
                url: geonameUrl,
                dataType: 'xml',
                processData: false,
                data: 'query=' + quotedQueryString,
                success: function(response) {
                    search.linkedDataSources.geonames.response = [];
                    $('geonames geoname', response).each(function(index, spec) {
                        search.linkedDataSources.geonames.results.push(search.getResultFromGeoName(spec, index));
                        search.linkedDataSources.geonames.response.push(spec);
                    });
                    $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
                    $('#GeoNamesDataMessage').text('Results: ' + search.linkedDataSources.geonames.results().length);
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    if (ajaxOptions !== 'abort') {
                        console.log('Error ' + ajaxOptions);
                    }
                }
            });
        };

        search.processGoogleGeocodeSearch = function(queryString) {
            var quotedQueryString;
            $('.linkedDataMessage').text('');
            $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
            $('#GoogleGeocodeDataMessage').addClass('fa fa-spin fa-refresh');
            search.processData = search.processGoogleGeocodeData;
            quotedQueryString = encodeURI(queryString);
            search.linkedDataSources.viaf.ajaxRequest = $.ajax({
                url: googleGeocodeUrl,
                // dataType : 'json',
                dataType: 'xml',
                processData: false,
                data: 'address=' + quotedQueryString,
                success: function(response) {
                    search.linkedDataSources.googlegeocode.response = [];
                    console.log(response);

                    $('GeocodeResponse result', response).each(function(index, spec) {
                        search.linkedDataSources.googlegeocode.results.push(search.getResultFromGoogleGeocode(spec, index));
                        search.linkedDataSources.googlegeocode.response.push(spec);
                    });

                    $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
                    $('#GoogleGeocodeDataMessage').text('Results: ' + search.linkedDataSources.googlegeocode.results().length);
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    if (ajaxOptions !== 'abort') {
                        console.log('Error ' + ajaxOptions);
                    }
                }
            });
        };

        // Scraping functions
        search.scrapeResult = function() {
            if (search.selectedData) {
                search.selectedData.data = search.processData(search.selectedData.id);
            }
        };

        search.htmlifyCWRCPerson = function() {
            var genderSelector;
            var data = search.selectedData;
            var workingXML = $.parseXML(data.data);
            // birthDeath
            var dateTypeSelector = 'entity > person > description > existDates > dateSingle > dateType';
            var birthNode = $(workingXML).find(dateTypeSelector).filter(function() {
                return $(this).text() === 'birth';
            });
            var deathNode = $(workingXML).find(dateTypeSelector).filter(function() {
                return $(this).text() === 'death';
            });
            var birthValue = birthNode.siblings('standardDate').text();
            var deathValue = deathNode.siblings('standardDate').text();
            // if (birthValue !== '' && deathValue !== '') {
            // 	data.birthDeath = birthValue + "-" + deathValue;
            // }

            var dateSpacer = '...';

            birthValue = birthValue === '' ? dateSpacer : birthValue;
            deathValue = deathValue === '' ? dateSpacer : deathValue;

            if (birthValue === dateSpacer && deathValue === dateSpacer) {
                data.birthDeath = '';
            } else {
                data.birthDeath = birthValue + ' - ' + deathValue;
            }

            // gender.
            genderSelector = 'entity > person > description > genders > gender';
            data.gender = $(workingXML).find(genderSelector).first().text();

            // url
            data.url = 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/' + data.id;

            return search.completeHtmlifyPerson(data);

        };

        search.htmlifyCWRCOrganization = function() {
            var data = search.selectedData;
            var workingXML = $.parseXML(data.data);
            // url
            data.url = 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/' + data.id;
            return search.completeHtmlifyOrganization(data);
        };

        search.getAnchor = function(url) {
            var anchor = $('<a></a>');
            anchor.attr('target', '_blank');
            anchor.attr('href', url);
            anchor.append('URL: ' + url);
            return anchor;
        };

        search.completeHtmlifyOrganization = function(data) {
            var head = $('<div></div>');
            var list = $('<ul></ul>');

            // for (var i =0 ; i< data.variantNames.length; ++i) {
            var listItem = $('<li></li>');

            listItem.append(search.getAnchor(data.url));
            list.append(listItem);
            // }

            head.append(list);

            return xmlToString(head[0]);
        };

        search.htmlifyCWRCTitle = function() {

            var data = search.selectedData;
            var workingXML = $.parseXML(data.data);
            // author,
            data.authors = [];//'Author';
            var authorSelector = 'mods > name'; //

            var authors = $(workingXML).find(authorSelector).filter(function() {
                return $(this).attr('type') === 'personal';
            });
            $(authors).children('namePart').each(function(i, namePart) {
                data.authors.push($(namePart).text());
            });

            //date,

            var dateSelector = 'mods > originInfo > dateIssued';
            data.date = $(workingXML).find(dateSelector).first().text();
            //URL
            data.url = 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/' + data.id;

            return search.completeHtmlifyTitle(data);
        };

        search.completeHtmlifyTitle = function(data) {
            var head = $('<div></div>');
            var list = $('<ul></ul>');
            //author
            var listItem;
            for (var i = 0; i < data.authors.length; ++i) {
                listItem = $('<li></li>');
                listItem.append('Author: ' + data.authors[i]);
                list.append(listItem);
            }

            // date
            listItem = $('<li></li>');
            listItem.append('Date: ' + data.date);
            list.append(listItem);
            // url
            listItem = $('<li></li>');
            listItem.append(search.getAnchor(data.url));
            list.append(listItem);
            head.append(list);
            return xmlToString(head[0]);
        };

        search.htmlifyCWRCPlace = function() {
            var longSelector;
            var latSelector;
            var data = search.selectedData;
            var workingXML = $.parseXML(data.data);

            // First administrative division, country (displayed in line, separated by commas - if possible),
            var firstSelector = 'entity > place > description > firstAdministrativeDivision';
            var countrySelector = 'entity > place > description > countryName';

            var first = $(workingXML).find(firstSelector).first().text();
            var country = $(workingXML).find(countrySelector).first().text();

            data.first = first + ', ' + country;

            latSelector = 'entity > place > description > latitude';

            data.lat = $(workingXML).find(latSelector).first().text();
            longSelector = 'entity > place > description > longitude';

            data.long = $(workingXML).find(longSelector).first().text();
            data.url = 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/' + data.id;

            return search.completeHtmlifyPlace(data);
        };

        search.completeHtmlifyPlace = function(data) {
            var head = $('<div></div>');
            var list = $('<ul></ul>');
            var listItem;

            // first
            listItem = $('<li></li>');
            listItem.append(data.first);
            list.append(listItem);
            // lat
            listItem = $('<li></li>');
            listItem.append('Latitude: ' + data.lat);
            list.append(listItem);
            // long
            listItem = $('<li></li>');
            listItem.append('Longitude: ' + data.long);
            list.append(listItem);
            // url
            listItem = $('<li></li>');
            listItem.append(search.getAnchor(data.url));
            list.append(listItem);

            head.append(list);
            return xmlToString(head[0]);
        };

        search.htmlifyVIAFPerson = function() {
            var data = search.selectedData;
            return search.completeHtmlifyPerson(data);
        };

        search.completeHtmlifyPerson = function(data) {
            var result = '<div><ul>';

            if (data.nationality && data.nationality !== '') {
                result += '<li>Nationality: ' + data.nationality + '</li>';
            }
            if (data.birthDeath && data.birthDeath !== '') {
                result += '<li>Birth - Death: ' + data.birthDeath + '</li>';
            }
            // if (data.gender && data.gender !== '') {
            // 	result += "<li>Gender: "+ data.gender +"</li>";
            // }
            if (data.url && data.url !== '') {
                result += '<li>URL: <a target="_blank" href="' + data.url + '">' + data.url + '</a></li>';
            }
            result += '</ul></div>';
            return result;
        };

        search.htmlifyVIAFOrganization = function() {
            var result = '';
            var data = search.selectedData;

            result += '<div><ul>';
            if (data.url !== '') {
                result += '<li>URL: <a href="' + data.url + '">' + data.url + '</a></li>';
            }
            result += '</ul></div>';
            return result;
        };

        search.htmlifyVIAFTitle = function() {
            var data = search.selectedData;
            var head = $('<div></div>');
            var list = $('<ul></ul>');
            var listItem;

            if (data.authors) {
                listItem = $('<li></li>');
                listItem.append('Author: ' + data.authors[0]);
                list.append(listItem);
            }

            if (data.date) {
                listItem = $('<li></li>');
                listItem.append('Date: ' + data.date);
                list.append(listItem);
            }

            if (data.url) {
                listItem = $('<li></li>');
                listItem.append(search.getAnchor(data.url));
                list.append(listItem);
            }

            head.append(list);
            return xmlToString(head[0]);
        };

        search.paginateSearch = function(page, dataSource) {
            var key, lds, queryString ;
            for (key in search.linkedDataSources) {
                if (search.linkedDataSources.hasOwnProperty(key)) {
                    lds = search.linkedDataSources[key];
                    lds.results.removeAll();
                }
            }

            queryString = search.queryString();
            if (queryString && queryString !== null && queryString.length > 0) {
                dataSource.processSearch(search.queryString(), page);
            }
        };

        search.linkedDataSources = {
            'cwrc': search.getLinkedDataSource({
                'name': 'CWRC',
                'processSearch': search.processCWRCSearch,
                'datatype': [ 'person', 'place', 'organization', 'title' ],
                'paginate': search.paginateSearch
            }),
            'viaf': search.getLinkedDataSource({
                'name': 'VIAF',
                'processSearch': search.processVIAFSearch,
                'datatype': [ 'person', 'organization', 'title' ],
                'paginate': search.paginateSearch
            }),
            'geonames': search.getLinkedDataSource({
                'name': 'GeoNames',
                'processSearch': search.processGeoNameSearch,
                'datatype': [ 'place' ],
                'paginate': null
            }),
            'googlegeocode': search.getLinkedDataSource({
                'name': 'GoogleGeocode',
                'processSearch': search.processGoogleGeocodeSearch,
                'datatype': [ 'place' ],
                'paginate': null
            })
        };

        search.selectedLinkedDataSource = 'cwrc';
        search.queryString = ko.observable('');

        // templates
        search.getLinkedDataSourceTemplates = function() {
            var lds;
            var key;
            var result = '';
            var index = 0;
            var cl;
            for (key in search.linkedDataSources) {
                if (search.linkedDataSources.hasOwnProperty(key)) {
                    lds = search.linkedDataSources[key];
                    cl = (index === 0) ? 'in' : '';
                    result +=
                        '										<div class="panel panel-default" data-bind="visible: $root.linkedDataSources.' + key + '.showPanel">' +
                        '											<div data-name="' + key + '" class="panel-heading panel-title" data-toggle="collapse" data-parent="#accordion" href="#collapse' + key + '" data-bind="{click:$root.selectLinkedDataSource}">' +
                        '														' + lds.name + '<span class="pull-right linkedDataMessage" id="' + lds.name + 'DataMessage"></span>' +
                        '											</div>' +
                        '											<div id="collapse' + key + '" class="panel-collapse collapse ' + cl + '">' +
                        '												<div class="panel-body">' +
                        // paginator
                        '									<div class="paginatorArea" id="' + lds.name + 'Paginator" data-bind="{if: $root.linkedDataSources[\'' + key + '\' ].showPaginate}">' +
                        //'									<span data-bind="{text: $root.linkedDataSources[\'' + key + '\' ].page}">Results 100</span>'+
                        // '									<select class="form-control">' +
                        // '										<option>1</option>' +
                        // '										<option>2</option>' +
                        // '										<option>3</option>' +
                        // '										<option>4</option>' +
                        // '										<option>5</option>' +
                        // '									</select>' +
                        '									<ul class="pagination  pagination-sm nomargin" data-bind="with: $root.linkedDataSources[\'' + key + '\' ]">' +
                        '										<li data-bind="{css: {disabled: page() <= 0}}"><a href="#" data-bind="{attr: {data: page() - 1}, click: paginate}">&laquo;</a></li>' +
                        '										<li data-bind="{css: {active: page() == paginateNumber(0), disabled: paginateNumber(0) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(0)}, text: paginateNumber(0) + 1, click: paginate}" data="0">1</a></li>' +
                        '										<li data-bind="{css: {active: page() == paginateNumber(1), disabled: paginateNumber(1) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(1)}, text: paginateNumber(1) + 1, click: paginate}" data="1">2</a></li>' +
                        '										<li data-bind="{css: {active: page() == paginateNumber(2), disabled: paginateNumber(2) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(2)}, text: paginateNumber(2) + 1, click: paginate}" data="2">3</a></li>' +
                        '										<li data-bind="{css: {active: page() == paginateNumber(3), disabled: paginateNumber(3) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(3)}, text: paginateNumber(3) + 1, click: paginate}" data="3">4</a></li>' +
                        '										<li data-bind="{css: {active: page() == paginateNumber(4), disabled: paginateNumber(4) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(4)}, text: paginateNumber(4) + 1, click: paginate}" data="4">5</a></li>' +
                        '										<li data-bind="{css: {disabled: page() >= maxPage()}}"><a href="#" data-bind="{attr: {data: page() + 1}, click: paginate}">&raquo;</a></li>' +
                        '									</ul>' +
                        '									</div>' +
                        // content
                        '									<div class="list-group cwrc-result-area">' +
                        '										<!-- ko foreach: linkedDataSources.' + key + '.results -->' +
                        '										<a href="#" class="list-group-item" data-bind="{click:$root.selectResult, event: { dblclick: $root.returnAndHide }, css: {active: selected}}" >' +
                        '											<h5 class="list-group-item-heading">' +
                        '												<span data-bind="text: name"></span>' +
                        '												<span class="cwrc-entity-info pull-right fa fa-info-circle" data-bind="click: $root.showInfoPopOver" data-content="Test content" data-original-title="Test title"></span>' +
                        '											</h5>' +
                        // '											<h5 class="list-group-item-heading"> <span data-bind="text:data[\'dc.title\' ]"></span> - <span data-bind="text:source"></span></h5>' +
                        // '											<p class="list-group-item-text"><span data-bind="text:data.id"></span></p>' +
                        '										</a>' +
                        '										<!-- /ko -->' +
                        '									</div>' +
                        // end of content
                        '												</div>' +
                        '											</div>' +
                        '										</div>';
                    ++index;
                }
            }
            return result;
        };

        search.initialize = function() {
            var queryResultsTemplate = '' +
                '<script type="text/html" id="queryResults">' +
                '										<div class="panel panel-default">' +
                '											<div data-name="NAME VARIABLE" class="panel-heading panel-title" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" data-bind="{click:$root.selectLinkedDataSource}">' +
                '														NAME VARIABLE' +
                '											</div>' +
                '											<div id="collapseOne" class="panel-collapse collapse in">' +
                '												<div class="panel-body">' +
                // content
                '									<div class="list-group cwrc-result-area">' +
                '									</div>' +
                // end of content
                '												</div>' +
                '											</div>' +
                '										</div>' +
                '</script>';

            var searchTemplates = '' +
                '<div id="cDSearch" class="bootstrap-scope">' +
                '	<div class="modal fade" id="cwrcSearchDialog">' +
                '		<div class="modal-dialog" id="search-modal">' +
                '			<div class="modal-content">' +
                '				<div class="modal-header">' +
                '					<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                // '					<h4 class="modal-title"><span>Search XXX</span></h4>' +
                '						<h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
                '				</div>' +
                '				<div class="modal-body modal-body-area">' +
                '					<!-- Content -->' +
                '					<div class="row">' +
                '						<div class="col-lg-12">' +
                '								<input type="text" class="form-control" id="searchEntityInput" placeholder="Search" data-bind="{value:queryString, onKeyUp: delayedSearchEntity}">' +
                '						</div><!-- /.col-lg-6 -->' +
                '					</div><!-- /.row -->' +
                '					<br> <!-- FIXME -->' +
                '					<div class="row">' +
                '						<!-- Results -->' +
                '						<div class="col-lg-12">' +
                '							<div class="panel">' +
                // '								<div class="panel-heading">Results</div>' +
                '								<div class="panel-body">' +
                '									<div class="panel-group" id="accordion">' +
                search.getLinkedDataSourceTemplates() +
                // '										<!-- ko foreach: linkedDataSources -->' +
                // '										+<div data-bind="template: { name: \'queryResults\', data: $data }"></div>' +
                // '										<!-- /ko -->' +
                '									</div>' +
                '								</div>' +
                '							</div>' +
                '						</div>' +
                '					</div>' +
                '					<!--  End of content-->' +
                '				</div>' +
                '				<div class="modal-footer">' +
                '					<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
                '					<!-- ko foreach: buttons -->' +
                '					<button type="button" class="btn btn-default" data-dismiss="modal" data-bind="text:label, click: $root.runCustomAction"></button>' +
                '					<!-- /ko -->' +
                // '					<button type="button" class="btn btn-default" data-bind="click: createEntity">Add New</button>' +
                '					<button type="button" class="btn btn-primary" data-dismiss="modal" data-bind="click: returnSelected">Select</button>' +
                '				</div>' +
                '			</div>' +
                '		</div>' +
                '	</div>' +
                '</div>';

            $('body').append(searchTemplates);

            ko.bindingHandlers.datepicker = {
                init: function(element, valueAccessor, allBindingsAccessor) {
                    var options = {
                        format: 'yyyy-mm-dd',
                        viewMode: 2,
                        autoclose: true
                    };

                    $(element).siblings(':button').first().bsDatepicker(options);

                    ko.utils.registerEventHandler($(element).siblings(':button').first(), 'changeDate', function(event) {
                        var value = valueAccessor();
                        if (ko.isObservable(value)) {
                            var dateVal = ko.toJSON(event.date).substr(1, 10);
                            value(dateVal);
                            $(element).val(dateVal);
                        }
                    });

                    ko.utils.registerEventHandler(element, 'keyup', function(event) {
                        var value = valueAccessor();
                        var dateVal;
                        if (ko.isObservable(value)) {
                            dateVal = event.target.value;
                            value(dateVal);
                        }
                    });
                },
                update: function(element, valueAccessor) {
                    var value = valueAccessor();
                    $(element).val(ko.unwrap(value));
                }
            };

            ko.bindingHandlers.onKeyUp = {
                init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
                    ko.utils.registerEventHandler(element, 'keyup', function(evt) {
                        valueAccessor().call(viewModel);
                    });
                }
            };

            ko.applyBindings(search, $('#cDSearch')[0]);
            $('#cwrcSearchDialog').modal(params.modalOptions);

            $('#cwrcSearchDialog').draggable({
                handle: '.modal-header'
            });
            $('#cwrcSearchDialog').on('hidden.bs.modal', function(e) {
                // stop ajax call if exists
                var lds, key;
                search.clear();
                for (key in search.linkedDataSources) {
                    if (search.linkedDataSources.hasOwnProperty(key)) {
                        lds = search.linkedDataSources[key];
                        if (lds.ajaxRequest) {
                            lds.ajaxRequest.abort();
                        }
                    }
                }
                search.clear();
            });

            $('#cwrcSearchDialog').on('show.bs.modal', function(e) {
                $('.modal-body-area').css('max-height', $(window).height() * 0.7);
            });

        };

        // search functionality
        search.clear = function() {
            var key, lds;
            search.selectedData = null;
            for (key in search.linkedDataSources) {
                if (search.linkedDataSources.hasOwnProperty(key)) {
                    lds = search.linkedDataSources[key];
                    lds.results.removeAll();
                }
            }
            search.queryString('');
            search.initiateInfo();
            search.removeInfoPopOver();
            $('.linkedDataMessage').text('');
            $('.linkedDataMessage').removeClass('fa fa-spin fa-refresh');
            $('#searchEntityInput').val('');
        };

        // search.delayedTimeout;
        search.delayedSearchEntity = function() {
            clearTimeout(search.delayedTimeout);
            search.delayedTimeout = setTimeout(search.searchEntity, 1000);
        };

        search.searchEntity = function() {
            search.removeInfoPopOver();
            search.performSearch($('#searchEntityInput').val());
        };

        // Logic functions

        // models
        search.result = function(specs) {
            var that = {
                // processed initially
                name: '',
                id: '',
                // processed for result
                data: '',
                // scrape : function() {return '';}, // defined for each linked data source
                // helper
                selected: ko.observable(false)
            };
            return that;
        };

        search.htmlifyGeoNamePlace = function(name, countryName, latitude, longitude, id) {
            var url;
            var head = $('<div></div>');
            var list = $('<ul></ul>');
            var listItem = $('<li></li>');
            listItem.append('Country: ' + countryName);
            list.append(listItem);

            listItem = $('<li></li>');
            listItem.append('Latitude: ' + latitude);
            list.append(listItem);

            listItem = $('<li></li>');
            listItem.append('Longitude: ' + longitude);
            list.append(listItem);

            url = 'http://www.geonames.org/' + id;
            listItem = $('<li></li>');
            listItem.append('URL:&nbsp;<a href="' + url + '" target="_blank">' + url + '</a>');
            list.append(listItem);
            head.append(list);
            return xmlToString(head[0]);
        };

        search.htmlifyGoogleGeocodePlace = function(lat, lng, url) {
            var head = $('<div></div>');
            var list = $('<ul></ul>');
            var listItem = $('<li></li>');
            listItem.append('Latitude: ' + lat);
            list.append(listItem);

            listItem = $('<li></li>');
            listItem.append('Longitude: ' + lng);
            list.append(listItem);

            listItem = $('<li></li>');
            listItem.append(search.getAnchor(url));
            list.append(listItem);

            head.append(list);
            return xmlToString(head[0]);
        };

        search.getResultFromGeoName = function(specs, index) {
            // specs has data and source
            var that = search.result();
            that.id = index;
            that.name = $(specs).find('name').text() + ', ' + $(specs).find('countryName').text();
            that.htmlify = function() {
                return search.htmlifyGeoNamePlace($(specs).find('name').text(),
                    $(specs).find('countryName').text(),
                    $(specs).find('lat').text(),
                    $(specs).find('lng').text(),
                    $(specs).find('geonameid').text());
            };
            return that;
        };

        search.getResultFromGoogleGeocode = function(specs, index) {
            var that = search.result();
            that.id = index;
            that.name = $(specs).find('formatted_address').text();
            that.htmlify = function() {
                var location = $(specs).find('geometry').find('location');
                var url = 'https://www.google.ca/maps/place/' + encodeURI($(specs).find('formatted_address').text());

                return search.htmlifyGoogleGeocodePlace($(location).find('lat').text(),
                    $(location).find('lng').text(),
                    url);
            };
            return that;
        };

        search.getResultFromCWRC = function(specs) {
            // specs has data and source
            var that = search.result();
            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            that.name = specs.object_label;
            // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
            that.id = specs.PID;

            switch (dialogType) {
                case 'person':
                    // that.scrape = search.scrapeCWRCPerson;
                    that.htmlify = search.htmlifyCWRCPerson;
                    break;
                case 'organization':
                    // that.scrape = search.scrapeCWRCOrganization;
                    that.htmlify = search.htmlifyCWRCOrganization;
                    break;
                case 'title':
                    // that.scrape = search.scrapeCWRCTitle;
                    that.htmlify = search.htmlifyCWRCTitle;
                    break;
                case 'place':
                    // that.scrape = search.scrapeCWRCTitle;
                    that.htmlify = search.htmlifyCWRCPlace;
                    break;
            }
            return that;
        };

        search.viafSelectorHelper = function(originalSelector) {
            var pattern = /ns\d+\\:/g;
            var newSelector = originalSelector.replace(pattern, '');
            return originalSelector + ' , ' + newSelector;
        };

        search.getResultFromVIAF = function(specs, index) {
            var urlSelector;
            var idSelector;
            var nameSelector;
            var that = search.result();
            var i = index + 2;
            // Chrome has a bug which does not find elements with namespaces, to avoid this problem we define the selector twice
            // VIAF returns all of the required information on the list call so there is no need to request again on second call
            var codeSelector = 'a';
            switch (dialogType) {
                case 'person':
                case 'organization':
                    codeSelector = 'a';
                    break;
                case 'title':
                    codeSelector = 't';

            }

            nameSelector = search.viafSelectorHelper('recordData >  ns' + i + '\\:VIAFCluster >  ns' + i + '\\:mainHeadings > ns' + i + '\\:mainHeadingEl > ns' + i + '\\:datafield > ns' + i + '\\:subfield[code="' + codeSelector + '" ]'); //code attribute a
            idSelector = search.viafSelectorHelper('recordData ns' + i + '\\:VIAFCluster ns' + i + '\\:viafID');

            that.name = $(specs).find(nameSelector).first().text(); //$(specs).find(nameSelector).text();
            that.id = $(specs).find(idSelector).first().text();

            // Extra
            urlSelector = search.viafSelectorHelper('recordData >  ns' + i + '\\:VIAFCluster >  ns' + i + '\\:Document');
            that.url = $(specs).find(urlSelector).first().attr('about');

            switch (dialogType) {
                case 'person':
                    search.completeViafPersonResult(that, specs, i);
                    break;
                case 'organization':
                    search.completeViafOrganizationResult(that, specs, i);
                    break;
                case 'title':
                    search.completeViafTitleResult(that, specs, i);
                    break;
            }

            switch (dialogType) {
                case 'person':
                    // that.scrape = search.scrapeVIAFPerson;
                    that.htmlify = search.htmlifyVIAFPerson;
                    break;
                case 'organization':
                    // that.scrape = search.scrapeVIAFOrganization;
                    that.htmlify = search.htmlifyVIAFOrganization;
                    break;
                case 'title':
                    // that.scrape = search.scrapeVIAFTitle;
                    that.htmlify = search.htmlifyVIAFTitle;
                    break;
            }

            return that;
        };

        // CompleteVIAFXXXResult extends the result object with specifics of each entity

        search.completeViafPersonResult = function(that, specs, i) {
            var birthDeathSelector = search.viafSelectorHelper('recordData >  ns' + i + '\\:VIAFCluster >  ns' + i + '\\:mainHeadings > ns' + i + '\\:mainHeadingEl > ns' + i + '\\:datafield > ns' + i + '\\:subfield[code="d"]');
            var genderSelector = search.viafSelectorHelper('recordData >  ns' + i + '\\:VIAFCluster >  ns' + i + '\\:fixed > ns' + i + '\\:gender');
            var genderCode = $(specs).find(genderSelector).first().text();

            that.birthDeath = $(specs).find(birthDeathSelector).first().text();
            switch (genderCode) {
                case 'a':
                    that.gender = 'Female';
                    break;
                case 'b':
                    that.gender = 'Male';
                    break;
                default:
                    that.gender = 'Unspecified';
            }
        };

        search.completeViafOrganizationResult = function(that, specs, i) {

        };

        search.completeViafTitleResult = function(that, specs, i) {
            var authorSelector = search.viafSelectorHelper('recordData > ns' + i + '\\:VIAFCluster > ns' + i + '\\:mainHeadings > ns' + i + '\\:mainHeadingEl > ns' + i + '\\:datafield > ns' + i + '\\:subfield[code="a" ]');
            var dateSelector = search.viafSelectorHelper('recordData > ns' + i + '\\:VIAFCluster > ns' + i + '\\:mainHeadings > ns' + i + '\\:mainHeadingEl > ns' + i + '\\:datafield > ns' + i + '\\:subfield[code="d" ]');
            var date = $(specs).find(dateSelector).first().text();
            var authors = [];
            that.date = date;
            authors.push($(specs).find(authorSelector).first().text());
            that.authors = authors;

        };

        search.selectResult = function(result) {
            $.each(search.linkedDataSources[search.selectedLinkedDataSource].results(), function(i, entry) {
                entry.selected(false);
            });
            result.selected(true);

            if (search.selectedData !== undefined && search.selectedData !== null && search.selectedData !== result) {
                search.removeInfoPopOver();
            }

            search.selectedData = result;
        };

        search.selectLinkedDataSource = function(data, event) {
            search.selectedLinkedDataSource = $(event.target).attr('data-name');
            search.searchEntity();
        };

        search.performSearch = function(queryString) {
            var key, lds;
            search.selectedData = null;

            for (key in search.linkedDataSources) {
                if (search.linkedDataSources.hasOwnProperty(key)) {
                    lds = search.linkedDataSources[key];
                    lds.results.removeAll();
                }
            }

            search.selectedData = null;
            if (queryString !== '') {
                // CWRC Search
                for (key in search.linkedDataSources) {
                    if (search.linkedDataSources.hasOwnProperty(key)) {
                        lds = search.linkedDataSources[key];
                        if (lds.ajaxRequest !== null) {
                            lds.ajaxRequest.abort();
                        }
                    }
                }
                search.linkedDataSources[search.selectedLinkedDataSource].processSearch(queryString, 0);
            }
        };

        search.processData = function() {
            return '';
        };

        search.GetResult = function() {
            var result = {};
            if (search.selectedData) {
                result.id = search.selectedData.id;
                result.name = search.selectedData.name;
                result.repository = search.selectedLinkedDataSource;
                result.data = search.selectedData.data;
            }
            return result;
        };

        search.runCustomAction = function(custom) {
            search.scrapeResult();
            custom.action(search.GetResult());
            search.clear();
        };

        search.returnSelected = function() {
            search.scrapeResult();
            search.success(search.GetResult());
            search.clear();
        };

        search.initiateInfo = function() {
            $('#search-modal').popover({
                title: function() {
                    return search.selectedData.name;
                },
                content: function() {
                    var result = '';
                    result += '<div>';
                    search.scrapeResult();
                    result += search.selectedData.htmlify();
                    result += '</div>';
                    return result;
                },
                html: true,

                trigger: 'manual'
            });
        };

        search.showInfoPopOver = function(clicked) {
            search.selectedData = clicked;
            $('#search-modal').popover('show');
            $('.popover').find('.arrow').removeClass('arrow');
        };

        search.removeInfoPopOver = function() {
            $('#search-modal').popover('hide');
        };

        search.returnAndHide = function() {
            search.returnSelected();
            $('#cwrcSearchDialog').modal('hide');
        };

        ///////////////////////////////////////////////////////////////////////
        // cD search interface
        ///////////////////////////////////////////////////////////////////////

        function completeSearchDialog(opts) {
            var dataSource,
                button,
                dataId,
                i;
            $('#cwrcSearchDialog').modal('show');
            search.buttons.removeAll();
            // search.buttons(opts.buttons);
            if (opts.buttons) {
                for (i = 0; i < opts.buttons.length; ++i) {
                    button = opts.buttons[i];
                    if (typeof(button.label) === 'string' &&
                        typeof(button.action) === 'function') {
                        search.buttons.push(button);
                    }
                }
            }

            // define panels to be shown
            for (dataId in search.linkedDataSources) {
                if (search.linkedDataSources.hasOwnProperty(dataId)) {
                    dataSource = search.linkedDataSources[dataId];
                    dataSource.showPanel(dataSource.datatype.indexOf(dialogType) > -1);
                }
            }

            search.success = opts.success === undefined ? $.noop : opts.success;
            search.error = opts.error === undefined ? $.noop : opts.error;

            if (opts.query) {
                $('#searchEntityInput').val(opts.query);
                search.performSearch(opts.query);
            }
        }

        function popSearchPerson(opts) {
            search.clear();
            search.dialogTitle('Search Person');
            dialogType = 'person';
            completeSearchDialog(opts);
        }

        cD.popSearchPerson = popSearchPerson;

        function popSearchOrganization(opts) {
            search.clear();
            search.dialogTitle('Search Organization');
            dialogType = 'organization';
            completeSearchDialog(opts);
        }

        cD.popSearchOrganization = popSearchOrganization;

        function popSearchPlace(opts) {
            search.clear();
            search.dialogTitle('Search Place');
            dialogType = 'place';
            completeSearchDialog(opts);
        }

        cD.popSearchPlace = popSearchPlace;

        function popSearchTitle(opts) {
            search.clear();
            search.dialogTitle('Search Title');
            dialogType = 'title';
            completeSearchDialog(opts);
        }

        cD.popSearchTitle = popSearchTitle;

        popSearch = {
            person: cD.popSearchPerson,
            organization: cD.popSearchOrganization,
            place: cD.popSearchPlace,
            title: cD.popSearchTitle
        };

        cD.popSearch = popSearch;

        ///////////////////////////////////////////////////////////////////////
        initialize();
    })();
    return cD;
});
