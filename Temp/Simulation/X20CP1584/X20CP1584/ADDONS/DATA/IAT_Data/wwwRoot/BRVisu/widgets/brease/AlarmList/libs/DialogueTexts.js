define([], function () {
    'use strict';
    function DialogueTexts() {
        return {
            en: {
                filter: {
                    title: 'Configuration dialog to filter alarms',
                    col: 'Column',
                    op: 'Operator',
                    val: 'Value',
                    state: 'and state is',
                    act: 'active',
                    inact: 'inactive',
                    actack: 'active acknowledged',
                    and: 'and',
                    or: 'or'
                },
                sort: {
                    title: 'Configuration dialog to sort alarms',
                    col: 'Column',
                    sort: 'Sort',
                    by: 'By',
                    first: 'First',
                    then: 'then',
                    inc: 'increasing',
                    dec: 'decreasing',
                    az: 'A - Z',
                    za: 'Z - A',
                    old: 'oldest first',
                    new: 'newest first'
                },
                style: {
                    title: 'Configuration dialogue to style alarms',
                    style: 'Set style',
                    state: 'if alarm is',
                    act: 'active',
                    inact: 'inactive',
                    actack: 'active acknowledge',
                    any: 'any',
                    sev: 'and severity condition',
                    and: 'and',
                    or: 'or'
                }
            },
            de: {
                filter: {
                    title: 'Konfigurationsdialog zum Filtern von Alarmen',
                    col: 'Spalte',
                    op: 'Operator',
                    val: 'Wert',
                    state: 'und Status ist',
                    and: 'und',
                    or: 'oder',
                    act: 'aktiv',
                    inact: 'inaktiv',
                    actack: 'aktiv bestätigt'
                },
                sort: {
                    title: 'Konfigurationsdialog zum Sortieren von Alarmen',
                    col: 'Spalte',
                    sort: 'Sortieren',
                    by: 'Nach',
                    first: 'Zuerst',
                    inc: 'aufsteigend',
                    dec: 'absteigend',
                    then: 'dann',
                    az: 'A - Z',
                    za: 'Z - A',
                    old: 'älteste',
                    new: 'neueste'
                },
                style: {
                    title: 'Konfigurationsdialog zum Stylen von Alarmen',
                    style: 'Style festlegen',
                    state: 'wenn Alarm ist',
                    act: 'aktiv',
                    inact: 'inaktiv',
                    actack: 'aktiv bestätigt',
                    any: 'alle',
                    sev: 'und Schweregrad ist',
                    and: 'und',
                    or: 'oder'
                }
            }
        };
    }
    
    return new DialogueTexts();
});
