define([
    'widgets/brease/TableWidget/libs/StylingSettings',
    'brease/core/Utils'
], function (SuperClass, Utils) {
    'use strict';

    /** 
     * @class widgets.brease.AlarmList.libs.StylingSettings
     * Class for rendering the widgets necessary inside the styling configuration dialogue. Also collects the results when the
     * window is closed and passes it on to the calling class.
     */

    var StyleClass = SuperClass.extend(function FilterSettings(dialog, widget, lang, texts) {
            this.texts = texts;
            SuperClass.apply(this, arguments);
        }, null),

        p = StyleClass.prototype;

    /**
     * @method initialize
     * This method will instantiate an empty dialog, and if there has been a sorting configuration stored it will with this information
     * initialize any stored information in the dialog.
     * @returns {Object}
     */
    p.initialize = function () {
        this.config = {};
        this.config.rows = [];
        this.textSystemReady = new $.Deferred();
        this.setUpConfiguration();
        this._getStyleNames();
        this._initializeEmptyDialogConfig();

        if (this.widget.settings.config.style.length > 0) {
            var self = this;
            $.when(this.textSystemReady.promise()).then(function successHandler() {
                self._initializeStoredDialogConfig();
            });
        }
        return this.config;
    };

    /**
     * @method setUpConfiguration
     * This method will create the necessary configuration object for the dialog to instantiate, it will set the values for where
     * each individual widget type should be placed in the row direction. It will also store the necessary informtaion about the
     * height an individual row will take so that an offset from the top can be calculated. 
     */
    p.setUpConfiguration = function () {
        this.config.names = [];
        
        this.config.children = {
            delete_this_row: 0,
            label_style: 1,
            input_style: 2,
            label_state: 3,
            dd_state: 4,
            check_cond_first: 5,
            dd_cond_first: 6,
            input_cond_first: 7,
            check_cond_sec: 8,
            dd_cond_sec_cond: 9,
            dd_cond_sec: 10,
            input_cond_sec: 11,
            rect_separator: 12,
            add_next_row: 13,

            left: {
                delete_this_row: 50,
                label_style: 75,
                input_style: 185,
                label_state: 330,
                dd_state: 450,
                check_cond_first: 30,
                dd_cond_first: 230,
                input_cond_first: 286,
                check_cond_sec: 365,
                dd_cond_sec_cond: 398,
                dd_cond_sec: 468,
                input_cond_sec: 528,
                rect_separator: 0,
                add_next_row: 10
            }
        };
        this.config.loc = {
            offset: 0,
            widgetHeight: 30,
            widgetOffset: 10,
            logicalOperatorHeight: 20,
            currSeparatorTopOffset: 110,
            filterlogicalTopOffset: 125

        };
        this.config.loc.rowHeight = 2 * this.config.loc.widgetHeight + 3 * this.config.loc.widgetOffset;
    };

    /**
     * @method _getCurrSeparatorTop
     * This method calculates the distance from the top for a line separator between two rows for a given row
     * @private
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrSeparatorTop = function (row) {
        return this.config.loc.currSeparatorTopOffset + (row * this.config.loc.rowHeight) + this.config.loc.offset;
    };

    /**
     * @method _getCurrFilterLogicalTop
     * This method calculates the distance from the top for a logical operator (and/or) between two rows for a given row
     * @private
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrFilterLogicalTop = function (row) {
        return this.config.loc.filterlogicalTopOffset + ((row - 1) * 3 * this.config.loc.widgetHeight) + this.config.loc.offset;
    };

    /**
     * @method _getCurrTop
     * This method calculates the distance from the top for the widgets that are part of the row (except the line and the logical operator) for a given row
     * @private
     * @param {UInteger} row
     * @returns {UInteger}
     */
    p._getCurrTop = function (row) {
        return 30 + (row * 2 * this.config.loc.widgetHeight) + (row * 3 * this.config.loc.widgetOffset) + this.config.loc.offset;
    };

    /**
     * @method _getOneRowOffset
     * This method will calculate the height to the next row given the current row
     * @private
     * @param {UInteger} currTop
     * @returns {UInteger}
     */
    p._getOneRowOffset = function (currTop) {
        return currTop + (2 * this.config.loc.widgetHeight) + (3 * this.config.loc.widgetOffset);
    };

    /**
     * @method _createRow
     * This method will create a row. No matter what it says in the other methods, they all call this one. This method will calculate the height from the top
     * of the dialog to the current row, the logical operator (inbetween rows), and the line separator (inbetween rows). It will then create a unique number
     * for to identify all widgets in this row. After that it will look at the configuration to see if there is data already stored and in this case add
     * these to the configuration for this row.
     * 
     * Next it will create the delete button first. The add button belongs to the previous row, just as this row will add it's add button to the next row.
     * Then it will create a label, and a dropdown where a user can select which style choose from. AFter that it will add another label and then finally
     * a second dropdown where the user can select which status this style should be applied to. Then there is a second row; here there's a checkbox
     * that will allow the user to add additional conditional operators to exactly select alarms. There is first a dropdown to select an operator,
     * then a numeric input to select a comparative value (x > 1). Then there is another checkbox in case the user wants a bound comparison (1 < x < 10) which 
     * is followed by a dropdown to select an operator and a numeric input for the comparative value.
     * 
     * If this is very hard to grasp, which I might understand if it is, I'd recommend that you open up a dialog in the runtime and a have a look at what
     * it looks like and how it works. This is going to clear things up a lot.
     * @private
     * @param {UInteger} clickedRow
     * @returns {Object}
     */
    p._createRow = function (clickedRow) {
        var currSeparatorTop = this._getCurrSeparatorTop(clickedRow),
            currTop = this._getCurrTop(clickedRow),
            currSubTop = 40 + currTop,
            row = [],
            randomNumber = Utils.uniqueID();

        //Main row 
        row.push(this._getImage('style_button_delete_' + randomNumber, 'widgets/brease/TableWidget/assets/Delete.svg', this.config.children.left.delete_this_row, currTop));

        row.push(this._getLabel('style_label_' + randomNumber, this.texts.style, this.config.children.left.label_style, currTop, 150));
        var styles = [
            { value: '1', text: this.config.names[0] },
            { value: '2', text: this.config.names[1] },
            { value: '3', text: this.config.names[2] },
            { value: '4', text: this.config.names[3] },
            { value: '5', text: this.config.names[4] },
            { value: '6', text: this.config.names[5] },
            { value: '7', text: this.config.names[6] },
            { value: '8', text: this.config.names[7] }];

        var obj = {};
        if (this.widget.settings.config.style.length > 0 && this.widget.settings.config.style[clickedRow] !== undefined) {
            obj = this.widget.settings.config.style[clickedRow];
        } else {
            obj.sevOnePos = 4;
            obj.sevTwoPos = 2;
        }
        
        row.push(this._getDropDown('style_input_' + randomNumber, styles, this.config.children.left.input_style, currTop, 140, 'right', obj.namePos));
        row.push(this._getLabel('style_label_state_' + randomNumber, this.texts.state, this.config.children.left.label_state, currTop, 150));
        var active = [
            { value: '1', text: this.texts.act },
            { value: '2', text: this.texts.actack }, 
            { value: '3', text: this.texts.inact },
            { value: '5', text: this.texts.any }
        ];
        row.push(this._getDropDown('style_dropdown_state_' + randomNumber, active, this.config.children.left.dd_state, currTop, 150, 'left', obj.statePos));

        //Second Row
        row.push(this._getCheckExtOptions('style_check_cond_first_' + randomNumber, this.texts.sev, this.config.children.left.check_cond_first, currSubTop, 200, obj.sevOneUse));
        var choices = [
            { value: '0', text: '<>' }, 
            { value: '1', text: '==' }, 
            { value: '2', text: '<' }, 
            { value: '3', text: '<=' }, 
            { value: '4', text: '>' }, 
            { value: '5', text: '>=' }
        ];
        row.push(this._getDropDown('style_dd_cond_first_' + randomNumber, choices, this.config.children.left.dd_cond_first, currSubTop, 50, 'right', obj.sevOnePos));
        row.push(this._getNumericInput('style_input_cond_first_' + randomNumber, this.config.children.left.input_cond_first, currSubTop, 70, obj.sevOne));
        row.push(this._getCheckExtOptions('style_check_cond_sec_' + randomNumber, '', this.config.children.left.check_cond_sec, currSubTop, 30, obj.sevTwoUse));
        row.push(this._getDropDown('style_dd_cond_sec_cond' + randomNumber, [{ value: '0', text: this.texts.and }, { value: '1', text: this.texts.or }],
            this.config.children.left.dd_cond_sec_cond, currSubTop, 60, 'left', obj.sevTwoOp));
        row.push(this._getDropDown('style_dd_cond_sec' + randomNumber, choices, this.config.children.left.dd_cond_sec, currSubTop, 50, 'left', obj.sevTwoPos));
        row.push(this._getNumericInput('style_input_cond_sec' + randomNumber, this.config.children.left.input_cond_sec, currSubTop, 70, obj.sevTwo));

        row.push(this._getRect('style_rect_separator_' + randomNumber, this.config.children.left.rect_separator, currSeparatorTop, 600));

        //Move the new add button to the next row
        var oneRowOffset = this._getOneRowOffset(currTop);
        row.push(this._getImage('style_button_add_' + randomNumber, 'widgets/brease/TableWidget/assets/Add.svg', this.config.children.left.add_next_row, oneRowOffset));

        return row;
    };

    /**
     * @method _widgetCollectStateBeforeClosing
     * @private
     * This method will collect all the values from the different dropdownboxes, and numeric inputs and store these in a json
     * object that later will be used for the styling mechanism.
     * @returns {Object[]}
     */
    p._widgetCollectStateBeforeClosing = function () {
        var listJsonObj = [];
        
        for (var i = 0; i < this.currRow; i += 1) {
            var jsonObj = {
                name: '',
                namePos: '',
                state: '',
                statePos: 0,
                sevOneUse: false,
                sevOne: 0,
                sevOnePos: 2,
                sevTwoUse: false,
                sevTwo: 0,
                sevTwoPos: 4

            };
            var tO = this._getSelectedItemFromDataProvider(this.config.rows[i].widgets[this.config.children.input_style].id);
            jsonObj.name = tO.text;
            jsonObj.namePos = parseInt(tO.value);
            
            tO = this._getSelectedItemFromDataProvider(this.config.rows[i].widgets[this.config.children.dd_state].id);
            jsonObj.state = tO.text;
            jsonObj.statePos = parseInt(tO.value);

            jsonObj.sevOneUse = brease.callWidget(this.config.rows[i].widgets[this.config.children.check_cond_first].id, 'getValue');
            
            if (jsonObj.sevOneUse) {
                jsonObj.sevOne = parseInt(brease.callWidget(this.config.rows[i].widgets[this.config.children.input_cond_first].id, 'getValue'));
                jsonObj.sevOnePos = parseInt(brease.callWidget(this.config.rows[i].widgets[this.config.children.dd_cond_first].id, 'getSelectedValue'));
            }

            jsonObj.sevTwoUse = brease.callWidget(this.config.rows[i].widgets[this.config.children.check_cond_sec].id, 'getValue');
            
            if (jsonObj.sevTwoUse) {
                jsonObj.sevTwo = parseInt(brease.callWidget(this.config.rows[i].widgets[this.config.children.input_cond_sec].id, 'getValue'));
                jsonObj.sevTwoOp = parseInt(brease.callWidget(this.config.rows[i].widgets[this.config.children.dd_cond_sec_cond].id, 'getSelectedValue'));
                jsonObj.sevTwoPos = parseInt(brease.callWidget(this.config.rows[i].widgets[this.config.children.dd_cond_sec].id, 'getSelectedValue'));
            }

            listJsonObj.push(jsonObj);  
        }
        //Here we need to store the filter in localStorage/cookie
        if (this.config === undefined) {
            return this.widget.settings.config.style;
        }
        return listJsonObj;

    };

    return StyleClass;

});
