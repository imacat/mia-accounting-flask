/* The Mia! Accounting Flask Project
 * transaction-form.js: The JavaScript for the transaction form
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
 * First written: 2023/2/25
 */
"use strict";

// Initializes the page JavaScript.
document.addEventListener("DOMContentLoaded", () => {
    TransactionForm.initialize();
    JournalEntryEditor.initialize();
});

/**
 * The transaction form
 *
 */
class TransactionForm {

    /**
     * The form element
     * @type {HTMLFormElement}
     */
    #element;

    /**
     * The template to add a new journal entry
     * @type {string}
     */
    entryTemplate;

    /**
     * The date
     * @type {HTMLInputElement}
     */
    #date;

    /**
     * The error message of the date
     * @type {HTMLDivElement}
     */
    #dateError;

    /**
     * The control of the currencies
     * @type {HTMLDivElement}
     */
    #currencyControl;

    /**
     * The error message of the currencies
     * @type {HTMLDivElement}
     */
    #currencyError;

    /**
     * The currency list
     * @type {HTMLDivElement}
     */
    #currencyList;

    /**
     * The currency sub-forms
     * @type {CurrencySubForm[]}
     */
    #currencies;

    /**
     * The button to add a new currency
     * @type {HTMLButtonElement}
     */
    #addCurrencyButton;

    /**
     * The note
     * @type {HTMLTextAreaElement}
     */
    #note;

    /**
     * The error message of the note
     * @type {HTMLDivElement}
     */
    #noteError;

    /**
     * Constructs the transaction form.
     *
     */
    constructor() {
        this.#element = document.getElementById("accounting-form");
        this.entryTemplate = this.#element.dataset.entryTemplate;
        this.#date = document.getElementById("accounting-date");
        this.#dateError = document.getElementById("accounting-date-error");
        this.#currencyControl = document.getElementById("accounting-currencies");
        this.#currencyError = document.getElementById("accounting-currencies-error");
        this.#currencyList = document.getElementById("accounting-currency-list");
        this.#currencies = Array.from(document.getElementsByClassName("accounting-currency"))
            .map((element) => new CurrencySubForm(this, element));
        this.#addCurrencyButton = document.getElementById("accounting-add-currency");
        this.#note = document.getElementById("accounting-note");
        this.#noteError = document.getElementById("accounting-note-error");

        this.#addCurrencyButton.onclick = () => {
            const newIndex = 1 + (this.#currencies.length === 0? 0: Math.max(...this.#currencies.map((currency) => currency.index)));
            const html = this.#element.dataset.currencyTemplate
                .replaceAll("CURRENCY_INDEX", escapeHtml(String(newIndex)));
            this.#currencyList.insertAdjacentHTML("beforeend", html);
            const element = document.getElementById("accounting-currency-" + String(newIndex));
            this.#currencies.push(new CurrencySubForm(this, element));
            this.#resetDeleteCurrencyButtons();
            initializeDragAndDropReordering(this.#currencyList, () => {
                this.#onReorderCurrencies();
            });
        };
        this.#resetDeleteCurrencyButtons();
        initializeDragAndDropReordering(this.#currencyList, () => {
            this.#onReorderCurrencies();
        });
        this.#date.onchange = () => {
            this.#validateDate();
        };
        this.#note.onchange = () => {
            this.#validateNote();
        }
        this.#element.onsubmit = () => {
            return this.#validate();
        };
    }

    /**
     * Deletes a currency sub-form.
     *
     * @param currency {CurrencySubForm} the currency sub-form to delete
     */
    deleteCurrency(currency) {
        const index = this.#currencies.indexOf(currency);
        this.#currencies.splice(index, 1);
        this.#resetDeleteCurrencyButtons();
    }

    /**
     * Resets the buttons to delete the currency sub-forms
     *
     */
    #resetDeleteCurrencyButtons() {
        if (this.#currencies.length === 1) {
            this.#currencies[0].deleteButton.classList.add("d-none");
        } else {
            for (const currency of this.#currencies) {
                currency.deleteButton.classList.remove("d-none");
            }
        }
    }

    /**
     * The callback when the currencies are reordered
     *
     */
    #onReorderCurrencies() {
        for (let i = 0; i < this.#currencies; i++) {
            this.#currencies[i].no.value = String(i + 1);
        }
    }

    /**
     * Validates the form.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    #validate() {
        let isValid = true;
        isValid = this.#validateDate() && isValid;
        isValid = this.#validateCurrencies() && isValid;
        isValid = this.#validateNote() && isValid;
        return isValid;
    }

    /**
     * Validates the date.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    #validateDate() {
        this.#date.value = this.#date.value.trim();
        this.#date.classList.remove("is-invalid");
        if (this.#date.value === "") {
            this.#date.classList.add("is-invalid");
            this.#dateError.innerText = A_("Please fill in the date.");
            return false;
        }
        this.#date.classList.remove("is-invalid");
        this.#dateError.innerText = "";
        return true;
    }

    /**
     * Validates the currencies.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    #validateCurrencies() {
        let isValid = true;
        isValid = this.#validateCurrenciesReal() && isValid;
        for (const currency of this.#currencies) {
            isValid = currency.validate() && isValid;
        }
        return isValid;
    }

    /**
     * Validates the currency sub-forms, the validator itself.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    #validateCurrenciesReal() {
        if (this.#currencies.length === 0) {
            this.#currencyControl.classList.add("is-invalid");
            this.#currencyError.innerText = A_("Please add some currencies.");
            return false;
        }
        this.#currencyControl.classList.remove("is-invalid");
        this.#currencyError.innerText = "";
        return true;
    }

    /**
     * Validates the note.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    #validateNote() {
        this.#note.value = this.#note.value
             .replace(/^\s*\n/, "")
             .trimEnd();
        this.#note.classList.remove("is-invalid");
        this.#noteError.innerText = "";
        return true;
    }

    /**
     * The transaction form
     * @type {TransactionForm}
     */
    static #form;

    static initialize() {
        this.#form = new TransactionForm()
    }
}

/**
 * The currency sub-form.
 *
 */
class CurrencySubForm {

    /**
     * The element
     * @type {HTMLDivElement}
     */
    #element;

    /**
     * The transaction form
     * @type {TransactionForm}
     */
    form;

    /**
     * The currency index
     * @type {number}
     */
    index;

    /**
     * The prefix of the HTML ID and class
     * @type {string}
     */
    #prefix;

    /**
     * The control
     * @type {HTMLDivElement}
     */
    #control;

    /**
     * The error message
     * @type {HTMLDivElement}
     */
    #error;

    /**
     * The number
     * @type {HTMLInputElement}
     */
    no;

    /**
     * The button to delete the currency
     * @type {HTMLButtonElement}
     */
    deleteButton;

    /**
     * The debit side
     * @type {DebitCreditSideSubForm|null}
     */
    #debit;

    /**
     * The credit side
     * @type {DebitCreditSideSubForm|null}
     */
    #credit;

    /**
     * Constructs a currency sub-form
     *
     * @param form {TransactionForm} the transaction form
     * @param element {HTMLDivElement} the currency sub-form element
     */
    constructor(form, element) {
        this.#element = element;
        this.form = form;
        this.index = parseInt(this.#element.dataset.index);
        this.#prefix = "accounting-currency-" + String(this.index);
        this.#control = document.getElementById(this.#prefix + "-control");
        this.#error = document.getElementById(this.#prefix + "-error");
        this.no = document.getElementById(this.#prefix + "-no");
        this.deleteButton = document.getElementById(this.#prefix + "-delete");
        const debitElement = document.getElementById(this.#prefix + "-debit");
        this.#debit = debitElement === null? null: new DebitCreditSideSubForm(this, debitElement, "debit");
        const creditElement = document.getElementById(this.#prefix + "-credit");
        this.#credit = creditElement == null? null: new DebitCreditSideSubForm(this, creditElement, "credit");
        this.deleteButton.onclick = () => {
            this.#element.parentElement.removeChild(this.#element);
            this.form.deleteCurrency(this);
        };
    }

    /**
     * Validates the form.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    validate() {
        let isValid = true;
        if (this.#debit !== null) {
            isValid = this.#debit.validate() && isValid;
        }
        if (this.#credit !== null) {
            isValid = this.#credit.validate() && isValid;
        }
        isValid = this.validateBalance() && isValid;
        return isValid;
    }

    /**
     * Validates the valance.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    validateBalance() {
        if (this.#debit !== null && this.#credit !== null) {
            if (!this.#debit.getTotal().equals(this.#credit.getTotal())) {
                this.#control.classList.add("is-invalid");
                this.#error.innerText = A_("The totals of the debit and credit amounts do not match.");
                return false;
            }
        }
        this.#control.classList.remove("is-invalid");
        this.#error.innerText = "";
        return true;
    }
}

/**
 * The debit or credit side sub-form
 *
 */
class DebitCreditSideSubForm {

    /**
     * The currency sub-form
     * @type {CurrencySubForm}
     */
    currency;

    /**
     * The element
     * @type {HTMLDivElement}
     */
    #element;

    /**
     * The currencyIndex
     * @type {number}
     */
    #currencyIndex;

    /**
     * The entry type, either "debit" or "credit"
     * @type {string}
     */
    entryType;

    /**
     * The prefix of the HTML ID and class
     * @type {string}
     */
    #prefix;

    /**
     * The error message
     * @type {HTMLDivElement}
     */
    #error;

    /**
     * The journal entry list
     * @type {HTMLUListElement}
     */
    #entryList;

    /**
     * The journal entry sub-forms
     * @type {JournalEntrySubForm[]}
     */
    #entries;

    /**
     * The total
     * @type {HTMLSpanElement}
     */
    #total;

    /**
     * The button to add a new entry
     * @type {HTMLButtonElement}
     */
    #addEntryButton;

    /**
     * Constructs a debit or credit side sub-form
     *
     * @param currency {CurrencySubForm} the currency sub-form
     * @param element {HTMLDivElement} the element
     * @param entryType {string} the entry type, either "debit"
     */
    constructor(currency, element, entryType) {
        this.currency = currency;
        this.#element = element;
        this.#currencyIndex = currency.index;
        this.entryType = entryType;
        this.#prefix = "accounting-currency-" + String(this.#currencyIndex) + "-" + entryType;
        this.#error = document.getElementById(this.#prefix + "-error");
        this.#entryList = document.getElementById(this.#prefix + "-list");
        // noinspection JSValidateTypes
        this.#entries = Array.from(document.getElementsByClassName(this.#prefix)).map((element) => new JournalEntrySubForm(this, element));
        this.#total = document.getElementById(this.#prefix + "-total");
        this.#addEntryButton = document.getElementById(this.#prefix + "-add-entry");
        this.#addEntryButton.onclick = () => {
            JournalEntryEditor.addNew(this);
            AccountSelector.initializeJournalEntryForm();
        };
        this.#resetDeleteJournalEntryButtons();
    }

    /**
     * Adds a new journal entry sub-form
     *
     * @returns {JournalEntrySubForm} the newly-added journal entry sub-form
     */
    addJournalEntry() {
        const newIndex = 1 + (this.#entries.length === 0? 0: Math.max(...this.#entries.map((entry) => entry.entryIndex)));
        const html = this.currency.form.entryTemplate
            .replaceAll("CURRENCY_INDEX", escapeHtml(String(this.#currencyIndex)))
            .replaceAll("ENTRY_TYPE", escapeHtml(this.entryType))
            .replaceAll("ENTRY_INDEX", escapeHtml(String(newIndex)));
        this.#entryList.insertAdjacentHTML("beforeend", html);
        const entry = new JournalEntrySubForm(this, document.getElementById(this.#prefix + "-" + String(newIndex)));
        this.#entries.push(entry);
        this.#resetDeleteJournalEntryButtons();
        this.validate();
        return entry;
    }

    /**
     * Deletes a journal entry sub-form
     *
     * @param entry {JournalEntrySubForm}
     */
    deleteJournalEntry(entry) {
        const index = this.#entries.indexOf(entry);
        this.#entries.splice(index, 1);
        this.updateTotal();
        this.#resetDeleteJournalEntryButtons();
    }

    /**
     * Resets the buttons to delete the journal entry sub-forms
     *
     */
    #resetDeleteJournalEntryButtons() {
        if (this.#entries.length === 1) {
            this.#entries[0].deleteButton.classList.add("d-none");
        } else {
            for (const entry of this.#entries) {
                entry.deleteButton.classList.remove("d-none");
            }
        }
    }

    /**
     * Returns the total amount.
     *
     * @return {Decimal} the total amount
     */
    getTotal() {
        let total = new Decimal("0");
        for (const entry of this.#entries) {
            if (entry.amount.value !== "") {
                total = total.plus(new Decimal(entry.amount.value));
            }
        }
        return total;
    }

    /**
     * Updates the total
     *
     */
    updateTotal() {
        let total = new Decimal("0");
        for (const entry of this.#entries) {
            if (entry.amount.value !== "") {
                total = total.plus(new Decimal(entry.amount.value));
            }
        }
        this.#total.innerText = formatDecimal(this.getTotal());
    }

    /**
     * Validates the form.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    validate() {
        let isValid = true;
        isValid = this.#validateReal() && isValid;
        for (const entry of this.#entries) {
            isValid = entry.validate() && isValid;
        }
        return isValid;
    }

    /**
     * Validates the form, the validator itself.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    #validateReal() {
        if (this.#entries.length === 0) {
            this.#element.classList.add("is-invalid");
            this.#error.innerText = A_("Please add some journal entries.");
            return false;
        }
        this.#element.classList.remove("is-invalid");
        this.#error.innerText = "";
        return true;
    }
}

/**
 * The journal entry sub-form.
 *
 */
class JournalEntrySubForm {

    /**
     * The debit or credit entry side sub-form
     * @type {DebitCreditSideSubForm}
     */
    side;

    /**
     * The element
     * @type {HTMLLIElement}
     */
    #element;

    /**
     * The entry type, either "debit" or "credit"
     * @type {string}
     */
    entryType;

    /**
     * The entry index
     * @type {number}
     */
    entryIndex;

    /**
     * The prefix of the HTML ID and class
     * @type {string}
     */
    #prefix;

    /**
     * The control
     * @type {HTMLDivElement}
     */
    #control;

    /**
     * The error message
     * @type {HTMLDivElement}
     */
    #error;

    /**
     * The account code
     * @type {HTMLInputElement}
     */
    #accountCode;

    /**
     * The text display of the account
     * @type {HTMLDivElement}
     */
    #accountText;

    /**
     * The summary
     * @type {HTMLInputElement}
     */
    #summary;

    /**
     * The text display of the summary
     * @type {HTMLDivElement}
     */
    #summaryText;

    /**
     * The amount
     * @type {HTMLInputElement}
     */
    amount;

    /**
     * The text display of the amount
     * @type {HTMLSpanElement}
     */
    #amountText;

    /**
     * The button to delete journal entry
     * @type {HTMLButtonElement}
     */
    deleteButton;

    /**
     * Constructs the journal entry sub-form.
     *
     * @param side {DebitCreditSideSubForm} the debit or credit entry side sub-form
     * @param element {HTMLLIElement} the element
     */
    constructor(side, element) {
        this.side = side;
        this.#element = element;
        this.entryType = element.dataset.entryType;
        this.entryIndex = parseInt(element.dataset.entryIndex);
        this.#prefix = element.dataset.prefix;
        this.#control = document.getElementById(this.#prefix + "-control");
        this.#error = document.getElementById(this.#prefix + "-error");
        this.#accountCode = document.getElementById(this.#prefix + "-account-code");
        this.#accountText = document.getElementById(this.#prefix + "-account-text");
        this.#summary = document.getElementById(this.#prefix + "-summary");
        this.#summaryText = document.getElementById(this.#prefix + "-summary-text");
        this.amount = document.getElementById(this.#prefix + "-amount");
        this.#amountText = document.getElementById(this.#prefix + "-amount-text");
        this.deleteButton = document.getElementById(this.#prefix + "-delete");
        this.#control.onclick = () => {
            JournalEntryEditor.edit(this, this.#accountCode.value, this.#accountCode.dataset.text, this.#summary.value, this.amount.value);
            AccountSelector.initializeJournalEntryForm();
        };
        this.deleteButton.onclick = () => {
            this.#element.parentElement.removeChild(this.#element);
            this.side.deleteJournalEntry(this);
        };
    }

    /**
     * Validates the form.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    validate() {
        if (this.#accountCode.value === "") {
            this.#control.classList.add("is-invalid");
            this.#error.innerText = A_("Please select the account.");
            return false;
        }
        if (this.amount.value === "") {
            this.#control.classList.add("is-invalid");
            this.#error.innerText = A_("Please fill in the amount.");
            return false;
        }
        this.#control.classList.remove("is-invalid");
        this.#error.innerText = "";
        return true;
    }

    /**
     * Stores the data into the journal entry sub-form.
     *
     * @param accountCode {string} the account code
     * @param accountText {string} the account text
     * @param summary {string} the summary
     * @param amount {string} the amount
     */
    save(accountCode, accountText, summary, amount) {
        this.#accountCode.value = accountCode;
        this.#accountCode.dataset.text = accountText;
        this.#accountText.innerText = accountText;
        this.#summary.value = summary;
        this.#summaryText.innerText = summary;
        this.amount.value = amount;
        this.#amountText.innerText = formatDecimal(new Decimal(amount));
        this.validate();
    }
}

/**
 * The journal entry editor.
 *
 */
class JournalEntryEditor {

    /**
     * The journal entry editor
     * @type {HTMLFormElement}
     */
    #element;

    /**
     * The bootstrap modal
     * @type {HTMLDivElement}
     */
    #modal;

    /**
     * The entry type, either "debit" or "credit"
     * @type {string}
     */
    entryType;

    /**
     * The control of the account
     * @type {HTMLDivElement}
     */
    #accountControl;

    /**
     * The account
     * @type {HTMLDivElement}
     */
    #account;

    /**
     * The error message of the account
     * @type {HTMLDivElement}
     */
    #accountError;

    /**
     * The control of the summary
     * @type {HTMLDivElement}
     */
    #summaryControl;

    /**
     * The summary
     * @type {HTMLDivElement}
     */
    #summary;

    /**
     * The error message of the summary
     * @type {HTMLDivElement}
     */
    #summaryError;

    /**
     * The amount
     * @type {HTMLInputElement}
     */
    #amount;

    /**
     * The error message of the amount
     * @type {HTMLDivElement}
     */
    #amountError;

    /**
     * The journal entry to edit
     * @type {JournalEntrySubForm|null}
     */
    #entry;

    /**
     * The debit or credit entry side sub-form
     * @type {DebitCreditSideSubForm}
     */
    #side;

    /**
     * Constructs a new journal entry editor.
     *
     */
    constructor() {
        this.#element = document.getElementById("accounting-entry-editor");
        this.#modal = document.getElementById("accounting-entry-editor-modal");
        this.#accountControl = document.getElementById("accounting-entry-editor-account-control");
        this.#account = document.getElementById("accounting-entry-editor-account");
        this.#accountError = document.getElementById("accounting-entry-editor-account-error")
        this.#summaryControl = document.getElementById("accounting-entry-editor-summary-control");
        this.#summary = document.getElementById("accounting-entry-editor-summary");
        this.#summaryError = document.getElementById("accounting-entry-editor-summary-error");
        this.#amount = document.getElementById("accounting-entry-editor-amount");
        this.#amountError = document.getElementById("accounting-entry-editor-amount-error");
        this.#summaryControl.onclick = () => {
            SummaryEditor.start(this, this.#summary.dataset.value);
        };
        this.#element.onsubmit = () => {
            if (this.#validate()) {
                if (this.#entry === null) {
                    this.#entry = this.#side.addJournalEntry();
                }
                this.#entry.save(this.#account.dataset.code, this.#account.dataset.text, this.#summary.dataset.value, this.#amount.value);
                this.#side.updateTotal();
                this.#side.currency.validateBalance();
                bootstrap.Modal.getInstance(this.#modal).hide();
            }
            return false;
        };
    }

    /**
     * Saves the summary from the summary editor.
     *
     * @param summary {string} the summary
     */
    saveSummary(summary) {
        if (summary === "") {
            this.#summaryControl.classList.remove("accounting-not-empty");
        } else {
            this.#summaryControl.classList.add("accounting-not-empty");
        }
        this.#summary.dataset.value = summary;
        this.#summary.innerText = summary;
        bootstrap.Modal.getOrCreateInstance(this.#modal).show();
    }

    /**
     * Saves the summary with the suggested account from the summary editor.
     *
     * @param summary {string} the summary
     * @param accountCode {string} the account code
     * @param accountText {string} the account text
     */
    saveSummaryWithAccount(summary, accountCode, accountText) {
        this.#accountControl.classList.add("accounting-not-empty");
        this.#account.dataset.code = accountCode;
        this.#account.dataset.text = accountText;
        this.#account.innerText = accountText;
        this.#validateAccount();
        this.saveSummary(summary)
    }

    /**
     * Validates the form.
     *
     * @returns {boolean} true if valid, or false otherwise
     */
    #validate() {
        let isValid = true;
        isValid = this.#validateAccount() && isValid;
        isValid = this.#validateSummary() && isValid;
        isValid = this.#validateAmount() && isValid
        return isValid;
    }

    /**
     * Validates the account.
     *
     * @return {boolean} true if valid, or false otherwise
     */
    #validateAccount() {
        if (this.#account.dataset.code === "") {
            this.#accountControl.classList.add("is-invalid");
            this.#accountError.innerText = A_("Please select the account.");
            return false;
        }
        this.#accountControl.classList.remove("is-invalid");
        this.#accountError.innerText = "";
        return true;
    }

    /**
     * Validates the summary.
     *
     * @return {boolean} true if valid, or false otherwise
     * @private
     */
    #validateSummary() {
        this.#summary.classList.remove("is-invalid");
        this.#summaryError.innerText = "";
        return true;
    }

    /**
     * Validates the amount.
     *
     * @return {boolean} true if valid, or false otherwise
     * @private
     */
    #validateAmount() {
        this.#amount.value = this.#amount.value.trim();
        this.#amount.classList.remove("is-invalid");
        if (this.#amount.value === "") {
            this.#amount.classList.add("is-invalid");
            this.#amountError.innerText = A_("Please fill in the amount.");
            return false;
        }
        this.#amount.classList.remove("is-invalid");
        this.#amount.innerText = "";
        return true;
    }

    /**
     * Adds a new journal entry.
     *
     * @param side {DebitCreditSideSubForm} the debit or credit side sub-form
     */
    #onAddNew(side) {
        this.#entry = null;
        this.#side = side;
        this.entryType = this.#side.entryType;
        this.#element.dataset.entryType = side.entryType;
        this.#accountControl.classList.remove("accounting-not-empty");
        this.#accountControl.classList.remove("is-invalid");
        this.#account.innerText = "";
        this.#account.dataset.code = "";
        this.#account.dataset.text = "";
        this.#accountError.innerText = "";
        this.#summaryControl.dataset.bsTarget = "#accounting-summary-editor-" + side.entryType + "-modal";
        this.#summaryControl.classList.remove("accounting-not-empty");
        this.#summaryControl.classList.remove("is-invalid");
        this.#summary.dataset.value = "";
        this.#summary.innerText = ""
        this.#summaryError.innerText = ""
        this.#amount.value = "";
        this.#amount.classList.remove("is-invalid");
        this.#amountError.innerText = "";
    }

    /**
     * Edits a journal entry.
     *
     * @param entry {JournalEntrySubForm} the journal entry sub-form
     * @param accountCode {string} the account code
     * @param accountText {string} the account text
     * @param summary {string} the summary
     * @param amount {string} the amount
     */
    #onEdit(entry, accountCode, accountText, summary, amount) {
        this.#entry = entry;
        this.#side = entry.side;
        this.entryType = this.#side.entryType;
        this.#element.dataset.entryType = entry.entryType;
        if (accountCode === "") {
            this.#accountControl.classList.remove("accounting-not-empty");
        } else {
            this.#accountControl.classList.add("accounting-not-empty");
        }
        this.#account.innerText = accountText;
        this.#account.dataset.code = accountCode;
        this.#account.dataset.text = accountText;
        this.#summaryControl.dataset.bsTarget = "#accounting-summary-editor-" + entry.entryType + "-modal";
        if (summary === "") {
            this.#summaryControl.classList.remove("accounting-not-empty");
        } else {
            this.#summaryControl.classList.add("accounting-not-empty");
        }
        this.#summary.dataset.value = summary;
        this.#summary.innerText = summary;
        this.#amount.value = amount;
    }

    /**
     * The journal entry editor
     * @type {JournalEntryEditor}
     */
    static #editor;

    /**
     * Initializes the journal entry editor.
     *
     */
    static initialize() {
        this.#editor = new JournalEntryEditor();
    }

    /**
     * Adds a new journal entry.
     *
     * @param side {DebitCreditSideSubForm} the debit or credit side sub-form
     */
    static addNew(side) {
        this.#editor.#onAddNew(side);
    }

    /**
     * Edits a journal entry.
     *
     * @param entry {JournalEntrySubForm} the journal entry sub-form
     * @param accountCode {string} the account code
     * @param accountText {string} the account text
     * @param summary {string} the summary
     * @param amount {string} the amount
     */
    static edit(entry, accountCode, accountText, summary, amount) {
        this.#editor.#onEdit(entry, accountCode, accountText, summary, amount);
    }

    /**
     * Validates the account when the account is updated from the account selector.
     *
     */
    static validateAccount() {
        this.#editor.#validateAccount();
    }
}

/**
 * Escapes the HTML special characters and returns.
 *
 * @param s {string} the original string
 * @returns {string} the string with HTML special character escaped
 * @private
 */
function escapeHtml(s) {
    return String(s)
         .replaceAll("&", "&amp;")
         .replaceAll("<", "&lt;")
         .replaceAll(">", "&gt;")
         .replaceAll("\"", "&quot;");
}

/**
 * Formats a Decimal number.
 *
 * @param number {Decimal} the Decimal number
 * @returns {string} the formatted Decimal number
 */
function formatDecimal(number) {
    if (number.equals(new Decimal("0"))) {
        return "-";
    }
    const frac = number.modulo(1);
    const whole = Number(number.minus(frac)).toLocaleString();
    return whole + String(frac).substring(1);
}
