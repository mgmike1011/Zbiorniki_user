define(['brease/controller/libs/FocusElem',
    'brease/events/BreaseEvent',
    'brease/enum/Enum',
    'brease/controller/libs/KeyActions',
    'brease/core/Utils', 
    'brease/events/VirtualEvents'], 
function (FocusElem, BreaseEvent, Enum, KeyActions, Utils, VirtualEvents) {

    'use strict';

    var FocusHandler = function (widget) {
            this.widget = widget;
            this.focusElems = [];
            this.focusPosition = 0;
            this.scrollTime = 100;
            this.rows = [];
            this.headerCells = [];
            this.dimensions = {};
            this.zoomFactor = 1;
            if (isFocusable(widget.getTabIndex())) {
                this._onDrawBinded = this.onDraw.bind(this);
                this._onBeforeDestroyBinded = this.onBeforeDestroy.bind(this);
                this.widget.eventDispatcher.addEventListener('draw', this._onDrawBinded);
                this.widget.eventDispatcher.addEventListener('before_destroy', this._onBeforeDestroyBinded);
                this.widget.el.on(BreaseEvent.BEFORE_ENABLE_CHANGE, _onBeforeEnableChange.bind(this));
                this.widget.el.on(BreaseEvent.BEFORE_VISIBLE_CHANGE, _onBeforeVisibleChange.bind(this));
                this._boundUpdateZoomFactor = _updateZoomFactor.bind(this);
                document.body.addEventListener(BreaseEvent.APP_RESIZE, this._boundUpdateZoomFactor);
            }
        },
        p = FocusHandler.prototype,
        itemFocusClass = 'elementFocus';

    p.focus = function () {
        if (brease.config.visu.keyboardOperation) {
            if (this.focusElems.length > 0) {
                this.focusElems[0].elem.focus({ preventScroll: true });
            } else {
                return null;
            }
        }
    };

    p.dispose = function () {
        this.widget.eventDispatcher.removeEventListener('draw', this._onDrawBinded);
        this.widget.eventDispatcher.removeEventListener('before_destroy', this._onBeforeDestroyBinded);
        this.widget.el.off(BreaseEvent.BEFORE_ENABLE_CHANGE);
        this.widget.el.off(BreaseEvent.BEFORE_VISIBLE_CHANGE);
        document.body.removeEventListener(BreaseEvent.APP_RESIZE, this._boundUpdateZoomFactor);
    };
    
    p.onBeforeDestroy = function () {
        _removeFocus.call(this, this.rows);
        this.focusElems.forEach(function (focusElem) {
            focusElem.dispose();
        });
        this.focusElems = [];
    };

    p.onDraw = function () {
        this.onBeforeDestroy();

        _setupHeader.call(this);
        _setupTable.call(this);
        _setupPagingButtons.call(this);
    };

    function _setupHeader() {
        var that = this;
        this.headerEl = this.widget.el.find('.tw_header');
        var headerFocusElem = new FocusElem(this.headerEl.get(0), _getFocusElemOptions.call(this));
        this.focusElems.push(headerFocusElem);
        
        this.headerEl.off('focus').on('focus', _onHeaderFocus.bind(this));
        this.headerEl.off('blur').on('blur', _onHeaderBlur.bind(this));
        this.headerEl.off(BreaseEvent.CLICK).on(BreaseEvent.CLICK, function (e) {
            _onClick.call(that, e, that.headerCells);
        });
        this.headerCells = this.widget.settings.childrenList.map(function (widget) {
            return widget.elem;
        });
    }

    function _getFocusElemOptions() {
        return { 
            tabIndex: this.widget.settings.tabIndex, 
            parentContentId: this.widget.getParentContentId(), 
            enable: this.widget.isEnabled(), 
            omitFocusStyle: true 
        };
    }

    function _setupTable() {
        this.rows = Array.from(this.widget.elem.querySelectorAll('tbody>tr')).filter(function (row) {
            return !row.children[0].classList.contains('dataTables_empty');
        });
        this.tableEl = this.widget.el.find('.tw_table');

        if (this.rows.length > 0) {
            var that = this;
            var tableFocusElem = new FocusElem(this.tableEl.get(0), _getFocusElemOptions.call(this));
            this.focusElems.push(tableFocusElem);
        
            this.tableEl.off('focus').on('focus', _onTableFocus.bind(this));
            this.tableEl.off('blur').on('blur', _onTableBlur.bind(this));
            this.tableEl.off(BreaseEvent.CLICK).on(BreaseEvent.CLICK, function (e) {
                _onClick.call(that, e, that.rows);
            });
    
            _updateZoomFactor.call(this);
            _restoreTableFocus.call(this);
        } else {
            // focusElem.dispose does not remove the tabIndex since we need it to restore the tableFocus
            // so we have to manually remove it if there are no rows
            this.tableEl.get(0).removeAttribute('tabIndex');
        }
    }

    // in case rows change (page change, data change) we could run into the problem that there is no row at focusPosition
    // => goto last valid row
    function _restoreTableFocus() {
        if (document.activeElement === this.tableEl.get(0)) {
            if (this.rows[this.focusPosition] === undefined) {
                this.focusPosition = this.rows.length - 1;
            }
            _focusItemByIndex.call(this, this.rows, this.focusPosition);
        }
    }

    function _setupPagingButtons() {
        var pagingButtons = this.widget.el.find('.paginate_button');
        for (var i = 0; i < pagingButtons.length; ++i) {
            var buttonElem = pagingButtons[i];
            var options = _getFocusElemOptions.call(this);
            options.omitFocusStyle = false;
            // paging buttons are always focusable regardless if widget is disabled
            options.enable = !buttonElem.classList.contains('disabled');
            
            var focusElem = new FocusElem(buttonElem, options);
            this.focusElems.push(focusElem);
        }
        _fixButtonFocusLostOnClick.call(this, pagingButtons);
        _fixButtonFocusLostOnEnter.call(this, pagingButtons);
    }

    function _onHeaderFocus(e) {
        var that = this;
        this.headerCells[this.focusPosition].classList.add(itemFocusClass);
        $(e.target).on('keydown', function (e) {
            _onKeyDown.call(that, e, that.headerCells);
        });
    }

    function _onHeaderBlur(e) {
        $(e.target).off('keydown');
        _removeFocus.call(this, this.headerCells);
        this.focusPosition = 0;
    }

    function _onKeyDown(e, elems) {
        var action = KeyActions.getActionForKey(e.key);

        if (action === Enum.KeyAction.Accept) {
            triggerVirtualClick(elems[this.focusPosition], e);
        } else if (e.currentTarget === this.tableEl.get(0)) {
            _handleTableAction.call(this, e, action);
        } else {
            _handleHeaderAction.call(this, e, action);
        }
    }

    function _handleTableAction(e, action) {
        if (action === Enum.KeyAction.ScrollDown) {
            stopEvent(e);
            _focusNext.call(this, this.rows);
        } else if (action === Enum.KeyAction.ScrollUp) {
            stopEvent(e);
            _focusPrevious.call(this, this.rows);
        } else if (action === Enum.KeyAction.ScrollDownFast) {
            stopEvent(e);
            _focusNextPage.call(this);
        } else if (action === Enum.KeyAction.ScrollUpFast) {
            stopEvent(e);
            _focusPreviousPage.call(this);
        }
    }

    function _handleHeaderAction(e, action) {
        if (action === Enum.KeyAction.ScrollRight) {
            stopEvent(e);
            _focusNext.call(this, this.headerCells);
        } else if (action === Enum.KeyAction.ScrollLeft) {
            stopEvent(e);
            _focusPrevious.call(this, this.headerCells);
        }
    }

    function _focusNext(elems) {
        elems[this.focusPosition].classList.remove(itemFocusClass);
        this.focusPosition++;
        if (this.focusPosition >= elems.length) {
            this.focusPosition = 0;
        }
        elems[this.focusPosition].classList.add(itemFocusClass);
        _scrollIntoView.call(this, elems[this.focusPosition]);
    }

    function _focusPrevious(elems) {
        elems[this.focusPosition].classList.remove(itemFocusClass);
        this.focusPosition--;
        if (this.focusPosition < 0) {
            this.focusPosition = elems.length - 1;
        }
        elems[this.focusPosition].classList.add(itemFocusClass);
        _scrollIntoView.call(this, elems[this.focusPosition]);
    }

    function _onClick(e, elems) {
        if (!this.widget.isEnabled()) {
            return;
        }
        var index = elems.findIndex(function (elem) {
            return elem.contains(e.target);
        });
        if (index >= 0 && index !== this.focusPosition) {
            e.currentTarget.focus(); // fix for touch before focus
            _focusItemByIndex.call(this, elems, index);
        }
    }

    function _focusItemByIndex(elems, index) {
        elems[this.focusPosition].classList.remove(itemFocusClass);
        this.focusPosition = index;
        elems[this.focusPosition].classList.add(itemFocusClass);
    }

    function _onTableFocus(e) {
        var that = this;
        this.rows[this.focusPosition].classList.add(itemFocusClass);
        _scrollIntoView.call(this, this.rows[this.focusPosition]);
        $(e.target).on('keydown', function (e) {
            _onKeyDown.call(that, e, that.rows);
        });
    }

    function _onTableBlur(e) {
        $(e.target).off('keydown');
        _removeFocus.call(this, this.rows);
        this.focusPosition = 0;
    }

    function _removeFocus(elems) {
        elems.forEach(function (elem) {
            elem.classList.remove(itemFocusClass);
        });
    }

    function _onBeforeEnableChange(e) {
        if (e.target !== this.widget.elem) return;
        var enable = e.detail.value;
        if (enable) {
            this.focusElems.forEach(function (focusElem) {
                if (!focusElem.elem.classList.contains('paginate_button')) {
                    focusElem.enable();
                }
            });
        } else {
            _removeFocus(this.rows);
            _removeFocus(this.headerCells);
            this.focusElems.forEach(function (focusElem) {
                if (!focusElem.elem.classList.contains('paginate_button')) {
                    focusElem.disable();
                }
            });
        }
    }

    function _onBeforeVisibleChange(e) {
        if (e.target !== this.widget.elem) return;
        var visible = e.detail.value;
        var searchBox = this.widget.elem.querySelectorAll('.tw_top_bar .breaseTextInput')[0];
        if (searchBox) {
            searchBox.dispatchEvent(new CustomEvent(BreaseEvent.BEFORE_VISIBLE_CHANGE, { detail: { value: visible }, bubbles: true }));
        }
        if (visible) {
            this.focusElems.forEach(function (focusElem) {
                focusElem.show();
            });
        } else {
            _removeFocus(this.rows);
            _removeFocus(this.headerCells);
            this.focusElems.forEach(function (focusElem) {
                focusElem.hide();
            });
        }
    }

    function _fixButtonFocusLostOnClick(pagingButtons) {
        // after clicking the paging button all buttons are recreated by datatable
        // then we have to manually set the focus to the new button
        var that = this;

        pagingButtons.off(BreaseEvent.MOUSE_UP).on(BreaseEvent.MOUSE_UP, function (e) {
            that.prevFocusedButtonIdx = parseInt(e.target.dataset.dtIdx, 10);
            // jquery dataTable calls blur on click on button which is active => see 5242
            if (e.target.classList.contains('current')) {
                window.setTimeout(function () {
                    e.target.focus();
                }, 1);
            }
        });
        if (this.prevFocusedButtonIdx !== undefined) {
            _restoreButtonFocus.call(this, pagingButtons, this.prevFocusedButtonIdx);
        }
        that.prevFocusedButtonIdx = undefined;
    }

    function _fixButtonFocusLostOnEnter(pagingButtons) {
        var that = this;
        pagingButtons.off('keydown').on('keydown', function (e) {
            var action = KeyActions.getActionForKey(e.key);
            if (action === Enum.KeyAction.Accept) {
                that.prevKeyFocusedButtonIdx = parseInt(e.target.dataset.dtIdx, 10);
            }
        });
        if (this.prevKeyFocusedButtonIdx !== undefined && document.activeElement.isSameNode(document.body)) {
            _restoreButtonFocus.call(this, pagingButtons, this.prevKeyFocusedButtonIdx);
        }
        that.prevKeyFocusedButtonIdx = undefined;
    }

    function _restoreButtonFocus(pagingButtons, idx) {
        if (pagingButtons[idx].classList.contains('disabled')) {
            if (pagingButtons[idx].classList.contains('previous')) {
                pagingButtons[idx + 1].focus();
            } else { // next button
                pagingButtons[idx - 1].focus();
                brease.focusManager.focusNext();
            }
        } else {
            pagingButtons[idx].focus();
        }
    }

    function _updateZoomFactor() {
        if (this.tableEl) {
            this.zoomFactor = Utils.getScaleFactor(this.tableEl.get(0));
            delete this.dimensions.rowHeight;
            delete this.dimensions.height;
        }
    }

    function _getRowHeight() {
        if (!this.dimensions.rowHeight) {
            this.dimensions.rowHeight = this.rows[0].getBoundingClientRect().height;
        }
        return this.dimensions.rowHeight;
    }

    function _getTableHeight() {
        if (!this.dimensions.height) {
            var container = this.tableEl.get(0),
                containerRect = container.getBoundingClientRect();
            this.dimensions.height = containerRect.height;
        }
        return this.dimensions.height;
    }

    function _scrollIntoView(elem) {
        var scroller;
        if (this.rows.includes(elem)) {
            scroller = this.widget.getScroller();

            if (scroller && elem && !_isRowInView.call(this, elem)) {
                scroller.scrollToElement(elem, this.scrollTime, 0, true);
            }
        } else { //if (this.headerCells.includes(elem)) {
            scroller = this.widget.getHeaderScroller();

            if (scroller && elem && !_isHeaderInView.call(this, elem)) {
                scroller.scrollToElement(elem, this.scrollTime, true, 0);
            }
        }
    }

    /*
    * @method 
    * Check if row is completely in view
    * @param {HTMLElement} elem
    * @return {Boolean}
     */
    function _isRowInView(elem) {
        var scrollOffset = _getTableScrollOffset.call(this),
            index = _getIndexOfRow.call(this, elem),
            rowHeight = _getRowHeight.call(this),
            height = _getTableHeight.call(this),
            itemTop = index * rowHeight - scrollOffset;
        // console.log('itemTop:' + itemTop + ' rowHeight:' + this.dimensions.rowHeight + ' containerHeight:' + this.dimensions.height);
        return itemTop >= 0 && (itemTop + rowHeight <= height);
    }

    /*
    * @method 
    * Check if header is completely in view
    * @param {HTMLElement} elem
    * @return {Boolean}
     */
    function _isHeaderInView(elem) {
        var scrollOffset = _getHeaderScrollOffset.call(this),
            itemLeft = elem.offsetLeft - scrollOffset,
            cellWidth = elem.offsetWidth;
        // console.log('scrollOffset: ' + scrollOffset + ' elem.offsetLeft' + elem.offsetLeft);
        // console.log('itemLeft:' + itemLeft + ' cellWidth:' + cellWidth + ' offsetWidth:' + this.headerEl.get(0).offsetWidth);
        return itemLeft >= 0 && (itemLeft + cellWidth <= this.headerEl.get(0).offsetWidth);
    }

    /*
    * @method 
    * Returns the offset of the scroll-wrapper as positive Number
    * @return {Number}
     */
    function _getTableScrollOffset() {
        var scroller = this.widget.getScroller();
        if (scroller) {
            if (typeof scroller.scrollBy === 'function') {
                return Math.abs(scroller.y) * this.zoomFactor;
            } else {
                return this.tableEl.get(0).getElementsByClassName('dataTables_scrollBody')[0].scrollTop * this.zoomFactor;
            }
        } else {
            return 0;
        }
    }
    
    /*
    * @method 
    * Returns the offset of the scroll-wrapper as positive Number
    * @return {Number}
     */
    function _getHeaderScrollOffset() {
        // get header scroller!
        var scroller = this.widget.getHeaderScroller();
        if (scroller) {
            return Math.abs(scroller.x);
        } else {
            return 0;
        }
    }

    function _getIndexOfRow(elem) {
        return Array.prototype.indexOf.call(this.rows, elem);
    }

    /*
    * @method 
    * If the focused item is not the last item, which is completely in view -> focus the last item completely in view  
    * If the focused item is the last item, which is completely in view -> focus some following item and scroll to that  
    * 1) the new focused item is on bottom of the ListBox  
    * 2) the previous focused item is visible on top of the ListBox (not necessarily complete)
    * If the focused item is the last item of the list -> do nothing  
     */
    function _focusNextPage() {
        var lastIndexInView = _findLastIndexInView.call(this),
            focusedIndex = _getIndexOfRow.call(this, this.rows[this.focusPosition]);
    
        if (lastIndexInView === focusedIndex) {
            //jump one page
            var rowHeight = _getRowHeight.call(this);
            var height = _getTableHeight.call(this);
            var pageIndexOffset = Math.max(1, getPageIndexOffset(height, rowHeight) - 1);
            var maxIndex = this.rows.length - 1;
            var nextIndex = Math.min(focusedIndex + pageIndexOffset, maxIndex); 
            if (nextIndex > focusedIndex) {
                _focusItemByIndex.call(this, this.rows, nextIndex);
                var focusElem = this.rows[this.focusPosition];
                _scrollToItem.call(this, focusElem, -Math.trunc(height - rowHeight) / this.zoomFactor);
            }
        } else {
            _focusItemByIndex.call(this, this.rows, lastIndexInView);
        }
    }

    function getPageIndexOffset(height, rowHeight) {
        return Math.ceil(height / rowHeight) - 1;
    }

    /*
    * @method 
    * If the focused item is not the first item, which is completely in view -> focus the first item completely in view  
    * If the focused item is the first item, which is completely in view -> focus some previous item and scroll so that  
    * 1) the new focused item is on top of the ListBox  
    * 2) the previous focused item is visible on bottom of the ListBox (not necessarily complete)
    * If the focused item is the first item of the list -> do nothing  
     */
    function _focusPreviousPage() {
        var firstIndexInView = findFirstIndexInView.call(this),
            focusedIndex = _getIndexOfRow.call(this, this.rows[this.focusPosition]);
    
        if (firstIndexInView === focusedIndex) {
            //jump one page
            var rowHeight = _getRowHeight.call(this);
            var height = _getTableHeight.call(this);
            var pageIndexOffset = Math.max(1, getPageIndexOffset(height, rowHeight) - 1);
            var prevIndex = Math.max(focusedIndex - pageIndexOffset, 0);
            if (prevIndex < focusedIndex) {
                _focusItemByIndex.call(this, this.rows, prevIndex);
                var focusElem = this.rows[this.focusPosition];
                _scrollToItem.call(this, focusElem, 0);
            }
        } else {
            _focusItemByIndex.call(this, this.rows, firstIndexInView);
        }
    }

    /*
    * @method 
    * Get the highest index of items, which are completely in view
    * @return {Integer}
     */
    function _findLastIndexInView() {
        var rowHeight = _getRowHeight.call(this),
            scrollOffset = _getTableScrollOffset.call(this),
            containerHeight = _getTableHeight.call(this);
            
        var f = (containerHeight + scrollOffset) / rowHeight,
            rounded = Utils.roundTo(f, 2),
            index = Math.floor(rounded) - 1;
        // console.log('rowHeight: ' + rowHeight, ' scrollOffset: ' + scrollOffset + ' height:' + containerHeight + ' f:' + f, ' rounded:' + rounded + ' index:' + index);
        var maxIndex = this.rows.length - 1;
        return Math.min(index, maxIndex);
    }

    /*
    * @method 
    * Get the lowest index of items, which are completely in view
    * @return {Integer}
     */
    function findFirstIndexInView() {
        var rowHeight = _getRowHeight.call(this),
            scrollOffset = _getTableScrollOffset.call(this);
    
        var f = scrollOffset / rowHeight,
            rounded = Utils.roundTo(f, 2),
            index = Math.ceil(rounded);
        // console.log('rowHeight: ' + rowHeight, ' scrollOffset: ' + scrollOffset + ' f:' + f, ' rounded:' + rounded + ' index:' + index);
        return Math.max(index, 0);
    }

    function _scrollToItem(elem, offsetY) {
        var scroller = this.widget.getScroller();
        if (scroller && elem) {
            scroller.scrollToElement(elem, this.scrollTime, 0, offsetY);
        }
    }

    function isFocusable(tabIndex) {
        return brease.config.isKeyboardOperationEnabled() && tabIndex > -1 && !brease.config.editMode;
    }

    // stop event from trigger scrolling, esc dialog..
    function stopEvent(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    function triggerVirtualClick(elem, e) {
        var type = BreaseEvent.CLICK;
        var rect = elem.getBoundingClientRect(),
            ev = new MouseEvent(type.substring(1), {
                bubbles: true,
                cancelable: true,
                clientX: rect.left,
                clientY: rect.top,
                view: window
            });
        ev.originalEvent = e;
        VirtualEvents.triggerVirtualEvent(elem, type, ev, { pointerId: 0 });
    }

    return FocusHandler;
});
