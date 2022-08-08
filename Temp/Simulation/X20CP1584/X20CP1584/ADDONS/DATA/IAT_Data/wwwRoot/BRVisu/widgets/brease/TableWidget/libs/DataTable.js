define([
    'widgets/brease/common/libs/external/jquery.dataTables',
    'widgets/brease/common/libs/external/dataTables.select',
    'widgets/brease/common/libs/external/dataTables.scroller'
], function () {
    'use strict';

    /**
     * @class widgets.brease.TableWidget.libs.DataTable
     * @extends core.javascript.Object
     * Class for controlling the DataTable object. This class is used as an interface for the renderer so that the
     * can inject a datatable used in testing.
     */

    function DT() {
    }

    var p = DT.prototype;

    /**
     * @method exists
     * checks whether the datatable does exist or not, mostly for semantics in the code for external use
     * @returns {Boolean}
     */
    p.exists = function () {
        return !!this.datatable;
    };

    /**
     * @method _noExist
     * @private
     * checks whether the datatable does exist or not. Returns inverted value
     * @returns {Boolean}
     */
    p._noExist = function () {
        return (!this.datatable);
    };

    /**
     * @method addTableNode
     * @param {Object} el jquery element of the widget so the table can be appended to the widget
     * This method takes the jquery element of the widget, creates a Table node (jQuery) and appends it to the table.
     */
    p.addTableNode = function (el) {
        this.$table = $('<table cellspacing="0"></table>');
        el.prepend(this.$table);
        return this.$table;
    };

    /**
     * @method initializeDataTable
     * This method will fetch the options for the datatables, create the datatables, and finally add the rows/data to the table so it can be populated.
     * @param {Object} options the options necessary for instantiating the table
     */
    p.initializeDataTable = function (options) {
        //set dataTables to use console.warn for errors
        //attention: all widgets, which use dataTables, share this setting; so it makes no sense to use different settings
        $.fn.dataTable.ext.sErrMode = console.warn;
        this.datatable = this.$table.DataTable(options);
    };

    /**
     * @method info
     * @returns {Object}
     * This method will get the info object of the currently displayed page. See: https://datatables.net/reference/api/page.info()
     */
    p.info = function () {
        if (this._noExist()) {
            return {
                page: 0,
                pages: 0,
                length: 0,
                start: 0,
                end: 0
            };
        }
        return this.datatable.page.info();
    };

    /**
     * @method addRows
     * This method grabs the data from the model class and populates the datatable with this.
     * See: https://datatables.net/reference/api/rows.add()
     * @param {Object[]} rows an array of objects containing all the rows that are to be displayed
     */
    p.addRows = function (rows) {
        if (this._noExist() || !rows) { return; }
        this.datatable.rows.add(rows);
    };

    /**
     * @method order
     * This method will order the data in the given column in the given direction. Example of passed data
     * [0, 'asc'] will sort the 0th column in an ascending way.
     * See: https://editor.datatables.net/reference/api/order()
     * @param {Object[]} order an array containing first the column to be sorted and then asc or desc order type
     */
    p.order = function (order) {
        if (this._noExist()) { return; }
        this.datatable.order(order);
    };

    /**
     * @method search
     * @param {String} searchCriteria
     * This method will set the search criteria in the search box and then update the datatables with the search criteria (it works
     * as a wild card search over all columns and rows) and differs from how the filter works and then redraws the table.
     * See: https://datatables.net/reference/api/search
     */
    p.search = function (searchCriteria) {
        if (this._noExist()) { return; }
        this.datatable.search(searchCriteria);
    };

    /**
     * @method resetFilter
     * @deprecated
     * Not used anymore I think...
     */
    p.resetFilter = function (active) {
        if (this._noExist()) { return; }
        this.datatable.column([0]).search('');
        this.datatable.column([1]).search('');
        if (active) {
            this.datatable.column([3]).search('');
        }
    };

    /**
     * @method goToPage
     * This method set's the page the datatables should go to
     * @param {UInteger} goToPage
     */
    p.goToPage = function (goToPage) {
        if (this._noExist()) { return; }
        this.datatable.page(goToPage);
    };
    
    /**
     * @method show
     * This method set's the page the datatables should go to
     * @param {UInteger} id
     */
    p.show = function (id) {
        this.datatable.row().show(id);
    };

    /**
     * @method find
     * @param {Object} id
     * @returns {Boolean}
     * This method takes an id and checks in the datatbles if this id is present in the currently displayed dataset. If it is, it returns true else false.
     */
    p.find = function (id) {
        if (this._noExist()) { return; }
        var c = this, check = false, key = Object.keys(id);
        this.datatable.rows({ filter: 'applied' })[0].forEach(function (w) { 
            if (c.datatable.data()[w][key] === id[key]) { 
                check = true; 
            }
        });
        return check;
    };

    /**
     * @method draw
     * If the repos is set to true the datatables will be drawn with the first page selected, if the 
     * repos is false, the datatables will be redrawn and the cursor will stay
     * on the same page as before. If there is no data at that page, the page will be blank. See example 2:
     * https://datatables.net/reference/api/draw()#Examples
     * @param {Boolean} repos repositions the datatable's or not
     */
    p.draw = function (repos) {
        if (this._noExist()) { return; }
        this.datatable.draw(repos);
    };

    /**
     * @method deselect
     * @param {Object} row
     */
    p.deselect = function (row) {
        this.datatable.rows(row).deselect();
    };

    /**
     * @method select
     */
    p.select = function (selected) {
        this.datatable.row(selected, { page: 'current' }).select();
    };

    /**
     * @method index
     */
    p.index = function (selected) {
        return this.datatable.row(selected, { page: 'current' }).index();
    };

    /**
     * @method getCurrentRow
     * @returns {UInteger}
     */
    p.getCurrentRow = function () {
        return this.datatable.rows({ selected: true }).data()[0];
    };

    /**
     * @method getRowIndex
     * @returns {UInteger}
     */
    p.getRowIndex = function () {
        return this.datatable.row({ selected: true }).index();
    };

    /**
     * @method getRowIndices
     * @returns {UInteger}
     */
    p.getRowIndices = function () {
        return this.datatable.rows({ selected: true })[0];
    };

    /**
     * @method getFilteredPage
     * This method will return the page which is currently displayed
     * Used in the colorMeBlue functionality in the Renderer Classes
     * @returns {UInteger}
     */
    p.getFilteredPage = function () {
        return this.datatable.rows({ filter: 'applied' }).page();
    };

    /**
     * @method getFilteredOffset
     * This method will return the row which is present on the offset passed to the function
     * Used in the colorMeBlue functionality in the Renderer Classes
     * @param {UInteger} offset
     * @returns {UInteger}
     */
    p.getFilteredOffset = function (offset) {
        return this.datatable.rows({ filter: 'applied' })[0][offset];
    };

    /**
     * @method clear
     * this method clears the datatables from any data present currently present in the datatable
     */
    p.clear = function () {
        if (this._noExist()) { return; }
        this.datatable.clear();
    };

    /**
     * @method addRowSelectionFromPlugin
     * This method will add a plugin to the datatables that makes it possible to select a row from the action/event system and display this.
     * If the selected row is not on the same page, the method will first find this row and then select it.
     * See: https://datatables.net/examples/plug-ins/api.html
     */
    p.addRowSelectionFromPlugin = function () {
        $.fn.dataTable.Api.register('row().show()', function (id) {
            this.table().rows({ page: 'current' }).deselect();

            var pageInfo = this.table().page.info(),
                dataset = this.table().rows({ filter: 'applied' }).data();
            
            var rowDataIsPresentOn = 0, 
                key = Object.getOwnPropertyNames(id);
            for (var i = 0; i < dataset.length; i += 1) {
                if (dataset[i][key] === id[key]) {
                    rowDataIsPresentOn = i;
                    break;
                }
            }

            var pageDataIsOn = Math.floor(rowDataIsPresentOn / pageInfo.length);

            if (pageInfo.length !== -1 && pageDataIsOn !== this.index()) {
                // Go to that page
                this.table().page(pageDataIsOn).draw(false);
                rowDataIsPresentOn = rowDataIsPresentOn % pageInfo.length;
            }
            // Select row in question
            this.table().row(':eq(' + rowDataIsPresentOn + ')', { page: 'current' }).select();
            // Return row object
            return this;
        });
    };

    /**
     * @method destroy
     * This method will destroy the datatable, remove the jquery object (tableEl) and then it reinstantitates it all again.
     */
    p.destroy = function () {
        if (this.datatable !== undefined) {
            this.datatable.destroy(true);
        }
        if (this.$table !== undefined) {
            this.$table.remove();
        }
    };
    
    return DT;
});
