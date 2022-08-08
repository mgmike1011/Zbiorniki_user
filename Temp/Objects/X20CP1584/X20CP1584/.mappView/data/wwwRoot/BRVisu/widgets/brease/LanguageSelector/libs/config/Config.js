define([
    'brease/enum/Enum'
], function (Enum) {

    'use strict';

    /**
     * @class widgets.brease.LanguageSelector.config.Config
     * @extends core.javascript.Object
     * @override widgets.brease.LanguageSelector
     */

    /**
     * @cfg {Integer} selectedIndex=0
     * @iatStudioExposed
     * @iatCategory Data
     * @bindable
     * @not_projectable
     * @editableBinding
     * Index of the selected item. The first item has index=0
     */

    /**
     * @cfg {String} selectedValue=''
     * @iatStudioExposed
     * @iatCategory Data
     * @bindable
     * @not_projectable
     * @editableBinding
     * Value of the selected item
     */

    /**
     * @cfg {DirectoryPath} imagePath='widgets/brease/LanguageSelector/assets/img/'
     * path to language icons 
     * @iatCategory Appearance
     * In case that the path is changed to a different folder, the widget will look for images
     * using the following pattern "imagePath/[LanguageCode].png"; i.e. "Media/languages/en.png" will be
     * the image used for english when imagePath is set to "Media/languages/". The folder should contain
     * an image for every used language in the visualization.
     * @iatStudioExposed
     */

    /**
     * @cfg {brease.enum.ImagePosition} imageAlign='right'
     * @iatStudioExposed
     * @iatCategory Appearance
     * Position of images relative to text  
     */

    /**
     * @cfg {brease.enum.DropDownDisplaySettings} displaySettings='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * Defines which elements are displayed on the widget
     */

    return {
        selectedIndex: 0,
        selectedValue: '',
        imagePath: 'widgets/brease/LanguageSelector/assets/img/',
        imageAlign: Enum.ImageAlign.right,
        displaySettings: Enum.DropDownDisplaySettings.default
    };

});
