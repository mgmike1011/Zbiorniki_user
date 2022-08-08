define([], function () {
    'use strict';
    function DialogueTexts() {
        return {
            en: {
                title: 'Configuration dialogue for AlarmList',
                filter: {
                    title: 'Filtering',
                    col: 'Column',
                    op: 'Operator',
                    val: 'Value',
                    and: 'and',
                    or: 'or',
                    act: 'Active',
                    inact: 'Inactive',
                    actack: 'Active Acknowledged',
                    inactack: 'Inactive Acknowledged',
                    true: 'true',
                    false: 'false'
                },
                sort: {
                    title: 'Sorting',
                    col: 'Column',
                    sort: 'Sort',
                    by: 'By',
                    first: 'First',
                    inc: 'Increasing',
                    dec: 'Decreasing',
                    then: 'then',
                    az: 'A to Z',
                    za: 'Z to A',
                    old: 'Oldest first',
                    new: 'Newest first',
                    true: 'true',
                    false: 'false'
                }
            },
            de: {
                title: 'Konfigurationsdialog für AlarmList',
                filter: {
                    title: 'Filterung',
                    col: 'Spalte',
                    op: 'Operator',
                    val: 'Wert',
                    and: 'und',
                    or: 'oder',
                    act: 'Aktiv',
                    inact: 'Inaktiv',
                    actack: 'Aktiv & Bestätigen',
                    inactack: 'Inaktiv & Bestätigen',
                    true: 'wahr',
                    false: 'falsch'
                },
                sort: {
                    title: 'Sortierung',
                    col: 'Spalte',
                    sort: 'Sortieren',
                    by: 'nach',
                    first: 'Zuerst',
                    inc: 'aufsteigend',
                    dec: 'absteigend',
                    then: 'dann',
                    az: 'A bis Z',
                    za: 'Z bis A',
                    old: 'Den ältesten zuerst',
                    new: 'Den neusten zuerst',
                    true: 'wahr',
                    false: 'falsch'
                }
            }
        };
    }
    
    return new DialogueTexts();
});
