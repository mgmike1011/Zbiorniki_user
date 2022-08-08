define([
    'brease/core/Class',
    'brease/events/BreaseEvent',
    'widgets/brease/common/ErrorHandling/libs/CommissioningErrorHandler',
    'widgets/brease/TableWidget/libs/Dialogue',
    'widgets/brease/TableWidget/libs/PageEventDispatcher'
], function (
    SuperClass, BreaseEvent, ErrorHandler, ConfigDialogue, PageEventDispatcher
) {

    'use strict';

    /** 
     * @class widgets.brease.TableWidget.libs.Controller
     * @extends brease.core.Class
     */

    var ControllerClass = SuperClass.extend(function Controller(widget) {
            SuperClass.call(this);
            this.pageEventDispatcher = new PageEventDispatcher();
            this.widget = widget;
        }, null),

        p = ControllerClass.prototype;

    /**
     * @method initialize
     * Initialized the Controller Class. Adds the errorHandler and all deferred objects so that when the widget and all the child widgets are ready
     * these promises can be executed.
     */
    p.initialize = function () {
        _addEventListener(this);
        this._addClassSpecificEventListeners(this);
        this.errorHandler = new ErrorHandler(this.widget);
        this.internal = {
            timer: [],
            firstItr: true
        };
        var self = this;
        this.widgetReady = new $.Deferred();
        this.childrenReady = new $.Deferred();
        $.when(
            this.widgetReady.promise(),
            this.childrenReady.promise())
            .done(self._bind('_allReadyHandler')
            );

        this.selectedItem = undefined;
    };

    /**
     * @method _addClassSpecificEventListeners
     * Method for a accessing the superclass initialisation function, which gives a possibility to inject code early in the initialisation phase if needed.
     */
    p._addClassSpecificEventListeners = function () {
        //pass - just used for sub classes to have access to init method, in case a function needs to be called early on
    };

    /**
     * @method languageChanged
     * Method called when the language has been changed, has to be overshadowed in the derived class
     */
    p.languageChanged = function () {
        //Has to be overshadowed in derived class
    };

    /**
     * @method getEventItem
     * @param {String|Object|Integer} item
     * Method to retrieve an item, see derived class for further implementation. Has to be overshadowed. 
     */
    p.getEventItem = function (item) {
        //Has to be overshadowed in derived class
    };

    /**
     * @method setSelectedItem
     * @param {Object} item currently selected item
     * This method sets the currently selected item and stores it in the instance.
     */
    p.setSelectedItem = function (item) {
        this.selectedItem = item; // this.widget.model.getSelectedRowOnCurrentPage() //Gets actually selected item on this page
    };

    /**
     * @method draw
     * Method calls the draw method in the renderer which will trigger a redraw of the table.
     */
    p.draw = function () {
        this.widget.renderer.redraw();
    };

    p.filterDraw = function () {
        this.widget.renderer.draw();
    };

    /**
     * @method dispatchItemClickEvent
     * @param {Object} item
     * @param {Object} e
     * This method will retrieve the current item and send it to the itemClickHandler so that it will be dispatched in the DOM.
     */
    p.dispatchItemClickEvent = function (item, e) {
        if (item === undefined) { return; }
        this.widget._itemClickHandler(this.getEventItem(item), e);
    };

    /**
     * @method dispatchDoubleItemClickEvent
     * @param {Object} item
     * @param {Object} e
     * This method will retrieve the current item and send it to the itemDoubleClickHandler so that it will be dispatched in the DOM.
     */
    p.dispatchDoubleItemClickEvent = function (item, e) {
        if (item === undefined) { return; }
        this.widget._itemDoubleClickHandler(this.getEventItem(item), e);
    };

    /**
     * @method getSelectedItem
     * @return {Object} the selected item
     * This method returns the selected item if the widget is not disabled.
     */
    p.getSelectedItem = function () {
        if (this.widget.isDisabled) { return false; }
        return this.selectedItem;
    };

    /**
     * @method aggregatedReadyHandler
     * This method adds an event listener for the ValueChanged event and binds this to the _submitSearchValueHandler so that when a user writes
     * in the search box and presses enter we can catch the value and update the datatables with the correct search query. 
     */
    p.aggregatedReadyHandler = function () {
        this.widget.elem.addEventListener('ValueChanged', this._bind('_submitSearchValueHandler'));
    };

    /**
     * @method childrenInitializedHandler
     * Method that will resolve all promises for the children.
     */
    p.childrenInitializedHandler = function () {
        this.childrenReady.resolve();
    };

    /**
     * @method openConf
     * @param {String} type
     * This method will instantiate a new configuration dialog of the type filter, so a user can create a filter configuration at runtime. 
     */
    p.openConf = function (type) {
        this.configDialogue = new ConfigDialogue(this.widget);
        this.configDialogue.open(type);
    };

    /**
     * @method filterData
     * @param {Object} filter the actual filter set from the Config Dilogue
     * This method will retrieve the filter object from the configuration dialogue and set it in the renderer so that the DataTable can filter data when being drawn.
     */
    p.filterData = function (filter) {
        this.widget.renderer.setFilter(filter);
    };

    /**
     * @method _allReadyHandler
     * @private
     * Method that will be called when all child widgets and widget has thrown the WIDGET_READY event. Will call the model to start collecting data,
     * update the renderer so that it initializes the DataTables, finally it sets the texts of the pagination buttons.
     */
    p._allReadyHandler = function () {
        this.widget.model.start();
        this.widget.renderer.start();
        this.widget.setTexts();
    };

    /**
     * @method _submitSearchValueHandler
     * @param {Object} e
     * @private
     * This method updates the model with the search query written in the searchBox, given that the events source elements id is the same as the id of the searchbox,
     * guaranteeing that it is this widget's textinput that is sending the event.
     */
    p._submitSearchValueHandler = function (e) {
        if (e.srcElement.id === this.widget.renderer.searchBoxId) {
            this.widget.model.setSearch(e.detail.value);
        }
    };

    /**
     * @method _itemDoubleSelectHandler
     * @param {Object} e
     * If the widget isn't disabled this method will find out the currently selected row and call the dispatchDoubleItemClickEvent
     * will be called to let the action event system know that a row has been double clicked.
     */
    p._itemDoubleSelectHandler = function (e, dt, type, cell, originalEvent) {
        if (this.widget.isDisabled) { return false; }

        var currentSelected = $(e.target).closest('tr');
        this.dispatchDoubleItemClickEvent(this.widget.renderer.index(currentSelected), e);
    };

    /**
     * @method _mouseDownHandler
     * @param {Object} e
     */
    p._mouseDownHandler = function (e) {
        if (this.widget.isDisabled) { return false; }

        this.movingSelection = $(e.target).closest('tr');
        this.movingSelection.addClass('mousedown');

        $(document).on(BreaseEvent.MOUSE_UP, this._bind('_mouseUpHandler'));
        // $(document).on(BreaseEvent.MOUSE_MOVE, this._bind('_mouseMoveHandler'));
    };

    // /**
    //  * @method _mouseMoveHandler
    //  * @param {Object} e
    //  */
    // p._mouseMoveHandler = function (e) {
    //     if (this.widget.isDisabled) { return false; }

    //     var currentSelected = $(e.target).closest('tr');
    //     if (currentSelected !== this.movingSelection) {
    //         this.movingSelection.removeClass('mousedown');
    //         currentSelected.addClass('mousedown');
    //         this.movingSelection = currentSelected;
    //     }

    // };

    /**
     * @method _mouseUpHandler
     * @param {Object} e
     */
    p._mouseUpHandler = function (e) {
        this.movingSelection.removeClass('mousedown');
        $(document).off(BreaseEvent.MOUSE_UP, this._bind('_mouseUpHandler'));
        // $(document).off(BreaseEvent.MOUSE_MOVE, this._bind('_mouseMoveHandler'));
    };

    /**
     * @method _itemSelectHandler
     * @param {Object} e
     * If the widget isn't disabled this method will find out the currently selected row and compare with the previously selected rows,
     * if these differ then the all previously selected rows (to prevent that a row is still selected after a page change) will be deselected
     * and then the dispatchItemClickEvent will be called to let the action event system know that a new row has been selected.
     */
    p._itemSelectHandler = function (e, dt, type, cell, originalEvent) {
        if (this.widget.isDisabled) { return false; }

        var allSelected = $(e.target).closest('tbody').find('tr.selected');
        var currentSelected = $(e.target).closest('tr');

        if (allSelected[0] !== currentSelected[0]) {
            //remove all previous selections 
            this.widget.renderer.deselect();

            this.widget.renderer.select(currentSelected);
            this.setSelectedItem(this._getRowIndex());
        }

        this.dispatchItemClickEvent(this.widget.renderer.index(currentSelected), e);
    };

    /**
     * @method _widgetReadyHandler
     * @param {Object} e
     * Method that will be called when the widget's WIDGET_READY event is dispatched by the base widget. This will resolve the promise waiting for this
     * widget to be ready. It also removes the eventlistener for itself.
     */
    p._widgetReadyHandler = function (e) {
        if (brease.uiController.parentWidgetId(e.target) === this.widget.elem.id) {
            this.widget.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_widgetReadyHandler'));
            this.widgetReady.resolve();
        }
    };

    /**
     * @method _pageChange
     * This method is extremely complicated and should probably be refactored into something simpler. Explanation as follows:
     * When a page is changed 5 events have to be fired: <br />
     *  - FirstPageNumber <br />
     *  - PreviousPageNumber <br />
     *  - CurrentPageNumber <br />
     *  - NextPageNumber <br />
     *  - LastPageNumber <br />
     * <br />
     * These 5 events come with a set of parameters: <br />
     *  - pageNumber {Integer} <br />
     *  - pageText {String} <br />
     *  - show {Boolean} <br />
     *  - select {Integer} <br />
     *  <br />
     * Except for the CurrentPageNumber which also contains two extra parameters: <br />
     *  - pageAlternativeNumber {Integer} <br />
     *  - pageAlternativeText {String} <br />
     *  <br />
     * The reason for this that the widget should be controlled by external buttons so that the pagination can be styled completely individually yet working via
     * the action event system. Let's go through these parameters step by step. <br />
     * 
     * The first pageNumber is pretty straight forward. It will display the current page in a number, this is use ful when you want to access this page, as a 
     *    button then will have access to a number it can pass back to the TableWidget.
     * The pageText is also simple to explain, the button cannot display a text that is of the type Integer, so it has to passed as a String aswell so it can be
     *    bound to the text value of the button.
     * The third parameter: show, is a bit harder. If a user is on first page, it doesn't make sense to show this button, as the user will not be able to select
     *    it anyway. For this the show parameter can be used. If it's false the button can be hidden or disabled.
     * The fourth parameter select is used for actually selecting a button. This parameter will be true for the page currently selected. In most cases this will
     *    only be the CurrentPageNumber. But when we start reaching the end of the pages the first/last or previous/next page numbers can also be selected.
     * 
     * This leads the last two parameters.
     * The pageAlternativeNumber will give the current page number, but will not decrease below 2 and will not increase above the last page minus 1
     * The pageAlternativeText is the same but as a text.
     * 
     * The reason for this that the external pagination can have a different number of setups.
     * If there is only one button/textoutput showing the current page the pageNumber/-Text should be used as it will go from 0 to last page.
     * But if the pagination incorporates three buttons: previous page, current page and next page then when you go to the first page, 
     * the previous button should show the first page, while the current page should show the first page + 1 (hence the alternative number). Likewise
     * when you go to the last page the next button should show the last page but the current page should show the last page - 1. To get these values
     * the alternative page number should be employed.
     *  <br />
     *    prev      curr      next                  prev      curr      next <br />
     *  _______   _______   _______               _______   _______   _______ <br />
     * |       | |       | |       |             |       | |       | |       | <br />
     * |   1   | |   2   | |   3   |      ==>    | n - 1 | |   n   | | n + 1 | <br />
     * |_______| |_______| |_______|             |_______| |_______| |_______| <br />
     * @param {Integer} curr the current page
     * @param {Integer} last the last page in the datatable
     */
    p._pageChange = function (curr, last) {
        var widget = this.widget;
        this.pageEventDispatcher.setCurrentPage(curr);
        this.pageEventDispatcher.setLastPage(last);
        var eventTypes = this.pageEventDispatcher.getEventTypes(),
            eventData;
        for (var i = 0; i < eventTypes.length; i++) {
            eventData = this.pageEventDispatcher.createPageEvent(eventTypes[i]);
            if (eventData !== null) {
                widget._pageChangeHandler(eventTypes[i], eventData);
            }
        }
    };

    /**
     * @method goToPage
     * @param {Integer} page
     * @param {String} type
     * This method is just a wrapper for the renderers goToPage method
     * See renderer for more info.
     * @return {Boolean}
     */
    p.goToPage = function (page, type) {
        return this.widget.renderer.goToPage(page, type);
    };

    /**
     * @method _setMissingBindingErrorMsg
     * When called this method updates the errorHandler that he MpLink binding is missing and which will set a warning over the widget so that it cannot be used.
     * Intended to be used during commissioning only. Widgets should not work without an mplink anyway.
     */
    p._setMissingBindingErrorMsg = function () {
        this.errorHandler.requiredBindingMissing('mpLink');
    };

    /**
     * @method addEventListenerOnItems
     * Iterates over all items and calls the appendEventListeners in all TableColumnWidgets. This will add the OrderHandler to the clickevent
     * so that when a click on a header element takes place the data can be reordered.
     */
    p.addEventListenerOnItems = function () {
        for (var i = 0; i < this.widget.settings.childrenList.length; i += 1) {
            brease.callWidget(this.widget.settings.childrenIdList[i], 'appendEventListeners');
        }
    };

    /**
     * @method disable
     * Method will call the renderers disable method and then iterate over all child widgets and set these to the disabled state.
     */
    p.disable = function () {
        this.widget.renderer.disable();
        for (var i = 0; i < this.widget.settings.childrenList.length; i += 1) {
            brease.callWidget(this.widget.settings.childrenIdList[i], 'disable');
        }
    };

    /**
     * @method enable
     * Method will call the renderers enable method and then iterate over all child widgets and set these to the enabled state.
     */
    p.enable = function () {
        this.widget.renderer.enable();
        for (var i = 0; i < this.widget.settings.childrenList.length; i += 1) {
            brease.callWidget(this.widget.settings.childrenIdList[i], 'enable');
        }
    };

    /**
     * @method dispose
     * This method will remove all eventlisteners from the DOM.
     * List of events removed:
     * 
     *  - ColumnWidthChanged
     *  - ColumnTypeChanged
     *  - ColumnOrderChanged
     *  - RendererInitialized
     *  - ValueChanged
     *  - BreaseEvent.WIDGET_READY
     *  - BreaseEvent.CLICK
     *  - BreaseEvent.MOUSE_DOWN
     *  - BreaseEvent.DBL_CLICK
     */
    p.dispose = function () {
        this.pageEventDispatcher.dispose();
        this.widget.elem.removeEventListener('ColumnWidthChanged', _.bind(_columnResizeHandler, this));
        this.widget.elem.removeEventListener('ColumnTypeChanged', _.bind(_columnTypeChangedHandler, this));
        this.widget.elem.removeEventListener('ColumnOrderChanged', _.bind(_columnOrderChangedHandler, this));
        this.widget.elem.removeEventListener('RendererInitialized', this._bind('_rendererInitialized'));
        this.widget.elem.removeEventListener('ValueChanged', this._bind('_submitSearchValueHandler'));
        this.widget.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_widgetReadyHandler'));
        this.widget.renderer.tableEl.off(BreaseEvent.CLICK, this._bind('_itemSelectHandler'));
        this.widget.renderer.tableEl.off(BreaseEvent.MOUSE_DOWN, this._bind('_mouseDownHandler'));
        this.widget.renderer.tableEl.off(BreaseEvent.DBL_CLICK, this._bind('_itemDoubleSelectHandler'));
    };

    /**
     * @method _getCurrentDataRow
     * @private
     * @return {Object} returns the row in the form of an object
     * Returns the data on the currently selected row
     */
    p._getCurrentDataRow = function () {
        return this.widget.renderer.getCurrentRow();
    };

    /**
     * @method _getRowIndex
     * @private
     * @return {Integer} index of currently selected row
     * Returns the index on the currently selected row
     */
    p._getRowIndex = function () {
        return this.widget.renderer.getRowIndex();
    };

    /**
     * @method _getRowIndices
     * @private
     * @return {Integer[]} indices of currently selected rows
     * Returns the indices of the currently selected rows
     */
    p._getRowIndices = function () {
        return this.widget.renderer.getRowIndices();
    };

    /**
     * @method _columnResizeHandler
     * @param {Object} e 
     * Updates the scroller, model, sets the column width for the changed column and finally updates the total maxwidth of the table.
     */
    function _columnResizeHandler(e) {
        this.widget.renderer.refreshScroller();
        this.widget.model.updateModel();

        this.widget.renderer.setColumnWidth(this.widget.model.childrenIdList.indexOf(e.detail.id), e.detail.newWidth);
        this.widget.renderer.setTableWidth(this.widget.model.maxWidth);
    }

    /**
     * @method _columnTypeChangedHandler
     * Rebuilds the view of the table.
     */
    function _columnTypeChangedHandler() {
        this.widget.renderer.rebuildView();
    }

    /**
     * @method _columnOrderChangedHandler
     * @param {Object} e
     * Iterates over the child widgets and resets the internal ordering of each and one of them, except for the item that dispatches this event.
     * Then updates the renderer of the new column ordering.
     */
    function _columnOrderChangedHandler(e) {
        for (var i = 0; i < this.widget.settings.childrenIdList.length; i += 1) {
            if (this.widget.settings.childrenIdList[i] !== e.detail.id) {
                brease.callWidget(this.widget.settings.childrenIdList[i], 'resetOrdering');
            }
        }
        this.widget.renderer.updateOrder(e.detail);
    }

    /**
     * @method _rendererInitialized
     * @param {Object} e
     * Method will add event handlers for the click and double click.
     */
    p._rendererInitialized = function (e) {
        this.widget.renderer.tableEl.on(BreaseEvent.CLICK, this._bind('_itemSelectHandler'));
        this.widget.renderer.tableEl.on(BreaseEvent.MOUSE_DOWN, this._bind('_mouseDownHandler'));
        this.widget.renderer.tableEl.on(BreaseEvent.DBL_CLICK, this._bind('_itemDoubleSelectHandler'));
        var table = this.widget.elem.querySelector('.dataTables_scrollBody');
        if (table !== null) {
            table.addEventListener('scroll', this._bind('_howFarScrolled'));
        }

        // this.widget.elem.addEventListener('page.dt', this._bind('_howFarPaged'));
        this.widget.el.on('page.dt', this._bind('_howFarPaged'));
    };

    /**
     * @method _howFarScrolled
     * @private
     * @param {Event} e
     */
    p._howFarScrolled = function (e) {
        var table = this.widget.elem.querySelector('.dataTables_scrollBody');
        if (table.offsetHeight + table.scrollTop >= table.scrollHeight - 500) {
            this._scrolledToBottom(e);
        }
    };
    p.howFarScrolledDefault = function (e) {
        this._scrolledToBottom(e);
    };

    /**
     * @method _scrolledToBottom
     * @private
     * @param {Event} e
     * This method will be called by the TableWidget when the scrolling starts to approach the end of the scrollable area
     * and should be used for updating data from the backend.
     */
    p._scrolledToBottom = function (e) {
        //Has to be overridden in a derived widget
    };

    /**
     * @method _howFarPaged
     * @private
     * @param {Event} e
     */
    p._howFarPaged = function (e) {
        var pageInfo = this.widget.renderer._getDataTablePageInfo();

        if (pageInfo.pages - 1 === pageInfo.page) {
            this._scrolledToBottom();
        }
    };

    /**
     * @method _addEventListener
     * @param {Object} that
     * Adds all event listeners necessary for the widget.
     */
    function _addEventListener(that) {
        that.widget.elem.addEventListener(BreaseEvent.WIDGET_READY, that._bind('_widgetReadyHandler'));
        that.widget.elem.addEventListener('ColumnWidthChanged', _.bind(_columnResizeHandler, that));
        that.widget.elem.addEventListener('ColumnTypeChanged', _.bind(_columnTypeChangedHandler, that));
        that.widget.elem.addEventListener('ColumnOrderChanged', _.bind(_columnOrderChangedHandler, that));
        that.widget.elem.addEventListener('RendererInitialized', that._bind('_rendererInitialized'));
    }
    
    return ControllerClass;
});
