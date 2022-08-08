define([
    'brease/core/Class',
    'brease/events/BreaseEvent',
    'widgets/brease/GenericDialog/libs/models/dialogWidgetModel',
    'brease/services/RuntimeService'
], function (
    SuperClass, BreaseEvent, DialogWidgetModel, _runtimeServices
) {
    
    'use strict';

    /** 
     * @class widgets.brease.TableWidget.libs.StylingSettings
     * @extends brease.core.Class
     */

    var StyleClass = SuperClass.extend(function FilterSettings(dialog, widget, lang, texts) {
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

        p = StyleClass.prototype;

    /**
     * @method initialize
     * Method individual for dervied widgets - look there.
     */
    p.initialize = function () {
        //Implement in derived child widget
    };

    /**
     * @method _getCurrSeparatorTop
     * Method individual for dervied widgets - look there.
     * @param {UInteger} row
     */
    p._getCurrSeparatorTop = function (row) {
        //Implement in derived child widget
    };

    /**
     * @method _getCurrFilterLogicalTop
     * Method individual for dervied widgets - look there.
     * @param {UInteger} row
     */
    p._getCurrFilterLogicalTop = function (row) {
        //Implement in derived child widget
    };

    /**
     * @method _getCurrTop
     * Method individual for dervied widgets - look there.
     * @param {UInteger} row
     */
    p._getCurrTop = function (row) {
        //Implement in derived child widget
    };
    
    /**
     * @method _getOneRowOffset
     * Method individual for dervied widgets - look there.
     * @param {UInteger} currTop
     */
    p._getOneRowOffset = function (currTop) {
        //Implement in derived child widget
    };

    /**
     * @method _createRow
     * Method individual for dervied widgets - look there.
     * @param {UInteger} clickedRow
     */
    p._createRow = function (clickedRow) {
        //Implement in derived child widget
    };

    /**
     * @method _widgetCollectStateBeforeClosing
     * Method individual for dervied widgets - look there.
     */
    p._widgetCollectStateBeforeClosing = function () {
        //Implement in derived child widget
    };

    /**
     * @method _getSelectedItemFromDataProvider
     * @private
     * @param {String} id
     * @returns {UInteger|String}
     * This method is a helper method to get the value of the selected item from a DropDownBox. It was created as a helper methd when
     * the DropDownBox migrated to it's new architecture.
     */
    p._getSelectedItemFromDataProvider = function (id) {
        var item, dP = brease.callWidget(id, 'getDataProvider'), selectedIndex = brease.callWidget(id, 'getSelectedIndex');
        if (dP && selectedIndex > -1) {
            item = dP[selectedIndex];
        }
        return item;
    };

    /**
     * @method _initializeEmptyDialogConfig
     * @private
     * This method should be called from the derived widget, so the header columns become correct. It will create an empty dialog, with a line 
     * separator and at the end an add button so that a user can add a row. It will then add the necessary eventlistener for the add row button.
     */
    p._initializeEmptyDialogConfig = function () {
        //Implement configuration structure in derived child widget - see ALarmlist for example
        
        this.config.startWidgets = [];
        
        this.dialog.el.on(BreaseEvent.WIDGET_READY, this._bind('_handleChildWidgetReady'));

        // First add the header for the configuration dialogue
        this.config.startWidgets.push(this._getImage('style_button_add_0', 'widgets/brease/TableWidget/assets/Add.svg', this.config.children.left.add_next_row, this._getCurrTop(0)));

        for (var i = 0; i < this.config.startWidgets.length; i += 1) {
            this.dialog.addWidget(this.config.startWidgets[i]);
        }

        var addButtonId = this.config.startWidgets[0].id; 
        if (brease.config.isKeyboardOperationEnabled()) {
            brease.uiController.setWidgetPropertyIndependentOfState(addButtonId, 'tabIndex', 1);
        }
        $('#' + addButtonId).on(BreaseEvent.CLICK, this._bind('_addRowHandler'));
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
        
        cls = 'widgets_brease_' + type + '_style_tableConfigurationDialogStyle';
        e.target.classList.add(cls);
    };

    /**
     * @method _initFocus
     * @private
     * Sets focus to add button when its ready
     */
    p._initFocus = function (e) {
        if (e.target.id.includes('style_button_add_0')) {
            e.target.focus();
        }
    };

    /**
     * @method _initializeStoredDialogConfig
     * @private
     * This method runs through the filter stored in the widget and creates rows and add eventlisteners accordingly.
     */
    p._initializeStoredDialogConfig = function () {
        
        for (var i = 0; i < this.widget.settings.config.style.length; i += 1) {
            var row = this._createRow(i);

            for (var j = 0; j < row.length; j += 1) {
                this.dialog.addWidget(row[j]);
            }

            this.config.rows.push({ widgets: row });
            
            this.currRow += 1;   

            $('#' + this.config.rows[i].widgets[this.config.children.add_next_row].id).on(BreaseEvent.CLICK, this._bind('_addRowHandler'));
            $('#' + this.config.rows[i].widgets[this.config.children.delete_this_row].id).on(BreaseEvent.CLICK, this._bind('_removeRow'));

            this._reColourNewObject(i);
        }
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

        this._reColourNewObject(clickedRow);
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
            this.dialog.addWidget(row[i]);
        }
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

        //Move all the widgets to their new respective positions
        this._moveRow(clickedRow, false);
        
        //Instatiate new row
        for (var i = 0; i < row.length; i += 1) {
            if (i !== this.config.children.logic_op_next_row || clickedRow !== 0) {
                this.dialog.addWidget(row[i]);
            }
        }

        //Add event handlers to new row
        $('#' + row[this.config.children.add_next_row].id).on(BreaseEvent.CLICK, this._bind('_addRowHandler'));
        $('#' + row[this.config.children.delete_this_row].id).on(BreaseEvent.CLICK, this._bind('_removeRow'));

        //splice new row into position in row configuration
        this.config.rows.splice(clickedRow, 0, { widgets: row });
        
        //Increase currRow by one
        this.currRow += 1;
        _setTabIndex.call(this);
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
            $('#' + this.config.rows[clickedRow].widgets[this.config.children.add_next_row].id).off(BreaseEvent.CLICK, this._bind('_addRowHandler'));

            for (var i = 0; i < this.config.rows[clickedRow].widgets.length - 1; i += 1) {
                this.dialog.removeWidget(this.config.rows[clickedRow].widgets[i + 1]);
            }
            
            //Finally set a timer to remove the Delete Image with a timer so that the 
            //event can dispatch first before removing widget
            var self = this;
            setTimeout(function () { 
                self.dialog.removeWidget(self.config.rows[clickedRow].widgets[self.config.children.delete_this_row]);
                self.config.rows.splice(clickedRow, 1);
                self.currRow -= 1;
                _setTabIndex.call(self);
                _restoreFocusAfterRemove.call(self, clickedRow);
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
     * @method _reColourNewObject
     * @private
     * This method will change all other (except the header line separator) so it becomse 2px high and black.
     */
    p._reColourNewObject = function (addedRow) {
        $('#' + this.config.rows[addedRow].widgets[this.config.children.rect_separator].id).css('border-width', '0px 0px 2px 0px'); //.css('background-color', 'rgba(0,0,0,0');
    }; 
    
    /**
     * @method 
     * This method will remove eventlisteners added at start up
     */
    p.removeEventListeners = function () {
        this.dialog.el.off(BreaseEvent.WIDGET_READY, this._bind('_handleChildWidgetReady'));
    };

    /**
     * @method _getStyleNames
     * This method will asynchronously get all the names that belong to the namespace:
     * - IAT/Widgets/ -- AlarmList or AuditList or AlarmHistory -- /style/{1-8}
     * and store these in configuration under the name variable
     */
    p._getStyleNames = function () {
        
        var self = this;
        function _getStyleNamesCallback(texts) {
            for (var i = 1; i <= 8; i += 1) {
                var tempText = texts['IAT/Widgets/' + self.widget.settings.type + '/style' + i];
                if (tempText === undefined) {
                    tempText = 'style' + i;
                }
                self.config.names.push(tempText);
            }
            self.textSystemReady.resolve();
        }

        _runtimeServices.loadTexts(this.lang, _getStyleNamesCallback); 
    };

    /**
     * @method _getDropDown
     * @private
     * @param {String} name
     * @param {Object[]} dataprovider the dataprovider for the dropdown, has to follow a predefined patter
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger} pos 
     * @param {UInteger|String} selectedBalue this has to be a number, but can be given as a string or number
     * @returns {Object}
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * This Dropdown is meant to be used as a generic dropdownbox for any reason, the dataprovider has to be provided for it to work.
     */
    p._getDropDown = function (name, dataProvider, x, y, w, pos, selectedValue) {
        if (selectedValue === undefined) {
            selectedValue = '0';
        } else if (typeof selectedValue === 'number') {
            selectedValue = selectedValue.toString();
        }

        var selectedIndex;
        for (var j = 0; j < dataProvider.length; j += 1) {
            if (dataProvider[j].value === selectedValue) {
                selectedIndex = j;
                break;
            }
        }

        var dropdown = new DialogWidgetModel();
        dropdown.name = name;
        dropdown.type = 'widgets/brease/DropDownBox';
        dropdown.x = x;
        dropdown.y = y;
        dropdown.width = w;
        dropdown.height = '30px';

        dropdown.options = {
            'dataProvider': dataProvider,
            'selectedValue': selectedValue,
            'selectedIndex': selectedIndex,
            'listPosition': pos,
            'fitHeight2Items': false,
            'cropToParent': true,
            'ellipsis': true
        };

        if (name.includes('state')) {
            dropdown.options.listWidth = 220;
        }
        
        dropdown.result = { method: 'getSelectedValue' };
        return dropdown;
    };

    /**
     * @method _getLabel
     * @private
     * @param {String} name name of the widget
     * @param {String} text text of the widget
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @returns {Object}
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
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
     * @param {String} name name of the widget
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {String} value
     * @returns {Object}
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
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
     * @param {String} name name of the widget
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @param {UInteger} value
     * @returns {Object}
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
     */
    p._getNumericInput = function (name, x, y, w, value) {
        if (value === undefined) {
            value = 0;
        }
        var format = {
                'metric': { 'decimalPlaces': 0, 'minimumIntegerDigits': 1, 'maximumIntegerDigits': 11 },
                'imperial': { 'decimalPlaces': 0, 'minimumIntegerDigits': 1, 'maximumIntegerDigits': 11 },
                'imperial-us': { 'decimalPlaces': 0, 'minimumIntegerDigits': 1, 'maximumIntegerDigits': 11 } },
            uDG = true,
            maxValue = 4294967295,
            lVP = 'noSubmit';

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
     * @param {String} name name of the widget
     * @param {String} img path to the image
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @returns {Object}
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
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
     * @param {String} name
     * @param {UInteger} x x position of the widget
     * @param {UInteger} y y position of the widget
     * @param {UInteger} w width of the widget
     * @returns {Object}
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is described in the name of the method.
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

    /**
     * @method _getCheckExtOptions
     * @private
     * @param {String} name 
     * @param {String} text 
     * @param {UInteger} x 
     * @param {UInteger} y 
     * @param {UInteger} w 
     * @param {UInteger} value 
     * @returns {Object}
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is CheckBox.
     */
    p._getCheckExtOptions = function (name, text, x, y, w, value) {
        var check = new DialogWidgetModel();
        check.name = name;
        check.type = 'widgets/brease/CheckBox';
        check.x = x;
        check.y = y;
        check.width = w;
        check.height = '30px';
        check.options = {
            text: text
        };
        if (value !== undefined) {
            check.options.value = value;
        }
        return check;
    };

    return StyleClass;

    function _setTabIndex() {
        if (!brease.config.isKeyboardOperationEnabled()) {
            return;
        }
        var tabIndex = 2;
        this.config.rows.forEach(function (row) {
            row.widgets.forEach(function (widget) {
                if (widget.id !== '' && !widget.id.includes('label') && !widget.id.includes('rect_separator')) {
                    brease.uiController.setWidgetPropertyIndependentOfState(widget.id, 'tabIndex', tabIndex++);
                }
            }, this);
        }, this);
        this.dialog.elem.dispatchEvent(new CustomEvent(BreaseEvent.TABINDEX_CHANGED, { bubbles: true, detail: { contentId: brease.settings.globalContent } }));
    }
    
    // next task: restore focus to next element and not to first add button
    function _restoreFocusAfterRemove(clickedRow) {
        if (!brease.config.isKeyboardOperationEnabled()) {
            return;
        }
        var focusWidget;
        if (clickedRow === 0) {
            var addButtonWidgetId = this.config.startWidgets[0].id;
            focusWidget = document.getElementById(addButtonWidgetId);
        } else {
            focusWidget = document.getElementById(this.config.rows[clickedRow - 1].widgets[this.config.children.add_next_row].id);
        }
        if (focusWidget) {
            focusWidget.focus();
        }
    }
});
