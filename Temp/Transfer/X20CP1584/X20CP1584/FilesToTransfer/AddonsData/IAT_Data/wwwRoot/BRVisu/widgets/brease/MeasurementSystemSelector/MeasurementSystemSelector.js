define([
    'widgets/brease/DropDownBox/DropDownBox',
    'widgets/brease/MeasurementSystemSelector/libs/config/Config',
    'brease/events/BreaseEvent',
    'brease/decorators/MeasurementSystemDependency',
    'widgets/brease/common/libs/redux/utils/UtilsList'
], function (SuperClass, Config, BreaseEvent, measurementSystemDependency, UtilsList) {

    'use strict';

    /**
    * @class widgets.brease.MeasurementSystemSelector
    * #Description
    * DropDownBox, which opens a list of all measurement systems   
    *  
    * @breaseNote 
    * @extends widgets.brease.DropDownBox
    *
    * @iatMeta category:Category
    * System,Selector,Buttons
    * @iatMeta description:short
    * Auswahl des Maßsystems
    * @iatMeta description:de
    * Ermöglicht dem Benutzer ein Maßsystem auszuwählen
    * @iatMeta description:en
    * Enables the user to select a system of measurement
    */

    /**
    * @method setDataProvider
    * @inheritdoc 
    * @hide
    */

    var defaultSettings = Config,

        WidgetClass = SuperClass.extend(function MeasurementSystemSelector() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {

        //Set the dataProvider and selectedValue
        var measurementSystems = brease.measurementSystem.getMeasurementSystems(),
            actualMeasurementSystem = brease.measurementSystem.getCurrentMeasurementSystem();
        this.settings.dataProvider = UtilsList.getDataProviderForMeasurement(measurementSystems);
        var selectedMeasurement = this.settings.dataProvider.find(function (entry) {
            return entry.value === actualMeasurementSystem;
        });
        this.settings.selectedIndex = selectedMeasurement === undefined ? 0 : this.settings.dataProvider.indexOf(selectedMeasurement);
        document.body.addEventListener(BreaseEvent.MEASUREMENT_SYSTEM_LOADED, this._bind('listChangeHandler'));

        SuperClass.prototype.init.apply(this, arguments);
    };

    p.listChangeHandler = function () {
        var measurementSystems = brease.measurementSystem.getMeasurementSystems(),
            dataProvider = UtilsList.getDataProviderForMeasurement(measurementSystems);
            
        if (JSON.stringify(this.settings.dataProvider) !== JSON.stringify(dataProvider)) {
            this.setDataProvider(dataProvider); 
        }
    };

    p.measurementSystemChangeHandler = function () {
        this.setSelectedValue(brease.measurementSystem.getCurrentMeasurementSystem());
    };

    /**
     * @method setImagePath
     * @iatStudioExposed
     * Sets imagePath
     * @param {DirectoryPath} imagePath
     */
    p.setImagePath = function () {
        SuperClass.prototype.setImagePath.apply(this, arguments);
    };

    p.submitChange = function () {
        var state = this.store.getState();
        if (brease.measurementSystem.getCurrentMeasurementSystem() !== state.items.selectedValue) {
            brease.measurementSystem.switchMeasurementSystem(state.items.selectedValue);
        }
        SuperClass.prototype.submitChange.apply(this, arguments);
    };

    p.submitChangeToEditor = function () {
        //Do not submit anything to the editor
    };

    p.dispose = function () {
        document.body.removeEventListener(BreaseEvent.MEASUREMENT_SYSTEM_LOADED, this._bind('listChangeHandler'));
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p.suspend = function () {
        document.body.removeEventListener(BreaseEvent.MEASUREMENT_SYSTEM_LOADED, this._bind('listChangeHandler'));
        SuperClass.prototype.suspend.apply(this, arguments);
    };

    p.wake = function () {
        SuperClass.prototype.wake.apply(this, arguments);
        document.body.addEventListener(BreaseEvent.MEASUREMENT_SYSTEM_LOADED, this._bind('listChangeHandler'));
        this.listChangeHandler();
    };

    return measurementSystemDependency.decorate(WidgetClass, true);

});
