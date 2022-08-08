define([
    'brease/core/Class',
    'brease/helper/Scroller',
    'brease/core/Utils',
    'brease/events/BreaseEvent',
    'widgets/brease/TableWidget/libs/DataTable',
    'widgets/brease/common/libs/NativeScroller'

], function (
    SuperClass, Scroller, Utils, BreaseEvent, DT, NativeScroller
) {

    'use strict';

    /**
    * @class widgets.brease.TableWidget.libs.Renderer
    * @extends brease.core.Class
    * Renderer (View) of TableWidget
    */
    /**
    * @method constructor
    * @param {Object} [widget] reference to widget creating the instance
    */
    var RendererClass = SuperClass.extend(function Renderer(widget) {
            SuperClass.call(this);
            this.widget = widget;
            this.dt = new DT();

            this.internal = {
                searchInProgress: false,
                filterSet: false,
                filterPos: -1,
                scrollerOptions: {
                    header: {
                        mouseWheel: true,
                        scrollY: false,
                        scrollX: true,
                        scrollbars: false,
                        probeType: 3
                    },
                    body: {
                        mouseWheel: true,
                        scrollY: true,
                        scrollX: true,
                        probeType: 3
                    }
                }
            };

        }, null),

        p = RendererClass.prototype;

    /**
     * @method initialize
     * Method to set up all values and functions needed to run Renderer Class. However it will not set up the DataTables. For this
     * the method start has to be called.
     */
    p.initialize = function () {
        if (this.widget.settings.omitClass !== true) {
            this.widget.el.addClass('breaseTableWidget');
            this.widget.el.addClass('container');
        }

        if (!brease.config.editMode) {
            this._addRowSelectionFromPlugin();
        }

        this.widget.settings.itemsPerPage = (this.widget.settings.itemsPerPage <= 0) ? 1 : this.widget.settings.itemsPerPage;

        this.searchBoxId = Utils.uniqueID(this.widget.elem.id + '_searchbox');
        this.searchBoxWidth = '30%';
        this.searchBoxPadding = 3;
        this.topBarWrapperHeight = 30 + 2 * this.searchBoxPadding;
        this.tableWrapperHeight = 0;
        this.pagingWrapperHeight = 34;
        this.heightToReduce = 0;

        this.initialized = false;

        //Throttle the redraw function so delete function is not called too often
        this.throttledRedraw = _.throttle(this._redraw, 300, {
            'leading': false,
            'trailing': true
        });

        this.tableEl = this.dt.addTableNode(this.widget.el);
        this.setFilter();
    };

    /**
     * @method start
     * Wrapper method to initialize the table.
     */
    p.start = function () {
        this._initializeDataTable();
    };

    /**
     * @method rebuildView 
     * Rebuild the complete view of the table. It will first destroy the old table, remove scrollers, searchbox. Add the busy indicator
     * and finally it will update the model (retrieve new data) and then it will initialize the data table a new.
     */
    p.rebuildView = function () {
        this.initialized = false;
        this._destroy();
        this._removeScroller();
        this._removeSearchBox();
        this.widget._showBusyIndicator();
        this.widget.model.updateModel();
        this._initializeDataTable();
    };

    /**
     * @method redraw 
     * CALL THIS METHOD!
     * Redraws the table with new configuration/data etc.
     */
    p.redraw = function () {
        this.throttledRedraw();
    };

    /**
     * @method _redraw
     * @private
     * DO NOT CALL THIS METHOD EVER!
     * This is the pseudo-private method of the redraw function and is controlled by the lodash method throttle. This way lodash will call this method
     * every 300ms irregardless of how often the redraw function is called. This is to reduce the number of redraws/reflows that takes place.
     * See: https://lodash.com/docs/4.17.11#throttle
     */
    p._redraw = function () {
        this._destroy();
        this._removeScroller();
        this._removeSearchBox();
        this.widget._showBusyIndicator();
        this._initializeDataTable();
    };

    /**
     * @method _removeSearchBox
     * @private
     * This method calls the dispose method of the searchBox and then the _nullifySearchBox to remove the searchbox from memory.
     */
    p._removeSearchBox = function () {
        if (this.searchBox) {
            this.searchBox.dispose();
            this._nullifySearchBox();
        }
    };

    /**
     * @method _nullifySearchBox
     * @private
     * This method set's the prototype parameter of the searchBox to null.
     */
    p._nullifySearchBox = function () {
        this.searchBox = null;
    };

    /**
     * @method refreshScroller 
     * @private
     * Update scroller view
     */
    p.refreshScroller = function () {
        this._refreshScroller();
    };

    /**
     * @method setColumnWidth 
     * set the width of a column
     * @param {UInteger} index index of column
     * @param {UInteger} width width to be set
     */
    p.setColumnWidth = function (index, width) {
        this._setColumnWidth(this.tableEl, index, width);
    };

    /**
     * @method setTableWidth 
     * set the width of the table node
     * @param {UInteger} width width to be set
     */
    p.setTableWidth = function (width) {
        this._setTableWidth(this.tableEl, width);
    };

    p.deselect = function (row) {
        this.dt.deselect(row);
    };
    p.select = function (s) {
        this.dt.select(s);
    };
    p.index = function (s) {
        return this.dt.index(s);
    };
    p.getCurrentRow = function () {
        return this.dt.getCurrentRow();
    };
    p.getRowIndex = function () {
        return this.dt.getRowIndex();
    };
    p.getRowIndices = function () {
        return this.dt.getRowIndices();
    };

    /**
     * @method setSearchBox
     * @param {Boolean} value
     * This method sets teh topBarWrapperHeight to 30px (and adds some padding) if the value is true. Then it updates the layout of the TableWidget.
     */
    p.setSearchBox = function (value) {
        if (value === true) {
            this.topBarWrapperHeight = 30 + 2 * this.searchBoxPadding;
        }
        this.updateLayout();
    };

    /**
     * @method setPaging
     * @param {Boolean} value
     * This method sets the pagingWrapperHeight to 30px and then rebuilds the table, if the value is true. This will force the paging to be displayed in the table.
     */
    p.setPaging = function (value) {
        if (value === true) {
            this.pagingWrapperHeight = 30;
        }
        this.rebuildView();
    };

    /**
     * @method setItemsPerPage
     * This method will call the rebuildView as it gathers all necessary data about the items for us.
     */
    p.setItemsPerPage = function () {
        this.rebuildView();
    };

    /**
     * @method setHeaderHeight
     * If the table have a header this method will updated the layout
     */
    p.setHeaderHeight = function () {
        if (this.tw_header_el) {
            this.updateLayout();
        }
    };

    /**
     * @method addRows
     * This method grabs the data from the model class and populates the datatable with this.
     * @param {Object[]} data
     */
    p.addRows = function (data) {
        if (!data) {
            data = this.widget.model.getPreparedData();
        }
        this.dt.addRows(data);
        this.draw();
    };

    /**
     * @method setSearch
     * @param {String} searchCriteria
     * This method will set the search criteria in the search box and then update the datatables with the search criteria (it works
     * as a wild card search over all columns and rows) and differs from how the filter works and then redraws the table.
     */
    p.setSearch = function (searchCriteria) {
        this.internal.searchInProgress = (searchCriteria.length > 0);

        this.searchBox.setValue(searchCriteria);
        this.dt.search(searchCriteria);
        this.draw();
    };

    /**
     * @method draw
     * @param {Boolean} repositionSelector
     * This method will set the filter of the widget and then redraw the datatable. If the repositionSelector is set to true the datatables
     * will be drawn with the first page selected, if the repositionSelector is false, the datatables will be redraw and the cursor will stay
     * on the same page as before. If there is no data at that page, the page will be blank. See example 2:
     * https://datatables.net/reference/api/draw()#Examples
     */
    p.draw = function (repositionSelector) {
        if (repositionSelector === undefined) { repositionSelector = true; }
        // this.setFilter();
        this.dt.draw(false);
        var info = this._getDataTablePageInfo();
        var goToPage = (info.page > info.pages) ? info.pages - 1 : info.page;
        this.dt.goToPage(goToPage);
        this.dt.draw(repositionSelector);
    };

    /**
     * @method setFilter
     * This method will pop the global jquery parameter for filters and apply the filtering algorithm for this specific TableWidget.
     * As it would be impossible to keep track of which filter belongs to which TableWidget, especially when widgets are being disposed of
     * etc, it is easier to call this method and set the filter right before filtering of data. So this method should be called before every
     * redraw of the table. That way we can guarantee that the filter being applied to the TableWidget is the right one. THe only way to apply
     * a filter though is by pushing a value to the the global jquery variable $.fn.dataTable.ext.search array.
     * See: https://datatables.net/manual/plug-ins/search
     */
    p.setFilter = function () {
        var self = this;
        // if ($.fn.dataTable.ext.search.length !== 0) {
        if (!this.internal.filterSet) {
            //The function for filtering WILL ONLY BE CALLED IF THERE IS DATA IN THE TABLE!!!!
            $.fn.dataTable.ext.search.push(
                // eslint-disable-next-line no-unused-vars
                function (settings, data, dataIndex, row) {
                    var elem = $(settings.nTable).closest('.breaseTableWidget')[0];
                    if (!elem || elem.id !== self.widget.elem.id || self.widget.model.getPreparedData().length === 0) return true;

                    var accVal = (self.widget.settings.config.filter.length === 0), accAnd = true;
                    for (var i = 0; i < self.widget.settings.config.filter.length; i += 1) {
                        var fil = self.widget.settings.config.filter[i], compVal, origVal;

                        //Check if we are looking at time
                        if (fil.data === 'tim') {
                            compVal = self._fixTimestamp(fil.comp.split('Z')[0]).getTime();
                            origVal = self._fixTimestamp(self.widget.model.currentData[dataIndex].tim).getTime();
                        } else {
                            compVal = fil.comp;
                            origVal = self.widget.model.currentData[dataIndex][fil.data];
                        }

                        var val = self._getFilterStatement(origVal, fil.opVal, compVal);

                        //Split between whether we are in an 'OR' or 'AND' filter
                        if (fil.logVal === 1 || fil.logical === '') {
                            accVal = accVal || (accAnd && val);
                            accAnd = true;
                        } else if (fil.logVal === 0) {
                            accAnd = accAnd && val;
                        }

                    }
                    return accVal;
                });
            this.internal.filterSet = true;
            this.internal.filterPos = $.fn.dataTable.ext.search.length - 1;
        }
    };

    /**
     * @method _fixTimestamp
     * @private
     * @param {String} tim
     * @returns {Date} slightly modifid Date object depending on the format value
     * Takes a timestamp in the format of a string (in ISO 8601 format) and converts it to a Date. Depending on the format that has been set
     * we have to figure out which is the lowest common denominator. E.g. if a format involves minutes but not seconds it doesn't make sense
     * to compare two timestamps on second format. Therefore the seconds will be removed and the minutes will be kept to give a better comparison
     * between two timestamps.
     */
    p._fixTimestamp = function (tim) {
        var d = new Date(tim);

        var f = this.widget.getFormat();

        if (f.indexOf('f') !== -1) {
            // eslint-disable-next-line no-self-assign
            d = d;
        } else if (f.indexOf('s') !== -1 || f.indexOf('T') !== -1) {
            d.setMilliseconds(0);
        } else if (f.indexOf('m') !== -1 || (f.indexOf('t') !== -1 && f.length === 1)) {
            d.setMilliseconds(0);
            d.setSeconds(0);
        } else if (f.indexOf('H') !== -1 || f.indexOf('h') !== -1) {
            d.setMilliseconds(0);
            d.setSeconds(0);
            d.setMinutes(0);
        } else if (f.indexOf('d') !== -1 || f.indexOf('D') !== -1 || (f.indexOf('M') !== -1 && f.length === 1)) {
            d.setMilliseconds(0);
            d.setSeconds(0);
            d.setMinutes(0);
            d.setHours(0);
        } else if (f.indexOf('M') !== -1 || f.indexOf('Y') !== -1) {
            d.setMilliseconds(0);
            d.setSeconds(0);
            d.setMinutes(0);
            d.setHours(0);
            d.setDate(0);
        } else if (f.indexOf('y') !== -1) {
            d.setMilliseconds(0);
            d.setSeconds(0);
            d.setMinutes(0);
            d.setHours(0);
            d.setDate(0);
            d.setMonth(0);
        }
        return d;
    };

    /**
     * @method _getFilterStatement
     * @private
     * @param {String|Date|Integer} origVal The original value that is to be compared to. I.e. the value being stored in the currentData variable in the derived model
     * @param {Integer} opVal operator value. Could either be (!= [0], == [1], < [2], <= [3], > [4], >= [5], Contains [6], Does not contain [7]) The number corresponds to operator that will be executed.
     * @param {String|Date|Integer} compVal The comparative value, has to be of the same type as the original value.
     * This method will take two values and compare these accordingly to the operator passed on the op value. Both origVal and compVal has to be of the same type.
     */
    p._getFilterStatement = function (origVal, op, compVal) {
        var retValRow;

        if (origVal instanceof Date) {
            origVal = origVal.getTime();
            compVal = compVal.getTime();
        }

        if (typeof origVal === 'number') {
            compVal = parseInt(compVal);
        }

        switch (op) {
            case 0:
                retValRow = (origVal !== compVal);
                break;

            case 1:
                retValRow = (origVal === compVal);
                break;

            case 2:
                retValRow = (origVal < compVal);
                break;

            case 3:
                retValRow = (origVal <= compVal);
                break;

            case 4:
                retValRow = (origVal > compVal);
                break;

            case 5:
                retValRow = (origVal >= compVal);
                break;

            case 6:
                retValRow = (typeof (origVal) !== 'string') ? false : (origVal.indexOf(compVal) !== -1);
                break;

            case 7:
                retValRow = (typeof (origVal) !== 'string') ? false : (origVal.indexOf(compVal) === -1);
                break;

            default:
                retValRow = true;
        }
        return retValRow;
    };

    /**
     * @method _rowEligibility
     * @private
     * Override in derived widgets
     */
    p._rowEligibility = function () {
        //Override in derived widgets
    };

    /**
     * @method _colorMeBlue
     * @private
     * Override in derived widgets
     */
    p._colorMeBlue = function () {
        //Override in derived widgets
    };

    /**
     * @method _centerImages
     * @private
     * Override in derived widgets
     */
    p._centerImages = function () {
        //Override in derived widgets
    };

    /**
     * @method _resetFilter
     * @deprecated
     * @private
     * Not used anymore I think...
     */
    p._resetFilter = function (active) {
        this.dt.resetFilter(active);
        this.draw();
    };

    /**
     * @method updateData
     * Method called by the model class to update the data in the datatables. It will clear the datatables, retrieve the data from a getter in the model,
     * add it to the datatable, and finally draw the new data.
     */
    p.updateData = function () {
        //check if datatable exists
        if (!this.dt.exists()) { return; }

        //??????????????????
        if (!this.widget.settings.optimize) {
            this.dt.clear();
            this.dt.addRows(this.widget.model.getPreparedData());
            this.draw(false);
        } else {
            if (this.widget.model.dataPrepended()) {
                this.addRows(this.widget.model.getPrependedData());
            } else {
                // this.datatable.clear(); 
                this.rebuildView();
            }
        }
    };

    /**
     * @method updateNextData
     * 
     */
    p.updateNextData = function (data) {
        this.dt.addRows(data);
        this.draw(false);
    };

    /**
     * @method repositionTopBar
     * Adds the top bar (where the search box is located) at the top of the table.
     * Forces the search box to float to the right of the widget.
     */
    p.repositionTopBar = function () {
        this.widget.el.find('.top-bar-table').prepend(this.searchBox.el);
        this.searchBox.el.css('float', 'right');
    };

    /**
     * @method updateColumnWidths
     * This method iterates over all items and sets the new columnWidth. It doesn't actually update the items (TableColumnWidgets) but rather
     * injects the width to the col-tag in the HTML Table.
     */
    p.updateColumnWidths = function () {
        for (var i = 0; i < this.widget.settings.childrenIdList.length; i += 1) {
            this._setColumnWidth(this.tableEl, i, this.widget.model.columnWidths[i]);
        }
    };

    /**
     * @method updateText
     * This method updates the text on the Next and Previous buttons in the navigation bar (at the bottom). It will use the text selected by the
     * user in the property grid. This could be textKeys or plain text.
     */
    p.updateText = function () {
        this.widget.el.find('.previous').text(this.widget.settings.previousText);
        this.widget.el.find('.next').text(this.widget.settings.nextText);
    };

    /**
     * @method updateTableWidth
     * This method updates the width of table by getting the max width from the model
     */
    p.updateTableWidth = function () {
        this._setTableWidth(this.tableEl, this.widget.model.maxWidth);
    };

    /**
     * @method updateTableElHeight
     * This method updates the height of table element by getting the height of the widget
     * @return {Number} returns the updated height of the data element height
     */
    p.updateTableElHeight = function () {
        var tableElHeight = this._getTableElHeight();
        this._setTableElHeight(tableElHeight);
        return tableElHeight;
    };

    /**
     * @method _getTableElHeight
     * This method returns the calculated height of the table element.
     * @return {Number} returns the widget height minus the headerHeight and searchbox height if needed
     */
    p._getTableElHeight = function () {
        return this.widget.el.height() - this.widget.settings.headerHeight - this.heightToReduce;
    };

    /**
     * @method _setTableElHeight
     * @param {Integer} tableElHeight
     * This method sets the table element height to the table element(tw_table_el) if the table element is present.
     */
    p._setTableElHeight = function (tableElHeight) {
        if (this.tw_table_el) {
            this.tw_table_el.height(tableElHeight);
        }
    };

    /**
     * @method updateOrder
     * @param {Object} detail
     * @param {String} detail.order can either be 'asc' or 'desc' as decided by the TableColumnWidget
     * @param {String} detail.id The id of the TableColumnWidget
     * This method iterates over the items and if the id passed is the same the ones iterating over, the datatables ordering will be updated accoringly
     * to order direction (asc/desc), for all other however the TableColumnWidget's ordering will be reset.
     */
    p.updateOrder = function (detail) {
        for (var i = 0; i < this.widget.settings.childrenIdList.length; i += 1) {
            if (this.widget.settings.childrenIdList[i] === detail.id) {
                if (detail.order === undefined) {
                    this.dt.order([this.widget.settings.childrenIdList.length, 'desc']);
                } else {
                    this.dt.order([i, detail.order]);
                }
                this.draw();
            } else {
                brease.callWidget(this.widget.settings.childrenIdList[i], 'resetOrdering');
            }
        }
    };

    /**
     * @method updateLayout
     * If the table is initialized this method sets the layout size and refreshes the scrollers.
     */
    p.updateLayout = function () {
        if (this.initialized) {
            this._setLayoutSize();
            this.refreshScroller();
        }
    };

    /**
     * @method enable
     * This method will remove the disable selector from all rows, it will also make the svg elements representing the ordering of the table columns available again
     * and finally it will re-add the selected class to the item that was selected when the widget got disabled. It will also update the searchBox that it should be
     * enabled. (This could be argued that this is a task of the controller instead; should perhaps be changed in the future)
     */
    p.enable = function () {
        if (this.searchBox && !this.widget.isDisabled) {
            this.searchBox.setEnable(true);
        }
        if (this.widget.busyIndicator && !this.widget.isDisabled) {
            this.widget.busyIndicator.enable();
        }

        if (!this.widget.isDisabled) {
            if (this.selectedAtDisable !== undefined && this._getDataTablePageInfo().page === this.selectedPageAtDisable && this.disabledEdge) {
                this.widget.el.find('tr:eq(' + this.selectedAtDisable + ')').addClass('selected');
                this.disabledEdge = false;
            }
            for (var j = 1; j <= this.nbrOfRows; j += 1) {
                this.widget.el.find('tr:eq(' + j + ')').removeClass('disabled');
            }
            for (var i = 1; i <= this.nbrOfColumns; i += 1) {
                this.widget.el.find('.breaseTableColumnWidget > svg').css('display', 'block');
            }
        }
    };

    /**
     * @method disable
     * This method will add the disable selector from all rows, then it will remove the selected class from the item that is selected 
     * and additionally store this in a variable so it can be used again when the widget is enabled. It will also update the searchBox that it should be
     * disabled. (This could be argued that this is a task of the controller instead; should perhaps be changed in the future)
     */
    p.disable = function () {
        if (this.searchBox && this.widget.isDisabled) {
            this.searchBox.setEnable(false);
        }

        if (this.widget.busyIndicator && this.widget.isDisabled) {
            this.widget.busyIndicator.disable();
        }

        if (this.widget.isDisabled) {
            for (var j = 1; j <= this.nbrOfRows; j += 1) {
                this.widget.el.find('tr:eq(' + j + ')').addClass('disabled');
                if (this.widget.el.find('tr:eq(' + j + ')').hasClass('selected')) {
                    this.widget.el.find('tr:eq(' + j + ')').removeClass('selected');
                    this.disabledEdge = true;
                    this.selectedPageAtDisable = this._getDataTablePageInfo().page;
                    this.selectedAtDisable = j;
                }
            }

            for (var i = 1; i <= this.nbrOfColumns; i += 1) {
                this.widget.el.find('.breaseTableColumnWidget > svg').css('display', 'none');
            }
        }
    };

    /**
     * @method _getLayoutElements
     * @private
     * Stores all the different parts of the widget (Top bar, header, table and pagination) into separate variables:
     * tw_top_bar_el, tw_header_el, tw_table_el, tw_paging_el, all part of the renderer prototype.
     */
    p._getLayoutElements = function () {
        this.tw_top_bar_el = this.widget.el.find('.tw_top_bar');
        this.tw_header_el = this.widget.el.find('.tw_header');
        this.tw_table_el = this.widget.el.find('.tw_table');
        this.tw_paging_el = this.widget.el.find('.tw_paging');
    };

    /**
     * @method _setLayoutSize
     * @private
     * This method decides whether any of the search box or pagination should be shown or not depending on the selection by a user in the property grid.
     */
    p._setLayoutSize = function () {

        // Update header height
        this.tw_header_el.height(this.widget.settings.headerHeight);

        // TEMPORARY Use Flexbox instead?
        this.heightToReduce = 0;

        if (this.widget.settings.searchBox) {
            this.tw_top_bar_el.removeClass('remove');
            this.tw_top_bar_el.height(this.topBarWrapperHeight);
            this.heightToReduce += this.topBarWrapperHeight;
        } else {
            this.topBarWrapperHeight = 0;
            this.tw_top_bar_el.addClass('remove');
        }

        if (this.widget.settings.paging && this.widget.settings.showPagingButtons) {
            this.tw_paging_el.removeClass('remove');
            this.tw_paging_el.height(this.pagingWrapperHeight);
            this.heightToReduce += this.pagingWrapperHeight;
        } else {
            this.pagingWrapperHeight = 0;
            this.tw_paging_el.addClass('remove');
        }

        var tableElHeight = this.updateTableElHeight();
        if (this.widget.settings.optimize) {
            this.scrollerBody.height(tableElHeight);
        }
    };

    /**
     * @method _initCompleteCallback
     * @private
     * Method called when the DataTable has been drawn for the first time. This method will then update the model, rearrange the components,
     * add aggregated widgets, fix with column definitions and update the layout of the widget. 
     */
    p._initCompleteCallback = function () {

        this.initialized = true;

        var event = new CustomEvent('RendererInitialized', { bubbles: true, cancelable: true });
        this.widget.dispatchEvent(event);

        // Update Model
        this.widget.model.updateModel();

        // Get Layout elements
        this._getLayoutElements();

        // Put header div's into header wrapper
        this._rearrangeColumnWidgets();

        // Put search box in top bar
        this._addAggregatedWidgets();

        // Append col definitons to DOM
        this._addColumnDefs(this.tableEl, this.widget.settings.childrenIdList.length);

        // Add header and body scroller
        this._createScroller();

        //Set up event listeners again
        this.widget.controller.addEventListenerOnItems();

        this.updateLayout();
        this.updateColumnWidths();
        this.updateTableWidth();

        //decide if we are to update buttons styles or remove them
        if (this.widget.settings.showPagingButtons && this.widget.settings.paging) {
            // Styles the buttons to brease buttons
            this._setButtons(this);
        }

        if (this.widget.settings.paging) {
            //Throw event to change page
            this._pageChange();
        }
    };

    /**
     * @method _pageChange
     * Method to change the page via the actions specified in the widget class. It will get the currently displayed page,
     * the last page that is part of the datatables, and finally it will forward this information to the controller.
     */
    p._pageChange = function () {
        if (this.dt.exists()) {
            var curr = this._getDataTablePageInfo().page + 1;
            var last = this._getDataTablePageInfo().pages;
            this.widget.controller._pageChange(curr, last);
        }
    };

    /**
     * @method goToPage
     * @param {Integer} page the page to change to
     * @param {String} type which action has been used, either first, last, next, prev, or a number can have been set.
     * @return {Boolean} is true if page change was successful else false
     * This function, albeit very complicated, will change the page to the one specified by the page and the type.
     * It will first retrieve which the current page is from the datatables, then it will also get the maximum number of pages.
     * If the type is of type first, last, next or prev the function will by itself figure out which the current page should be. 
     *  For 'first' if the currPage is greater than 0 it will set the currPage to 0 else it will set it to -1
     *  For 'last' if the currPage is greater than the max number of pages (minus 1) else it will set it to -1
     *  For 'next' if the currPage (plus 1) is less than the maximum number of pages it will set the currPage to itself, else it will set it to -1
     *  For 'prev' if the currPage (minus 1) is greater or equal than 0 it will set the currPage to currPage minus 1 else it will set it to -1
     *  For 'number' it is a bit more complicated. If the page (parameter) minus one is less greater than 0 and less than maxPages minus 1 it will 
     *      return the page value minus one, in any other case (wrong type, NaN, undefined, outside the scope) it will return -1
     *  Default : if no cases fit the currPage will be set to -1
     * 
     * If the the currPage is -1 the function will return false. If the currPage is something else it will update the datatables with the page we want
     * to go to and call the draw function to change the page. It will then return true. //#endregion
     * 
     * The return value is important as the actions calling this function could be using a resulthandler in the AS Action/Event-System and thus needs
     * something for the result. 
     */
    p.goToPage = function (page, type) {
        var currPage = this._getDataTablePageInfo().page,
            maxPages = this._getDataTablePageInfo().pages;
        switch (type) {
            case 'first': currPage = (currPage > 0) ? 0 : -1; break;

            case 'last': currPage = (currPage < maxPages - 1) ? maxPages - 1 : -1; break;

            case 'next': currPage = (currPage + 1 < maxPages) ? currPage + 1 : -1; break;

            case 'prev': currPage = (currPage - 1 >= 0) ? currPage - 1 : -1; break;

            case 'number': currPage = (typeof (page) === 'number' && !isNaN(page)) ? (page - 1 < 0) ? -1 : (page - 1 > maxPages - 1) ? -1 : page - 1 : -1; break;

            default: currPage = -1;
        }

        if (currPage === -1) {
            return false;
        }

        this.dt.goToPage(currPage);
        this.draw(false);
        return true;
    };

    /**
     * @method _drawCallback
     * @private
     * When the datatables has been drawn/redrawn, this function will be called. This means that the table has been populated with the current data set that
     * was given to the library. When this happens, the table needs to be updated with the correct width, refreshing the scrollers, update the texts on each
     * button set styling of each individual row if necessary, reshift the images to their correct position. Update the user that there has been a page change,
     * and also check if the rows needs to have disabled styling.
     */
    p._drawCallback = function () {
        this.widget._hideBusyIndicator();
        this.updateTableWidth();
        this.updateTableElHeight();
        this.refreshScroller();
        this.widget.setTexts();

        if (this.dt.exists()) {
            this.nbrOfRows = this._getDataTablePageInfo().end - this._getDataTablePageInfo().start;
            this.nbrOfColumns = this.widget.settings.config.columns.length;
        }

        this._colorMeBlue();
        this._centerImages();

        if (this.widget.settings.showPagingButtons && this.widget.settings.paging) {
            // Styles the buttons to brease buttons
            this._updateLastbutton();
            this._setButtons(this);
        }

        if (this.widget.settings.paging) {
            //Throw event to change page
            this._pageChange();
        }

        if (this.widget.isDisabled) {
            this.disable();
        } else {
            this.enable();
        }

        if (this.widget.settings.optimize && !this.ns) {
            this.ns = new NativeScroller();
            this.ns.init(this.widget.elem.getElementsByClassName('dataTables_scrollBody')[0]);
        }
        this.widget.eventDispatcher.dispatchEvent({ type: 'draw' });
    };

    /**
     * @method _onAggregatedWidgetsReady
     * @private
     * @param {Object} e event
     * When the aggregated widgets are ready we enter here to set the right values for it, then store a reference to the aggregated searchbox widget,
     * if the widget is disabled, these widgets will be updated, then rearranged to where they belong.
     */
    p._onAggregatedWidgetsReady = function (e) {
        if (e.target.id === this.searchBoxId) {
            this.searchBox = brease.callWidget(this.searchBoxId, 'widget');
            this.searchBox.el.css('margin', this.searchBoxPadding + 'px');

            if (this.searchBox) {
                if (this.widget.isDisabled) {
                    this.disable();
                }

                if (brease.config.editMode) {
                    this._rearrangeSearchBox(this);
                } else {
                    this._rearrangeSearchBox(this);
                    this.widget.controller.aggregatedReadyHandler();
                }
            }
        }
    };

    /**
     * @method wake
     * Called when the widget is woken by the framework, will update the global jquery filter variable with the necessary filter for this widget
     */
    p.wake = function () {
        //
    };

    /**
     * @method suspend
     * Called when the widget is suspended by the framework, will remove the global jquery filter variable
     */
    p.suspend = function () {
        // $.fn.dataTable.ext.search = [];
        // This call is a bad idea: this.throttledRedraw.cancel();
    };

    /**
     * @method dispose
     * Called when the widget is diposed by the framework, removes all jquery elements, scrollers and removes the global jquery filter variable
     */
    p.dispose = function () {
        // $.fn.dataTable.ext.search = [];
        $.fn.dataTable.ext.search.splice(this.internal.filterPos, 1, function () { return true; });
        this.internal.filterPos = -1;
        this._removeScroller();
        this._destroy();
        this._removeEventListener();
        this.throttledRedraw.cancel();
    };

    /**
     * @method _addTableNode
     * @private
     * @param {Object} el jquery element of the widget so the table can be appended to the widget
     * This method takes the jquery element of the widget, creates a Table node (jQuery) and appends it to the table.
     */
    p._addTableNode = function (el) {
        var $table = $('<table cellspacing="0"></table>');

        el.prepend($table);
        return $table;
    };

    /**
     * @method _rearrangeColumnWidgets
     * @private
     * This method detaches all headers and replaces them at the right place in the DOM structure.
     */
    p._rearrangeColumnWidgets = function () {
        var self = this;
        // eslint-disable-next-line no-unused-vars
        $.each(this.widget.model.childrenList, function (index, w) {
            w.el.detach();
            self.tw_header_el.children().append(w.el);
        });
    };

    /**
     * @method _rearrangeSearchBox
     * @private
     * This method will set the css necessary for the search box to be placed in the right place. THen it will append the
     * search box to the top bar jquery element and finally apply the css properties to the search box. 
     */
    p._rearrangeSearchBox = function () {
        var searchBoxCSS = {
            'float': 'right',
            'width': this.searchBoxWidth
        };
        this.tw_top_bar_el.append(this.searchBox.el);
        this.searchBox.el.css(searchBoxCSS);
    };

    /**
     * @method _addAggregatedWidgets
     * @private
     * This method will create the aggregated widgets that the TableWidget needs (TextInput)
     * and add an eventlistener so that when these are ready can be used.
     */
    p._addAggregatedWidgets = function () {
        var busyIndicatorCss = {
            'position': 'relative',
            'visibility': 'hidden',
            'z-index': 1000,
            'height': '50px',
            'width': '50px',
            'top': '-' + parseInt(this.widget.el.height(), 10) / 2 + 'px',
            'padding-left': parseInt(this.widget.el.width(), 10) / 2 - 15 + 'px',
            'left': '0px'
        };

        this.widget.busyIndicatorHandler.createBusyIndicator(busyIndicatorCss);
        this.widget.elem.addEventListener(BreaseEvent.WIDGET_READY, this._bind('_onAggregatedWidgetsReady'));
        brease.uiController.createWidgets(this.widget.elem,
            [{
                className: 'widgets.brease.TextInput',
                id: this.searchBoxId,
                options: {
                    droppable: false,
                    omitDisabledClick: true,
                    tabIndex: this.widget.getTabIndex()
                }
            }], true, this.widget.settings.parentContentId);
    };

    /**
     * @method _initializeDataTable
     * @private
     * This method will fetch the options for the datatables, create the datatables, and finally add the rows/data to the table so it can be populated.
     */
    p._initializeDataTable = function () {
        if (this.widget.settings.config.columns.length === 0) { return false; }

        this.options = this._fetchDataTableOptions();
        // this.datatable = this.tableEl.DataTable(this.options);
        this.dt.initializeDataTable(this.options);
        if (!this.widget.settings.optimize) {
            this.addRows();
        }
    };

    /**
     * @method _fetchDataTableOptions
     * @private
     * @returns {Object} datatables option definition
     * This method sets up the brain behind the datatables. It will give the callback function to the initcomplete and drawcallback. It will
     * select the initial text of the pagination buttons, the page length, the column definition, the paginiation type, if paging should be 
     * available or not, sorting and much more. For a full definition of everything that can be added see: https://datatables.net/reference/option/
     */
    p._fetchDataTableOptions = function () {
        var options = {};

        options = {

            /* Callbacks */
            initComplete: _.bind(this._initCompleteCallback, this),
            drawCallback: _.bind(this._drawCallback, this),

            /* Options */
            // select: {
            //     style: 'single',   // Select extension of datatable deactivated - Feature for single selection implemented manually with brease events
            // },
            api: true,
            autoWidth: false,
            rowId: this.widget.settings.rowId,

            language: {
                search: '',
                paginate: {
                    next: 'Next',
                    previous: 'Previous'
                }
            },
            pageLength: 3,
            paging: true,
            pagingType: 'simple_numbers',
            info: false,
            dom: "<'tw_top_bar'><'tw_header' <'header-flex-container'>><'tw_table' t><'tw_paging' p>",
            //For items containing more data (see timestamps) we have to use orthogonal data to sort it correctly
            //see the getShortColumnType method for respective Item (ALI, AHI, AuLI, etc) to see how to structure it!
            //orthogonal data is so far implemented for
            //timestamps (All), size (FEI)
            //https://datatables.net/examples/ajax/orthogonal-data
            columns: [],
            order: (this.widget.settings.config.sort.length === 0) ? [[this.widget.settings.childrenIdList.length, 'desc']] : this.widget.settings.config.sort,
            columnDefs: [{ targets: -1, searchable: false, visible: false, orderable: true }, { targets: '_all', searchable: true, orderable: true }]
            // order: optionsComingFromModel.sort,
        };

        if (this.widget.settings.optimize) {
            //we expand the columnDefs with a hidden first column
            // options.columnDefs.push();
            //https://datatables.net/blog/2011-06-11
            var height = this.widget.elem.clientHeight;

            if (this.widget.settings.searchBox) {
                height -= this.topBarWrapperHeight;
            }

            height -= this.widget.settings.headerHeight;

            options['data'] = this.widget.model.getPreparedData();
            options['scroller'] = {
                rowHeight: (this.widget.settings.rowHeight !== 0) ? this.widget.settings.rowHeight : 62,
                boundaryScale: 0.5
            };
            options['scrollY'] = height;
            options['deferRender'] = true;
        } else {
            options.paging = this.widget.settings.paging;
            options.pageLength = this.widget.settings.itemsPerPage;
        }

        //check if we need to set fixed rowHeight
        if (this.widget.settings.rowHeight !== 0) {
            options.dom = "<'tw_top_bar'><'tw_header' <'header-flex-container'>><'tw_table fixed-row-height' t><'tw_paging' p>";
        }

        options.columns = this.widget.settings.config.columns;
        options.language.paginate.previous = this.widget.settings.previousText;
        options.language.paginate.next = this.widget.settings.nextText;

        return options;
    };

    /**
     * @method _getDataTablePageInfo
     * @private
     * @returns {Object}
     * This method will get the info object of the currently displayed page.
     */
    p._getDataTablePageInfo = function () {
        return this.dt.info();
    };

    /**
     * @method _addColumnDefs
     * @private
     * @param {Object} tableEl
     * @param {UInteger} columns
     * This method will create the col definition needed for the HTML Table to display the width of each individual column correctly. It will
     * then add this wrapped around a colgroup tag in the table jquery element.
     */
    p._addColumnDefs = function (tableEl, columns) {
        var colGroup = tableEl.find('colgroup');
        var colEl = $('<col />');

        if (colGroup.length !== 0) {
            $(colGroup).empty();

            for (var i = 0; i < columns; i += 1) {
                $(colGroup).append(colEl);
            }
            tableEl.prepend(colGroup);
        } else {
            var colGroupEl = $('<colgroup />');

            for (var x = 0; x < columns; x += 1) {
                colGroupEl.append(colEl.clone());
            }
            tableEl.prepend(colGroupEl);
        }
    };

    /**
     * @method _setColumnWidth
     * @private
     * @param {Object} tableEl the jquery table element
     * @param {UInteger} index the index of the column in the colgroup
     * @param {UInteger} width width of the column
     * This method sets the width of a col-item in the colgroup found in the HTML table. The item on the position index will receive the width: width.
     */
    p._setColumnWidth = function (tableEl, index, width) {
        var colElements = tableEl.find('col');
        $(colElements[index]).width(width);
    };

    /**
     * @method _setButtons
     * @private
     * This method will iterate over all pagination buttons that are available in the DataTable and set the ToggleButton widgets default style to these,
     * it will also apply a span tag which it wraps the around the text so all styles can be properly applied. If a button has the DataTable's
     * current class we add the active class to give the active styling to this button
     */
    p._setButtons = function () {
        if (this.tw_paging_el === undefined) { return; }
        var btn = this.tw_paging_el.find('.paginate_button'),
            ellipsisSpan = this.tw_paging_el.find('.ellipsis');
        btn.addClass('widgets_brease_ToggleButton_style_default');
        btn.addClass('breaseButton');
        btn.each(function () {
            var currBtn = $(this);
            var t = currBtn.text();
            currBtn.text('');
            currBtn.append('<span>' + t + '</span>');

            if (!currBtn.hasClass('next') && !currBtn.hasClass('previous')) {
                currBtn.css('width', 'auto').css('min-width', 44);
                // btnBackColor = $(this).css('background-color');
            }
            currBtn.height(30);
            if (currBtn.hasClass('current')) {
                currBtn.addClass('active');
            }
        });

        if (ellipsisSpan !== undefined) {
            this._wrapEllipsisSpan(ellipsisSpan, btn.not('.previous').not('.next').css('height'), btn.not('.previous').not('.next').css('width'));
        }
    };

    p._updateLastbutton = function () {
        //Derive if necessary (AuditList/AlarmHistory)
    };

    /**
     * @method _setTableWidth
     * @private
     * @param {Object} tableEl jquery element of the table
     * @param {UInteger} width total width of the table
     * This method will set the total width of the Table with the width given on the corresponding parameter.
     */
    p._setTableWidth = function (tableEl, width) {
        tableEl.css('width', width + 'px');
    };

    /**
     * @method _createScroller
     * @private
     * This method will create the scrollbars needed to synchronize the scrolling in the header and the body.
     * It will also call the method to add eventlisteners for the scroll event.
     */
    p._createScroller = function () {
        if (brease.config.editMode) {
            this.internal.scrollerOptions.header.disableMouse = true;
            this.internal.scrollerOptions.header.disableTouch = true;
        }

        this.scrollerHead = Scroller.addScrollbars(this.tw_header_el[0], this.internal.scrollerOptions.header);
        if (this.widget.settings.optimize) {
            this.scrollerBody = this.widget.el.find('.dataTables_scrollBody');
            this.scrollerBody.on('mousewheel', this._bind('_onScrollerMouseWheel'));
        } else {
            this.scrollerBody = Scroller.addScrollbars(this.widget.el.find('.tw_table')[0], this.internal.scrollerOptions.body);
        }

        this._addScrollListener();
    };

    /** 
     * @method _onScrollerMouseWheel
     * @private
     * Stops propagation of the mouse wheel event if scrollBar is available.
     * Parent iscroll would catch event and preventDefault (see A&P 705595)
     * @param {Object} e 
     */
    p._onScrollerMouseWheel = function (e) {
        if (this._hasScrollBar()) {
            e.stopPropagation();
        }
    };

    /**
     * @method _hasScrollBar
     * @private
     * Check if there is a overflow => scrollBars are available.
     */
    p._hasScrollBar = function () {
        return this.scrollerBody.get(0).scrollHeight > this.scrollerBody.height();
    };

    /**
     * @method _addScrollListener
     * @private
     * This method add the eventlisteners for the scrollers on the body and header for the event 'scroll'.
     */
    p._addScrollListener = function () {
        this.scrollerBody.on('scroll', _.bind(this._scrollLinkHead, this));
        this.scrollerHead.on('scroll', _.bind(this._scrollLinkBody, this));

        if (!this.widget.settings.optimize && !this.widget.settings.paging) {
            this.scrollerBody.on('scrollEnd', _.bind(this._howFarScrolledDefault, this));
        }
    };
    p._howFarScrolledDefault = function () {
        if (Math.abs(this.scrollerBody.maxScrollY) - Math.abs(this.scrollerBody.y) < 500) {
            this.widget.controller.howFarScrolledDefault();
        }
    };

    /**
     * @method _scrollLinkHead
     * @private
     * This method will link the scrolling between the header and body, so that if the header gets scrolled the body will also scroll.
     */
    p._scrollLinkHead = function () {
        if (this.widget.settings.optimize) {
            this.scrollerHead.scrollTo((-1) * this.dt.datatable.settings()[0].nScrollBody.scrollLeft, 0, 0);
        } else {
            this.scrollerHead.scrollTo(this.scrollerBody.x, 0, 0);
        }
    };

    /**
     * @method _scrollLinkBody
     * @private
     * This method will link the scrolling between the header and body, so that if the body gets scrolled the header will also scroll.
     */
    p._scrollLinkBody = function () {
        if (this.widget.settings.optimize) {
            this.dt.datatable.settings()[0].nScrollBody.scrollLeft = (-1) * this.scrollerHead.x;
        } else {
            this.scrollerBody.scrollTo(this.scrollerHead.x, 0, 0);
        }

    };

    /**
     * @method _refreshScroller
     * @private
     * This method will refresh the scrollers in the header and the body when the framework calls the update of all scrollers.
     */
    p._refreshScroller = function () {
        if (this.scrollerHead) {
            this.scrollerHead.refresh();
        }
        if (this.scrollerBody && !this.widget.settings.optimize) {
            this.scrollerBody.refresh();
        }
    };

    /**
     * @method _removeEventListener
     * @private
     * This method removes the eventlistnener for the WIDGET_READY event on aggregated widgets.
     */
    p._removeEventListener = function () {
        this.widget.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_onAggregatedWidgetsReady'));
    };

    /**
     * @method _removeScroller
     * @private
     * This method will remove the scroller of the header and body together with the corresponding eventlisteners, if these exists.
     */
    p._removeScroller = function () {
        if (this.scrollerBody) {
            this.scrollerBody.off('mousewheel', this._bind('_onScrollerMouseWheel'));
            this.scrollerBody.off('scroll', _.bind(this._scrollLinkHead, this));
            this.scrollerBody.off('scrollEnd', _.bind(this._howFarScrolledDefault, this));
            if (!this.widget.settings.optimize) {
                this.scrollerBody.destroy();
            }
            this._nullifyScrollBody();
        }
        if (this.scrollerHead) {
            this.scrollerHead.off('scroll', _.bind(this._scrollLinkBody, this));
            this.scrollerHead.destroy();
            this._nullifyScrollHead();
        }

        if (this.ns) {
            this.ns.dispose();
            this.ns = null;
        }
    };

    /**
     * @method _nullifyScrollBody
     * @private
     * This method sets the scroller of the body to null.
     */
    p._nullifyScrollBody = function () {
        this.scrollerBody = null;
    };

    /**
     * @method _nullifyScrollHead
     * @private
     * This method sets the scroller of the head to null.
     */
    p._nullifyScrollHead = function () {
        this.scrollerHead = null;
    };

    /**
     * @method displayRowInTable
     * @param {Object} id the id should be an object that contains one of the columns in the derived widget's column definition. See correct documet for that widget - mapp communication.
     * This method will update the datatables with which row to show and then call method that will scroll there.
     */
    p.displayRowInTable = function (id) {
        if (this._findRow(id)) {
            this.dt.show(id);
            this._scrollToSelectedRow();
        }
    };

    /**
     * @method _findRow
     * @private
     * @param {Object} id
     * @returns {Boolean}
     * This method takes an id and checks in the datatbles if this id is present in the currently displayed dataset. If it is, it returns true else false.
     */
    p._findRow = function (id) {
        return this.dt.find(id);
    };

    /**
     * @method _addRowSelectionFromPlugin
     * @private
     * This method will add a plugin to the datatables that makes it possible to select a row from the action/event system and display this.
     */
    p._addRowSelectionFromPlugin = function () {
        this.dt.addRowSelectionFromPlugin();
    };

    /**
     * @method _scrollToSelectedRow
     * @private
     * This method scrolls to the row that is selected (has class selected)
     */
    p._scrollToSelectedRow = function () {
        if (!this.widget.settings.optimize) {
            this.scrollerBody.scrollToElement('.selected');
        }
    };

    /**
     * @method _destroy
     * @private
     * This method will destroy the datatable, remove the jquery object (tableEl) and then it reinstantitates it all again.
     */
    p._destroy = function () {
        this.widget.eventDispatcher.dispatchEvent({ type: 'before_destroy' });
        this.dt.destroy();
        this.tableEl = this.dt.addTableNode(this.widget.el);
    };

    /**
     * @method _wrapEllipsisSpan
     * @private
     * This method will style the ellipsis the same way the surrounding buttons are styled
     * @param {Object} ellipsisSpan
     * @param {String} btnHeight
     * @param {String} btnWidth
     */
    p._wrapEllipsisSpan = function (ellipsisSpan, btnHeight, btnWidth) {
        var wrapEl = $('<a class = ellipsisSpanWrap ></a>');
        wrapEl.addClass('widgets_brease_ToggleButton_style_default');
        wrapEl.addClass('breaseButton');
        wrapEl.height(btnHeight);
        wrapEl.width(btnWidth);
        ellipsisSpan.css('position', 'absolute');
        ellipsisSpan.wrap(wrapEl);
    };

    p._clickHandler = function (e) {
        // A&P 738855: The paging buttons are not working with touch when the AlarmList is disabled
        // _handleEvent in base widget calls preventDefault which prevents all following mouse events
        // jquery datatable only triggerd on touchevents. Since its a DummyEvent we can just set defaultPrevented=true to prevent call to preventDefault. 
        if (!this.widget.isEnabled() && Utils.getOriginalEvent(e) instanceof TouchEvent && 
            this.tw_paging_el && this.tw_paging_el.get(0).contains(e.target) && e.originalEvent) {
            e.originalEvent.defaultPrevented = true;
        }
    };

    return RendererClass;
});
