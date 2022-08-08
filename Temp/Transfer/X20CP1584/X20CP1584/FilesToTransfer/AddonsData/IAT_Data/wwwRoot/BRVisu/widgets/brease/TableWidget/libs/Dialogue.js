define([
    'brease/core/Class',
    'brease/events/BreaseEvent',
    'widgets/brease/GenericDialog/GenericDialog',
    'widgets/brease/GenericDialog/libs/config'
], function (
    SuperClass, BreaseEvent, Dialog, DialogConfig
) {
    
    'use strict';
    
    /** 
     * @class widgets.brease.TableWidget.libs.Dialogue
     * @extends brease.core.Class
     */

    var DialogueClass = SuperClass.extend(function Dialogue(widget) {
            this.dialog = new Dialog(widget.elem);// widget.configDiag;
            SuperClass.apply(this);
            this.widget = widget;
        }, null),

        p = DialogueClass.prototype;
    
    /**
     * @method initialize
     * @param {String} type which type of dialog should be instantiated 
     * @param {String} lang
     * Should be implemented in the derived widgets, will start a dialog for the filtering
     */
    p.initialize = function () {
        //Implement in derived child widget
    };

    /**
     * @method open
     * This method retrieves the name from the getLanguage function and checks if it's german or not. If it's german it stores the internal language as german otherwise
     * as english. The reason for this is that the next function, setUpTexts, retrieves all texts associated with the Dialog window and stores it over the text object
     * in either the english or the german object, hence we don't need to add another object for textkeys coming from the backend. These will automatically, and seamlessly,
     * integrate into Filtering/Sorting/or Styling dialog. It will also listen to the promise being resolved, and when so is done - i.e. the text have been gathered from the
     * backend, it will open the dialog and display it, also handle eventlisteners for closing the dialog.
     * @param {String} type possible options filter, style or sort. 
     */
    p.open = function (type) {
        this.actualLang = this._getLanguage();
        this.lang = (this.actualLang !== 'de') ? 'en' : 'de';
        var def = new $.Deferred();
        this.setUpTexts(def, this.actualLang, this.lang, type);
        var self = this;
        $.when(def.promise()).then(function successHandler() {
            
            var conf = self.initialize(type);
            self.dialog.show(conf, self.widget.elem);
            self.dialog.isReady().then(function () {
                $('#' + self.dialog.elem.id).on(BreaseEvent.WIDGET_READY, { type: type }, self._bind('_widgetAdded'));
                $('#' + self.dialog.elem.id).on('window_closing', { type: type }, self._bind('_collectDataBeforeClosing'));
            });
        });

    };

    /**
     * @method _initializeEmptyDialogConfig
     * @private
     * This method will create the basic configuration needed for any dialog, based on the GenericDialog module.
     * @param {String} headerText header text of the dialog box
     * @param {Number} height optional height will default to 480
     * @param {Number} width optional width willd default to 600
     */
    p._initializeEmptyDialogConfig = function (headerText, height, width) {
        this.config = new DialogConfig();

        // dialog
        this.config.forceInteraction = true;
        this.config.contentWidth = width || 600;
        this.config.contentHeight = height || 480;

        // header
        this.config.header.text = headerText;

        //footer
        this.config.buttons.ok = true;
        this.config.buttons.cancel = true;
    };

    p._widgetAdded = function (e) {
        var type = e.data.type;
        $('#' + this.dialog.elem.id)
            .off(BreaseEvent.WIDGET_READY, this._bind('_widgetAdded'))
            .addClass('system_brease_TableConfigurationDialog_style_default');
        this[type].initialize();
    };
    
    /**
     * @method _collectDataBeforeClosing
     * @private
     * This method will listen for the closing event and once it it is thrown it will collect the filter configuration, store it into the table
     * and redraw the table. Then it will update the backend that there was a change in the filter.
     */
    p._collectDataBeforeClosing = function (e) {
        if (brease.uiController.parentWidgetId(e.target) === this.dialog.elem.id) {
            var type = e.data.type;
            this[type].removeEventListeners();
            if (this.dialog.getDialogResult() === 'ok') {
                this.widget.settings.config[type] = this[type]._widgetCollectStateBeforeClosing();
                if (this.widget.controller) {
                    this.widget.controller.draw();
                }
                this.widget.sendConfiguration(type);
            }
        }
    };

    /**
     * @method _addRowHandler
     * @private
     * @deprecated
     */
    p._addRowHandler = function (e) {
        //Function to switch between the different tabs avaible for modularity
        this.filter._addRowHandler(e);
    };
    
    /**
     * @method _getLanguage
     * @private
     * This method will determine which language is currenly used. If it's not german it will default to English.
     */
    p._getLanguage = function () {
        return brease.language.getCurrentLanguage();
    };

    /**
     * @method setUpTexts
     * This method will set up all text keys necessary to instantiate the dialogue
     * @param {Promise} def a deferred object used to retrieve the texts from the asynchronous function
     * @param {String} lang the language currently in use
     * @param {String} fallbackLang the fallback language to use if current language is missing
     * @param {String} type the type of the Dialog window, valid values are filter, style or order
     */
    p.setUpTexts = function () {
        //Override in widget
    };

    /**
     * @method _reColourAllObjects
     * @private
     * @param {Object} self 
     * Will recolor all separators (?)
     */
    // eslint-disable-next-line no-unused-vars
    function _reColourAllObjects(self) {
        self.filter._reColourFirstLineSeparator();
    }

    /**
     * @method dispose
     * This method will dispose of/remove the dialog.
     */
    p.dispose = function () {
        this.dialog.dispose();
        SuperClass.prototype.dispose.call(this);
    };

    return DialogueClass;
});
