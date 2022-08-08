define([
    'brease/core/Class',
    'brease/core/Utils',
    'brease/events/BreaseEvent',
    'widgets/brease/GenericDialog/libs/models/dialogWidgetModel'
], function (
    SuperClass, Utils, BreaseEvent, DialogWidgetModel
) {
    
    'use strict';

    /** 
     * @class widgets.brease.TableWidget.libs.SortingSettings
     * @extends brease.core.Class
     * 
     * If this is very hard to grasp, which I might understand if it is, I'd recommend that you open up a dialog in the runtime and a have a look at what
     * it looks like and how it works. This is going to clear things up a lot.
     */

    var SortingClass = SuperClass.extend(function SortingSettings(dialog, widget, lang, texts) {
            this.texts = texts;
            this.lang = lang;
            this.dialog = dialog;
            this.tableConfig = widget.settings.config;
            this.childrenList = widget.settings.childrenList;
            this.widget = widget;
            this.currRow = 0;
            this.init = false;
            SuperClass.call(this);
        }, null),

        p = SortingClass.prototype;

    /**
     * @method initialize
     * @returns {Object}
     * This method will instantiate an empty dialog, and if there has been a sorting configuration stored it will with this information
     * initialize any stored information in the dialog.
     */
    p.initialize = function () {
        this.config = {};
        this.config.rows = [];
        this.config.startWidgets = [];

        this._initializeEmptyDialogConfig();

        if (this.widget.settings.config.sort.length > 0) {
            this._initializeStoredDialogConfig();
        }
        
        return this.config;
    };

    /**
     * @method _initializeEmptyDialogConfig
     * @private
     * This method will create the necessary configuration object for the dialog to instantiate, it will set the values for where
     * each individual widget type should be placed in the row direction. It will also store the necessary informtaion about the
     * height an individual row will take so that an offset from the top can be calculated. It will then add the starting/header
     * widgets to the dialog and add these to the configuration before adding the necessary eventlistener.
     */
    p._initializeEmptyDialogConfig = function () {

        this.config.children = {
            delete_this_row: 0,
            label: 1,
            column_picker: 2,
            rect_separator: 3,
            add_next_row: 4,
            sort_value: 5,
            
            left: {
                left_banner_label: 75,
                center_banner_label: 150,
                right_banner_label: 360,
                add_next_row: 10,
                delete_this_row: 50,
                label: 90,
                column_picker: 150,
                sort_value: 360,
                rect_separator: 0
            }
        };

        this.config.loc = {
            offset: 0,
            widgetHeight: 30,
            widgetOffset: 12,
            logicalOperatorHeight: 20,
            currSeparatorTopOffset: 110,
            filterlogicalTopOffset: 100

        };
        this.config.loc.rowHeight = this.config.loc.widgetHeight + 3 * this.config.loc.widgetOffset;

        this.config.rows = [];

        this.dialog.el.on(BreaseEvent.WIDGET_READY, this._bind('_handleChildWidgetReady'));

        // First add the header for the configuration dialogue
        this.config.startWidgets.push(this._getRect('sort_rect_header', 0, 50 + this.config.loc.offset, 600));
        this.config.startWidgets.push(this._getLabel('sort_label_sort', this.texts.sort, this.config.children.left.left_banner_label, 20 + this.config.loc.offset, 75));
        this.config.startWidgets.push(this._getLabel('sort_label_columns', this.texts.col, this.config.children.left.center_banner_label, 20 + this.config.loc.offset, 150));
        this.config.startWidgets.push(this._getLabel('sort_label_by', this.texts.by, this.config.children.left.right_banner_label, 20 + this.config.loc.offset, 150));
        this.config.startWidgets.push(this._getImage('sort_button_add_0', 'widgets/brease/TableWidget/assets/Add.svg', this.config.children.left.add_next_row, 60 + this.config.loc.offset));

        for (var i = 0; i < this.config.startWidgets.length; i += 1) {
            this.dialog.addWidget(this.config.startWidgets[i]);
        }

        var addButtonWidgetId = this.config.startWidgets[4].id;
        if (brease.config.isKeyboardOperationEnabled()) {
            brease.uiController.setWidgetPropertyIndependentOfState(addButtonWidgetId, 'tabIndex', 1);
        }
        $('#' + addButtonWidgetId).on(BreaseEvent.CLICK, this._bind('_addRowHandler'));
    };

    /**
     * @method _handleChildWidgetReady
     * @private
     * Handles the widgets when these are ready
     */
    p._handleChildWidgetReady = function (e) {
        this._addCorrectStyle(e);
        this._initFocus(e);
    };

    p._addCorrectStyle = function (e) {
        var type = e.target['dataset'].breaseWidget.split('/')[2], cls;
        
        if (e.target.id.includes('sort_label')) {
            cls = 'widgets_brease_' + type + '_style_tableConfigurationDialogHeaderStyle';
            e.target.classList.add(cls);
        } else {
            cls = 'widgets_brease_' + type + '_style_tableConfigurationDialogStyle';
            e.target.classList.add(cls);
        }
    };

    /**
     * @method _initFocus
     * @private
     * Sets focus to add button when its ready
     */
    p._initFocus = function (e) {
        if (e.target.id.includes('sort_button_add_0')) {
            e.target.focus();
        }
    };
    
    /**
    * @method
     * This method will remove eventlisteners added at start up
     */
    p.removeEventListeners = function () {
        this.dialog.el.off(BreaseEvent.WIDGET_READY, this._bind('_handleChildWidgetReady'));
    };

    /**
     * @method _reColourFirstLineSeparator
     * @private
     * This method will change the first line separator (below the header) so it becomse 2px high and black.
     */
    p._reColourFirstLineSeparator = function () {
        $('#' + this.config.startWidgets[0].id).css('border-width', '0px 0px 2px 0px');
    };

    /**
     * @method _addRowHandler
     * @private
     * This method is an intermediary step for listening to events placed on the add button. It will determine if the clicked row
     * is the same row as the current row or not. If the two are the same then it will add a new row at the end, and if these are
     * not the same then a row will be inserted on the clicked position.
     */
    p._addRowHandler = function (e) {
        //In preparation for insertion of row
        var clickedRow = this._getCurrentRow(brease.uiController.parentWidgetId(e.target), this.config.children.add_next_row);
        if (clickedRow === this.currRow) {
            this._addRow();
        } else {
            this._insertRow(clickedRow);
        }
    };
 
    /**
     * @method _addRow
     * @private
     * This method will create the row for the current row, add the widgets to the dialog, add the necesary eventlisteners for
     * these widgets and push the row into the configuration array so that these can be accessed later. It will then increase
     * the current row with one. 
     */
    p._addRow = function () {
        var row = this._createRow(this.currRow);      
        
        for (var i = 0; i < row.length; i += 1) {
            if (i !== this.config.children.logic_op_next_row || this.currRow !== 0) {
                this.dialog.addWidget(row[i]);
            }
        }
        
        $('#' + row[this.config.children.column_picker].id).on(BreaseEvent.WIDGET_READY, this._bind('_updateRowHandler'));
        $('#' + row[this.config.children.add_next_row].id).on(BreaseEvent.CLICK, this._bind('_addRowHandler'));
        $('#' + row[this.config.children.delete_this_row].id).on(BreaseEvent.CLICK, this._bind('_removeRow'));
                
        this.config.rows.push({ widgets: row });

        this.currRow += 1;
        _setTabIndex.call(this);
    };

    /**
     * @method _initializeStoredDialogConfig
     * @private
     * This method runs through the filter stored in the widget and creates rows and add eventlisteners accordingly.
     */
    p._initializeStoredDialogConfig = function () {
        
        for (var i = 0; i < this.widget.settings.config.sort.length; i += 1) {
            var row = this._createRow(i);

            for (var j = 0; j < row.length; j += 1) {
                if (j !== this.config.children.logic_op_next_row || this.currRow !== 0) {
                    this.dialog.addWidget(row[j]);
                }
            }

            this.config.rows.push({ widgets: row });
            
            this.currRow += 1;   

            $('#' + this.config.rows[i].widgets[this.config.children.column_picker].id).on(BreaseEvent.WIDGET_READY, this._bind('_updateRowHandler'));
            $('#' + this.config.rows[i].widgets[this.config.children.add_next_row].id).on(BreaseEvent.CLICK, this._bind('_addRowHandler'));
            $('#' + this.config.rows[i].widgets[this.config.children.delete_this_row].id).on(BreaseEvent.CLICK, this._bind('_removeRow'));

            this._reColourNewObject(i);
        }
        _setTabIndex.call(this);
    };

    /**
     * @method _updateRowHandler
     * @private
     * This method is an intermediary step to be able to add an eventlistener to the column picker and listen to it's SelectedIndexChanged event.
     */
    p._updateRowHandler = function (e) {
        var addedRow = this._getCurrentRow(brease.uiController.parentWidgetId(e.target), this.config.children.column_picker);
        if (addedRow === undefined) { return; }
        
        this._reColourNewObject(addedRow);
        this._checkMaxColumnsReached();

        $('#' + this.config.rows[addedRow].widgets[this.config.children.column_picker].id).off(BreaseEvent.WIDGET_READY, this._bind('_updateRowHandler'));
        $('#' + this.config.rows[addedRow].widgets[this.config.children.column_picker].id).on('SelectedIndexChanged', this._bind('_updateRow'));
    };

    /**
     * @method _updateRow
     * @private
     * This method will be called everytime the type of column has been changed. The method will first figure out which row has been selected
     * and then remove the column widget from this row. It will take the value passed in the event, reinstantiate a widget defined by this value
     * that will now be placed on this position. Finally it will update the configuration with the new widget and remove the old.
     */
    p._updateRow = function (e) {
        var currRow = this._getCurrentRow(brease.uiController.parentWidgetId(e.target), this.config.children.column_picker);

        if (currRow === undefined) { return; }

        var currTop = this._getCurrTop(currRow);

        if (this.config.rows[currRow].widgets[this.config.children.sort_value]) {
            this.dialog.removeWidget(this.config.rows[currRow].widgets[this.config.children.sort_value]);
            this.config.rows[currRow].widgets.pop();
        }
        var row = [];
        row.push(this._getValueColumn(e.detail.selectedValue, this.config.children.left.sort_value, currTop, 220));
        for (var i = 0; i < row.length; i += 1) {
            this.dialog.addWidget(row[i]);
        }
        this.config.rows[currRow].widgets = this.config.rows[currRow].widgets.concat(row);
        _setTabIndex.call(this);
    };

    /**
     * @method _insertRow
     * @private
     * @param {String} clickedRow
     * This method will insert a row at the row that has been clicked and shifts all by calling the _moveRow function,
     * it then adds all necessary eventlistener for this row, before splicing the configuration and adding the new
     * configuration at the right place in the list, and finally increases the current row with one.
     */
    p._insertRow = function (clickedRow) {
        
        if (clickedRow === 0) {
            brease.callWidget(this.config.rows[clickedRow].widgets[this.config.children.label].id, 'setText', this.texts.then);
        }
        
        //Create a new row with positional value where this one is
        var row = this._createRow(clickedRow);

        //Move all the widgets to their new respective positions
        this._moveRow(clickedRow, false);
        
        //Instatiate new row
        for (var i = 0; i < row.length; i += 1) {
            if (i !== this.config.children.logic_op_next_row || clickedRow !== 0) {
                this.dialog.addWidget(row[i]);
            }
        }

        //Add event handlers to new row
        $('#' + row[this.config.children.column_picker].id).on(BreaseEvent.WIDGET_READY, this._bind('_updateRowHandler'));
        $('#' + row[this.config.children.add_next_row].id).on(BreaseEvent.CLICK, this._bind('_addRowHandler'));
        $('#' + row[this.config.children.delete_this_row].id).on(BreaseEvent.CLICK, this._bind('_removeRow'));

        //splice new row into position in row configuration
        this.config.rows.splice(clickedRow, 0, { widgets: row });
        
        //Increase currRow by one
        this.currRow += 1;
        _setTabIndex.call(this);
    };

    /**
     * @method _getCurrentRow
     * @private
     * @param {String} pressedId
     * @param {UInteger} widgetPos
     * @returns {UInteger}
     * This method will return which the current row is by looking at the pressedId and the widget position in the configuration.
     */
    p._getCurrentRow = function (pressedId, widgetPos) {
        if (pressedId.includes('button_add_0')) {
            return 0;
        }

        for (var j = 0; j < this.config.rows.length; j += 1) {
            if (pressedId === this.config.rows[j].widgets[widgetPos].id) {
                if (this.config.children.add_next_row === widgetPos) {
                    //The add button belongs to the next row but is added with previous row.
                    return j + 1;
                } else {
                    return j;
                }
            }
        }
        return undefined;
    };

    /**
     * @method _createRow
     * @private
     * @param {UInteger} clickedRow
     * @returns {Object}
     * This method will create a row. No matter what it says in the other methods, they all call this one. This method will calculate the height from the top
     * of the dialog to the current row, the logical operator (inbetween rows), and the line separator (inbetween rows). It will then create a unique number
     * for to identify all widgets in this row. After that it will look at the configuration to see if there is data already stored and in this case add
     * these to the configuration for this row.
     * 
     * Next it will create the delete button first. The add button belongs to the previous row, just as this row will add it's add button to the next row.
     * Then it will add the ColumnPicker (which will display all the available columns in the widget), and an operator widget (Dropdown displaying >, <, 
     * ==, <>, etc). Then the Add button will be placed on the new row. After that a logical filter operator (and/or) will be placed between the previous
     * row and this new one. Next a Rectangle widget will added below the row that will act as a separation line between two rows. Lastly, and it's very
     * important that this happens last, the value selector (i.e. the value we want to compare to) is added. The reason it has to be added last is that
     * it needs to be popped from the queue and readded when user changes the column type from the column selector. The value selector is created by calling
     * the _getvalueColumn function which decides which type of widget will be used.
     * 
     * If this is very hard to grasp, which I might understand if it is, I'd recommend that you open up a dialog in the runtime and a have a look at what
     * it looks like and how it works. This is going to clear things up a lot.
     */
    p._createRow = function (clickedRow) {
        var currSeparatorTop = this._getCurrSeparatorTop(clickedRow),
            currTop = this._getCurrTop(clickedRow),
            row = [],
            labelText,
            randomNumber = Utils.uniqueID();

        //Main row 
        row.push(this._getImage('sort_button_delete_' + randomNumber, 'widgets/brease/TableWidget/assets/Delete.svg', this.config.children.left.delete_this_row, currTop));

        if (this.currRow === 0 || clickedRow === 0) {
            labelText = this.texts.first;
        } else {
            labelText = this.texts.then;
        }

        var col = this.tableConfig.columns[0].data, val;
        if (this.widget.settings.config.sort.length > 0 && this.widget.settings.config.sort[clickedRow] !== undefined) {
            col = this.widget.settings.config.columns[this.widget.settings.config.sort[clickedRow][0]].data;
            val = (this.widget.settings.config.sort[clickedRow][1] === 'asc') ? 0 : 1;
        }

        row.push(this._getLabel('sort_label_' + randomNumber, labelText, this.config.children.left.label, currTop, 150));
        row.push(this._getDropDownColumn('sort_dropdown_columnpicker_' + randomNumber, this.config.children.left.column_picker, currTop, 150, col));
        row.push(this._getRect('sort_rect_separator_' + randomNumber, this.config.children.left.rect_separator, currSeparatorTop, 600));

        //Move the new add button to the next row
        var oneRowOffset = this._getOneRowOffset(currTop);
        row.push(this._getImage('sort_button_add_' + randomNumber, 'widgets/brease/TableWidget/assets/Add.svg', this.config.children.left.add_next_row, oneRowOffset));

        //This row has to be last, so we can pop it later
        row.push(this._getValueColumn(col, this.config.children.left.sort_value, currTop, 220, val));

        return row;
    };

    /**
     * @method _removeRow
     * @private
     * This method will, just as the name suggest, remove a row. It will first find out which row has been clicked, then remove
     * all eventlisteners for this row, before it removes the widgets from the dialog (via GenericDialog) and then finally when it
     * has been removed the configuration will be updated accordingly, and all the subsequent rows will be moved up one step.
     */
    p._removeRow = function (e) {
        var clickedRow = this._getCurrentRow(brease.uiController.parentWidgetId(e.target), this.config.children.delete_this_row);
        if (this.config.rows[clickedRow].widgets[this.config.children.delete_this_row].id === brease.uiController.parentWidgetId(e.target)) {
            e.stopPropagation();
            $('#' + this.config.rows[clickedRow].widgets[this.config.children.delete_this_row].id).off(BreaseEvent.CLICK, this._bind('_removeRow'));
            $('#' + this.config.rows[clickedRow].widgets[this.config.children.column_picker].id).off('SelectedIndexChanged', this._bind('_updateRow'));
            $('#' + this.config.rows[clickedRow].widgets[this.config.children.add_next_row].id).off(BreaseEvent.CLICK, this._bind('_addRowHandler'));

            for (var i = 0; i < this.config.rows[clickedRow].widgets.length - 1; i += 1) {
                this.dialog.removeWidget(this.config.rows[clickedRow].widgets[i + 1]);
            }
            
            //Finally set a timer to remove the Delete Image with a timer so that the 
            //event can dispatch first before removing widget
            var self = this;
            window.setTimeout(function () { 
                self.dialog.removeWidget(self.config.rows[clickedRow].widgets[self.config.children.delete_this_row]);
                self.config.rows.splice(clickedRow, 1);
                self.currRow -= 1;
                
                if (clickedRow === 0 && self.config.rows[clickedRow] !== undefined) {
                    brease.callWidget(self.config.rows[clickedRow].widgets[self.config.children.label].id, 'setText', self.texts.first);
                }
                if (self.config.rows.length === _nrOfVisibleColumns.call(self) - 1) {
                    self._belowMaxColumn(); 
                }
                _restoreFocusAfterRemove.call(self, clickedRow);
                _setTabIndex.call(self);
            }, 0);
            //Move all the widgets to their new respective positions
            this._moveRow(clickedRow, true, true);
        }
    };

    /**
     * @method _moveRow
     * @private
     * @param {UInteger} clickedRow
     * @param {Boolean} moveUp
     * @param {Boolean} remove
     * This method will move all rows up or down one step depending on which row was clicked, and if the moveUp flag has been set or not. The
     * remove flag will only increase the click count by one as this row now is gone and shouldn't be incorporated in the row count.
     */
    p._moveRow = function (clickedRow, moveUp, remove) {
        var initalRow = clickedRow + ((remove !== undefined || remove === true) ? 1 : 0);
        for (var j = initalRow; j < this.config.rows.length; j += 1) {
            for (var k = 0; k < this.config.rows[j].widgets.length; k += 1) {
                if (moveUp) {
                    // move rowHeight px per row north bound
                    $('#' + this.config.rows[j].widgets[k].id).css('top', parseInt($('#' + this.config.rows[j].widgets[k].id).css('top')) - this.config.loc.rowHeight);
                } else {
                    // move rowHeight px per row south bound
                    $('#' + this.config.rows[j].widgets[k].id).css('top', parseInt($('#' + this.config.rows[j].widgets[k].id).css('top')) + this.config.loc.rowHeight);
                }
            }
        }
    };

    /**
     * @method _getValueColumn
     * @private
     * @param {String} selected selected item represented by the short hand form from the TableColumnWidget (or derived one). Eg. sta (Status in AL)
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger|String|Date} selectedIndex the value that is to presented in the widget
     * This method will figure out which type of widget is necessary to use in order to display the correct information by comparing the columnType for this
     * specific column. If it's of type date it will instantiate a DateTimeInput, if it's of type str it will instantiate a TextInput. If it's a int however
     * it will look into the selected row and it will create a derived widget specific DropDownBox (either for categories (AL/AH) or status (AL) or sto/stn (AH))
     * If however the column does not fit into any of these categories a NumericInput will be generated.
     * 
     * TODO: migrate derived widget specific (All the dropdowns) selections to the derived widgets to avoid confusion.
     */
    p._getValueColumn = function (selected, x, y, w, selectedIndex) {
        var widget, data, rand = Utils.uniqueID(), name = 'dropdown_sort_' + rand;
        if (this.tableConfig.columnTypes[selected] === 'int') {
            data = [{ value: '0', text: this.texts.inc }, { value: '1', text: this.texts.dec }];
        } else if (this.tableConfig.columnTypes[selected] === 'str') {
            data = [{ value: '0', text: this.texts.az }, { value: '1', text: this.texts.za }];
        } else if (this.tableConfig.columnTypes[selected] === 'date') {
            data = [{ value: '0', text: this.texts.old }, { value: '1', text: this.texts.new }];
        } else if (this.tableConfig.columnTypes[selected] === 'bool') {
            data = [{ value: '0', text: this.texts.false }, { value: '1', text: this.texts.true }];
        }
        widget = this._getDropDown(name, data, x, y, w, selectedIndex);
        return widget;
    };

    p._widgetCollectStateBeforeClosing = function () {
        var listJsonObj = [];
        
        for (var i = 0; i < this.currRow; i += 1) {
            var jsonObj = [];
            var tO = this._getSelectedItemFromDataProvider(this.config.rows[i].widgets[this.config.children.column_picker].id);
            
            for (var j = 0; j < this.widget.settings.config.columns.length - 1; j += 1) {
                if (this.widget.settings.config.columns[j].data === tO.value) {
                    jsonObj.push(j);
                    break;
                }
            }

            if (parseInt(brease.callWidget(this.config.rows[i].widgets[this.config.children.sort_value].id, 'getSelectedValue')) === 0) {
                jsonObj.push('asc');
            } else {
                jsonObj.push('desc');
            }

            listJsonObj.push(jsonObj);  
        }
        //Here we need to store the filter in localStorage/cookie
        if (this.config === undefined) {
            return this.widget.settings.config.sort;
        }
        return listJsonObj;

    };

    p._getSelectedItemFromDataProvider = function (id) {
        var item, dP = brease.callWidget(id, 'getDataProvider'), selectedIndex = brease.callWidget(id, 'getSelectedIndex');
        if (dP && selectedIndex > -1) {
            item = dP[selectedIndex];
        }
        return item;
    };

    p._checkMaxColumnsReached = function () {
        if (this.config.rows.length >= _nrOfVisibleColumns.call(this)) {
            _changeAddButtonVisibility.call(this, false); 
        }
    };

    p._belowMaxColumn = function () {
        _changeAddButtonVisibility.call(this, true); 
    };

    function _changeAddButtonVisibility(visibility) {
        for (var j = 0; j < this.config.rows.length; j += 1) {
            brease.callWidget(this.config.rows[j].widgets[this.config.children.add_next_row].id, 'setVisible', visibility);
        }
        brease.callWidget(this.config.startWidgets[this.config.children.add_next_row].id, 'setVisible', visibility); 
    }

    p._getCurrSeparatorTop = function (row) {
        return this.config.loc.currSeparatorTopOffset + (row * this.config.loc.rowHeight) + this.config.loc.offset;
    };

    p._getCurrFilterLogicalTop = function (row) {
        return this.config.loc.filterlogicalTopOffset + ((row - 1) * this.config.loc.rowHeight) + this.config.loc.offset;
    };

    p._getCurrTop = function (row) {
        return 60 + (row * (this.config.loc.rowHeight)) + this.config.loc.offset;
    };

    p._getOneRowOffset = function (currTop) {
        return currTop + this.config.loc.rowHeight;
    };

    p._reColourNewObject = function (addedRow) {
        $('#' + this.config.rows[addedRow].widgets[this.config.children.rect_separator].id).css('border-width', '0px 0px 2px 0px');
    };
    
    p._getDropDown = function (name, dataProvider, x, y, w, selectedIndex) {
        if (selectedIndex === undefined) {
            selectedIndex = 0;
        } else {
            for (var i = 0; i < _nrOfVisibleColumns.call(this); i += 1) {
                if (selectedIndex === this.tableConfig.columns[i].data) {
                    selectedIndex = i;
                }
            }
        }

        var dropdown = new DialogWidgetModel();
        dropdown.name = name;
        dropdown.type = 'widgets/brease/DropDownBox';
        dropdown.x = x;
        dropdown.y = y;
        dropdown.width = w;
        dropdown.height = 30;

        dropdown.options = {
            'dataProvider': dataProvider,
            'selectedIndex': parseInt(selectedIndex),
            'listPosition': 'left',
            'fitHeight2Items': false,
            'cropToParent': true,
            'listWidth': 220,
            'ellipsis': true
        };

        dropdown.result = { method: 'getSelectedValue' };
        return dropdown;
    };

    p._getDropDownColumn = function (name, x, y, w, selectedIndex) {
        if (selectedIndex === undefined) {
            selectedIndex = 0;
        } else {
            for (var i = 0; i < _nrOfVisibleColumns.call(this); i += 1) {
                if (selectedIndex === this.tableConfig.columns[i].data) {
                    selectedIndex = i;
                }
            }
        }

        var dropdown = new DialogWidgetModel();
        dropdown.name = name;
        dropdown.type = 'widgets/brease/DropDownBox';
        dropdown.x = x;
        dropdown.y = y;
        dropdown.width = w;
        dropdown.height = 30;
        dropdown.options = {
            'dataProvider': [],
            'selectedIndex': parseInt(selectedIndex),
            'listPosition': 'right',
            'fitHeight2Items': false,
            'cropToParent': true,
            'listWidth': 220,
            'ellipsis': true
        };

        for (var j = 0; j < _nrOfVisibleColumns.call(this); j += 1) {
            dropdown.options.dataProvider.push({ 'value': this.tableConfig.columns[j].data, 'text': this.childrenList[j].settings.text });
        }

        dropdown.result = { method: 'getSelectedValue' };
        return dropdown;
    };

    p._getImage = function (name, img, x, y) {
        var image = new DialogWidgetModel();
        image.name = name;
        image.type = 'widgets/brease/Image';
        image.x = x;
        image.y = y;
        image.width = '30px';
        image.height = '30px';

        image.options = {
            image: img,
            tabIndex: 0
        };

        return image;
    };

    p._getLabel = function (name, text, x, y, w) {
        var label = new DialogWidgetModel();
        label.name = name;
        label.type = 'widgets/brease/Label';
        label.x = x;
        label.y = y;
        label.width = w;
        label.height = '30px';

        label.options = {
            'text': text
        };

        return label;
    };

    p._getRect = function (name, x, y, w) {
        var rect = new DialogWidgetModel();
        rect.name = name;
        rect.type = 'widgets/brease/Rectangle';
        rect.x = x;
        rect.y = y;
        rect.width = w;
        rect.height = '2px';

        rect.options = {
            'borderWidth': '0px 0px 1px 0px'
        };

        return rect;
    };

    function _nrOfVisibleColumns() {
        return this.tableConfig.columns.length - 1;
    }

    function _setTabIndex() {
        if (!brease.config.isKeyboardOperationEnabled()) {
            return;
        }
        var tabIndex = 2;
        this.config.rows.forEach(function (row) {
            row.widgets.forEach(function (widget) {
                if (widget.id !== '' && !widget.name.includes('sort_rect') && !widget.name.includes('sort_label') && !widget.name.includes('dropdown_sort_')) {
                    brease.uiController.setWidgetPropertyIndependentOfState(widget.id, 'tabIndex', tabIndex++);
                    
                    if (widget.name.includes('sort_dropdown_columnpicker') && row.widgets[this.config.children.sort_value]) {
                        var id = row.widgets[this.config.children.sort_value].id;
                        brease.uiController.setWidgetPropertyIndependentOfState(id, 'tabIndex', tabIndex++);
                    }
                }
            }, this);
        }, this);
        this.dialog.elem.dispatchEvent(new CustomEvent(BreaseEvent.TABINDEX_CHANGED, { bubbles: true, detail: { contentId: brease.settings.globalContent } }));
    }

    function _restoreFocusAfterRemove(clickedRow) {
        if (!brease.config.isKeyboardOperationEnabled()) {
            return;
        }
        var focusWidget;
        if (clickedRow === 0) {
            var addButtonWidgetId = this.config.startWidgets[this.config.children.add_next_row].id;
            focusWidget = document.getElementById(addButtonWidgetId);
        } else {
            focusWidget = document.getElementById(this.config.rows[clickedRow - 1].widgets[this.config.children.add_next_row].id);
        }
        if (focusWidget) {
            focusWidget.focus();
        }
    }

    return SortingClass;
});
