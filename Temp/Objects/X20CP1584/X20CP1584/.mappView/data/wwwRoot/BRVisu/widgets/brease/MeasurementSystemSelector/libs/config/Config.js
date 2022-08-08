define(['brease/enum/Enum'],
    function (Enum) {

        'use strict';

        /**
        * @class widgets.brease.MeasurementSystemSelector.config.Config
        * @extends core.javascript.Object
        * @override widgets.brease.MeasurementSystemSelector
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
        * @cfg {DirectoryPath} imagePath=''
        * path to measurement system icons 
        * @iatCategory Appearance
        * In case that the path is used, the widget will look for images
        * using the following pattern "imagePath/[MeasurementSystemCode].png"; i.e. "Media/measurement/imperial.png" will be
        * the image used for imperial when imagePath is set to "Media/measurement/". The folder should contain
        * an image for every measurement system.
        * @iatStudioExposed
        */

        /**
        * @cfg {ItemCollection} dataProvider (required)
        * @hide
        */

        return {
            selectedIndex: 0,
            selectedValue: '',
            imagePath: ''
        };

    });
