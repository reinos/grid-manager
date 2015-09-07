(function($) {

    Gridmanager.prototype.tmpl.prototype = {
        newRow: function(){
            return [
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
            ].join("\n");
        },
        emptyRow: function(){
            return [
                '<tr class="empty_field odd" style="display: table-row;">',
                '<td colspan="3" class="empty_field first">',
                'You have not added any rows of data yet. <a href="#" class="grid_link_add">Add some data?</a>',
                '</td>',
                '</tr>'
            ].join("\n");
        }
    };



});