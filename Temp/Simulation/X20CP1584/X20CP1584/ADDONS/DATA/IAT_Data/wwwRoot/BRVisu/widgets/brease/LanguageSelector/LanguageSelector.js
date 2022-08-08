define([
    'widgets/brease/DropDownBox/DropDownBox',
    'widgets/brease/LanguageSelector/libs/config/Config',
    'brease/decorators/LanguageDependency',
    'widgets/brease/common/libs/redux/utils/UtilsList'
], function (SuperClass, Config, languageDependency, UtilsList) {

    'use strict';

    /**
    * @class widgets.brease.LanguageSelector
    * #Description
    * DropDownBox, which opens a List of all languages  
    *  
    * @breaseNote 
    * @extends widgets.brease.DropDownBox
    *
    * @iatMeta category:Category
    * System,Selector,Buttons
    * @iatMeta description:short
    * Auswahl der Sprache
    * @iatMeta description:de
    * Widget zur Auswahl der Sprache
    * @iatMeta description:en
    * Widget for language selection
    */

    /**
    * @method setDataProvider
    * @hide
    */
    /**
     * @cfg {ItemCollection} dataProvider (required)
     * @hide
     */

    var defaultSettings = Config,

        WidgetClass = SuperClass.extend(function LanguageSelector() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {

        //Set the dataProvider and selectedValue
        var languageList = brease.language.getLanguages(),
            currentLanguage = brease.language.getCurrentLanguage();

        this.settings.dataProvider = UtilsList.getDataProviderForLanguage(languageList.languages);
        var selectedLanguage = this.settings.dataProvider.find(function (entry) {
            return entry.value === currentLanguage;
        });
        
        if (!brease.config.editMode) {
            this.settings.selectedIndex = selectedLanguage === undefined ? 0 : selectedLanguage.index;
        } else {
            //workaround to show in the editor always English
            this.settings.selectedIndex = 1;
        }

        SuperClass.prototype.init.apply(this, arguments);
    };

    p.langChangeHandler = function () {
        SuperClass.prototype.langChangeHandler.apply(this, arguments);
        this.setSelectedValue(brease.language.getCurrentLanguage());
    };

    /**
     * @method setImagePath
     * @iatStudioExposed
     * Sets imagePath
     * @param {DirectoryPath} imagePath
     */
    p.setImagePath = function (imagePath) {
        SuperClass.prototype.setImagePath.apply(this, arguments);
    };

    p.submitChange = function () {
        var state = this.store.getState();
        if (brease.language.getCurrentLanguage() !== state.items.selectedValue) {
            brease.language.switchLanguage(state.items.selectedValue);
        }
        SuperClass.prototype.submitChange.apply(this, arguments);
    };

    p.submitChangeToEditor = function () {
        //Do not submit anything to the editor
    };

    return languageDependency.decorate(WidgetClass, true);

});
