(function($) {

    /**
     * Grid Namespace
     */
    var Gridmanager = window.Gridmanager = {

        // Event handlers stored here, direct access outside only from
        // Gridmanager.Publish class
        _eventHandlers: [],

        /**
         * Binds an event to a fieldtype
         *
         * Available events are:
         * 'display' - When a row is displayed
         * 'remove' - When a row is deleted
         * 'beforeSort' - Before sort starts
         * 'afterSort' - After sort ends
         * 'displaySettings' - When settings form is displayed
         *
         * @param	{string}	fieldtypeName	Class name of fieldtype so the
         *				correct cell object can be passed to the handler
         * @param	{string}	action			Name of action
         * @param	{func}		func			Callback function for event
         */
        bind: function(fieldtypeName, action, func)
        {
            if (this._eventHandlers[action] == undefined)
            {
                this._eventHandlers[action] = [];
            }

            // Each fieldtype gets one method per handler
            this._eventHandlers[action][fieldtypeName] = func;
        }
    };

    /**
     * Grid Publish class
     *
     * @param	{string}	field		Field ID of table to instantiate as a Grid
     */
    Gridmanager.Publish = function(field, settings)
    {
        this.root = $(field);
        //this.blankRow = $(Gridmanager.Template.newRow());
        //this.emptyField = $(this.Template.emptyRow());
        //this.rowContainer = this.root.find('.grid_row_container');
        //this.settings = (settings !== undefined) ? settings : EE.grid_field_settings[field.id];
        console.log(this);
        this.Publish.init();
        //this.eventHandlers = [];
    }

    Gridmanager.Publish.prototype = {

        init: function()
        {
            //place the body
            this.root.html(Gridmanager.Template.body());
            this._bindSortable();
            //this._bindAddButton();
            //this._bindDeleteButton();
            //this._toggleRowManipulationButtons();
            //this._fieldDisplay();
            //
            //// Store the original row count so we can properly increment new
            //// row placeholder IDs in _addRow()
            //this.original_row_count = this._getRows().size();
            //
            //// Disable input elements in our blank template container so they
            //// don't get submitted on form submission
            //this.blankRow.find(':input').attr('disabled', 'disabled');
        },

        /**
         * Allows rows to be reordered
         */
        _bindSortable: function()
        {
            var that = this;

            this.rowContainer.sortable({
                axis: 'y',						// Only allow vertical dragging
                containment: 'parent',			// Contain to parent
                handle: 'td.grid_handle',		// Set drag handle
                cancel: 'td.grid_sort_cancel',	// Do not allow sort on this handle
                items: 'tr.grid_row',			// Only allow these to be sortable
                sort: EE.sortable_sort_helper,	// Custom sort handler
                helper: function(event, row)	// Fix issue where cell widths collapse on drag
                {
                    var $originals = row.children();
                    var $helper = row.clone();

                    $helper.children().each(function(index)
                    {
                        // Set helper cell sizes to match the original sizes
                        $(this).width($originals.eq(index).width())
                    });

                    return $helper;
                },
                // Fire 'beforeSort' event on sort start
                start: function(event, row)
                {
                    that._fireEvent('beforeSort', row.item);
                },
                // Fire 'afterSort' event on sort stop
                stop: function(event, row)
                {
                    that._fireEvent('afterSort', row.item);
                }
            });
        },

        /**
         * Adds rows to a Grid field based on the fields minimum rows setting
         * and how many rows already exist
         */
        _addMinimumRows: function()
        {
            // Figure out how many rows we need to add
            var rowsCount = this._getRows().size(),
                neededRows = this.settings.grid_min_rows - rowsCount;

            // Show empty field message if field is empty and no rows are needed
            if (rowsCount == 0 && neededRows == 0)
            {
                this.emptyField.show();
            }

            // Add the needed rows
            while (neededRows > 0)
            {
                this._addRow();

                neededRows--;
            }
        },

        /**
         * Toggles the visibility of the Add button and Delete buttons for rows
         * based on the number of rows present and the max and min rows settings
         */
        _toggleRowManipulationButtons: function()
        {
            var rowCount = this._getRows().size();

            if (this.settings.grid_max_rows !== '')
            {
                var addButton = this.root.find('.grid_button_add');

                // Show add button if row count is below the max rows setting
                addButton.toggle(rowCount < this.settings.grid_max_rows);
            }

            if (this.settings.grid_min_rows !== '')
            {
                var deleteButtons = this.root.find('.grid_button_delete');

                // Show delete buttons if the row count is above the min rows setting
                deleteButtons.toggle(rowCount > this.settings.grid_min_rows);
            }

            // Do not allow sortable to run when there is only one row, otherwise
            // the row becomes detached from the table and column headers change
            // width in a fluid-column-width table
            this.rowContainer.find('td.grid_handle').toggleClass('grid_sort_cancel', rowCount == 1);
        },

        /**
         * Returns current number of data rows in the Grid field
         *
         * @return	{int}	Number of rows
         */
        _getRows: function()
        {
            return this.rowContainer
                .find('tr.grid_row')
                .not(this.blankRow.add(this.emptyField));
        },

        /**
         * Binds click listener to Add button to insert a new row at the bottom
         * of the field
         */
        _bindAddButton: function()
        {
            var that = this;

            this.root.find('.grid_button_add, .grid_link_add').on('click', function(event)
            {
                event.preventDefault();

                that._addRow();
            });
        },

        /**
         * Inserts new row at the bottom of our field
         */
        _addRow: function()
        {
            // Clone our blank row
            el = this.blankRow.clone();

            el.removeClass('blank_row');

            // Increment namespacing on inputs
            this.original_row_count++;
            el.html(
                el.html().replace(
                    RegExp('new_row_[0-9]{1,}', 'g'),
                    'new_row_' + this.original_row_count
                )
            );

            // Enable inputs
            el.find(':input').removeAttr('disabled');

            // Append the row to the end of the row container
            this.rowContainer.append(el);

            // Make sure empty field message is hidden
            this.emptyField.hide();

            // Hide/show delete buttons depending on minimum row setting
            this._toggleRowManipulationButtons();

            // Fire 'display' event for the new row
            this._fireEvent('display', el);
        },

        /**
         * Binds click listener to Delete button in row column to delete the row
         */
        _bindDeleteButton: function()
        {
            var that = this;

            this.root.on('click', '.grid_button_delete', function(event)
            {
                event.preventDefault();

                row = $(this).parents('tr.grid_row');

                // Fire 'remove' event for this row
                that._fireEvent('remove', row);

                // Remove the row
                row.remove();

                that._toggleRowManipulationButtons();

                // Show our empty field message if we have no rows left
                if (that._getRows().size() == 0)
                {
                    that.emptyField.show();
                }
            });
        },

        /**
         * Called after main initialization to fire the 'display' event
         * on pre-exising rows
         */
        _fieldDisplay: function()
        {
            var that = this;

            setTimeout(function(){
                that._getRows().each(function()
                {
                    that._fireEvent('display', $(this));
                });

                that._addMinimumRows();
            }, 500);
        },

        /**
         * Fires event to fieldtype callbacks
         *
         * @param	{string}		action	Action name
         * @param	{jQuery object}	row		jQuery object of affected row
         */
        _fireEvent: function(action, row)
        {
            // If no events regsitered, don't bother
            if (Gridmanager._eventHandlers[action] === undefined)
            {
                return;
            }

            // For each fieldtype binded to this action
            for (var fieldtype in Gridmanager._eventHandlers[action])
            {
                // Find the sepecic cell(s) for this fieldtype and send each
                // to the fieldtype's event hander
                row.find('td[data-fieldtype="'+fieldtype+'"]').each(function()
                {
                    Gridmanager._eventHandlers[action][fieldtype]($(this));
                });
            }
        }
    };

    /**
     * Grid Template class
     */
    Gridmanager.Template = {
        newRow: function(){
            return $([
                '<tr class="gridmanager_row blank_row even">',
                ' <td class="gridmanager_handle">&nbsp;</td>',
                '<td width="0%" data-fieldtype="text" data-column-id="14">',
                '<div class="gridmanager_cell">',
                '<input type="text" name="field_id_61[rows][new_row_0][col_id_14]" value="" dir="ltr" field_content_type="all" maxlength="256" disabled="disabled">	',
                '</div>',
                '</td>',
                '<td width="0%" data-fieldtype="text" data-column-id="15">',
                '<div class="gridmanager_cell">',
                '<a href="#" class="gridmanager_button_delete" tabindex="-1" title="Delete Row" style="display: inline;">Delete Row</a>',
                '<input type="text" name="field_id_61[rows][new_row_0][col_id_15]" value="" dir="ltr" field_content_type="all" maxlength="256" disabled="disabled">	',
                '</div>',
                '</td>',
                '</tr>'
            ].join("\n"));
        },
        emptyRow: function(){
            return $([
                '<tr class="empty_field odd" style="display: table-row;">',
                '<td colspan="3" class="empty_field first">',
                'You have not added any rows of data yet. <a href="#" class="grid_link_add">Add some data?</a>',
                '</td>',
                '</tr>'
            ].join("\n"));
        },
        heading: function() {
            return $([
                '<tr class="odd"><th class="gridmanager_handle">&nbsp;</th>',
                '<th width="0%">',
                '<b>test</b>',
                '</th>',
                '<th width="0%">',
                '<b>testtt</b>',
                '</th>',
                '</tr>'
            ].join("\n"));
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
                '<a class="gridmanager_button_add" href="#" title="Add Row">Add Row</a>',
                '</td>',
                '</tr>',
                '</tbody>',
                '</table>'
            ].join("\n"));
        }
    };

    /**
     * Grid Settings class
     */
    Gridmanager.Settings = function(settings)
    {
        this.root = $('#grid_settings');
        this.settingsScroller = this.root.find('#grid_col_settings_container');
        this.settingsContainer = this.root.find('#grid_col_settings_container_inner');
        this.colTemplateContainer = $('#grid_col_settings_elements');
        this.blankColumn = this.colTemplateContainer.find('.grid_col_settings');
        this.settings = settings;

        this.init();
    }

    Gridmanager.Settings.prototype = {

        init: function()
        {
            this._bindResize();
            this._bindSortable();
            this._bindAddButton();
            this._bindCopyButton();
            this._bindDeleteButton();
            this._bindDeleteButton();
            this._toggleDeleteButtons();
            this._bindColTypeChange();
            this._bindSubmit();
            this._highlightErrors();

            // If this is a new field, bind the automatic column title plugin
            // to the first column
            this._bindAutoColName(this.root.find('div.grid_col_settings[data-field-name^="new_"]'));

            // Fire displaySettings event
            this._settingsDisplay();

            // Disable input elements in our blank template container so they
            // don't get submitted on form submission
            this.colTemplateContainer.find(':input').attr('disabled', 'disabled');
        },

        /**
         * Upon page load, we need to resize the settings container to match the
         * width of the page, minus the width of the labels on the left, and also
         * need to resize the column container to fit the number of columns we have
         */
        _bindResize: function()
        {
            var that = this;

            $(document).ready(function()
            {
                that._resizeSettingsContainer();

                // Resize settings container on window resize
                $(window).resize(function()
                {
                    that._resizeSettingsContainer();
                });

                // Resize when Grid is selected from field type dropdown
                $('#field_type').change(function()
                {
                    if ($(this).val() == 'grid')
                    {
                        that._resizeSettingsContainer();
                    }
                });

                // Now, resize the inner container to fit the number of columns
                // we have ready on page load
                that._resizeColContainer();
            });
        },

        /**
         * Resizes the scrollable settings container to fit within EE's settings
         * table; this is called on page load and window resize
         */
        _resizeSettingsContainer: function()
        {
            // First need to set container smaller so that it's not affecting the
            // root with; for example, if the user makes the window width smaller,
            // the root with won't change if the settings scroller container doesn't
            // get smaller, thus the container runs off the page
            this.settingsScroller.width(500);

            this.settingsScroller.width(
                this.root.width() - this.root.find('#grid_col_settings_labels').width()
            );
        },

        /**
         * Resizes column container based on how many columns it contains
         *
         * @param	{boolean}	animated	Whether or not to animate the resize
         */
        _resizeColContainer: function(animated)
        {
            this.settingsContainer.animate(
                {
                    width: this._getColumnsWidth()
                },
                (animated == true) ? 400 : 0);
        },

        /**
         * Calculates total width the columns in the container should take up,
         * plus a little padding for the Add button
         *
         * @return	{int}	Calculated width
         */
        _getColumnsWidth: function()
        {
            var columns = this.root.find('.grid_col_settings');

            // 75px of extra room for the add button
            return columns.size() * columns.width() + 75;
        },

        /**
         * Allows columns to be reordered
         */
        _bindSortable: function()
        {
            this.settingsContainer.sortable({
                axis: 'x',						// Only allow horizontal dragging
                containment: 'parent',			// Contain to parent
                handle: 'div.grid_data_type',	// Set drag handle to the top box
                items: '.grid_col_settings',	// Only allow these to be sortable
                sort: EE.sortable_sort_helper	// Custom sort handler
            });
        },

        /**
         * Binds click listener to Add button to insert a new column at the end
         * of the columns
         */
        _bindAddButton: function()
        {
            var that = this;

            this.root.find('.grid_button_add').on('click', function(event)
            {
                event.preventDefault();

                that._insertColumn(that._buildNewColumn());
            });
        },

        /**
         * Binds click listener to Copy button in each column to clone the column
         * and insert it after the column being cloned
         */
        _bindCopyButton: function()
        {
            var that = this;

            this.root.on('click', 'a.grid_col_copy', function(event)
            {
                event.preventDefault();

                var parentCol = $(this).parents('.grid_col_settings');

                that._insertColumn(
                    // Build new column based on current column
                    that._buildNewColumn(parentCol),
                    // Insert AFTER current column
                    parentCol
                );
            });
        },

        /**
         * Binds click listener to Delete button in each column to delete the column
         */
        _bindDeleteButton: function()
        {
            var that = this;

            this.root.on('click', '.grid_button_delete', function(event)
            {
                event.preventDefault();

                var settings = $(this).parents('.grid_col_settings');

                // Only animate column deletion if we're not deleting the last column
                if (settings.index() == $('#grid_settings .grid_col_settings:last').index())
                {
                    settings.remove();
                    that._resizeColContainer(true);
                    that._toggleDeleteButtons();
                }
                else
                {
                    settings.animate({
                        opacity: 0
                    }, 200, function()
                    {
                        // Clear HTML before resize animation so contents don't
                        // push down bottom of column container while resizing
                        settings.html('');

                        settings.animate({
                            width: 0
                        }, 200, function()
                        {
                            settings.remove();
                            that._resizeColContainer(true);
                            that._toggleDeleteButtons();
                        });
                    });
                }
            });
        },

        /**
         * Looks at current column count, and if there are multiple columns,
         * shows the delete buttons; otherwise, hides delete buttons if there is
         * only one column
         */
        _toggleDeleteButtons: function()
        {
            var colCount = this.root.find('.grid_col_settings').size(),
                deleteButtons = this.root.find('.grid_button_delete');

            deleteButtons.toggle(colCount > 1);
        },

        /**
         * Inserts a new column after a specified element
         *
         * @param	{jQuery Object}	column		Column to insert
         * @param	{jQuery Object}	insertAfter	Element to insert the column
         *				after; if left blank, defaults to last column
         */
        _insertColumn: function(column, insertAfter)
        {
            var lastColumn = $('#grid_settings .grid_col_settings:last');

            // Default to inserting after the last column
            if (insertAfter == undefined)
            {
                insertAfter = lastColumn;
            }

            // If we're inserting a column in the middle of other columns,
            // animate the insertion so it's clear where the new column is
            if (insertAfter.index() != lastColumn.index())
            {
                column.css({ opacity: 0 })
            }

            column.insertAfter(insertAfter);

            this._resizeColContainer();
            this._toggleDeleteButtons();

            // If we are inserting a column after the last column, scroll to
            // the end of the column container
            if (insertAfter.index() == lastColumn.index())
            {
                // Scroll container to the very end
                this.settingsScroller.animate({
                    scrollLeft: this._getColumnsWidth()
                }, 700);
            }

            column.animate({
                opacity: 1
            }, 400);

            // Bind automatic column name
            this._bindAutoColName(column);

            // Fire displaySettings event
            this._fireEvent('displaySettings', $('.grid_col_settings_custom > div', column));
        },

        /**
         * Binds ee_url_title plugin to column label box to auto-populate the
         * column name field; this is only applied to new columns
         *
         * @param	{jQuery Object}	el	Column to bind ee_url_title to
         */
        _bindAutoColName: function(columns)
        {
            columns.each(function(index, column)
            {
                $('input.grid_col_field_label', column).bind("keyup keydown", function()
                {
                    $(this).ee_url_title($(column).find('input.grid_col_field_name'), true);
                });
            });
        },

        /**
         * Builts new column from scratch or based on an existing column
         *
         * @param	{jQuery Object}	el	Column to base new column off of, when
         *				copying an existing column for example; if left blank,
         *				defaults to blank column
         * @return	{jQuery Object}	New column element
         */
        _buildNewColumn: function(el)
        {
            if (el == undefined)
            {
                el = this.blankColumn.clone();
            }
            else
            {
                // Clone our example column
                el = this._cloneWithFormValues(el);
            }

            // Clear out column name field in new column because it has to be unique
            el.find('input[name$="\\[name\\]"]').attr('value', '');

            // Need to make sure the new column's field names are unique
            var new_namespace = 'new_' + $('.grid_col_settings', this.root).size();

            el.html(
                el.html().replace(
                    RegExp('(new_|col_id_)[0-9]{1,}', 'g'),
                    new_namespace
                )
            );

            el.attr('data-field-name', new_namespace);

            // Make sure inputs are enabled if creating blank column
            el.find(':input').removeAttr('disabled').removeClass('grid_settings_error');

            return el;
        },

        /**
         * Binds change listener to the data type columns dropdowns of each column
         * so we can load the correct settings form for the selected fieldtype
         */
        _bindColTypeChange: function()
        {
            var that = this;

            this.root.on('change', '.grid_data_type .grid_col_select', function(event)
            {
                // New, fresh settings form
                var settings = that.colTemplateContainer
                    .find('.grid_col_settings_custom_field_'+$(this).val()+':last')
                    .clone();

                // Enable inputs
                settings.find(':input').removeAttr('disabled');

                var customSettingsContainer = $(this)
                    .parents('.grid_col_settings')
                    .find('.grid_col_settings_custom');

                // Namespace fieldnames for the current column
                settings.html(
                    settings.html().replace(
                        RegExp('(new_|col_id_)[0-9]{1,}', 'g'),
                        customSettingsContainer.data('fieldName')
                    )
                );

                // Find the container holding the settings form, replace its contents
                customSettingsContainer.html(settings);

                // Fire displaySettings event
                that._fireEvent('displaySettings', settings);
            });
        },

        /**
         * Binds to form submission to pass along the entire HTML for the last
         * row in the Grid settings table for easy repopulated upon form
         * validation failing
         */
        _bindSubmit: function()
        {
            var that = this;

            this.root.parents('form').submit(function()
            {
                // Remove existing validation error classes
                $('.grid_col_settings_section input[type=text]').removeClass('grid_settings_error');

                grid_html = that._cloneWithFormValues(that.root.parent('#grid_settings_container'));

                $('<input/>', {
                    'type': 'hidden',
                    'name': 'grid_html',
                    'value': '<div id="grid_settings_container">'+grid_html.html()+'</div>'
                }).appendTo(that.root);
            });
        },

        /**
         * Clones an element and copies over any form input values because
         * normal cloning won't handle that
         *
         * @param	{jQuery Object}	el	Element to clone
         * @return	{jQuery Object}	Cloned element with form fields populated
         */
        _cloneWithFormValues: function(el)
        {
            var cloned = el.clone();

            el.find(":input:enabled").each(function()
            {
                // Find the new input in the cloned column for editing
                var new_input = cloned.find(":input[name='"+$(this).attr('name')+"']:enabled");

                if ($(this).is("select"))
                {
                    new_input
                        .find('option')
                        .removeAttr('selected')
                        .filter('[value="'+$(this).val()+'"]')
                        .attr('selected', 'selected');
                }
                // Handle checkboxes
                else if ($(this).attr('type') == 'checkbox')
                {
                    // .prop('checked', true) doesn't work, must set the attribute
                    new_input.attr('checked', $(this).attr('checked'));
                }
                // Handle radio buttons
                else if ($(this).attr('type') == 'radio')
                {
                    new_input
                        .removeAttr('selected')
                        .filter("[value='"+$(this).val()+"']")
                        .attr('checked', $(this).attr('checked'));
                }
                // Handle textareas
                else if ($(this).is("textarea"))
                {
                    new_input.html($(this).val());
                }
                // Everything else should handle the value attribute
                else
                {
                    // .val('new val') doesn't work, must set the attribute
                    new_input.attr('value', $(this).val());
                }
            });

            return cloned;
        },

        /**
         * Called after main initialization to fire the 'display' event
         * on pre-exising columns
         */
        _settingsDisplay: function()
        {
            var that = this;
            this.root.find('.grid_col_settings').each(function()
            {
                // Fire displaySettings event
                that._fireEvent('displaySettings', $('.grid_col_settings_custom > div', this));
            });
        },

        /**
         * Fires event to fieldtype callbacks
         *
         * @param	{string}		action	Action name
         * @param	{jQuery object}	el		jQuery object of affected element
         */
        _fireEvent: function(action, el)
        {
            var fieldtype = el.data('fieldtype');

            // If no events regsitered, don't bother
            if (Gridmanager._eventHandlers[action] === undefined ||
                Gridmanager._eventHandlers[action][fieldtype] == undefined)
            {
                return;
            }

            Gridmanager._eventHandlers[action][fieldtype]($(el));
        },

        /**
         * If there are fields with form validation errors in our settings
         * object, highlight them
         */
        _highlightErrors: function()
        {
            if (this.settings.error_fields != undefined)
            {
                $.each(this.settings.error_fields, function(index, val)
                {
                    $('input[name="'+val+'"]').addClass('grid_settings_error');
                });
            }
        }
    };

    /**
     * Public method to instantiate Grid field
     */
    //EE.grid = function(field, settings)
    //{
    //    return new Gridmanager.Publish(field, settings);
    //};

    /**
     * Public method to instantiate Grid settings
     */
    //EE.grid_settings = function(settings)
    //{
    //    return new Gridmanager.Settings(settings);
    //};

    //if (typeof _ !== 'undefined' && EE.grid_cache !== 'undefined')
    //{
    //    _.each(EE.grid_cache, function(args)
    //    {
    //        Gridmanager.bind.apply(Grid, args);
    //    });
    //}

})(jQuery);