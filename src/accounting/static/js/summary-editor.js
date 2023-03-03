/* The Mia! Accounting Flask Project
 * summary-editor.js: The JavaScript for the summary editor
 */

/*  Copyright (c) 2023 imacat.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/* Author: imacat@mail.imacat.idv.tw (imacat)
 * First written: 2023/2/28
 */

// Initializes the page JavaScript.
document.addEventListener("DOMContentLoaded", function () {
    SummaryEditor.initialize();
});

/**
 * A summary editor.
 *
 */
class SummaryEditor {

    /**
     * The summary editor form
     * @type {HTMLFormElement}
     */
    #form;

    /**
     * The modal of the summary editor
     * @type {HTMLFormElement}
     */
    #modal;

    /**
     * The entry type, either "debit" or "credit"
     * @type {string}
     */
    #entryType;

    /**
     * The prefix of the HTML ID and class
     * @type {string}
     */
    prefix;

    /**
     * The current tab.
     * @type {TabPlane}
     */
    currentTab;

    /**
     * The summary input.
     * @type {HTMLInputElement}
     */
    summary;

    /**
     * The number input.
     * @type {HTMLInputElement}
     */
    number;

    /**
     * The note.
     * @type {HTMLInputElement}
     */
    note;

    /**
     * The account buttons
     * @type {HTMLButtonElement[]}
     */
    #accountButtons;

    /**
     * The selected account button
     * @type {HTMLButtonElement|null}
     */
    #selectedAccount = null;

    /**
     * The modal of the journal entry form
     * @type {HTMLDivElement}
     */
    #entryFormModal;

    /**
     * The control of the account on the journal entry form
     * @type {HTMLDivElement}
     */
    #formAccountControl;

    /**
     * The account on the journal entry form
     * @type {HTMLDivElement}
     */
    #formAccount;

    /**
     * The control of the summary on the journal entry form
     * @type {HTMLDivElement}
     */
    #formSummaryControl;

    /**
     * The summary on the journal entry form
     * @type {HTMLDivElement}
     */
    #formSummary;

    /**
     * The tab plane classes
     * @type {typeof TabPlane[]}
     */
    #TAB_CLASES = [GeneralTagTab, GeneralTripTab, BusTripTab, RegularPaymentTab, NumberTab]

    /**
     * The tab planes
     * @type {{general: GeneralTagTab, travel: GeneralTripTab, bus: BusTripTab, regular: RegularPaymentTab, number: NumberTab}}
     */
    tabPlanes = {};

    /**
     * Constructs a summary editor.
     *
     * @param form {HTMLFormElement} the summary editor form
     */
    constructor(form) {
        this.#form = form;
        this.#entryType = form.dataset.entryType;
        this.prefix = "accounting-summary-editor-" + form.dataset.entryType;
        this.#modal = document.getElementById(this.prefix + "-modal");
        this.summary = document.getElementById(this.prefix + "-summary");
        this.number = document.getElementById(this.prefix + "-number-number");
        this.note = document.getElementById(this.prefix + "-number-note");
        // noinspection JSValidateTypes
        this.#accountButtons = Array.from(document.getElementsByClassName(this.prefix + "-account"));

        // Things from the entry form
        this.#entryFormModal = document.getElementById("accounting-entry-form-modal");
        this.#formAccountControl = document.getElementById("accounting-entry-form-account-control");
        this.#formAccount = document.getElementById("accounting-entry-form-account");
        this.#formSummaryControl = document.getElementById("accounting-entry-form-summary-control");
        this.#formSummary = document.getElementById("accounting-entry-form-summary");

        for (const cls of this.#TAB_CLASES) {
            const tab = new cls(this);
            this.tabPlanes[tab.tabId()] = tab;
        }
        this.currentTab = this.tabPlanes.general;
        this.#initializeSuggestedAccounts();
        const editor = this;
        this.summary.onchange = function () {
            editor.#onSummaryChange();
        };
        this.#form.onsubmit = function () {
            if (editor.currentTab.validate()) {
                editor.#submit();
            }
            return false;
        };
    }

    /**
     * The callback when the summary input is changed.
     *
     */
    #onSummaryChange() {
        this.summary.value = this.summary.value.trim();
        for (const tab of [this.tabPlanes.bus, this.tabPlanes.travel, this.tabPlanes.general]) {
            if (tab.populate()) {
                break;
            }
        }
        this.tabPlanes.number.populate();
    }

    /**
     * Filters the suggested accounts.
     *
     * @param tagButton {HTMLButtonElement|null} the tag button
     */
    filterSuggestedAccounts(tagButton) {
        for (const accountButton of this.#accountButtons) {
            accountButton.classList.add("d-none");
        }
        if (tagButton === null) {
            this.#selectAccount(null);
            return;
        }
        const suggested = JSON.parse(tagButton.dataset.accounts);
        let selectedAccountButton = null;
        for (const accountButton of this.#accountButtons) {
            if (suggested.includes(accountButton.dataset.code)) {
                accountButton.classList.remove("d-none");
                if (accountButton.dataset.code === suggested[0]) {
                    selectedAccountButton = accountButton;
                }
            }
        }
        this.#selectAccount(selectedAccountButton);
    }

    /**
     * Initializes the suggested accounts.
     *
     */
    #initializeSuggestedAccounts() {
        const editor = this;
        for (const accountButton of this.#accountButtons) {
            accountButton.onclick = function () {
                editor.#selectAccount(accountButton);
            };
        }
    }

    /**
     * Select a suggested account.
     *
     * @param selectedAccountButton {HTMLButtonElement|null} the account button, or null to deselect the account
     */
    #selectAccount(selectedAccountButton) {
        for (const accountButton of this.#accountButtons) {
            accountButton.classList.remove("btn-primary");
            accountButton.classList.add("btn-outline-primary");
        }
        if (selectedAccountButton !== null) {
            selectedAccountButton.classList.remove("btn-outline-primary");
            selectedAccountButton.classList.add("btn-primary");
        }
        this.#selectedAccount = selectedAccountButton;
    }

    /**
     * Submits the summary.
     *
     */
    #submit() {
        if (this.summary.value === "") {
            this.#formSummaryControl.classList.remove("accounting-not-empty");
        } else {
            this.#formSummaryControl.classList.add("accounting-not-empty");
        }
        if (this.#selectedAccount !== null) {
            this.#formAccountControl.classList.add("accounting-not-empty");
            this.#formAccount.dataset.code = this.#selectedAccount.dataset.code;
            this.#formAccount.dataset.text = this.#selectedAccount.dataset.text;
            this.#formAccount.innerText = this.#selectedAccount.dataset.text;
        }
        this.#formSummary.dataset.value = this.summary.value;
        this.#formSummary.innerText = this.summary.value;
        bootstrap.Modal.getOrCreateInstance(this.#modal).hide();
        bootstrap.Modal.getOrCreateInstance(this.#entryFormModal).show();
    }

    /**
     * The callback when the summary editor is shown.
     *
     */
    #onOpen() {
        this.#reset();
        this.summary.value = this.#formSummary.dataset.value;
        this.#onSummaryChange();
    }

    /**
     * Resets the summary editor.
     *
     */
    #reset() {
        this.summary.value = "";
        for (const tab of Object.values(this.tabPlanes)) {
            tab.reset();
        }
        this.tabPlanes.general.switchToMe();
    }

    /**
     * The summary editors.
     * @type {{debit: SummaryEditor, credit: SummaryEditor}}
     */
    static #editors = {}

    /**
     * Initializes the summary editors.
     *
     */
    static initialize() {
        const forms = Array.from(document.getElementsByClassName("accounting-summary-editor"));
        const entryForm = document.getElementById("accounting-entry-form");
        const formSummaryControl = document.getElementById("accounting-entry-form-summary-control");
        for (const form of forms) {
            const editor = new SummaryEditor(form);
            this.#editors[editor.#entryType] = editor;
        }
        const editors = this;
        formSummaryControl.onclick = function () {
            editors.#editors[entryForm.dataset.entryType].#onOpen();
        };
    }

    /**
     * Initializes the summary editor for a new journal entry.
     *
     * @param entryType {string} the entry type, either "debit" or "credit"
     */
    static initializeNewJournalEntry(entryType) {
        this.#editors[entryType].#onOpen();
    }
}

/**
 * A tab plane.
 *
 * @abstract
 * @private
 */
class TabPlane {

    /**
     * The parent summary editor
     * @type {SummaryEditor}
     */
    editor;

    /**
     * The prefix of the HTML ID and classes
     * @type {string}
     */
    prefix;

    /**
     * The tab
     * @type {HTMLSpanElement}
     */
    #tab;

    /**
     * The page
     * @type {HTMLDivElement}
     */
    #page;

    /**
     * Constructs a tab plane.
     *
     * @param editor {SummaryEditor} the parent summary editor
     */
    constructor(editor) {
        this.editor = editor;
        this.prefix = this.editor.prefix + "-" + this.tabId();
        this.#tab = document.getElementById(this.prefix + "-tab");
        this.#page = document.getElementById(this.prefix + "-page");
        const tabPlane = this;
        this.#tab.onclick = function () {
            tabPlane.switchToMe();
        };
    }

    /**
     * The tab ID
     *
     * @return {string}
     * @abstract
     */
    tabId() { throw new Error("Method not implemented.") };

    /**
     * Resets the tab plane input.
     *
     * @abstract
     */
    reset() { throw new Error("Method not implemented."); }

    /**
     * Populates the tab plane with the summary input.
     *
     * @return {boolean} true if the summary input matches this tab, or false otherwise
     * @abstract
     */
    populate() { throw new Error("Method not implemented."); }

    /**
     * Validates the input in the tab plane.
     *
     * @return {boolean} true if valid, or false otherwise
     * @abstract
     */
    validate() { throw new Error("Method not implemented."); }

    /**
     * Switches to the tab plane.
     *
     */
    switchToMe() {
        for (const tabPlane of Object.values(this.editor.tabPlanes)) {
            tabPlane.#tab.classList.remove("active")
            tabPlane.#tab.ariaCurrent = "false";
            tabPlane.#page.classList.add("d-none");
            tabPlane.#page.ariaCurrent = "false";
        }
        this.#tab.classList.add("active");
        this.#tab.ariaCurrent = "page";
        this.#page.classList.remove("d-none");
        this.#page.ariaCurrent = "page";
        this.editor.currentTab = this;
    }
}

/**
 * A tag plane with selectable tags.
 *
 * @abstract
 * @private
 */
class TagTabPlane extends TabPlane {

    /**
     * The tag input
     * @type {HTMLInputElement}
     */
    tag;

    /**
     * The error message for the tag input
     * @type {HTMLDivElement}
     */
    tagError;

    /**
     * The tag buttons
     * @type {HTMLButtonElement[]}
     */
    tagButtons;

    /**
     * Constructs a tab plane.
     *
     * @param editor {SummaryEditor} the parent summary editor
     * @override
     */
    constructor(editor) {
        super(editor);
        this.tag = document.getElementById(this.prefix + "-tag");
        this.tagError = document.getElementById(this.prefix + "-tag-error");
        // noinspection JSValidateTypes
        this.tagButtons = Array.from(document.getElementsByClassName(this.prefix + "-btn-tag"));
        this.initializeTagButtons();
        const tabPlane = this;
        this.tag.onchange = function () {
            let isMatched = false;
            for (const tagButton of tabPlane.tagButtons) {
                if (tagButton.dataset.value === tabPlane.tag.value) {
                    tagButton.classList.remove("btn-outline-primary");
                    tagButton.classList.add("btn-primary");
                    tabPlane.editor.filterSuggestedAccounts(tagButton);
                    isMatched = true;
                } else {
                    tagButton.classList.remove("btn-primary");
                    tagButton.classList.add("btn-outline-primary");
                }
            }
            if (!isMatched) {
                tabPlane.editor.filterSuggestedAccounts(null);
            }
            tabPlane.updateSummary();
            tabPlane.validateTag();
        };
    }

    /**
     * Updates the summary according to the input in the tab plane.
     *
     * @abstract
     */
    updateSummary() { throw new Error("Method not implemented."); }

    /**
     * Switches to the tab plane.
     *
     */
    switchToMe() {
        super.switchToMe();
        let selectedTagButton = null;
        for (const tagButton of this.tagButtons) {
            if (tagButton.classList.contains("btn-primary")) {
                selectedTagButton = tagButton;
                break;
            }
        }
        this.editor.filterSuggestedAccounts(selectedTagButton);
    }

    /**
     * Initializes the tag buttons.
     *
     */
    initializeTagButtons() {
        const tabPlane = this;
        for (const tagButton of tabPlane.tagButtons) {
            tagButton.onclick = function () {
                for (const otherButton of tabPlane.tagButtons) {
                    otherButton.classList.remove("btn-primary");
                    otherButton.classList.add("btn-outline-primary");
                }
                tagButton.classList.remove("btn-outline-primary");
                tagButton.classList.add("btn-primary");
                tabPlane.tag.value = tagButton.dataset.value;
                tabPlane.editor.filterSuggestedAccounts(tagButton);
                tabPlane.updateSummary();
            };
        }
    }

    /**
     * Validates the tag input.
     *
     * @return {boolean} true if valid, or false otherwise
     */
    validateTag() {
        this.tag.value = this.tag.value.trim();
        this.tag.classList.remove("is-invalid");
        this.tagError.innerText = "";
        return true;
    }

    /**
     * Validates a required field.
     *
     * @param field {HTMLInputElement} the input field
     * @param errorContainer {HTMLDivElement} the error message container
     * @param errorMessage {string} the error message
     * @return {boolean} true if valid, or false otherwise
     */
    validateRequiredField(field, errorContainer, errorMessage) {
        field.value = field.value.trim();
        if (field.value === "") {
            field.classList.add("is-invalid");
            errorContainer.innerText = errorMessage;
            return false;
        }
        field.classList.remove("is-invalid");
        errorContainer.innerText = "";
        return true;
    }
    
    /**
     * Resets the tab plane input.
     *
     * @override
     */
    reset() {
        this.tag.value = "";
        this.tag.classList.remove("is-invalid");
        this.tagError.innerText = "";
        for (const tagButton of this.tagButtons) {
            tagButton.classList.remove("btn-primary");
            tagButton.classList.add("btn-outline-primary");
        }
    }
}

/**
 * The general tag tab plane.
 *
 * @private
 */
class GeneralTagTab extends TagTabPlane {

    /**
     * The tab ID
     *
     * @return {string}
     * @abstract
     */
    tabId() {
        return "general";
    };

    /**
     * Updates the summary according to the input in the tab plane.
     *
     * @override
     */
    updateSummary() {
        const pos = this.editor.summary.value.indexOf("—");
        const prefix = this.tag.value === ""? "": this.tag.value + "—";
        if (pos === -1) {
            this.editor.summary.value = prefix + this.editor.summary.value;
        } else {
            this.editor.summary.value = prefix + this.editor.summary.value.substring(pos + 1);
        }
    }

    /**
     * Populates the tab plane with the summary input.
     *
     * @return {boolean} true if the summary input matches this tab, or false otherwise
     * @override
     */
    populate() {
        const found = this.editor.summary.value.match(/^([^—]+)—.+?(?:×\d+)?(?:\([^)]+\))?$/);
        if (found === null) {
            return false;
        }
        this.tag.value = found[1];
        for (const tagButton of this.tagButtons) {
            if (tagButton.dataset.value === this.tag.value) {
                tagButton.classList.remove("btn-outline-primary");
                tagButton.classList.add("btn-primary");
                this.editor.filterSuggestedAccounts(tagButton);
            }
        }
        this.switchToMe();
        return true;
    }

    /**
     * Validates the input in the tab plane.
     *
     * @return {boolean} true if valid, or false otherwise
     */
    validate() {
        return this.validateTag();
    }
}

/**
 * The general trip tab plane.
 *
 * @private
 */
class GeneralTripTab extends TagTabPlane {

    /**
     * The origin
     * @type {HTMLInputElement}
     */
    #from;

    /**
     * The error of the origin
     * @type {HTMLDivElement}
     */
    #fromError;

    /**
     * The destination
     * @type {HTMLInputElement}
     */
    #to;

    /**
     * The error of the destination
     * @type {HTMLDivElement}
     */
    #toError;

    /**
     * The direction buttons
     * @type {HTMLButtonElement[]}
     */
    #directionButtons;

    /**
     * Constructs a tab plane.
     *
     * @param editor {SummaryEditor} the parent summary editor
     * @override
     */
    constructor(editor) {
        super(editor);
        this.#from = document.getElementById(this.prefix + "-from");
        this.#fromError = document.getElementById(this.prefix + "-from-error");
        this.#to = document.getElementById(this.prefix + "-to");
        this.#toError = document.getElementById(this.prefix + "-to-error")
        // noinspection JSValidateTypes
        this.#directionButtons = Array.from(document.getElementsByClassName(this.prefix + "-direction"));
        const tabPlane = this;
        this.#from.onchange = function () {
            tabPlane.updateSummary();
            tabPlane.validateFrom();
        };
        for (const directionButton of this.#directionButtons) {
            directionButton.onclick = function () {
                for (const otherButton of tabPlane.#directionButtons) {
                    otherButton.classList.remove("btn-primary");
                    otherButton.classList.add("btn-outline-primary");
                }
                directionButton.classList.remove("btn-outline-primary");
                directionButton.classList.add("btn-primary");
                tabPlane.updateSummary();
            };
        }
        this.#to.onchange = function () {
            tabPlane.updateSummary();
            tabPlane.validateTo();
        };
    }

    /**
     * The tab ID
     *
     * @return {string}
     * @abstract
     */
    tabId() {
        return "travel";
    };

    /**
     * Updates the summary according to the input in the tab plane.
     *
     * @override
     */
    updateSummary() {
        let direction;
        for (const directionButton of this.#directionButtons) {
            if (directionButton.classList.contains("btn-primary")) {
                direction = directionButton.dataset.arrow;
                break;
            }
        }
        this.editor.summary.value = this.tag.value + "—" + this.#from.value + direction + this.#to.value;
    }

    /**
     * Resets the tab plane input.
     *
     * @override
     */
    reset() {
        super.reset();
        this.#from.value = "";
        this.#from.classList.remove("is-invalid");
        this.#fromError.innerText = "";
        for (const directionButton of this.#directionButtons) {
            if (directionButton.classList.contains("accounting-default")) {
                directionButton.classList.remove("btn-outline-primary");
                directionButton.classList.add("btn-primary");
            } else {
                directionButton.classList.add("btn-outline-primary");
                directionButton.classList.remove("btn-primary");
            }
        }
        this.#to.value = "";
        this.#to.classList.remove("is-invalid");
        this.#toError.innerText = "";
    }

    /**
     * Populates the tab plane with the summary input.
     *
     * @return {boolean} true if the summary input matches this tab, or false otherwise
     * @override
     */
    populate() {
        const found = this.editor.summary.value.match(/^([^—]+)—([^—→↔]+)([→↔])(.+?)(?:×\d+)?(?:\([^)]+\))?$/);
        if (found === null) {
            return false;
        }
        this.tag.value = found[1];
        this.#from.value = found[2];
        for (const directionButton of this.#directionButtons) {
            if (directionButton.dataset.arrow === found[3]) {
                directionButton.classList.remove("btn-outline-primary");
                directionButton.classList.add("btn-primary");
            } else {
                directionButton.classList.add("btn-outline-primary");
                directionButton.classList.remove("btn-primary");
            }
        }
        this.#to.value = found[4];
        for (const tagButton of this.tagButtons) {
            if (tagButton.dataset.value === this.tag.value) {
                tagButton.classList.remove("btn-outline-primary");
                tagButton.classList.add("btn-primary");
                this.editor.filterSuggestedAccounts(tagButton);
            }
        }
        this.switchToMe();
        return true;
    }

    /**
     * Validates the input in the tab plane.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validate() {
        let isValid = true;
        isValid = this.validateTag() && isValid;
        isValid = this.validateFrom() && isValid;
        isValid = this.validateTo() && isValid;
        return isValid;
    }

    /**
     * Validates the tag input.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validateTag() {
        return this.validateRequiredField(this.tag, this.tagError, A_("Please fill in the tag."));
    }

    /**
     * Validates the origin.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validateFrom() {
        return this.validateRequiredField(this.#from, this.#fromError, A_("Please fill in the origin."));
    }

    /**
     * Validates the destination.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validateTo() {
        return this.validateRequiredField(this.#to, this.#toError, A_("Please fill in the destination."));
    }
}

/**
 * The bus trip tab plane.
 *
 * @private
 */
class BusTripTab extends TagTabPlane {

    /**
     * The route
     * @type {HTMLInputElement}
     */
    #route;

    /**
     * The error of the route
     * @type {HTMLDivElement}
     */
    #routeError;

    /**
     * The origin
     * @type {HTMLInputElement}
     */
    #from;

    /**
     * The error of the origin
     * @type {HTMLDivElement}
     */
    #fromError;

    /**
     * The destination
     * @type {HTMLInputElement}
     */
    #to;

    /**
     * The error of the destination
     * @type {HTMLDivElement}
     */
    #toError;

    /**
     * Constructs a tab plane.
     *
     * @param editor {SummaryEditor} the parent summary editor
     * @override
     */
    constructor(editor) {
        super(editor);
        this.#route = document.getElementById(this.prefix + "-route");
        this.#routeError = document.getElementById(this.prefix + "-route-error");
        this.#from = document.getElementById(this.prefix + "-from");
        this.#fromError = document.getElementById(this.prefix + "-from-error");
        this.#to = document.getElementById(this.prefix + "-to");
        this.#toError = document.getElementById(this.prefix + "-to-error")
        const tabPlane = this;
        this.#route.onchange = function () {
            tabPlane.updateSummary();
            tabPlane.validateRoute();
        };
        this.#from.onchange = function () {
            tabPlane.updateSummary();
            tabPlane.validateFrom();
        };
        this.#to.onchange = function () {
            tabPlane.updateSummary();
            tabPlane.validateTo();
        };
    }

    /**
     * The tab ID
     *
     * @return {string}
     * @abstract
     */
    tabId() {
        return "bus";
    };

    /**
     * Updates the summary according to the input in the tab plane.
     *
     * @override
     */
    updateSummary() {
        this.editor.summary.value = this.tag.value + "—" + this.#route.value + "—" + this.#from.value + "→" + this.#to.value;
    }

    /**
     * Resets the tab plane input.
     *
     * @override
     */
    reset() {
        super.reset();
        this.#route.value = "";
        this.#route.classList.remove("is-invalid");
        this.#routeError.innerText = "";
        this.#from.value = "";
        this.#from.classList.remove("is-invalid");
        this.#fromError.innerText = "";
        this.#to.value = "";
        this.#to.classList.remove("is-invalid");
        this.#toError.innerText = "";
    }

    /**
     * Populates the tab plane with the summary input.
     *
     * @return {boolean} true if the summary input matches this tab, or false otherwise
     * @override
     */
    populate() {
        const found = this.editor.summary.value.match(/^([^—]+)—([^—]+)—([^—→]+)→(.+?)(?:×\d+)?(?:\([^)]+\))?$/);
        if (found === null) {
            return false;
        }
        this.tag.value = found[1];
        this.#route.value = found[2];
        this.#from.value = found[3];
        this.#to.value = found[4];
        for (const tagButton of this.tagButtons) {
            if (tagButton.dataset.value === this.tag.value) {
                tagButton.classList.remove("btn-outline-primary");
                tagButton.classList.add("btn-primary");
                this.editor.filterSuggestedAccounts(tagButton);
                break;
            }
        }
        this.switchToMe();
        return true;
    }

    /**
     * Validates the input in the tab plane.
     *
     * @return {boolean} true if valid, or false otherwise
     */
    validate() {
        let isValid = true;
        isValid = this.validateTag() && isValid;
        isValid = this.validateRoute() && isValid;
        isValid = this.validateFrom() && isValid;
        isValid = this.validateTo() && isValid;
        return isValid;
    }

    /**
     * Validates the tag input.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validateTag() {
        return this.validateRequiredField(this.tag, this.tagError, A_("Please fill in the tag."));
    }

    /**
     * Validates the route.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validateRoute() {
        return this.validateRequiredField(this.#route, this.#routeError, A_("Please fill in the route."));
    }

    /**
     * Validates the origin.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validateFrom() {
        return this.validateRequiredField(this.#from, this.#fromError, A_("Please fill in the origin."));
    }

    /**
     * Validates the destination.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validateTo() {
        return this.validateRequiredField(this.#to, this.#toError, A_("Please fill in the destination."));
    }
}

/**
 * The regular payment tab plane.
 *
 * @private
 */
class RegularPaymentTab extends TabPlane {

    /**
     * The payment buttons
     * @type {HTMLButtonElement[]}
     */
    #payments;

    // noinspection JSValidateTypes
    /**
     * Constructs a tab plane.
     *
     * @param editor {SummaryEditor} the parent summary editor
     * @override
     */
    constructor(editor) {
        super(editor);
        // noinspection JSValidateTypes
        this.#payments = Array.from(document.getElementsByClassName(this.prefix + "-payment"));
    }

    /**
     * The tab ID
     *
     * @return {string}
     * @abstract
     */
    tabId() {
        return "regular";
    };

    /**
     * Resets the tab plane input.
     *
     * @override
     */
    reset() {
        for (const payment of this.#payments) {
            payment.classList.remove("btn-primary");
            payment.classList.add("btn-outline-primary");
        }
    }

    /**
     * Populates the tab plane with the summary input.
     *
     * @return {boolean} true if the summary input matches this tab, or false otherwise
     * @override
     */
    populate() {
        return false;
    }

    /**
     * Validates the input in the tab plane.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validate() {
        return true;
    }
}

/**
 * The number tab plane.
 *
 * @private
 */
class NumberTab extends TabPlane {

    /**
     * Constructs a tab plane.
     *
     * @param editor {SummaryEditor} the parent summary editor
     * @override
     */
    constructor(editor) {
        super(editor);
        const tabPlane = this;
        this.editor.number.onchange = function () {
            tabPlane.updateSummary();
        };
        this.editor.note.onchange = function () {
            tabPlane.editor.note.value = tabPlane.editor.note.value.trim();
            tabPlane.updateSummary();
        };
    }

    /**
     * The tab ID
     *
     * @return {string}
     * @abstract
     */
    tabId() {
        return "number";
    };

    /**
     * Updates the summary according to the input in the tab plane.
     *
     * @override
     */
    updateSummary() {
        const found = this.editor.summary.value.match(/^(.*?)(?:×\d+)?(?:\([^)]+\))?$/);
        if (found !== null) {
            this.editor.summary.value = found[1];
        }
        if (parseInt(this.editor.number.value) > 1) {
            this.editor.summary.value = this.editor.summary.value + "×" + this.editor.number.value;
        }
        if (this.editor.note.value !== "") {
            this.editor.summary.value = this.editor.summary.value + "(" + this.editor.note.value + ")";
        }
    }

    /**
     * Resets the tab plane input.
     *
     * @override
     */
    reset() {
        this.editor.number.value = "";
        this.editor.note.value = "";
    }

    /**
     * Populates the tab plane with the summary input.
     *
     * @return {boolean} true if the summary input matches this tab, or false otherwise
     * @override
     */
    populate() {
        const found = this.editor.summary.value.match(/^(.*?)(?:×(\d+))?(?:\(([^)]+)\))?$/);
        if (found[2] === undefined) {
            this.editor.number.value = "";
        } else {
            this.editor.number.value = found[2];
        }
        if (found[3] === undefined) {
            this.editor.note.value = "";
        } else {
            this.editor.note.value = found[3];
        }
        return true;
    }

    /**
     * Validates the input in the tab plane.
     *
     * @return {boolean} true if valid, or false otherwise
     * @override
     */
    validate() {
        return true;
    }
}
