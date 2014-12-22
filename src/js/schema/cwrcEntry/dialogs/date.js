
/*global define*/
define([
    'jquery',
    'jquery-ui',
    'moment',
    'dialogForm'
], function($, jqueryUi, moment, DialogForm) {
    'use strict';
    return function(id, writer) {
        var toggleDate;
        var dateRange;
        var $endDate;
        var $startDate;
        var $dateInput;
        var w = writer;
        var html = '' +
            '<div id="' + id + 'Dialog" class="annotationDialog">' +
            '<div id="' + id + '_type" data-transform="buttonset" data-type="radio" data-mapping="prop.tag">' +
            '<p>Date type:</p>' +
            '<input type="radio" name="dateType" value="DATE" id="' + id + '_type_date" checked="checked"/><label for="' + id + '_type_date">Single Date</label>' +
            '<input type="radio" name="dateType" value="DATERANGE" id="' + id + '_type_range"/><label for="' + id + '_type_range">Date Range</label>' +
            '</div>' +
            '<div id="' + id + '_date">' +
            '<label for="' + id + '_cwrc_datePicker">Date:</label><br/><input type="text" data-type="textbox" data-mapping="VALUE" id="' + id + '_cwrc_datePicker" />' +
            '</div>' +
            '<div id="' + id + '_range">' +
            '<label for="' + id + '_startDate">Start date:</label><br/><input type="text" data-type="textbox" data-mapping="FROM" id="' + id + '_startDate" style="margin-bottom: 5px;"/><br />' +
            '<label for="' + id + '_endDate">End date:</label><br/><input type="text" data-type="textbox" data-mapping="TO" id="' + id + '_endDate" />' +
            '</div>' +
            '<div>Format: YYYY, YYYY-MM, or YYYY-MM-DD<br/>e.g. 2010, 2010-10, 2010-10-31</div>' +
            '<div id="' + id + '_certainty" data-transform="buttonset" data-type="radio" data-mapping="CERTAINTY">' +
            '<p>Certainty:</p>' +
            '<input type="radio" id="' + id + '_cert" name="' + id + '_id_certainty" value="CERT" data-default="true" /><label for="' + id + '_cert">Certain</label>' +
            '<input type="radio" id="' + id + '_c" name="' + id + '_id_certainty" value="C" /><label for="' + id + '_c">Circa</label>' +
            '<input type="radio" id="' + id + '_by" name="' + id + '_id_certainty" value="BY" /><label for="' + id + '_by">By this date</label>' +
            '<input type="radio" id="' + id + '_after" name="' + id + '_id_certainty" value="AFTER" /><label for="' + id + '_after">After this date</label>' +
            '<input type="radio" id="' + id + '_unknown" name="' + id + '_id_certainty" value="UNKNOWN" /><label for="' + id + '_unknown">Unknown date</label>' +
            '<input type="radio" id="' + id + '_rough" name="' + id + '_id_certainty" value="ROUGHLYDATED" /><label for="' + id + '_rough">Rough certainty</label>' +
            '</div>' +
            '<div id="' + id + '_calendar" data-transform="buttonset" data-type="radio" data-mapping="CALENDAR">' +
            '<p>Calendar type:</p>' +
            '<input type="radio" name="calendarType" value="NEWSTYLE" id="' + id + '_calendar_new" checked="checked"/><label for="' + id + '_calendar_new">New style</label>' +
            '<input type="radio" name="calendarType" value="BC" id="' + id + '_calendar_old"/><label for="' + id + '_calendar_old">BC</label>' +
            '</div>' +
            '</div>';
        var dialog = new DialogForm({
            writer: w,
            id: id,
            type: 'date',
            title: 'Tag Date',
            height: 430,
            width: 550,
            html: html
        });

        $('#' + id + '_type input').click(function() {
            toggleDate($(this).val());
        });

        $dateInput = $('#' + id + '_cwrc_datePicker');
        $dateInput.focus(function() {
            $(this).css({ borderBottom: '' });
        });

        $dateInput.datepicker({
            dateFormat: 'yy-mm-dd',
            constrainInput: false,
            changeMonth: true,
            changeYear: true,
            yearRange: '-210:+10',
            minDate: new Date(1800, 0, 1),
            maxDate: new Date(2020, 11, 31),
            showOn: 'button',
            buttonText: 'Date Picker',
            buttonImage: w.cwrcRootUrl + 'img/calendar.png',
            buttonImageOnly: true
        });
        // wrap the datepicker div with our custom class
        // TODO find a better way to do this
        $('#ui-datepicker-div').wrap('<div class="cwrc" />');

        $startDate = $('#' + id + '_startDate');
        $startDate.focus(function() {
            $(this).css({ borderBottom: '' });
        });
        $endDate = $('#' + id + '_endDate');
        $endDate.focus(function() {
            $(this).css({ borderBottom: '' });
        });

        dateRange = $('#' + id + '_startDate, #' + id + '_endDate').datepicker({
            dateFormat: 'yy-mm-dd',
            constrainInput: false,
            changeMonth: true,
            changeYear: true,
            yearRange: '-210:+10',
            minDate: new Date(1800, 0, 1),
            maxDate: new Date(2020, 11, 31),
            showOn: 'button',
            buttonText: 'Date Picker',
            buttonImage: w.cwrcRootUrl + 'img/calendar.png',
            buttonImageOnly: true,
            onSelect: function(selectedDate) {
                var option = this.id.indexOf('startDate') === -1 ? 'maxDate' : 'minDate';
                var instance = $(this).data('datepicker');
                var date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);
                dateRange.not(this).datepicker('option', option, date);
            }
        });

        toggleDate = function(type) {
            $('#' + id + '_date').hide();
            $('#' + id + '_range').hide();
            $dateInput.val('');
            $startDate.val('');
            $endDate.val('');
            if (type === 'DATERANGE') {
                $('#' + id + '_range').show();
            } else {
                $('#' + id + '_date').show();
            }
        };

        dialog.$el.on('beforeShow', function(e, config) {
            var parent;
            var data;
            var day;
            var month;
            var year;
            var dateObj;
            var dateString;
            var dateValue;
            if (dialog.mode === DialogForm.ADD) {
                dateValue = '';
                dateString = w.editor.currentBookmark.rng.toString();
                if (dateString !== '') {
                    dateObj = moment(dateString).toDate(); // use moment library to parse date string properly
                    year = dateObj.getFullYear();
                    if (!isNaN(year)) {
                        if (dateString.length > 4) {
                            month = dateObj.getMonth();
                            month++; // month is zero based index
                            if (month < 10) {
                                month = '0' + month;
                            }
                            day = dateObj.getDate();
                            if (day < 10) {
                                day = '0' + day;
                            }
                            dateValue = year + '-' + month + '-' + day;
                        } else {
                            year++; // if just the year, Date makes it dec 31st at midnight of the prior year
                            dateValue = year;
                        }
                    }
                }
                toggleDate('date');
                $('#' + id + '_type_date').prop('checked', true).button('refresh');
                $dateInput.val(dateValue);
                $startDate.val('');
                $endDate.val('');
            } else {
                data = config.entry.getAttributes();
                parent = config.entry.getTag();
                toggleDate(parent);
                if (parent === 'DATERANGE') {
                    $dateInput.val('');
                    $startDate.val(data.FROM);
                    $endDate.val(data.TO);
                } else {
                    $dateInput.val(data.VALUE);
                    $startDate.val('');
                    $endDate.val('');
                }
            }
            $dateInput.css({ borderBottom: '' });
            $startDate.css({ borderBottom: '' });
            $endDate.css({ borderBottom: '' });
            $dateInput.focus();
        });

        dialog.$el.on('beforeSave', function(e, dialog) {
            var dateString;
            var padEnd;
            var padStart;
            var endString;
            var startString;
            var error = false;
            var type = $('#' + id + '_type input:checked').val();
            if (type === 'DATERANGE') {
                startString = $startDate.val();
                endString = $endDate.val();
                padStart = '';
                padEnd = '';

                if (startString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    dialog.currentData.attributes.FROM = startString;
                } else if (startString.match(/^\d{4}-\d{2}$/)) {
                    dialog.currentData.attributes.FROM = startString;
                    padStart = '-01';
                } else if (startString.match(/^\d{4}$/)) {
                    dialog.currentData.attributes.FROM = startString;
                    padStart = '-01-01';
                } else {
                    $startDate.css({ borderBottom: '1px solid red' });
                    error = true;
                }

                if (endString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    dialog.currentData.attributes.TO = endString;
                } else if (endString.match(/^\d{4}-\d{2}$/)) {
                    dialog.currentData.attributes.TO = endString;
                    padEnd = '-01';
                } else if (endString.match(/^\d{4}$/)) {
                    dialog.currentData.attributes.TO = endString;
                    padEnd = '-01-01';
                } else {
                    $endDate.css({ borderBottom: '1px solid red' });
                    error = true;
                }

                var start = $.datepicker.parseDate('yy-mm-dd', startString + padStart);
                var end = $.datepicker.parseDate('yy-mm-dd', endString + padEnd);

                if (start > end) {
                    $startDate.css({ borderBottom: '1px solid red' });
                    $endDate.css({ borderBottom: '1px solid red' });
                    error = true;
                }
            } else {
                dateString = $dateInput.val();
                if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.match(/^\d{4}-\d{2}$/) || dateString.match(/^\d{4}$/)) {
                    dialog.currentData.attributes.VALUE = dateString;
                } else {
                    $dateInput.css({ borderBottom: '1px solid red' });
                    error = true;
                }
            }
            if (error) {
                dialog.isValid = false;
            } else {
                dialog.isValid = true;
            }
        });

        return {
            show: function(config) {
                dialog.show(config);
            }
        };
    };
});
