define([
    'widgets/brease/TableWidget/libs/FilterSettings',
    'widgets/brease/GenericDialog/libs/models/dialogWidgetModel'
], function (SuperClass, DialogWidgetModel) {
    'use strict';
    /** 
     * @class widgets.brease.AlarmList.libs.FilterSettings
     * Class for rendering the widgets necessary inside the filter configuration dialogue. Also collects the results when the
     * window is closed and passes it on to the calling class.
     */

    // eslint-disable-next-line no-unused-vars
    var FilterClass = SuperClass.extend(function FilterSettings(dialog, widget, lang, cat, texts) {
            this.texts = texts;
            SuperClass.apply(this, arguments);
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
            check_ext_options: 3,
            label_ext_options: 4,
            ext_options_state: 5,
            add_next_row: 6,
            logic_op_next_row: 7,
            rect_separator: 8,
            comp_value: 9,
            
            left: {
                delete_this_row: 50,
                column_picker: 100,
                operator: 270,
                check_ext_options: 270,
                label_ext_options: 300,
                ext_options_state: 485,
                add_next_row: 10,
                logic_op_next_row: 5,
                rect_separator: 70,
                comp_value: 375
            }
        };

        this.config.loc = {
            offset: 0,
            widgetHeight: 30,
            widgetOffset: 10,
            logicalOperatorHeight: 20,
            currSeparatorTopOffset: 135,
            filterlogicalTopOffset: 125
        };
        this.config.loc.rowHeight = 2 * this.config.loc.widgetHeight + 3 * this.config.loc.widgetOffset;

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
     * This method calculates the distance from the top for a line separator between two rows for a given row
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrSeparatorTop = function (row) {
        return this.config.loc.currSeparatorTopOffset + (row * 2 * (this.config.loc.widgetHeight + this.config.loc.widgetOffset + 5)) + this.config.loc.offset;
    };

    /**
     * @method _getCurrFilterLogicalTop
     * @private
     * This method calculates the distance from the top for a logical operator (and/or) between two rows for a given row
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrFilterLogicalTop = function (row) {
        return this.config.loc.filterlogicalTopOffset + ((row - 1) * 3 * this.config.loc.widgetHeight) + this.config.loc.offset;
    };

    /**
     * @method _getCurrTop
     * @private
     * This method calculates the distance from the top for the widgets that are part of the row (except the line and the logical operator) for a given row
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrTop = function (row) {
        return 60 + (row * 2 * this.config.loc.widgetHeight) + (row * 3 * this.config.loc.widgetOffset) + this.config.loc.offset;
    };

    /**
     * @method _getOneRowOffset
     * @private
     * This method will calculate the height to the next row given the current row
     * @param {UInteger} currTop
     * @returns {UInteger}
     */
    p._getOneRowOffset = function (currTop) {
        return currTop + (2 * this.config.loc.widgetHeight) + (3 * this.config.loc.widgetOffset);
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
    p._widgetCollectStateBeforeClosing = function () {
        var listJsonObj = [];
        
        for (var i = 0; i < this.currRow; i += 1) {
            var jsonObj = {
                logical: '',
                logVal: 2,
                data: '',
                op: '',
                opVal: 0,
                comp: '',
                ext: 0,
                extCompVal: 0
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
            if (this.config.rows[i].widgets.length === 9) {
                firstRow = 1;
            }

            if (jsonObj.data === 'sta' || jsonObj.data === 'cat') {
                jsonObj.comp = brease.callWidget(this.config.rows[i].widgets[this.config.children.comp_value - firstRow].id, 'getSelectedValue');
            } else {
                jsonObj.comp = brease.callWidget(this.config.rows[i].widgets[this.config.children.comp_value - firstRow].id, 'getValue');
            }
            jsonObj.ext = brease.callWidget(this.config.rows[i].widgets[this.config.children.check_ext_options].id, 'getValue');

            if (jsonObj.ext) {
                jsonObj.extCompVal = this._getSelectedItemFromDataProvider(this.config.rows[i].widgets[this.config.children.ext_options_state].id).value;
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
     * @method _createRow
     * @private
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
     * @param {UInteger} i
     * @returns {Object}
     */
    p._createRow = function (i) {

        var superRow = SuperClass.prototype._createRow.apply(this, arguments);

        var currTop = this._getCurrTop(i),
            currSubTop = 40 + currTop,
            row = [],
            height = 30,
            randomNumber = superRow[0].name.slice(14);

        var obj = {};
        if (this.widget.settings.config.filter.length > 0 && this.widget.settings.config.filter[i] !== undefined) {
            obj = this.widget.settings.config.filter[i];
        }

        //Sub filter row, for active rows
        row.push(_getCheckExtOptions(this, 'Check_Ext_Options_' + randomNumber, this.config.children.left.check_ext_options, currSubTop, 30, obj.ext));
        row.push(this._getLabel('Label_Ext_Options_State_' + randomNumber, this.texts.state, this.config.children.left.label_ext_options, currSubTop, 180));
        row.push(this._getDropDown('Dropdown_Ext_Options_State_' + randomNumber, [{ 'value': 0, 'text': this.texts.act },
            { 'value': 1, 'text': this.texts.inact }], this.config.children.left.ext_options_state, currSubTop, 110, height, obj.extCompVal, 'left'));
        superRow.splice.apply(superRow, [this.config.children.check_ext_options, 0].concat(row));
        return superRow;
    };

    /**
     * @method _getCheckExtOptions
     * @private
     * This method creates a configuration needed by the GenericDialog to instantiate a widget. Uses the base from the DialogWidgetModel from the Generic Dialog.
     * Type of widget is CheckBox.
     * @param {Object} self 
     * @param {String} name 
     * @param {UInteger} x 
     * @param {UInteger} y 
     * @param {UInteger} w 
     * @param {UInteger} value 
     * @returns {Object}
     */
    // eslint-disable-next-line no-unused-vars
    function _getCheckExtOptions(self, name, x, y, w, value) {
        
        var check = new DialogWidgetModel();
        check.name = name;
        check.type = 'widgets/brease/CheckBox';
        check.x = x;
        check.y = y;
        check.width = w;
        check.height = '30px';
        if (value !== undefined) {
            check.options.value = value;
        }
        return check;
    }

    return FilterClass;
});
