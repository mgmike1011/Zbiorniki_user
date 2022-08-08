define([
    'brease/services/RuntimeService'
], function (
    _runtimeServices
) {

    'use strict';
    /**
    * @class widgets.brease.TableWidget.libs.TextRetriever
    * Class for reading out the System Texts in the IAT namespace which can later be used for the dialogues
    */

    var TextRetriever = {
        /**
         * @method getTexts
         * Method to read all available texts from the backend for a certain configuration dialog, in this way making it available
         * in any language.
         * @param {String} lang the language that is to be used
         * @param {Object} originalTexts an object which holds the structure from which texts should be used, defined by the widget itself
         * @param {String} type which type of widget
         * @param {String} dialog which type of dialog (available possibilties: style, sort, filter)
         * @param {Object} widget reference to widget
         * @param {Promise} promise the promise that will be resolved once all texts are loaded
         */
        getTexts: function (lang, originalTexts, type, dialog, widget, promise) {

            function _getStyleNamesCallback(texts) {
                for (var key in originalTexts[dialog]) {
                    if (originalTexts[dialog].hasOwnProperty(key)) {
                        var tempText = texts['IAT/Widgets/' + type + '/' + dialog + '.' + key];

                        if (tempText !== undefined) {
                            originalTexts[dialog][key] = tempText;
                        }
                    }
                }
                promise.resolve();
            }
            _runtimeServices.loadTexts(lang, _getStyleNamesCallback); 
        }
    };

    return TextRetriever;
});
