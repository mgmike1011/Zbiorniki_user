define([
    'widgets/brease/Button/Button',
    'brease/decorators/UserDependency'
], function (SuperClass, userDependency) {

    'use strict';

    /**
     * @class widgets.brease.LogoutButton
     * #Description
     * Button to perform logout action
     * @breaseNote
     * @extends widgets.brease.Button

     * @iatMeta category:Category
     * Login,Buttons,System
     * @iatMeta description:short
     * Benutzer ausloggen
     * @iatMeta description:de
     * Setzt den Default Benutzer
     * @iatMeta description:en
     * Sets the default user
     */

    var defaultSettings = {
        },

        WidgetClass = SuperClass.extend(function LogoutButton() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {
        if (this.settings.omitClass !== true) {
            this.addInitialClass('breaseLogoutButton');
        }
        SuperClass.prototype.init.call(this);
    };

    p._onButtonClick = function (e) {
        brease.user.setDefaultUser().then(
            this._bind('_setUserSuccessHandler'),
            this._bind('_setUserFailHandler')
        );
    };

    p.userChangeHandler = function (e) {
    };

    p._setUserSuccessHandler = function () {
    };

    p._setUserFailHandler = function () {
    };

    return userDependency.decorate(WidgetClass, true);
});
