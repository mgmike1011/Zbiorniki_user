define([
    'widgets/brease/DataHandlerWidget/DataHandlerWidget',
    'brease/events/EventDispatcher',
    'brease/enum/Enum',
    'widgets/brease/TableWidget/libs/Renderer',
    'widgets/brease/TableWidget/libs/Controller',
    'widgets/brease/TableWidget/libs/Model',
    'widgets/brease/TableWidget/libs/FocusHandler',
    'brease/decorators/CultureDependency',
    'brease/decorators/MeasurementSystemDependency',
    'brease/decorators/VisibilityDependency',
    'widgets/brease/TableWidget/libs/ConfigBuilder',
    'widgets/brease/common/BusyIndicatorHandler/libs/BusyIndicatorHandler'
], function (
    SuperClass, EventDispatcher, Enum, Renderer, Controller,
    Model, FocusHandler, CultureDependency,
    MeasurementSystemDependency, VisibilityDependency, ConfigBuilder,
    BusyIndicatorHandler
) {

    'use strict';

    /**
     * @class widgets.brease.TableWidget
     * @extends widgets.brease.DataHandlerWidget
     * @requires widgets.brease.TextInput
     * @requires widgets.brease.Label
     * @requires widgets.brease.NumericInput
     * @requires widgets.brease.CheckBox
     * @requires widgets.brease.DateTimeInput
     * @requires widgets.brease.Image
     * @requires widgets.brease.Rectangle
     * @requires widgets.brease.DropDownBox
     * @requires widgets.brease.GenericDialog
     * @requires widgets.brease.BusyIndicator
     * @iatMeta studio:isContainer
     * true
     * @iatMeta studio:visible
     * false
     * 
     * @author malmbergj
     * @author holznera
     * 
     * @iatMeta category:Category
     * Data
     *
     * @iatMeta description:short
     * Superclass for Alarmlist and other table dependent Mapp connected widgets, not to be shown in Automation Studio
     * @iatMeta description:de
     * Superclass for Alarmlist and other table dependent Mapp connected widgets, not to be shown in Automation Studio
     * @iatMeta description:en
     * Superclass for Alarmlist and other table dependent Mapp connected widgets, not to be shown in Automation Studio
     */

    /**
     * @cfg {UInteger} headerHeight=40
     * @iatStudioExposed
     * @iatCategory Appearance 
     * Table header height
     */

    /**
     * @cfg {Boolean} paging=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * If TRUE, predefined paging will be used
     */

    /**
     * @cfg {Boolean} showPagingButtons=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * If TRUE, the paging buttons will be shown, else external paging has to be used.
     */

    /**
     * @cfg {Boolean} searchBox=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * If TRUE, predefined search box will be used
     */

    /**
     * @cfg {Integer} itemsPerPage=3
     * @iatStudioExposed
     * @iatCategory Behavior
     * Sets the number of items per page that will be displayed when paging is enabled
     */

    /**
     * @cfg {String} previousText='Previous'
     * @iatStudioExposed
     * @localizable
     * @iatCategory Appearance
     * Text for the 'Previous' button
     */

    /**
     * @cfg {String} nextText='Next'
     * @iatStudioExposed
     * @localizable
     * @iatCategory Appearance
     * Text for the 'Next' button
     */

    /**
     * @cfg {Integer} rowHeight=0
     * @localizable
     * @iatCategory Layout
     * A fixed height in pixels a row should take up
     */

    /**
     * @cfg {String} filterConfiguration=''
     * @iatStudioExposed
     * @bindable
     * @iatCategory Data
     * configuration used to set the filter for the alarmlist, predefined structure. Use from the runtime.
     */

    /**
     * @cfg {String} sortConfiguration=''
     * @iatStudioExposed
     * @bindable
     * @iatCategory Data
     * configuration used to set the filter for the alarmlist, predefined structure. Use from the runtime.
     */

    /**
     * @cfg {String} styleConfiguration=''
     * @iatStudioExposed
     * @bindable
     * @iatCategory Data
     * configuration used to set the filter for the alarmlist, predefined structure. Use from the runtime.
     */

    /**
     * @cfg {String} format='F'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * @bindable
     * Specifies the format of the time shown in the input field. This is either a format string (ee.g. "HH:mm") or a pattern ("F").
     */

    /**
    * @cfg {Boolean} focusable=false
    * The widget will not be added to the focus chain if this option is set to false.
    * It should be used if a widget has child widgets which derive the tabIndex from its parent but the parent widget itselfe should not be focusable. (i.e Login)
    * The difference to tabIndex=-1 is that the user can still set a tabIndex and the widget can forward the tabIndex to its child widgets.
    */

    /**
     * @event FirstPageNumber
     * Fires every time there is a page change, updates the First page.
     * @param {Integer} pageNumber
     * @param {String} pageText
     * @param {Boolean} show
     * @param {Integer} select
     * @iatStudioExposed
     */

    /**
     * @event LastPageNumber
     * Fires every time there is a page change, updates the Last page.
     * @param {Integer} pageNumber
     * @param {String} pageText
     * @param {Boolean} show
     * @param {Integer} select
     * @iatStudioExposed
     */

    /**
     * @event NextPageNumber
     * Fires every time there is a page change, updates the Next page after the current page.
     * @param {Integer} pageNumber
     * @param {String} pageText
     * @param {Boolean} show
     * @param {Integer} select
     * @iatStudioExposed
     */

    /**
     * @event PreviousPageNumber
     * Fires every time there is a page change, updates the Next page before the current page.
     * @param {Integer} pageNumber
     * @param {String} pageText
     * @param {Boolean} show
     * @param {Integer} select
     * @iatStudioExposed
     */

    /**
     * @event CurrentPageNumber
     * Fires every time there is a page change, updates the Current page, which is currently displayed.
     * @param {Integer} pageNumber
     * @param {String} pageText
     * @param {Boolean} show
     * @param {Integer} select
     * @param {Integer} pageAlternativeNumber
     * @param {String} pageAlternativeText
     * @iatStudioExposed
     */

    /**
    * @cfg {Integer} busyIndicatorDelay=0
    * @iatStudioExposed
    * @iatCategory Behavior
    * delay time for busy indicator [ms]
    */

    /**
     * @property {WidgetList} children=["widgets.brease.TableColumnWidget"]
     * @inheritdoc  
     */

    /**
    * @event FocusIn
    * @hide
    */

    /**
    * @event FocusOut
    * @hide
    */

    var defaultSettings = {
            childrenInitialized: false,
            childrenList: [],
            childrenIdList: [],
            childrenColumnWidths: [],
            counter: 0,
            headerHeight: 40,
            itemsPerPage: 3,
            searchBox: true,
            optimize: (brease.config.WidgetData.renderingPolicy === Enum.RenderingPolicy.PERFORMANCE),
            paging: true,
            showPagingButtons: (brease.config.WidgetData.renderingPolicy === Enum.RenderingPolicy.DEFAULT),
            nextText: 'Next',
            previousText: 'Previous',
            nextTextKey: null,
            previousTextKey: null,
            rowHeight: 0,
            format: 'F',
            formatKey: '',
            filterConfiguration: '',
            sortConfiguration: '',
            styleConfiguration: '',
            config: {
                hidden: { data: '' }
            },
            busyIndicatorDelay: 0,
            focusable: false
        },

        WidgetClass = SuperClass.extend(function TableWidget() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {
        this.eventDispatcher = new EventDispatcher();
        this.focusHandler = new FocusHandler(this);
        this.busyIndicatorHandler = new BusyIndicatorHandler(this);
        this.initRenderer();
        this.initController();
        this.initModel();
       
        SuperClass.prototype.init.call(this);

        if (!brease.config.editMode) {
            this.updateConfigurations();
            this.setFormat(this.settings.format);
        }
    };

    p._initEditor = function () {
        var widget = this;
        this.elem.classList.add('iatd-outline');

        require(['widgets/brease/TableWidget/libs/EditorBehavior'], function (EditorBehavior) {
            widget.editorBehavior = new EditorBehavior(widget);
            widget.el.addClass('iatd-outline');
            widget.el.addClass('iat-container-widget');
            widget.editorBehavior.initialize();
            widget.el.append($('<div id="fakeRowHeight"/>'));
            widget.settings.rowHeight = widget.el.find('#fakeRowHeight').height();
        });
    };

    p.initController = function () {
        this.controller = new Controller(this);
        this.controller.initialize();
    };

    p.initRenderer = function () {
        this.renderer = new Renderer(this);
        this.renderer.initialize();
    };

    p.initModel = function () {
        this.model = new Model(this);
        this.model.initialize();
    };

    /**
     * @method setTabIndex
     * Sets the state of property «tabIndex»
     * @param {Number} value
     */
    p.setTabIndex = function (value) {
        if (this.renderer) {
            brease.callWidget(this.renderer.searchBoxId, 'setTabIndex', value);
        }
        SuperClass.prototype.setTabIndex.call(this, value);
    };

    /**
    * @method focus
    * @iatStudioExposed
    * Sets focus on the search box or header element, if it can be focused and keyboardOperation=true
    */
    p.focus = function () {
        if (this.getSearchBox()) {
            return brease.callWidget(this.renderer.searchBoxId, 'focus');
        } else {
            return this.focusHandler.focus();
        }
    };

    p.getScroller = function () {
        if (this.settings.optimize) {
            return this.renderer.ns;
        }
        return this.renderer.scrollerBody;
    };

    p.getHeaderScroller = function () {
        return this.renderer.scrollerHead;
    };

    /**
     * @method setItemsPerPage
     * Sets itemsPerPage
     * @param {Integer} itemsPerPage
     */
    p.setItemsPerPage = function (itemsPerPage) {
        this.settings.itemsPerPage = (itemsPerPage <= 0) ? 1 : itemsPerPage;
        this.renderer.setItemsPerPage();
    };

    /**
     * @method getItemsPerPage 
     * Returns itemsPerPage.
     * @return {Integer}
     */
    p.getItemsPerPage = function () {
        return this.settings.itemsPerPage;
    };

    /**
     * @method setPaging
     * Sets Paging
     * @param {Boolean} paging
     */
    p.setPaging = function (paging) {
        this.settings.paging = paging && !this.settings.optimize;
        this.renderer.setPaging(this.settings.paging);
    };

    /**
     * @method getPaging
     * Returns paging
     * @return {Boolean}
     */
    p.getPaging = function () {
        return this.settings.paging;
    };

    /**
     * @method setShowPagingButtons
     * Sets ShowPagingButtons
     * @param {Boolean} showPagingButtons
     */
    p.setShowPagingButtons = function (showPagingButtons) {
        this.settings.showPagingButtons = showPagingButtons;
        this.renderer.setPaging(this.settings.paging);
    };

    /**
     * @method getShowPagingButtons
     * Returns ShowPagingButtons
     * @return {Boolean}
     */
    p.getShowPagingButtons = function () {
        return this.settings.showPagingButtons;
    };

    /**
     * @method setSearchBox
     * Sets searchBox
     * @param {Boolean} searchBox
     */
    p.setSearchBox = function (searchBox) {
        this.settings.searchBox = searchBox;
        this.renderer.setSearchBox(searchBox);
    };

    /**
     * @method getSearchBox
     * Returns searchBox
     * @return {Boolean}
     */
    p.getSearchBox = function () {
        return this.settings.searchBox;
    };

    /**
     * @method setPreviousText
     * Sets previousText
     * @param {String} previousText
     */
    p.setPreviousText = function (previousText) {
        if (previousText !== undefined) {
            if (brease.language.isKey(previousText) === false) {
                this.updatePreviousText(previousText);
                this.previousTextKey = null;
            } else {
                this.setPreviousTextKey(brease.language.parseKey(previousText));
            }
        }
    };

    /**
     * @method getPreviousText
     * Returns previousText
     * @return {String}
     */
    p.getPreviousText = function () {
        return this.settings.previousText;
    };

    /**
     * @method setPreviousTextKey
     * set the textkey
     * @param {String} key The new textkey
     */
    p.setPreviousTextKey = function (key) {
        if (key !== undefined) {
            this.settings.previousTextKey = key;
            this.updatePreviousText(brease.language.getTextByKey(this.settings.previousTextKey));
        }
    };

    /**
     * @method getPreviousTextKey
     * get the textkey
     */
    p.getPreviousTextKey = function () {
        return this.settings.previousTextKey;
    };

    p.updatePreviousText = function (previousText) {
        this.settings.previousText = previousText;
        this._updateTexts();
    };

    /**
     * @method setNextText
     * Sets nextText
     * @param {String} nextText
     */
    p.setNextText = function (nextText) {
        if (nextText !== undefined) {
            if (brease.language.isKey(nextText) === false) {
                this.updateNextText(nextText);
                this.nextTextKey = null;
            } else {
                this.setNextTextKey(brease.language.parseKey(nextText));
            }
        }
    };

    /**
     * @method getNextText
     * Returns nextText
     * @return {String}
     */
    p.getNextText = function () {
        return this.settings.nextText;
    };

    /**
     * @method setNextTextKey
     * set the textkey
     * @param {String} key The new textkey
     */
    p.setNextTextKey = function (key) {
        if (key !== undefined) {
            this.settings.nextTextKey = key;
            this.updateNextText(brease.language.getTextByKey(this.settings.nextTextKey));
        }
    };

    /**
     * @method getNextTextKey
     * get the textkey
     */
    p.getNextTextKey = function () {
        return this.settings.nextTextKey;
    };

    p.updateNextText = function (nextText) {
        this.settings.nextText = nextText;
        this._updateTexts();
    };

    /**
     * @method setHeaderHeight
     * Sets headerHeaderHeight
     * @param {PixelVal} headerHeaderHeight
     */
    p.setHeaderHeight = function (headerHeight) {
        this.settings.headerHeight = headerHeight;
        this.renderer.setHeaderHeight();
    };

    /**
     * @method getHeaderHeight 
     * Returns headerHeight.
     * @return {PixelVal}
     */
    p.getHeaderHeight = function () {
        return this.settings.headerHeight;
    };

    p.setTexts = function () {
        this.setNextText(this.settings.nextText);
        this.setPreviousText(this.settings.previousText);
    };

    /**
     * @method setRowHeight
     * Sets rowHeight
     * @param {String} rowHeight
     */
    p.setRowHeight = function (rowHeight) {
        this.settings.rowHeight = rowHeight;
    };

    /**
     * @method getRowHeight
     * Returns rowHeight
     * @return {String}
     */
    p.getRowHeight = function () {
        return this.settings.rowHeight;
    };

    /**
     * @method setFormat
     * Sets format
     * @param {String} format
     */
    p.setFormat = function (format) {
        if (format !== undefined) {
            if (brease.language.isKey(format) === false) {
                this.settings.format = format;
                this.settings.formatKey = undefined;
            } else {
                this.setFormatKey(brease.language.parseKey(format));
            }

            if (brease.config.editMode) {
                this.controller.updateData();
            } else {
                this.controller.languageChanged();
            }
        }
    };

    /**
     * @method getFormat 
     * Returns format.
     * @return {String}
     */
    p.getFormat = function () {
        return this.settings.format;
    };

    p.setFormatKey = function (key) {
        //console.debug(WidgetClass.name + '[id=' + this.elem.id + '].setTextKey:', key);
        if (key !== undefined) {
            this.settings.formatKey = key;
            this.setCultureDependency(true);
            var format = brease.language.getTextByKey(this.settings.formatKey);
            if (format !== 'undefined key') {
                this.settings.format = format;
            } else {
                console.iatWarn(this.elem.id + ': Format textKey not found: ' + key);
            }
        } else {
            this.settings.formatKey = undefined;
            console.iatInfo(this.elem.id + ': The text key is not valid : ' + key);
        }
    };

    /**
     * @method setFilterConfiguration
     * Sets filterConfiguration
     * @param {String} filterConfiguration
     */
    p.setFilterConfiguration = function (filterConfiguration) {
        this.settings.filterConfiguration = filterConfiguration;
        if (!brease.config.editMode) {
            this.updateConfigurations();
        }
    };

    /**
     * @method getFilterConfiguration
     * Returns filterConfiguration
     * @return {String}
     */
    p.getFilterConfiguration = function () {
        return this.settings.filterConfiguration;
    };

    /**
     * @method setSortConfiguration
     * Sets sortConfiguration
     * @param {String} sortConfiguration
     */
    p.setSortConfiguration = function (sortConfiguration) {
        this.settings.sortConfiguration = sortConfiguration;
        if (!brease.config.editMode) {
            this.updateConfigurations();
        }
    };

    /**
     * @method getSortConfiguration
     * Returns sortConfiguration
     * @return {String}
     */
    p.getSortConfiguration = function () {
        return this.settings.sortConfiguration;
    };

    /**
     * @method setStyleConfiguration
     * Sets styleConfiguration
     * @param {String} styleConfiguration
     */
    p.setStyleConfiguration = function (styleConfiguration) {
        this.settings.styleConfiguration = styleConfiguration;
        if (!brease.config.editMode) {
            this.updateConfigurations();
        }
    };

    /**
     * @method getStyleConfiguration
     * Returns styleConfiguration
     * @return {String}
     */
    p.getStyleConfiguration = function () {
        return this.settings.styleConfiguration;
    };

    /**
    * @method setBusyIndicatorDelay
    * Sets busyIndicatorDelay
    * @param {Integer} busyIndicatorDelay
    */
    p.setBusyIndicatorDelay = function (busyIndicatorDelay) {
        this.settings.busyIndicatorDelay = busyIndicatorDelay;
    };

    /**
    * @method getBusyIndicatorDelay
    * Returns busyIndicatorDelay
    * @param {Integer} busyIndicatorDelay
    */
    p.getBusyIndicatorDelay = function () {
        return this.settings.busyIndicatorDelay;
    };

    p._onErrorHandler = function (result) {
        if (brease.config.editMode) { return; }
        this._hideBusyIndicator();

        /**
         * @event OnError
         * Fired when mapp Component sends an Error.
         * @param {Integer} result
         * @iatStudioExposed
         */
        var onErrorEv = this.createEvent('OnError', { result: result });
        onErrorEv.dispatch();
    };

    p._itemClickHandler = function (item, e) {
        if (this.isDisabled) { return; }

        var clickEv = this.createMouseEvent('ItemClick', item, e);
        clickEv.dispatch();
    };

    p._itemDoubleClickHandler = function (item, e) {
        if (this.isDisabled) { return; }

        var clickEv = this.createMouseEvent('ItemDoubleClick', item, e);
        clickEv.dispatch();
    };
    
    p._clickHandler = function (e) {
        this.renderer._clickHandler(e);
        SuperClass.prototype._clickHandler.call(this, e, { origin: this.elem.id });
    };

    p._pageChangeHandler = function (func, item) {
        if (this.isDisabled) { return; }

        var pageChangeEvent = this.createEvent(func, item);
        pageChangeEvent.dispatch();
    };

    /**
     * @method openConfiguration
     * Open the filter part of the configuration dialogue
     * @iatStudioExposed
     * @param {MappTableConfigurationType} type (Supported types: Filtering, Sorting and Styling)
     */
    p.openConfiguration = function (type) {
        if (this.isDisabled) { return; }

        if (type === 'Filtering') {
            this.controller.openConf('filter');
        } else if (type === 'Sorting') {
            this.controller.openConf('sort');
        } else if (type === 'Styling') {
            this.controller.openConf('style');
        } else {
            console.iatWarn('Unsupported configuration type!');
        }
    };

    /**
     * @method goToPage
     * @iatStudioExposed
     * @param {Integer} value 
     * @return {Boolean}
     * Navigates to the page given by the value
     */
    p.goToPage = function (value) {
        return this.controller.goToPage(value, 'number');
    };

    /**
     * @method goToFirstPage
     * @iatStudioExposed
     * @return {Boolean}
     * Navigates to the page given by the value, and returns true or false if it worked respectively failed
     */
    p.goToFirstPage = function () {
        return this.controller.goToPage(undefined, 'first');
    };

    /**
     * @method goToLastPage
     * @iatStudioExposed
     * @return {Boolean}
     * Navigates to the page given by the value
     */
    p.goToLastPage = function () {
        return this.controller.goToPage(undefined, 'last');
    };

    /**
     * @method goToNextPage
     * @iatStudioExposed
     * @return {Boolean}
     * Navigates to the page given by the value
     */
    p.goToNextPage = function () {
        return this.controller.goToPage(undefined, 'next');
    };

    /**
     * @method goToPreviousPage
     * @iatStudioExposed
     * @return {Boolean}
     * Navigates to the page given by the value
     */
    p.goToPreviousPage = function () {
        return this.controller.goToPage(undefined, 'prev');
    };

    p.cultureChangeHandler = function (e) {
        if (e !== undefined || e.detail !== undefined) {
            if (this.settings.nextTextKey) {
                this.setNextText(brease.language.getTextByKey(this.settings.nextTextKey));
            }
            if (this.settings.previousTextKey) {
                this.setPreviousText(brease.language.getTextByKey(this.settings.previousTextKey));
            }

            if (this.settings.formatKey) {
                this.setFormatKey(this.settings.formatKey);
            }
        }

        this.controller.languageChanged();
    };

    p.measurementSystemChangeHandler = function () {
        this.controller.languageChanged();
    };

    p.childrenInitializedHandler = function () {
        SuperClass.prototype.childrenInitializedHandler.call(this);
        this.controller.childrenInitializedHandler();
    };

    p.childrenParsed = function (e) {
        SuperClass.prototype.childrenParsed.call(this, e);

        this.editorBehavior.childrenAdded(e);
    };

    p.childrenAdded = function (e) {
        SuperClass.prototype.childrenAdded.call(this, e);

        this.editorBehavior.childrenAdded(e);

        if (this.isDisabled) {
            this.controller.disable();
        }
    };

    p.childrenRemoved = function (e) {
        this.editorBehavior.childrenRemoved(e);
    };

    p.updateConfigurations = function () {
        if (brease.config.editMode) { return; }

        var configBuilder = new ConfigBuilder();
        this.settings.config.filter = configBuilder.parse('filter', this.settings.filterConfiguration, this.elem.id);
        this.settings.config.sort = configBuilder.parse('sort', this.settings.sortConfiguration, this.elem.id);
        this.settings.config.style = configBuilder.parse('style', this.settings.styleConfiguration, this.elem.id);
        this.renderer.redraw();
    };

    p.sendConfiguration = function (type) {
        var configBuilder = new ConfigBuilder(),
            conf = type + 'Configuration';
        this.settings[conf] = configBuilder.serialize(type, this.settings.config[type]);
        var sendObj = {};
        sendObj[conf] = this.settings[conf];
        this.sendValueChange(sendObj);
    };

    p.dispose = function () {
        this.focusHandler.dispose();
        this.controller.dispose();
        this.renderer.dispose();
        this.model.dispose();
        this.settings.initial = false;
        this.busyIndicatorHandler.dispose();
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p._updateTexts = function () {
        this.renderer.updateText();
    };

    p.wake = function () {
        this.renderer.wake();
        SuperClass.prototype.wake.apply(this, arguments);
    };

    p.suspend = function () {
        this.renderer.suspend();
        this.model.suspend();
        this.settings.initial = false;
        SuperClass.prototype.suspend.apply(this, arguments);
    };

    p.disable = function () {
        SuperClass.prototype.disable.apply(this, arguments);
        if (this.isDisabled) {
            this.controller.disable();
        }
    };

    p.enable = function () {
        SuperClass.prototype.enable.apply(this, arguments);
        if (!this.isDisabled) {
            this.controller.enable();
        }
    };

    p._refreshScroller = function () {
        this.renderer._refreshScroller();
    };

    p._showBusyIndicator = function () {
        this.busyIndicatorHandler.showBusyIndicator();
    };

    p._hideBusyIndicator = function () {
        this.busyIndicatorHandler.hideBusyIndicator();
    };

    return VisibilityDependency.decorate(MeasurementSystemDependency.decorate(CultureDependency.decorate(WidgetClass, true), true), true);

});
