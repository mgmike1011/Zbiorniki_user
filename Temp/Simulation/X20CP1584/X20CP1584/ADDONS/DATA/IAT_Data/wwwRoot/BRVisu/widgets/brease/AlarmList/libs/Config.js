define(function () {

    'use strict';   
 
    /**
    * @class widgets.brease.AlarmList.libs.Config
    * @extends core.javascript.Object
    * @override widgets.brease.AlarmList
    */

    /**
    * @cfg {DirectoryPath} imagePrefix=''
    * @iatStudioExposed
    * @iatCategory Appearance
    * @groupRefId Icons
    * @groupOrder 1
    * Path to the image used for the images in the category. The image names have to specifed in the backend at the MpAlarmX. See help for more information.
    */

    /**
    * @cfg {ImageType} imageSuffix='.png'
    * @iatStudioExposed
    * @iatCategory Appearance
    * @groupRefId Icons
    * @groupOrder 1
    * File extension used for the images in the category. The image names have to specifed in the backend at the MpAlarmX. See help for more information.
    */

    /**
    * @cfg {ImagePath} imageActive=''
    * @iatStudioExposed
    * @iatCategory Appearance
    * @groupRefId Icons
    * @groupOrder 2
    * Path to the image used for state "Active / Not-Acknowledged". If no image is defined, a predefined image will be used.
    */

    /**
    * @cfg {ImagePath} imageActiveAcknowledged=''
    * @iatStudioExposed
    * @iatCategory Appearance
    * @groupRefId Icons
    * @groupOrder 3
    * Path to the image used for state "Active / Acknowledged". If no image is defined, a predefined image will be used.
    */

    /**
    * @cfg {ImagePath} imageInactive=''
    * @iatStudioExposed
    * @iatCategory Appearance
    * @groupRefId Icons
    * @groupOrder 4
    * Path to the image used for state "Inactive / Not-Acknowledged". If no image is defined, a predefined image will be used.
    */

    /**
    * @cfg {MpComIdentType} mpLink=''
    * @iatStudioExposed
    * @bindable
    * @not_projectable
    * @iatCategory Data
    * Link to a MpAlarmX component
    */
       
    return {
        imagePrefix: '',
        imageSuffix: '.png',
        imageActive: '',
        imageActiveAcknowledged: '',
        imageInactive: '',
        mpLink: '',
        type: 'AlarmList',
        config: {
            columns: [],
            allColumns: ['ad1', 'ad2', 'cat', 'cod', 'ins', 'mes', 'nam', 'sco', 'sev', 'sta', 'tim'],
            columnWidths: [],
            columnTypes: {
                ad1: 'str',
                ad2: 'str',
                cat: 'int',
                cod: 'int',
                ins: 'int',
                mes: 'str',
                nam: 'str',
                sco: 'str',
                sev: 'int',
                sta: 'int',
                tim: 'date'
            },
            style: [],
            order: [],
            hidden: { data: 'ins' },
            filter: [],
            sort: [],
            original: {
                order: []
            }
        }
    };
});
