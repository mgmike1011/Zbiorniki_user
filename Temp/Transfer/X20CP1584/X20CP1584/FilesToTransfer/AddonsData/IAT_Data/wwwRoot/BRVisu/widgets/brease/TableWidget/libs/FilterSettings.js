define([
    'brease/core/Class',
    'brease/core/Utils',
    'brease/events/BreaseEvent',
    'widgets/brease/GenericDialog/libs/models/dialogWidgetModel',
    'brease/services/RuntimeService'
], function (
    SuperClass, Utils, BreaseEvent, 
    DialogWidgetModel, _runtimeServices
) {

    'use strict';

    /** 
     * @class widgets.brease.TableWidget.libs.FilterSettings
     * @extends brease.core.Class
     * 
     * If this is very hard to grasp, which I might understand if it is, I'd recommend that you open up a dialog in the runtime and a have a look at what
     * it looks like and how it works. This is going to clear things up a lot.
     */

    var FilterClass = SuperClass.extend(function FilterSettings(dialog, widget, lang, categories, texts) {
            this.texts = texts;
            this.lang = lang;
            this.dialog = dialog;
            this.categories = categories;
            this.tableConfig = widget.settings.config;
            this.childrenList = widget.settings.childrenList;
            this.widget = widget;
            this.currRow = 0;
            SuperClass.call(this);
        }, null),

        p = FilterClass.prototype;

    /**
     * @method initialize
     * This method will create the necessary configuration object for the dialog to instantiate, it will set the values for where
     * each individual widget type should be placed in the row direction. It will also store the necessary informtaion about the
     * height an individual row will take so that an offset from the top can be calculated. It will then retrieve all the category
     * names from the model, and instantiate an empty dialog with this information, before it retrieves the texts to be used from
     * the text system. Once this async process is done, it will initialize any stored information in the dialog.
     * @returns {Object}
     */
    p.initialize = function () {
        this.config = {};
        this.config.rows = [];
        this.config.cats = [];
        this.textSystemReady = new $.Deferred();
        this.config.children = {
            delete_this_row: 0,
            column_picker: 1,
            operator: 2,
            add_next_row: 3,
            logic_op_next_row: 4,
            rect_separator: 5,
            comp_value: 6,
            
            left: {
                delete_this_row: 50,
                column_picker: 100,
                operator: 270,
                add_next_row: 10,
                logic_op_next_row: 5,
                rect_separator: 70,
                comp_value: 375
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
        this._getCategoryNames();
        this._initializeEmptyDialogConfig();

        if (this.widget.settings.config.filter.length !== 0) {
            var self = this;
            $.when(this.textSystemReady.promise()).then(function successHandler() {
                self._initializeStoredDialogConfig();
            });
        }
        return this.config;
    };

    /**
     * @method _getCurrSeparatorTop
     * @private
     * This method calulates the distance from the top for a line separator between two rows for a given row
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrSeparatorTop = function (row) {
        return this.config.loc.currSeparatorTopOffset + (row * this.config.loc.rowHeight) + this.config.loc.offset;
    };

    /**
     * @method _getCurrFilterLogicalTop
     * @private
     * This method calculates the distance from the top for a logical operator (and/or) between two rows for a given row
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrFilterLogicalTop = function (row) {
        return this.config.loc.filterlogicalTopOffset + ((row - 1) * this.config.loc.rowHeight) + this.config.loc.offset;
    };

    /**
     * @method _getCurrTop
     * @private
     * This method calculates the distance from the top for the widgets that are part of the row (except the line and the logical operator) for a given row
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrTop = function (row) {
        return 60 + (row * (this.config.loc.rowHeight)) + this.config.loc.offset;
    };

    /**
     * @method _getOneRowOffset
     * @private
     * This method will calculate the height to the next row given the current row
     * @param {UInteger} currTop
     * @returns {UInteger}
     */
    p._getOneRowOffset = function (currTop) {
        return currTop + this.config.loc.rowHeight;
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
     * @method _insertRow
     * @private
     * @param {String} clickedRow
     * This method will insert a row at the row that has been clicked and shifts all by calling the _moveRow function,
     * it then adds all necessary eventlistener for this row, before splicing the configuration and adding the new
     * configuration at the right place in the list, and finally increases the current row with one.
     */
    p._insertRow = function (clickedRow) {

        //Create a new row with positional value where this one is
        var row = this._createRow(clickedRow);

        //Instatiate logical operator from resting first row
        if (clickedRow === 0) {
            if (this.config.rows[clickedRow].widgets[this.config.children.logic_op_next_row].id === '') {
                this.config.rows[clickedRow].widgets[this.config.children.logic_op_next_row].id = this._generateLogicalOperatorWidgetId();
            }
            this.dialog.addWidget(this.config.rows[clickedRow].widgets[this.config.children.logic_op_next_row]);
        }

        //Move all the widgets to their new respective positions
        this._moveRow(clickedRow, false);

        //Instatiate new row
        for (var i = 0; i < row.length; i += 1) {
            if (!(i === this.config.children.logic_op_next_row && clickedRow === 0)) {
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

    p._generateLogicalOperatorWidgetId = function () {
        return 'Dropdown_Logical_Filter_' + Utils.uniqueID();
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

        if (this.config.rows[currRow].widgets[this.config.children.comp_value]) {
            this.dialog.removeWidget(this.config.rows[currRow].widgets[this.config.children.comp_value]);
            this.config.rows[currRow].widgets.pop();
        }
        var row = [];
        row.push(this._getValueColumn(e.detail.selectedValue, this.config.children.left.comp_value, currTop, 220));
        for (var i = 0; i < row.length; i += 1) {
            this.dialog.addWidget(row[i]);
        }
        this.config.rows[currRow].widgets = this.config.rows[currRow].widgets.concat(row);

        _setTabIndex.call(this);
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
            
            // Finally set a timer to remove the Delete Image with a timer so that the 
            // event can dispatch first before removing widget
            var self = this;
            setTimeout(function () { 
                self.dialog.removeWidget(self.config.rows[clickedRow].widgets[self.config.children.delete_this_row]);
                self.config.rows.splice(clickedRow, 1);
                self.currRow -= 1;
                _restoreFocusAfterRemove.call(self, clickedRow);
                _setTabIndex.call(self);
            }, 0);

            //Inter filter operator has to be removed of the previous row
            if (clickedRow === 0 && this.config.rows[clickedRow + 1] !== undefined) {
                this.dialog.removeWidget(this.config.rows[clickedRow + 1].widgets[this.config.children.logic_op_next_row]);
                this.config.rows[clickedRow + 1].widgets[this.config.children.logic_op_next_row].id = '';
            }
            
            //Move all the widgets to their new respective positions
            this._moveRow(clickedRow, true, true);
        }
    };

    /**
     * @method _moveRow
     * @private
     * This method will move all rows up or down one step depending on which row was clicked, and if the moveUp flag has been set or not. The
     * remove flag will only increase the click count by one as this row now is gone and shouldn't be incorporated in the row count.
     * @param {UInteger} clickedRow
     * @param {Boolean} moveUp
     * @param {Boolean} remove
     */
    p._moveRow = function (clickedRow, moveUp, remove) {
        var initalRow = clickedRow + ((remove !== undefined || remove === true) ? 1 : 0);
        for (var j = initalRow; j < this.config.rows.length; j += 1) {
            for (var k = 0; k < this.config.rows[j].widgets.length; k += 1) {
                if (moveUp) {
                    // move rowHeight px per row north bound
                    this.config.rows[j].widgets[k].y -= this.config.loc.rowHeight;
                } else {
                    // move rowHeight px per row south bound
                    this.config.rows[j].widgets[k].y += this.config.loc.rowHeight;
                }
                $('#' + this.config.rows[j].widgets[k].id).css('top', parseInt(this.config.rows[j].widgets[k].y));
            }
        }
    };

    /**
     * @method _widgetCollectStateBeforeClosing
     * @private
     * This method will collect all the values from the different dropdownboxes, text-, numeric-, and datetime inputs and store these in a json
     * object that later will be used for the filtering mechanism.
     * OBS: Right now all dervied widgets different filtering anomolies are collected in this method, which probably isn't very smart, and should
     * be outsourced to each individual widget. TODO!
     * @returns {Object[]}
     */
    p._widgetCollectStateBeforeClosing = function (e) {
        var listJsonObj = [];
        
        for (var i = 0; i < this.currRow; i += 1) {
            var jsonObj = {
                logical: '',
                logVal: 2,
                data: '',
                op: '',
                opVal: 0,
                comp: ''
            };
            if (i < this.currRow - 1) {
                var tL = this._getSelectedItemFromDataProvider(this.config.rows[i + 1].widgets[this.config.children.logic_op_next_row].id);
                jsonObj.logical = tL.text;
                jsonObj.logVal = tL.value;
            }

            jsonObj.data = brease.callWidget(this.config.rows[i].widgets[this.config.children.column_picker].id, 'getSelectedValue');
            var tO = this._getSelectedItemFromDataProvider(this.config.rows[i].widgets[this.config.children.operator].id);
            jsonObj.op = tO.text;
            jsonObj.opVal = tO.value;

            var firstRow = 0;
            if (this.config.rows[i].widgets.length === 6) {
                firstRow = 1;
            }

            if (jsonObj.data === 'sto' || jsonObj.data === 'stn' || jsonObj.data === 'cat' || jsonObj.data === 'IsAdmin' || jsonObj.data === 'IsLocked') {
                jsonObj.comp = brease.callWidget(this.config.rows[i].widgets[this.config.children.comp_value - firstRow].id, 'getSelectedValue');
            } else {
                jsonObj.comp = brease.callWidget(this.config.rows[i].widgets[this.config.children.comp_value - firstRow].id, 'getValue');
            }
            
            listJsonObj.push(jsonObj);
        }
        //Here we need to store the filter in localStorage/cookie
        if (this.config === undefined) {
            return this.widget.settings.config.filter;
        }
        
        return listJsonObj;
        
    };
    
    /**
     * @method 
     * This method will remove eventlisteners added at start up
     */
    p.removeEventListeners = function () {
        this.dialog.el.off(BreaseEvent.WIDGET_READY, this._bind('_handleChildWidgetReady'));
    };

    /**
     * @method _getSelectedItemFromDataProvider
     * @private
     * This method is a helper method to get the value of the selected item from a DropDownBox. It was created as a helper methd when
     * the DropDownBox migrated to it's new architecture.
     * @param {String} id
     * @returns {UInteger|String}
     */
    p._getSelectedItemFromDataProvider = function (id) {
        var item, dP = brease.callWidget(id, 'getDataProvider'), selectedIndex = brease.callWidget(id, 'getSelectedIndex');
        if (dP && selectedIndex > -1) {
            item = dP[selectedIndex];
        }
        return item;
    };

    /**
     * @method _reColourFirstLineSeparator
     * @private
     * This method will change the first line separator (below the header) so it becomse 2px high and black.
     */
    p._reColourFirstLineSeparator = function () {
        $('#' + this.config.startWidgets[0].id).css('border-width', '0px 0px 2px 0px'); //.css('background-color', 'rgba(0,0,0,0');
    };

    /**
     * @method _reColourNewObject
     * @private
     * This method will change all other (except the header line separator) so it becomse 2px high and black.
     */
    p._reColourNewObject = function (addedRow) {
        $('#' + this.config.rows[addedRow].widgets[this.config.children.rect_separator].id).css('border-width', '0px 0px 2px 0px'); //.css('background-color', 'rgba(0,0,0,0');
    };

    /**
     * @method _getCurrentRow
     * @private
     * This method will return which the current row is by looking at the pressedId and the widget position in the configuration.
     * @param {String} pressedId
     * @param {UInteger} widgetPos
     * @returns {UInteger}
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
     * This method will create a row. No matter what it says in the other methods, they all call this one. This method will calculate the height from the top
     * of the dialog to the current row, the logical operator (inbetween rows), and the line separator (inbetween rows). It will then create a unique number
     * for to identify all widgets in this row. After that it will look at the configuration to see if there is data already stored and in this case add
     * these to the configuration for this row.
     * 
     * Next it will create the delete button first. The add button belongs to the previous row, just as this row will add it's add button to the next row.
     * Then it will add the ColumnPicker (which will display all the available columns in the widget), and an operator widget (Dropdown displaying >, <, 
     * ==, <>, etc). Then value selector is created by calling the _getvalueColumn function which decides which type of widget will be used.
     * Then the Add button will be placed on the new row. After that a logical filter operator (and/or) will be placed between the previous
     * row and this new one. Next a Rectangle widget will added below the row that will act as a separation line between two rows. Lastly, and it's very
     * important that this happens last, the value selector (i.e. the value we want to compare to) is added.
     * 
     * If this is very hard to grasp, which I might understand if it is, I'd recommend that you open up a dialog in the runtime and a have a look at what
     * it looks like and how it works. This is going to clear things up a lot.
     * @param {UInteger} i
     * @returns {Object}
     */
    p._createRow = function (i) {
        var currSeparatorTop = this._getCurrSeparatorTop(i),
            currFilterLogicalTop = this._getCurrFilterLogicalTop(i),
            currTop = this._getCurrTop(i),
            row = [],
            randomNumber = Utils.uniqueID();
        var obj = {};
        if (this.widget.settings.config.filter.length > 0 && this.widget.settings.config.filter[i] !== undefined) {
            obj = this.widget.settings.config.filter[i];
        }
        //Main row 
        row.push(this._getImage('Button_Delete_' + randomNumber, 'widgets/brease/TableWidget/assets/Delete.svg', this.config.children.left.delete_this_row, currTop));
        row.push(this._getDropDownColumn('Dropdown_ColumnPicker_' + randomNumber, this.config.children.left.column_picker, currTop, 150, obj.data));
        row.push(this._getDropDownOperator('Dropdown_Operator_' + randomNumber, this.config.children.left.operator, currTop, 85, obj.opVal));

        //Move the new add button to the next row
        var oneRowOffset = currTop + this.config.loc.rowHeight;
        row.push(this._getImage('Button_Add_' + randomNumber, 'widgets/brease/TableWidget/assets/Add.svg', this.config.children.left.add_next_row, oneRowOffset));
        
        //How to bind the next filter
        var logVal;
        if (i === 0 || _.isEmpty(obj)) {
            logVal = 0;
        } else {
            logVal = this.widget.settings.config.filter[i - 1].logVal;
        }
        row.push(this._getDropDown('Dropdown_Logical_Filter_' + randomNumber, [{ 'value': 0, 'text': this.texts.and }, { 'value': 1, 'text': this.texts.or }], 
            this.config.children.left.logic_op_next_row, currFilterLogicalTop, 60, this.config.loc.logicalOperatorHeight, logVal));
        row.push(this._getRect('Rect_Separator_' + randomNumber, this.config.children.left.rect_separator, currSeparatorTop, 600));
        
        //this row has to be last, so we can pop it later
        var data;
        if (obj.data !== undefined) {
            data = obj.data;
        } else {
            data = this.tableConfig.columns[0].data;
        }
        row.push(this._getValueColumn(data, this.config.children.left.comp_value, currTop, 220, obj.comp));

        return row;
    };

    /**
     * @method _initializeStoredDialogConfig
     * @private
     * This method runs through the filter stored in the widget and creates rows and add eventlisteners accordingly.
     */
    p._initializeStoredDialogConfig = function () {
        for (var i = 0; i < this.widget.settings.config.filter.length; i += 1) {
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
        }
        _setTabIndex.call(this);
    };

    /**
     * @method _initializeEmptyDialogConfig
     * @private
     * This method will create an empty dialog, with a header of three columns (Column, Operator, and Value), a line separator and at the end
     * an add button so that a user can add a row. It will then add the necessary eventlistener for the add row button.
     */
    p._initializeEmptyDialogConfig = function () {
        this.config.startWidgets = [];
        this.dialog.el.on(BreaseEvent.WIDGET_READY, this._bind('_handleChildWidgetReady'));
        // First add the header for the configuration dialogue
        this.config.startWidgets.push(this._getRect('filter_rect_header', 0, 50 + this.config.loc.offset, 600));
        this.config.startWidgets.push(this._getLabel('filter_label_column', this.texts.col, 100, 20 + this.config.loc.offset, 100));
        this.config.startWidgets.push(this._getLabel('filter_label_operator', this.texts.op, 270, 20 + this.config.loc.offset, 100));
        this.config.startWidgets.push(this._getLabel('filter_label_value', this.texts.val, 375, 20 + this.config.loc.offset, 100));
        this.config.startWidgets.push(this._getImage('filter_button_add_0', 'widgets/brease/TableWidget/assets/Add.svg', 10, 60 + this.config.loc.offset));

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
        
        if (e.target.id.includes('filter_label')) {
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
        if (e.target.id.includes('filter_button_add_0')) {
            e.target.focus();
        }
    };

    /**
     * @method _getValueColumn
     * @private
     * This method will figure out which type of widget is necessary to use in order to display the correct information by comparing the columnType for this
     * specific column. If it's of type date it will instantiate a DateTimeInput, if it's of type str it will instantiate a TextInput. If it's a int however
     * it will look into the selected row and it will create a derived widget specific DropDownBox (either for categories (AL/AH) or status (AL) or sto/stn (AH))
     * If however the column does not fit into any of these categories a NumericInput will be generated.
     * 
     * TODO: migrate derived widget specific (All the dropdowns) selections to the derived widgets to avoid confusion.
     * @param {String} selected selected item represented by the short hand form from the TableColumnWidget (or derived one). Eg. sta (Status in AL)
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger|String|Date} value the value that is to presented in the widget
     * @returns {Object}
     */
    p._getValueColumn = function (selected, x, y, w, value) {
        var widget;
        var name = Utils.uniqueID('Value_' + this.currRow);
        if (this.tableConfig.columnTypes[selected] === 'date') {
            widget = this._getDateTimeInput('DateTimeInput_' + name, x, y, w, value);
        } else if (this.tableConfig.columnTypes[selected] === 'str') {
            widget = this._getTextInput('TextInput_' + name, x, y, w, value);
        } else if (this.tableConfig.columnTypes[selected] === 'bool') {
            var dataProviderBool = [{ value: false, text: this.texts.false }, { value: true, text: this.texts.true }];
            widget = this._getDropDown('DropDownStatus_' + name, dataProviderBool, x, y, w, 30, (value !== undefined) ? parseInt(value) - 1 : value, 'left');
        } else if (this.tableConfig.columnTypes[selected] === 'int') {
            var dataProvider;
            if (selected === 'sta') {
                dataProvider = [{ value: '1', text: this.texts.act }, { value: '2', text: this.texts.actack }, { value: '3', text: this.texts.inact }];
                widget = this._getDropDown('DropDownStatus_' + name, dataProvider, x, y, w, 30, (value !== undefined) ? parseInt(value) - 1 : value, 'left');
            } else if (selected === 'cat') {
                dataProvider = [];
                for (var i = 0; i < this.categories.length; i += 1) {
                    dataProvider.push({ 'value': i.toString(), 'text': this.config.cats[i] });
                }

                widget = this._getDropDown('DropDownStatus_' + name, dataProvider, x, y, w, 30, value, 'left');
            } else if (selected === 'stn' || selected === 'sto') {
                dataProvider = [{ value: '1', text: this.texts.act }, { value: '2', text: this.texts.actack }, { value: '3', text: this.texts.inact }, { value: '4', text: this.texts.inactack }];
                widget = this._getDropDown('DropDownStatus_' + name, dataProvider, x, y, w, 30, (value !== undefined) ? parseInt(value) - 1 : value, 'left');
            } else {
                widget = this._getNumericInput('NumericInput_' + name, x, y, w, selected, value);
            }
        }
        return widget;
    };

    /**
     * @method _getCategoryNames
     * @private
     * This method will get all category names from the backend belonging to the namespace:
     *  - IAT/Widgets / *widget type (i.e. AlarmList, etc)* / * category *
     * it will then resolve the textSystemReady promise so that the dialog can continue loading.
     */
    p._getCategoryNames = function () {
        if (this.categories === undefined) { 
            this.textSystemReady.resolve();
            return null; 
        }
        var self = this;
        function _getCategoryNamesCallback(texts) {
            for (var i = 0; i < self.categories.length; i += 1) {
                var tempText = texts['IAT/Widgets/' + self.widget.settings.type + '/' + self.categories[i]];
                if (tempText === undefined) {
                    tempText = self.categories[i];
                }
                self.config.cats.push(tempText);
            }
            self.textSystemReady.resolve();
        }

        _runtimeServices.loadTexts(this.lang, _getCategoryNamesCallback); 
    };

    /**
     * @method _getDropDownColumn
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * This Dropdown is meant to be used to select which type of column should be selected.
     * @param {String} name
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger|String} selectedIndex this has to be a number, but can be given as a string or number
     * @returns {Object}
     */
    p._getDropDownColumn = function (name, x, y, w, selectedIndex) {
        if (selectedIndex === undefined) {
            selectedIndex = 0;
        } else {
            for (var i = 0; i < this.tableConfig.columns.length - 1; i += 1) {
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
            'listWidth': 190,
            'cropToParent': true,
            'ellipsis': true
        };

        //Minus 1 is for the hidden column used for re-sorting the tables back into correct order.
        for (var j = 0; j < this.tableConfig.columns.length - 1; j += 1) {
            dropdown.options.dataProvider.push({ 'value': this.tableConfig.columns[j].data, 'text': this.childrenList[j].settings.text });
        }

        dropdown.result = { method: 'getSelectedValue' };
        return dropdown;
    };

    /**
     * @method _getDropDownOperator
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * This Dropdown is meant to be used to select which type of operator should be selected.
     * @param {String} name
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger|String} selectedIndex this has to be a number, but can be given as a string or number
     * @returns {Object}
     */
    p._getDropDownOperator = function (name, x, y, w, selectedIndex) {
        if (selectedIndex === undefined) {
            selectedIndex = 0;
        }
        var dropdown = new DialogWidgetModel();
        dropdown.name = name;
        dropdown.type = 'widgets/brease/DropDownBox';
        dropdown.x = x;
        dropdown.y = y;
        dropdown.width = w;
        dropdown.height = 30;

        dropdown.options = {
            'dataProvider':
            [{ 'value': 0, 'text': '<>' },
                { 'value': 1, 'text': '==' },
                { 'value': 2, 'text': '<' },
                { 'value': 3, 'text': '<=' },
                { 'value': 4, 'text': '>' },
                { 'value': 5, 'text': '>=' },
                { 'value': 6, 'text': 'Contains' },
                { 'value': 7, 'text': 'Does not contain' }],
            'selectedIndex': parseInt(selectedIndex),
            'listPosition': 'right',
            'fitHeight2Items': false,
            'cropToParent': true,
            'ellipsis': true
        };

        dropdown.result = { method: 'getSelectedValue' };
        return dropdown;
    };

    /**
     * @method _getDropDown
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * This Dropdown is meant to be used as a generic dropdownbox for any reason, the dataprovider has to be provided for it to work.
     * @param {String} name
     * @param {Object[]} dataprovider the dataprovider for the dropdown, has to follow a predefined patter
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger} h height of the widget
     * @param {UInteger|String} selectedIndex this has to be a number, but can be given as a string or number
     * @param {UInteger} pos 
     * @returns {Object}
     */
    p._getDropDown = function (name, dataProvider, x, y, w, h, selectedIndex, pos) {
        if (h === undefined) {
            h = 30;
        }

        if (selectedIndex === undefined) {
            selectedIndex = 0;
        }

        if (pos === undefined) {
            pos = 'right';
        }

        var dropdown = new DialogWidgetModel();
        dropdown.name = name;
        dropdown.type = 'widgets/brease/DropDownBox';
        dropdown.x = x;
        dropdown.y = y;
        dropdown.width = w;
        dropdown.height = h;

        dropdown.options = {
            'dataProvider': dataProvider,
            'selectedIndex': parseInt(selectedIndex),
            'listPosition': pos,
            'fitHeight2Items': false,
            'listWidth': 220,
            'cropToParent': true,
            'ellipsis': true
        };

        dropdown.result = { method: 'getSelectedValue' };
        return dropdown;
    };
    
    /**
     * @method _getDateTimeInput
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
     * @param {String} name
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger} value
     * @returns {Object}
     */
    p._getDateTimeInput = function (name, x, y, w, value) {
        var dateTimeInput = new DialogWidgetModel();
        dateTimeInput.name = name;
        dateTimeInput.type = 'widgets/brease/DateTimeInput';
        dateTimeInput.x = x;
        dateTimeInput.y = y;
        dateTimeInput.width = w;
        dateTimeInput.height = '30px';
        dateTimeInput.options = {
            'format': 'yyyy-MM-dd HH:mm:ss'
        };

        if (value !== undefined) {
            dateTimeInput.options.value = new Date(value).toISOString();
        } else {
            var dt = new Date(),
                year = dt.getFullYear().toString(),
                month = dt.getMonth(),
                da = dt.getDate().toString(),
                hour = dt.getHours(),
                min = dt.getMinutes(),
                sec = dt.getSeconds();
            month = ((month < 9) ? '0' : '') + (month + 1).toString();
            da = ((da < 10) ? '0' : '') + da.toString();
            hour = ((hour < 10) ? '0' : '') + hour.toString();
            min = ((min < 10) ? '0' : '') + min.toString();
            sec = ((sec < 10) ? '0' : '') + sec.toString();
            dateTimeInput.options.value = year + '-' +
                                            month + '-' + 
                                            da + 'T' + 
                                            hour + ':' +
                                            min + ':' +
                                            sec + '.000Z';
        }

        return dateTimeInput;
    };

    /**
     * @method _getLabel
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
     * @param {String} name name of the widget
     * @param {String} text text of the widget
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @returns {Object}
     */
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

    /**
     * @method _getTextInput
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
     * @param {String} name name of the widget
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {String} value
     * @returns {Object}
     */
    p._getTextInput = function (name, x, y, w, value) {
        var textInput = new DialogWidgetModel();
        textInput.name = name;
        textInput.type = 'widgets/brease/TextInput';
        textInput.x = x;
        textInput.y = y;
        textInput.width = w;
        textInput.height = '30px';

        if (value !== undefined) {
            textInput.options.value = value;
        }

        return textInput;
    };

    /**
     * @method _getNumericInput
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
     * @param {String} name name of the widget
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {String} selected
     * @param {UInteger} value
     * @returns {Object}
     */
    p._getNumericInput = function (name, x, y, w, selected, value) {
        if (value === undefined) {
            value = 0;
        }
        var maxValue = 4294967295, 
            lVP,
            format = {
                'metric': { 'decimalPlaces': 0, 'minimumIntegerDigits': 1, 'maximumIntegerDigits': 11 },
                'imperial': { 'decimalPlaces': 0, 'minimumIntegerDigits': 1, 'maximumIntegerDigits': 11 },
                'imperial-us': { 'decimalPlaces': 0, 'minimumIntegerDigits': 1, 'maximumIntegerDigits': 11 } },
            uDG = false;

        if (selected === 'sta') {
            maxValue = 2;
            lVP = 'noSubmit';
        } else if (selected === 'idx') {
            lVP = 'submitAll';
        } else {
            uDG = true;
            lVP = 'noSubmit';
        }

        var numericInput = new DialogWidgetModel();
        numericInput.name = name;
        numericInput.type = 'widgets/brease/NumericInput';
        numericInput.x = x;
        numericInput.y = y;
        numericInput.width = w;
        numericInput.height = '30px';

        numericInput.options = {
            value: value,
            useDigitGrouping: uDG,
            numpadPosition: 'left',
            format: format,
            showUnits: false,
            maxValue: maxValue,
            limitViolationPolicy: lVP
        };

        return numericInput;
    };

    /**
     * @method _getImage
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
     * @param {String} name name of the widget
     * @param {String} img path to the image
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @returns {Object}
     */
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

    /**
     * @method _getRect
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
     * @param {String} name
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @returns {Object}
     */
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

    function _setTabIndex() {
        if (!brease.config.isKeyboardOperationEnabled()) {
            return;
        }
        // logic operators between lines are special and need to be inserted always before a add row button
        var logicOpIds = _getLogicalOperatorWidgetIds.call(this);
        var tabIndex = 2;
        this.config.rows.forEach(function (row) {
            row.widgets.forEach(function (widget) {
                if (isFocusableWidget(widget)) {
                    if (widget.name.includes('Button_Add_') && logicOpIds.length > 0) {
                        brease.uiController.setWidgetPropertyIndependentOfState(logicOpIds.shift(), 'tabIndex', tabIndex++);
                    }
                    brease.uiController.setWidgetPropertyIndependentOfState(widget.id, 'tabIndex', tabIndex++);
                    if (widget.name.includes('Dropdown_Operator') && row.widgets[this.config.children.comp_value]) {
                        var id = row.widgets[this.config.children.comp_value].id;
                        brease.uiController.setWidgetPropertyIndependentOfState(id, 'tabIndex', tabIndex++);
                    }
                }
            }, this);
        }, this);
        this.dialog.elem.dispatchEvent(new CustomEvent(BreaseEvent.TABINDEX_CHANGED, { bubbles: true, detail: { contentId: brease.settings.globalContent } }));
    }

    function isFocusableWidget(widget) {
        return widget.id !== '' && !widget.name.includes('Rect') && !widget.name.includes('Dropdown_Logical') && !widget.name.includes('Value_') && widget.type !== 'widgets/brease/Label';
    }

    function _getLogicalOperatorWidgetIds() {
        var logicOpIds = [];
        this.config.rows.forEach(function (row) {
            var logicOpWidget = row.widgets[this.config.children.logic_op_next_row];
            if (logicOpWidget.id !== '') {
                logicOpIds.push(logicOpWidget.id);
            }
        }, this);
        return logicOpIds;
    }

    function _restoreFocusAfterRemove(clickedRow) {
        if (!brease.config.isKeyboardOperationEnabled()) {
            return;
        }
        var focusWidget;
        if (clickedRow === 0) {
            var addButtonWidgetId = this.config.startWidgets[4].id;
            focusWidget = document.getElementById(addButtonWidgetId);
        } else {
            focusWidget = document.getElementById(this.config.rows[clickedRow - 1].widgets[this.config.children.add_next_row].id);
        }
        if (focusWidget) {
            focusWidget.focus();
        }
    }

    return FilterClass;
});
