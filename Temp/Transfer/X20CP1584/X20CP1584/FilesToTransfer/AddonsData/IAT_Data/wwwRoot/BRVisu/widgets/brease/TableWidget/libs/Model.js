define([
    'brease/core/Class',
    'brease/helper/DateFormatter'
], function (
    SuperClass, DateFormatter
) {

    'use strict';

    /** 
     * @class widgets.brease.TableWidget.libs.Model
     * @extends brease.core.Class
     */

    var defaultSettings = {},
    
        ModelClass = SuperClass.extend(function Model(widget) {
            SuperClass.apply(this, arguments);
            this.widget = widget;
            this.settings = widget.settings;
        }, defaultSettings),

        p = ModelClass.prototype;

    /**
     * @method initialize
     * method used to initialize the Model, will be called by the derived class. If no derived class exists the TableWidget class will call this.
     * Sets all values to the basic values.
     */
    p.initialize = function () {
        // Initialize Model
        this.childrenList = this.widget.settings.childrenList;
        this.childrenIdList = this.widget.settings.childrenIdList;
        this.internal = {
            dataPrepended: false
        };
        
        this.columnWidths = this.widget.settings.childrenColumnWidths;
        this.errorMode = false;
        
        this.maxWidth = 0;
        this.columns = [];
        this.data = [];
    };
    
    /**
     * @method start
     * method that starts the process
     */
    p.start = function () {
        this.updateModel();
    };

    /**
     * @method updateModel
     * Updates the model by first asking all child widgets (TableColumnWidgets - and derived types) about the which ones exists, the type these are of,
     * the width of these and then figuring out the total width of this widget. Finally it updates the table with data from either the backend or with
     * mock data, and unselects the selected item.
     */
    p.updateModel = function () {
        this.getColumns();
        this.getColumnWidths();
        this.getMaxWidth();

        if (brease.config.editMode) {
            this.setMockData();
        } else {
            this.updateTable();
        }
        this.widget.controller.setSelectedItem(undefined);
    };

    /**
     * @method 
     * This method will get the row from the un changed/original dataset,
     * Useful for the events getting the right clicked element.
     * @param {UInteger} row the number of the row to return
     * @returns {Object[]}
     */
    p.getRowFromCurrentData = function (row) {
        return this.currentData[row];
    };

    /**
     * @method 
     * This method will return the unprepared raw data stored in then model
     * @returns {Object[]}
     */
    p.getCurrentData = function () {
        return this.currentData;
    };
    
    /**
     * @method getPreparedData
     * returns the data that has been prepared to be displayed by the DataTable
     * @returns {Object[]}
     */
    p.getPreparedData = function () {
        return this.data;
    };

    /**
     * @method getPreparedDataToPrepend
     * returns the data that has been prepared to be displayed by the DataTable
     * @returns {Object[]}
     */
    p.getPreparedDataToPrepend = function () {
        return this.prependData;
    };

    /**
     * @method setSearch
     * @param {String} searchCriteria the search criteria that is entered in the search bar
     * This method passes the search criteria on to the renderer so that the datatables can be updated with this specific filter value
     */
    p.setSearch = function (searchCriteria) {
        this.widget.renderer.setSearch(searchCriteria);
    };

    /**
     * @method getColumns
     * This method iterates over all items (TableColumnWidgets - or derived widgets) and retrieves the type the widget is of.
     * The type is specific for the derived type so the AlarmList has it's own set, the AlarmHistory another, the AuditList a
     * third, and so on. Now the column must start with a column which is the index column as it will be used to sort the lists
     * but will be hidden from the user. So in case a user doesnt add an index or a timestamp we can still sort the list in a 
     * correct way. This must be implemented in the individual lists as it differs from list to list. see respective lists
     * config.js file. This is necessary for the scrolling optimization of the TableWidgets where we cannot prepend data, only
     * append data which then has to be sorted.
     */
    p.getColumns = function () {
        // var cols = (this.widget.settings.optimize) ? $.extend(true, [], this.settings.config.hidden) : [];
        var cols = [];
        for (var i = 0; i < this.settings.childrenIdList.length; i += 1) {
            cols.push(brease.callWidget(this.settings.childrenIdList[i], 'getShortColumnType')); //Special function
        }
        cols.push($.extend(true, {}, this.settings.config.hidden));

        this.settings.config.columns = cols;
    };

    /**
     * @method getColumnWidths
     * This method iterates over all items (TableColumnWidgets - or derived widgets) and retrieves the width the widget is of.
     * With this information the total width of the TableWidget can be calculated and also the individual columns stored for the
     * DataTables to display.
     */
    p.getColumnWidths = function () {
        var colWidths = [];
        for (var i = 0; i < this.settings.childrenIdList.length; i += 1) {
            colWidths.push(brease.callWidget(this.settings.childrenIdList[i], 'getWidth'));    
        }
        this.columnWidths = colWidths;
    };

    /**
     * @method updateTable
     * This method is only used internally if the TableWidget is used by itself. If a dervied type is used, then this widget should override this method
     */
    p.updateTable = function () {
        var colInfoObj = {};
        for (var i = 0; i < this.settings.childrenIdList.length; i += 1) {
            colInfoObj[this.settings.config.columns[i].data] = 'This is col ' + i + '!';
        }

        this.data = [];
        if (!brease.config.editMode) {
            for (var n = 0; n < 12; n += 1) { 
                this.data.push(colInfoObj);
            }
        } else {
            // TODO
            for (var x = 0; x < 5; x += 1) { 
                this.data.push(colInfoObj);
            }
        }
    };

    /**
     * @method _fixTimestamp
     * @private
     * @param {Date} tim timestamp in the format of ISO8601 (2019-02-28T07:51:33Z) see: https://en.wikipedia.org/wiki/ISO_8601
     * This method will fix the timestamp. It will look at the selected format and update the timestamp that is passed here.
     */
    p._fixTimestamp = function (tim) {
        if (!tim) {
            return {
                display: '',
                value: 0
            }; 
        }
        var retVal,
            d = new Date(tim.substring(0, 23));
        DateFormatter.format(d, this.widget.settings.format, function (result) {
            retVal = result;
        });
        return {
            display: retVal,
            value: d.getTime()
        };
    };

    /**
     * @method getMaxWidth
     * This method iterates over all items (TableColumnWidgets - or derived widgets) and calculates the max width of the TableWidget.
     */
    p.getMaxWidth = function () {
        var maxWidth = 0;

        for (var i = 0; i < this.settings.childrenIdList.length; i += 1) {
            maxWidth += this.columnWidths[i];
        }
        this.maxWidth = maxWidth;
    };

    p.dataPrepended = function () {
        return this.internal.dataPrepended;
    };
    p.getPrependedData = function () {
        return this.telegram;
    };

    /**
     * @method suspend
     * method that adds the possibility to dipose of information. Can be overridden in the derived widgets if necessary.
     */
    p.suspend = function () {
        // Do something
    };

    /**
     * @method dispose
     * method that adds the possibility to dipose of information. Can be overridden in the derived widgets if necessary.
     */
    p.dispose = function () {
        // Do something
    };

    return ModelClass;
});
