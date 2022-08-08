define([
    'brease/core/BaseWidget',
    'brease/events/BreaseEvent',
    'brease/core/Types',
    'brease/decorators/LanguageDependency',
    'widgets/brease/common/libs/wfUtils/UtilsImage'], 
function (
    SuperClass, BreaseEvent, Types, 
    LanguageDependency, UtilsImage
) {

    'use strict';

    /**
    * @class widgets.brease.TableColumnWidget
    * @extends brease.core.BaseWidget
    * @iatMeta studio:visible
    * false
    *
    * @iatMeta category:Category
    * Data
    *
    * @iatMeta description:short
    * SuperClass for ex. AlarmListItem to display different columns in a table
    * @iatMeta description:de
    * SuperClass for ex. AlarmListItem to display different columns in a table
    * @iatMeta description:en
    * SuperClass for ex. AlarmListItem to display different columns in a table
    */

    /**
    * @property {WidgetList} parents=["widgets.brease.TableWidget"]
    * @inheritdoc  
    */

    /**
    * @cfg {StyleReference} style='default'
    * @hide
    */

    /**
    * @cfg {Boolean} enable=true
    * @hide 
    */

    /**
    * @cfg {Boolean} visible=true
    * @hide
    */

    /**
    * @cfg {RoleCollection} permissionView
    * @hide
    */

    /**
    * @cfg {RoleCollection} permissionOperate
    * @hide
    */

    /**
     * @cfg {Integer} tabIndex=-1
     * @hide
     */

    /**
    * @cfg {String} text=''
    * @localizable
    * @iatStudioExposed
    * @iatCategory Appearance 
    * text for the Label
    */

    /**
    * @cfg {String} columnType='timestamp'
    * @iatStudioExposed
    * @iatCategory Appearance 
    * type of column
    */

    /**
    * @cfg {String} tooltip=''
    * @hide
    */

    /**
    * @method setStyle
    * @hide
    */

    /**
    * @method setVisible
    * @hide
    */
   
    /**
    * @method setEnable
    * @hide
    */

    /**
    * @method showTooltip
    * @hide
    */

    /**
    * @method focus
    * @hide
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
            text: '',
            columnType: '',
            textKey: ''
        },

        WidgetClass = SuperClass.extend(function TableColumnWidget() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    /**
     * @method init
     * instantiates the widget
     */
    p.init = function () {
        SuperClass.prototype.init.call(this);
        this.el.addClass('breaseTableColumnWidget');

        this.nameEl = $('<div class="headerText"></div>');
        this.imgEl = $('<svg></svg>');
        var widget = this;
        var src = 'widgets/brease/TableColumnWidget/assets/sort_arrow.svg';
        UtilsImage.getInlineSvg(src).then(function (svgElement) {
            widget.imgEl.replaceWith(svgElement);
            widget.imgEl = svgElement;
            widget.imgEl.addClass('ordering');
        });
        
        this.el.append(this.nameEl);
        this.el.append(this.imgEl);

        this.elem.addEventListener(BreaseEvent.WIDGET_READY, this._bind('_widgetReadyHandler'));
        this.appendEventListeners();
        this.el.off(BreaseEvent.CLICK, this._bind('_clickHandler'));
        
        this.setText(this.settings.text);
    };

    /**
    * @method appendEventListeners
    * Re-attaches event listeners if these don't already exist
    */
    p.appendEventListeners = function () {
        this.el.off(BreaseEvent.CLICK, this._bind('_widgetOrderHandler')).on(BreaseEvent.CLICK, this._bind('_widgetOrderHandler'));
    };

    /* Setter & Getter */
    
    /**
    * @method setText
    * sets the visible text
    * @param {String} text The new text
    */
    p.setText = function (text) {
        if (text !== undefined) {
            if (brease.language.isKey(text) === false) {
                this.updateText(text);
                //this.removeTextKey();
            } else {
                this.setTextKey(brease.language.parseKey(text));
            }
        }
    };

    /**
    * @method getText
    * gets the visible text
    * @return {String} text
    */
    p.getText = function () {
        return this.settings.text;
    };

    /**
    * @method setTextKey
    * set the textkey
    * @param {String} key The new textkey
    */
    p.setTextKey = function (key) {
        //console.debug(WidgetClass.name + '[id=' + this.elem.id + '].setTextKey:', key);
        if (key !== undefined) {
            this.settings.textkey = key;
            this.updateText(brease.language.getTextByKey(this.settings.textkey));
            this.setLangDependency(true);
        }
    };
    
    /**
    * @method getTextKey
    * get the textkey
    */
    p.getTextKey = function () {
        return this.settings.textkey;
    };

    /**
    * @method updateText
    * Updates the settings object and DOM element
    */
    p.updateText = function (text) {
        if (text !== null) {
            // No need to escape text as the jquery text method does not allow code injection
            this.settings.text = Types.parseValue(text, 'String');
            this.el.find('.headerText').text(this.settings.text);
            //this.el.text(this.settings.text);
        }
    };

    /**
    * @method removeTextKey
    * remove the textkey
    */
    p.removeTextKey = function () {
        this.settings.textkey = null;
        this.setLangDependency(false);
    };

    /**
    * @method setColumnType
    * Sets type
    * @param {String} columnType
    */
    p.setColumnType = function (columnType) {
        this.settings.columnType = columnType;
    };

    /**
    * @method getColumnType
    * Returns type.
    * @return {String}
    */
    p.getColumnType = function () {
        return this.settings.columnType;
    };

    /**
     * @method getShortColumnType
     * No enum present for superclass, should just return column type, has to be overridden in derived class
     */
    p.getShortColumnType = function () {
        //No enum present for superclass, should just return column type, has to be overridden in derived class
        return { data: this.settings.columnType };
    };

    /**
    * @event VisibleChanged
    * @param {Boolean} value 
    * @hide
    */

    /**
    * @event Click
    * Fired when element is clicked on.
    * @hide
    * @param {String} origin id of widget that triggered this event
    */

    /**
    * @event DisabledClick
    * @hide
    */

    /**
    * @event EnableChanged
    * @param {Boolean} value 
    * @hide
    */

    /**
     * @method getKey
     * @deprecated
     * This method will get the key in an object and return said object
     * @param {Object} obj
     * @param {String|Integer|Date|Object} value
     */
    p.getKey = function (obj, value) {
        for (var key in obj) {
            if (obj[key] === value) { return key; }
        }
    };

    p.getWidth = function () {
        return parseInt(this.settings.width, 10);
    };

    /**
     * @method updateImage
     * @param {String} img
     * 
     */
    p.updateImage = function (img) {
        this.el.find('.ordering').attr('src', img);
    };

    /* Handler */
    /**
     * @method _widgetReadyHandler
     * @private
     * Removes the eventlistener for this function --> fills no purpose ?
     * @param {Object} e 
     */
    p._widgetReadyHandler = function (e) {
        if (e.target.id === this.elem.id) {
            // console.log('Widget -> ' + this.elem.id + ' ready!');
            this.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_widgetReadyHandler'));
        }
    };

    p._editorStyleChanged = function (e) {
        this.widthUpdate(this.getWidth());
    };

    /**
     * @method resetOrdering
     * Setter for resetting a table column widget if another column is pressed to be sorted.
     * @param {Object} e not used
     */
    p.resetOrdering = function (e) {
        this.order = undefined;
        this.el.find('svg > g > path:eq(0)').removeClass('selected').removeClass('unselected').addClass('unselected');
        this.el.find('svg > g > path:eq(1)').removeClass('selected').removeClass('unselected').addClass('unselected');
    };
    
    /**
     * @method _widgetOrderHandler
     * This method will create an event of type ColumnOrderChanged and dispatch in the DOM 
     * for the TableWidget to listen to so it can update to the correct order
     * @param {Object} e not used
     */
    p._widgetOrderHandler = function (e) {
        if (this.isDisabled) { return; }

        var topTriangle, bottomTriangle;
        if (this.order === undefined) {
            this.order = 'desc';
            topTriangle = 'unselected';
            bottomTriangle = 'selected';
        } else if (this.order === 'desc') {
            this.order = 'asc';
            topTriangle = 'selected';
            bottomTriangle = 'unselected';
        } else if (this.order === 'asc') {
            this.order = undefined;
            topTriangle = 'unselected';
            bottomTriangle = 'unselected';
        }        
        
        this.el.find('svg > g > path:eq(0)').removeClass('selected').removeClass('unselected').addClass(topTriangle);
        this.el.find('svg > g > path:eq(1)').removeClass('selected').removeClass('unselected').addClass(bottomTriangle);

        var event = new CustomEvent('ColumnOrderChanged', { detail: { id: this.elem.id, order: this.order }, bubbles: true, cancelable: true });
        this.dispatchEvent(event);
    };

    /* Editor Size change */
    /**
     * @method widthUpdate
     * This method will create an event called ColumnWidthChanged and dispatch when called. Inside the id and the width are passed. This event
     * is in turned used by the TableWidget to update a columns width.
     * @param {UInteger} newWidth
     */
    p.widthUpdate = function (newWidth) {
        var event = new CustomEvent('ColumnWidthChanged', { detail: { id: this.elem.id, newWidth: newWidth }, bubbles: true, cancelable: true });
        // console.log('New header width: ', newWidth);
        this.dispatchEvent(event);
    };

    /**
     * @method dispose
     * Method diposes of widget
     */
    p.dispose = function () {
        this.el.off(BreaseEvent.CLICK, this._bind('_widgetOrderHandler'));
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    /**
     * @method langChangeHandler
     * Method called by the framework the language changes.
     * @param {Event} e 
     */
    p.langChangeHandler = function (e) {
        if (e !== undefined || e.detail !== undefined) {
            this.setText(brease.language.getTextByKey(this.settings.textkey));
        }
    };

    // override method called in BaseWidget.init
    p._initEditor = function () {
        var widget = this;
        
        this.elem.addEventListener(BreaseEvent.WIDGET_STYLE_PROPERTIES_CHANGED, this._bind('_editorStyleChanged'));

        widget.designer.options = {
            isRelocatable: false
        };
        
        require(['widgets/brease/TableColumnWidget/libs/EditorHandles'], function (EditorHandles) {
            var editorHandles = new EditorHandles(widget);
            widget.getHandles = function () {
                return editorHandles.getHandles();
            };
            widget.designer.getSelectionDecoratables = function () {
                return editorHandles.getSelectionDecoratables();
            };
        });
    };

    return LanguageDependency.decorate(WidgetClass, false);

});
