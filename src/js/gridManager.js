;
(function($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "gridmanager",
        defaults = {
            rows: "",
            heading: [],
            fieldId: ""
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);
        //set the field Number
        this.settings.fieldNumber = this.settings.heading.length;

        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function() {
            var _this = this;

            //place the body first
            var gridHtml = _this.template.init(_this.settings);

            //get the rows and parse them
            var rows = this.template.parseRows(_this.settings.rows, this.settings.fieldNumber);
            gridHtml.find('.gridmanager_row_container').html(rows);

            //place the html
            $(_this.element).html(gridHtml);

            //bind the sortable
            $(_this.element).find('.gridmanager_row_container').sortable({
                axis: 'y',						        // Only allow vertical dragging
                containment: 'parent',			        // Contain to parent
                handle: 'td.gridmanager_handle',		// Set drag handle
                cancel: 'td.gridmanager_sort_cancel',	// Do not allow sort on this handle
                items: 'tr.gridmanager_row',			// Only allow these to be sortable
                sort: this.ui.sortableSortHelper,	    // Custom sort handler,
                helper: function(e, ui) {               // Set the height of the row
                    ui.children().each(function() {
                        $(this).width($(this).width());
                    });
                    return ui;
                },
                stop: function(e, ui){
                    _this.ui.reorder(gridHtml, _this.settings.fieldName);
                }
            });

            //bind events
            _this._bindAddButton();
            _this._bindDeleteButton();
        },

        _bindAddButton: function(){
            var _this = this;
            $(document).on('click', '.grid_'+ _this.settings.fieldName+' .gridmanager_button_add', function(){
                $('.grid_'+ _this.settings.fieldName).find('.gridmanager_row_container').append(_this.template.parseRow());
            });
        },

        _bindDeleteButton: function(){
            var _this = this;
            $(document).on('click', '.grid_'+ _this.settings.fieldName+' .gridmanager_button_delete', function(){
                $(this).parents('.gridmanager_row').remove();
                _this.ui.reorder($(_this.element), _this.settings.fieldName);
            });
        },

        template: {
            init: function(settings) {
                var table = this.table();
                table.find('thead').append(this.parseHeading(settings.heading));
                return table;
            },

            parseRow: function(totalFields){
               // return this.parseRows()
            },

            //parse the rows
            parseRows: function(rows, totalFields) {

                var rows = JSON.parse(rows);
                var parsedData = [];
                var parsedRow = [];

                var rowWrapper = function(data) {
                    return [
                        '<tr class="gridmanager_row">',
                        '<td class="gridmanager_handle">&nbsp;</td>',
                        data,
                        '</tr>'
                    ].join("\n");
                };

                var rowData = function(field, deleteButton) {
                    return [
                        '<td width="0%" data-fieldtype="text" data-column-id="14">',
                        '<div class="gridmanager_cell">',
                        deleteButton,
                        field,
                        '</div>',
                        '</td>'
                    ].join("\n");
                };

                var deleteButton = function() {
                    return '<a href="#" class="gridmanager_button_delete" tabindex="-1" title="Delete Row" style="display: inline;">Delete Row</a>';
                }

                //parse the rows
                _.each(rows, function(v) {
                    //parse a row data field
                    for(var i = 0; i < totalFields; i++) {

                        var value = v[i] ? v[i].field : '';
                        var deleteData = '';

                        //place the delete button on the last one
                        if((totalFields - 1) == i) {
                            deleteData = deleteButton();
                        }

                        value = rowData(value, deleteData);


                        parsedData.push(value);
                    }

                    //parse a row
                    parsedRow.push(rowWrapper(parsedData.join("\n")));
                    //reset
                    parsedData = [];
                });

                return parsedRow.join("\n");

            },
            emptyRow: function() {
                return $([
                    '<tr class="empty_field odd" style="display: table-row;">',
                    '<td colspan="3" class="empty_field first">',
                    'You have not added any rows of data yet. <a href="#" class="grid_link_add">Add some data?</a>',
                    '</td>',
                    '</tr>'
                ].join("\n"));
            },

            // Build the heading
            parseHeading: function(heading) {
                var parsedHeading = [];

                //template for the wrapper
                var headingWrapper = function(data) {
                    return [
                        '<tr class="odd"><th class="gridmanager_handle">&nbsp;</th>',
                        data,
                        '</tr>'
                    ].join("\n");
                };

                // th template
                var headingData = function(fieldName) {
                    return [
                        '<th width="0%">',
                        '<b>' + fieldName + '</b>',
                        '</th>',
                    ].join("\n");
                };

                //loop over the headings and place them nicely
                _.each(heading, function(v) {
                    parsedHeading.push(headingData(v));
                });

                //return the data
                return headingWrapper(parsedHeading.join("\n"));

            },
            table: function() {
                return $([
                    '<table class="gridmanager_field_container" cellspacing="0" cellpadding="0">',
                    '<tbody>',
                    '<tr class="even">',
                    '<td class="gridmanager_field_container_cell">',
                    '<table class="gridmanager_field" cellspacing="0" cellpadding="0">',
                    '<thead>',
                    '</thead>',
                    '<tbody class="gridmanager_row_container ui-sortable">',
                    '</tbody>',
                    '</table>',
                    '</td>',
                    '<td class="gridmanager_delete_row_gutter">&nbsp;</td>',
                    '</tr>',
                    '<tr class="even">',
                    '<td>',
                    '<a class="gridmanager_button_add" href="#" title="Add Row">Add Row</a> <select name="add_row_field"><option value="text">Text</option></select>',
                    '</td>',
                    '</tr>',
                    '</tbody>',
                    '</table>'
                ].join("\n"));
            }
        },
        ui: {
            sortableSortHelper: function(e, ui) {
                // Get the axis to determine if we're working with heights or widths
                var axis = ($(this).sortable('option', 'axis') == false)
                        ? 'y' : $(this).sortable('option', 'axis'),
                    container = $(this),
                    placeholder = container.children('.ui-sortable-placeholder:first'),
                    helperSize = (axis == 'y') ? ui.helper.outerHeight() : ui.helper.outerWidth(),
                    helperPos = (axis == 'y') ? ui.position.top : ui.position.left,
                    helperEnd = helperPos + helperSize;

                container.children(':visible').each(function() {
                    var item = $(this);

                    if(!item.hasClass('ui-sortable-helper')
                        && !item.hasClass('ui-sortable-placeholder')) {
                        var itemSize = (axis == 'y') ? item.outerHeight() : item.outerWidth(),
                            itemPos = (axis == 'y') ? item.position().top : item.position().left,
                            itemEnd = itemPos + itemSize,
                            tolerance = Math.min(helperSize, itemSize) / 2;

                        if(helperPos > itemPos && helperPos < itemEnd) {
                            var distance = helperPos - itemPos;

                            if(distance < tolerance) {
                                placeholder.insertBefore(item);
                                container.sortable('refreshPositions');
                                return false;
                            }
                        }
                        else if(helperEnd < itemEnd && helperEnd > itemPos) {
                            var distance = itemEnd - helperEnd;

                            if(distance < tolerance) {
                                placeholder.insertAfter(item);
                                container.sortable('refreshPositions');
                                return false;
                            }
                        }
                    }
                });
            },
            reorder: function(gridHtml, fieldName){
                var _this = this;
                gridHtml.find('.gridmanager_row_container .gridmanager_row').each(function(i){
                    $(this).find('.gridmanager_field').each(function(){
                        $(this).prop('name', fieldName+'['+$(this).data('name')+']['+i+'][]');
                    });
                });
            }
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if(!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);