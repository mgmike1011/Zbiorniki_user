define([
    'widgets/brease/TableWidget/libs/Dialogue',
    'brease/enum/Enum',
    'widgets/brease/AlarmList/libs/FilterSettings',
    'widgets/brease/TableWidget/libs/SortingSettings',
    'widgets/brease/AlarmList/libs/StylingSettings',
    'widgets/brease/AlarmList/libs/DialogueTexts',
    'widgets/brease/TableWidget/libs/TextRetriever'
], function (SuperClass, Enum, Filter, Sorting, Styling, Texts, TextRetriever) {
    'use strict';
    /** 
     * @class widgets.brease.AlarmList.libs.Dialogue
     * Class opening and controlling the different configuration dialogues
     */

    var DialogueClass = SuperClass.extend(function Dialogue(widget) {
            SuperClass.apply(this, arguments);
        }, null),

        p = DialogueClass.prototype;

    /**
     * @method initialize
     * @param {String} type which type of dialog should be instantiated 
     * @returns {Object}
     */
    p.initialize = function (type) {
        switch (type) {
            case Enum.MappTableConfigurationType.Filtering:
                this.filter = new Filter(this.dialog, this.widget, this.actualLang, this.widget.model.categories, Texts[this.lang][type]);
                break;

            case Enum.MappTableConfigurationType.Sorting:
                this.sort = new Sorting(this.dialog, this.widget, this.actualLang, Texts[this.lang][type]);
                break;
                
            case Enum.MappTableConfigurationType.Styling:
                this.style = new Styling(this.dialog, this.widget, this.actualLang, Texts[this.lang][type]);
                break;
        }
        this._initializeEmptyDialogConfig(Texts[this.lang][type].title);
        return this.config;
    };

    /**
     * @method setUpTexts
     * This method will set up all text keys necessary to instantiate the dialogue
     * @param {Promise} def a deferred object used to retrieve the texts from the asynchronous function
     * @param {String} lang the language currently in use
     * @param {String} fallbackLang the fallback language to use if current language is missing
     * @param {String} type the type of the Dialog window, valid values are filter, style or order
     */
    p.setUpTexts = function (def, lang, fallbackLang, type) {
        this.texts = TextRetriever.getTexts(lang, Texts[fallbackLang], 'AlarmList', type, this, def);
    };

    return DialogueClass;
});
