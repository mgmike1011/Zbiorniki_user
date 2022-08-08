define([
    'widgets/brease/ListWidget/ListWidget',
    'brease/decorators/LanguageDependency',
    'brease/core/Types',
    'brease/core/Utils',
    'brease/events/BreaseEvent',
    'widgets/brease/TextPicker/libs/TextWheel',
    'brease/decorators/DragAndDropCapability',
    'widgets/brease/common/DragDropProperties/libs/DroppablePropertiesEvents'
], function (
    SuperClass, languageDependency, Types, Utils,
    BreaseEvent, TextWheel, dragAndDropCapability
) {

    'use strict';

    /**
     * @class widgets.brease.TextPicker
     *
     * @mixins widgets.brease.common.DragDropProperties.libs.DroppablePropertiesEvents
     *
     * #Description
     * TextPicker, extending ListWidget to show a list of text in a wheel
     *
     * @extends widgets.brease.ListWidget
     *
     * @iatMeta studio:license
     * licensed
     * @iatMeta studio:visible
     * true
     * @iatMeta category:Category
     * Selector
     * @iatMeta description:short
     * Liste von Texten in einem Rad
     * @iatMeta description:de
     * Zeigt eine Liste in einem Rad an, aus welcher der Benutzer Elemente auswählen kann
     * @iatMeta description:en
     * Displays a list in a wheel from where the user can select items
     */

    /**
     * @cfg {PixelVal} itemPadding=10px
     * @iatStudioExposed
     * @iatCategory Appearance
     * Padding between the items of the list
     */

    /**
     * @cfg {brease.enum.HorizontalPosition} itemAlign=center
     * @iatStudioExposed
     * @iatCategory Appearance
     * Horizontal alignment of the list items
     */

    /**
     * @cfg {brease.enum.TextAlign} textAlign=center
     * @iatStudioExposed
     * @iatCategory Appearance
     * Horizontal alignment of the displayed texts
     */

    /**
     * @cfg {PixelVal} itemHeight=40px
     * @iatStudioExposed
     * @iatCategory Appearance
     * Height of an item
     */

    /**
     * @cfg {Padding} padding=10px
     * @iatStudioExposed
     * @iatCategory Layout
     * Padding of the widget
     */

    /**
     * @cfg {UInteger} minItemWidth=50
     * @iatStudioExposed
     * @iatCategory Appearance
     * Minimum width in percentage of a non active item with respect to the overall picker wheel
     */

    /**
     * @cfg {UInteger} maxItemWidth=100
     * @iatStudioExposed
     * @iatCategory Appearance
     * Maximum width in percentage of a non active item with respect to the overall picker wheel
     */

    var defaultSettings = {
            itemPadding: '10px',
            itemAlign: 'center',
            textAlign: 'center',
            itemHeight: '40px',
            padding: '10px',
            minItemWidth: 50,
            maxItemWidth: 100
        },

        WidgetClass = SuperClass.extend(function TextPicker() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {

        SuperClass.prototype.init.call(this);
        _setClasses(this);
        this.textWheel = new TextWheel(this);
        this.textWheel.setWidgetSettings(this.settings);

        this._addEventListeners();
        _initPropertyGridValues(this);
    };

    p.langChangeHandler = function () {
        var spans = this.el.find(' .itemFragment span');
        for (var i = 0; i < spans.length; i += 1) {
            if (brease.language.isKey(this.settings.dataProvider[i].text)) {
                $(spans[i]).text(brease.language.getTextByKey(brease.language.parseKey(this.settings.dataProvider[i].text)));
            }
        }
    };

    /**
      * @method setDataProvider
      * Sets dataProvider
      * @iatStudioExposed
      * @param {ItemCollection} provider
      */
    p.setDataProvider = function (provider) {
        if (provider === undefined) {
            provider = [];
        }
        SuperClass.prototype.setDataProvider.call(this, provider);

        if (this.settings.selectedIndex !== undefined) {
            if (this.settings.selectedIndex >= this.settings.dataProvider.length && this.settings.dataProvider.length > 0) {
                this.settings.selectedIndex = this.settings.dataProvider.length - 1;
                this.settings.selectedValue = this.settings.dataProvider[this.settings.selectedIndex].value;
            }
            this.setSelectedIndex(this.settings.selectedIndex);
        }

        this.textWheel.redrawList(this.settings);

        //this.textWheel._setPositionBasedItemAppearance();

        this.langChangeHandler();

        _setClasses(this);
    };

    /**
      * @method setSelectedIndex
      * @iatStudioExposed
      * Sets selectedIndex
      * @param {UInteger} index
      */
    p.setSelectedIndex = function (index) {
        if (index !== null && index !== undefined) {
            this.oldSelectedIndex = this.settings.selectedIndex;
            this.settings.selectedIndex = index;

            //SelectedIndexChanged event. This should only be fired if the old index and the new index are not the same.
            if (this.settings.dataProvider.length > index) {
                this.textWheel._moveToIndex(this.settings.selectedIndex);
                if (this.settings.dataProvider[this.settings.selectedIndex].value !== undefined && this.getSubmitOnChange()) {
                    if (this.oldSelectedIndex !== this.settings.selectedIndex) {
                        this.submitChange();
                    }
                }
            }
        }
       
    };

    // methods were moved to ListWidget
    //p.submitChange = function () {
    //};

    //p._triggerIndexChangedEvent = function () {
    //};

    /**
     * @method setImageAlign
     * Sets imageAlign
     * @param {brease.enum.ImageAlign} imageAlign
     */
    p.setImageAlign = function (imageAlign) {
        if (imageAlign !== undefined) {
            SuperClass.prototype.setImageAlign.call(this, imageAlign);
            if (brease.config.editMode) {
                this.textWheel.redrawList(this.settings);
                _setClasses(this);
            }
        }
    };

    /**
     * @method setImagePath
     * Sets imagePath
     * @param {String} imagePath
     */
    p.setImagePath = function (imagePath) {
        if (imagePath !== undefined) {
            SuperClass.prototype.setImagePath.call(this, imagePath);
            var providerWithImages = this._updateDataProviderImages(this.settings.imagePath);
            this.setDataProvider(providerWithImages);
        }
    };

    /**
      * @method setItemPadding
      * Sets itemPadding
      * @param {PixelVal} itemPadding
      */
    p.setItemPadding = function (itemPadding) {
        if (itemPadding !== undefined) {
            this.settings.itemPadding = itemPadding;
            this.textWheel._updateItemPadding(this.settings.itemPadding);
        }
    };

    /**
      * @method getItemPadding
      * Returns itemPadding.
      * @return {PixelVal}
      */
    p.getItemPadding = function () {
        return this.settings.itemPadding;
    };

    /**
      * @method setItemAlign
      * Sets itemAlign
      * @param {brease.enum.HorizontalPosition} itemAlign
      */
    p.setItemAlign = function (itemAlign) {
        if (itemAlign !== undefined) {
            this.settings.itemAlign = itemAlign;
            if (brease.config.editMode) {
                this.textWheel.redrawList(this.settings);
                _setClasses(this);
            }
        }
    };

    /**
      * @method getItemAlign
      * Returns itemAlign.
      * @return {brease.enum.HorizontalPosition}
      */
    p.getItemAlign = function () {
        return this.settings.itemAlign;
    };

    /**
      * @method setTextAlign
      * Sets textAlign
      * @param {brease.enum.TextAlign} textAlign
      */
    p.setTextAlign = function (textAlign) {
        this.settings.textAlign = textAlign;
        if (brease.config.editMode) {
            this.textWheel.redrawList(this.settings);
            _setClasses(this);
        }
    };

    /**
      * @method getTextAlign
      * Returns textAlign.
      * @return {brease.enum.TextAlign}
      */
    p.getTextAlign = function () {
        return this.settings.textAlign;
    };

    /**
      * @method setItemHeight
      * Sets itemHeight
      * @param {PixelVal} itemHeight
      */
    p.setItemHeight = function (itemHeight) {
        if (itemHeight !== undefined) {
            this.settings.itemHeight = itemHeight;
            this.textWheel._updateItemHeight(this.settings.itemHeight);
        }
    };

    /**
      * @method getItemHeight
      * Returns itemHeight.
      * @return {PixelVal}
      */
    p.getItemHeight = function () {
        return this.settings.itemHeight;
    };

    /**
      * @method setPadding
      * Sets padding
      * @param {Padding} padding
      */
    p.setPadding = function (padding) {
        if (padding !== undefined) {
            this.settings.padding = padding;
            this.el.css('padding', this.settings.padding);
            this.textWheel._updateElements();
        }
    };

    /**
      * @method getPadding
      * Returns padding.
      * @return {Padding}
      */
    p.getPadding = function () {
        return this.settings.padding;
    };

    /**
      * @method setMinItemWidth
      * Sets minItemWidth
      * @param {UInteger} minItemWidth
      */
    p.setMinItemWidth = function (minItemWidth) {
        if (minItemWidth !== undefined) {
            this.settings.minItemWidth = minItemWidth;
            this.textWheel._setPositionBasedItemAppearance();
        }
    };

    /**
      * @method getMinItemWidth
      * Returns minItemWidth.
      * @return {UInteger}
      */
    p.getMinItemWidth = function () {
        return this.settings.minItemWidth;
    };

    /**
      * @method setMaxItemWidth
      * Sets maxItemWidth
      * @param {UInteger} maxItemWidth
      */
    p.setMaxItemWidth = function (maxItemWidth) {
        if (maxItemWidth !== undefined) {
            this.settings.maxItemWidth = maxItemWidth;
            this.textWheel._setPositionBasedItemAppearance();
        }
    };

    /**
      * @method getMaxItemWidth
      * Returns maxItemWidth.
      * @return {UInteger}
      */
    p.getMaxItemWidth = function () {
        return this.settings.maxItemWidth;
    };

    p._setOffset = function (offset) {
        this.offset = offset;
    };

    p._setMax = function (max) {
        this.max = max;
    };

    p._setMin = function (min) {
        this.min = min;
    };

    p._clickHandler = function (e) {
        if (!this.isDisabled) {
            var index = parseInt($(e.target).attr('data-index'), 10);
            // Next line not working because of recent chrome bug
            //if (index !== undefined && this.isMoving === false) {
            if (!isNaN(index)) {
                this.setSelectedIndex(index);
                if (this.getSubmitOnChange()) {
                    this._triggerIndexChangedEvent();
                }
            }
        }
        SuperClass.prototype._clickHandler.apply(this, arguments);
    };

    p._onMouseDown = function (e) {

        e.stopPropagation();
        e.preventDefault();

        this.isMoving = false;
        this.oldOffset = this.offset;
        e.originalEvent.preventDefault();
        
        if (e.originalEvent.touches) {
            this.pageY = e.originalEvent.touches[0].pageY;
        } else {
            this.pageY = e.pageY;
        }

        if (!this.isDisabled && this.settings.permissions.operate) {
            $(document).on(BreaseEvent.MOUSE_MOVE, this._bind('_onMouseMove'));
            $(document).on(BreaseEvent.MOUSE_UP, this._bind('_onMouseUp'));
        }

    };

    p._onMouseMove = function (e) {
        var pageY, newOffset, closestItem,
            scaleFactor = Utils.getScaleFactor(this.elem);

        this.isMoving = true;

        if (e.originalEvent.touches) {
            pageY = e.originalEvent.touches[0].pageY;
        } else {
            pageY = e.pageY;
        }

        newOffset = this.oldOffset + ((pageY - this.pageY) / scaleFactor);
        this.textWheel.updateFragmentOffset(newOffset);

        closestItem = this.textWheel._findClosestItemToWidgetCenter();

        this.textWheel._setPositionBasedItemAppearance();

        if (this.currentSelected) {
            $(this.currentSelected).removeClass('selected');
        }
        $(closestItem).addClass('selected');
        this.currentSelected = $(closestItem);
    };

    p._onMouseUp = function (e) {
        $(document).off(BreaseEvent.MOUSE_MOVE, this._bind('_onMouseMove'));
        $(document).off(BreaseEvent.MOUSE_UP, this._bind('_onMouseUp'));

        var closestItem = this.textWheel._findClosestItemToWidgetCenter();

        this.textWheel._setPositionBasedItemAppearance();

        if (this.isMoving && closestItem) {
            var index = parseInt(closestItem.getAttribute('data-index'), 10);
            this.setSelectedIndex(index);
            if (this.getSubmitOnChange()) {
                this._triggerIndexChangedEvent();
            }
        }

    };

    p._setHeight = function (h) {
        this.settings.height = h;
        this.el.css('height', this.settings.height);
        this.textWheel._updateElements();
    };

    p._setWidth = function (w) {
        this.settings.width = w;
        this.el.css('width', this.settings.width);
        this.textWheel._updateElements();
    };

    /**
     * @method setStyle
     * @iatStudioExposed
     * Sets the style
     * @param {StyleReference} value
     */
    p.setStyle = function (value) {
        SuperClass.prototype.setStyle.call(this, value);
        this.textWheel._updateElements();
        _setClasses(this);
    };

    p.wake = function () {
        SuperClass.prototype.wake.apply(this, arguments);
        this._addEventListeners();
        this.textWheel.redrawList(this.settings);
        _setClasses(this);
    };

    p.suspend = function () {
        this._removeEventListeners();
        SuperClass.prototype.suspend.apply(this, arguments);
    };

    p.dispose = function () {
        this._removeEventListeners();
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p._addEventListeners = function () {
        this.el.on(BreaseEvent.MOUSE_DOWN, this._bind('_onMouseDown'));
    };

    p._removeEventListeners = function () {
        this.el.off(BreaseEvent.MOUSE_DOWN, this._bind('_onMouseDown'));
    };

    p._visibleHandler = function (visible) {
        if (this.textWheel) {
            this.textWheel.redrawList(this.settings);
        }
    };

    function _setClasses(widget) {

        var items = $('#' + widget.elem.id).find('.itemFragment div');

        if (widget.settings.omitClass !== true) {
            widget.el.addClass('breaseTextPicker');
        }

        items.each(function (i) {
            var item = $(this);

            handleEllipsis(widget, item);
            handleWordWrap(widget);
            handleMultiLine(widget, item);
        });
    }

    function handleEllipsis(widget, item) {
        if (widget.settings.ellipsis === true) {
            item.addClass('ellipsis');
        } else {
            item.removeClass('ellipsis');
        }
    }

    function handleWordWrap(widget) {
        if (widget.settings.wordWrap === true) {
            widget.settings.wordWrap = Types.parseValue(widget.settings.wordWrap, 'Boolean');
        } else {
            widget.settings.wordWrap = false;
        }
    }

    function handleMultiLine(widget, item) {
        if (widget.settings.multiLine === true) {
            if (widget.settings.wordWrap === true) {
                item.addClass('wordWrap');
                item.removeClass('multiLine');
            } else {
                item.addClass('multiLine');
                item.removeClass('wordWrap');
            }

        } else {
            item.removeClass('wordWrap');
            item.removeClass('multiLine');
        }
    }

    function _initPropertyGridValues(widget) {
        widget.setImagePath(widget.settings.imagePath);
        widget.setDataProvider(widget.settings.dataProvider);
        widget.setSelectedIndex(widget.settings.selectedIndex);
        widget.setSelectedValue(widget.settings.selectedValue);
        widget.setEllipsis(widget.settings.ellipsis);
        widget.setMultiLine(widget.settings.multiLine);
        widget.setWordWrap(widget.settings.wordWrap);
        widget.setItemPadding(widget.settings.itemPadding);
        widget.setItemHeight(widget.settings.itemHeight);
        widget.setPadding(widget.settings.padding);
        widget.setMinItemWidth(widget.settings.minItemWidth);
        widget.setMaxItemWidth(widget.settings.maxItemWidth);
        widget.textWheel.setWidgetSettings(widget.settings);
    }

    // override method called in BaseWidget.init
    p._initEditor = function () {
        var widget = this;
        require(['widgets/brease/TextPicker/libs/EditorHandles'], function (EditorHandles) {
            widget.editorHandles = new EditorHandles(widget);
            widget.getHandles = function () {
                return widget.editorHandles.getHandles();
            };
            widget.designer.getSelectionDecoratables = function () {
                return widget.editorHandles.getSelectionDecoratables();
            };
        });
    };

    return dragAndDropCapability.decorate(languageDependency.decorate(WidgetClass, true), false);

});
