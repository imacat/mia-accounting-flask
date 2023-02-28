# The Mia! Accounting Flask Project.
# Author: imacat@mail.imacat.idv.tw (imacat), 2023/2/27

#  Copyright (c) 2023 imacat.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""The common test libraries for the transaction test cases.

"""
import re
from decimal import Decimal
from datetime import date
from secrets import randbelow

import httpx
from flask import Flask

from test_site import db

NEXT_URI: str = "/_next"
"""The next URI."""
NON_EMPTY_NOTE: str = "  This is \n\na test."
"""The stripped content of an non-empty note."""
EMPTY_NOTE: str = " \n\n  "
"""The empty note content."""


class Accounts:
    """The shortcuts to the common accounts."""
    CASH: str = "1111-001"
    BANK: str = "1113-001"
    SALES: str = "4111-001"
    SERVICE: str = "4611-001"
    AGENCY: str = "4711-001"
    OFFICE: str = "5153-001"
    TRAVEL: str = "5154-001"
    INTEREST: str = "4111-001"
    DONATION: str = "7481-001"
    RENT: str = "7482-001"


def get_add_form(csrf_token: str) -> dict[str, str]:
    """Returns the form data to add a new transaction.

    :param csrf_token: The CSRF token.
    :return: The form data to add a new transaction.
    """
    return {"csrf_token": csrf_token,
            "next": NEXT_URI,
            "date": date.today().isoformat(),
            "currency-0-code": "USD",
            "currency-0-debit-0-no": "16",
            "currency-0-debit-0-account_code": Accounts.CASH,
            "currency-0-debit-0-summary": " ",
            "currency-0-debit-0-amount": " 495.26 ",
            "currency-0-debit-6-no": "2",
            "currency-0-debit-6-account_code": Accounts.BANK,
            "currency-0-debit-6-summary": " Deposit ",
            "currency-0-debit-6-amount": "6000",
            "currency-0-debit-12-no": "2",
            "currency-0-debit-12-account_code": Accounts.OFFICE,
            "currency-0-debit-12-summary": " Pens ",
            "currency-0-debit-12-amount": "4.99",
            "currency-0-credit-2-no": "6",
            "currency-0-credit-2-account_code": Accounts.SERVICE,
            "currency-0-credit-2-summary": " ",
            "currency-0-credit-2-amount": "5500",
            "currency-0-credit-7-account_code": Accounts.SALES,
            "currency-0-credit-7-summary": " ",
            "currency-0-credit-7-amount": "950",
            "currency-0-credit-27-account_code": Accounts.INTEREST,
            "currency-0-credit-27-summary": " ",
            "currency-0-credit-27-amount": "50.25",
            "currency-3-no": "2",
            "currency-3-code": "JPY",
            "currency-3-debit-2-no": "2",
            "currency-3-debit-2-account_code": Accounts.CASH,
            "currency-3-debit-2-summary": " ",
            "currency-3-debit-2-amount": "15000",
            "currency-3-debit-9-no": "5",
            "currency-3-debit-9-account_code": Accounts.BANK,
            "currency-3-debit-9-summary": " Deposit ",
            "currency-3-debit-9-amount": "95000",
            "currency-3-credit-3-account_code": Accounts.AGENCY,
            "currency-3-credit-3-summary": " Realtor ",
            "currency-3-credit-3-amount": "65000",
            "currency-3-credit-5-no": "4",
            "currency-3-credit-5-account_code": Accounts.DONATION,
            "currency-3-credit-5-summary": " Donation ",
            "currency-3-credit-5-amount": "45000",
            "currency-16-code": "TWD",
            "currency-16-debit-2-no": "2",
            "currency-16-debit-2-account_code": Accounts.CASH,
            "currency-16-debit-2-summary": " ",
            "currency-16-debit-2-amount": "10000",
            "currency-16-debit-9-no": "2",
            "currency-16-debit-9-account_code": Accounts.TRAVEL,
            "currency-16-debit-9-summary": " Gas ",
            "currency-16-debit-9-amount": "30000",
            "currency-16-credit-6-no": "6",
            "currency-16-credit-6-account_code": Accounts.RENT,
            "currency-16-credit-6-summary": " Rent ",
            "currency-16-credit-6-amount": "35000",
            "currency-16-credit-9-account_code": Accounts.DONATION,
            "currency-16-credit-9-summary": " Donation ",
            "currency-16-credit-9-amount": "5000",
            "note": f"\n \n\n  \n{NON_EMPTY_NOTE}  \n  \n\n  "}


def get_unchanged_update_form(txn_id: int, app: Flask, csrf_token: str) \
        -> dict[str, str]:
    """Returns the form data to update a transaction, where the data are not
    changed.

    :param txn_id: The transaction ID.
    :param app: The Flask application.
    :param csrf_token: The CSRF token.
    :return: The form data to update the transaction, where the data are not
        changed.
    """
    from accounting.models import Transaction, TransactionCurrency
    with app.app_context():
        txn: Transaction | None = db.session.get(Transaction, txn_id)
        assert txn is not None
        currencies: list[TransactionCurrency] = txn.currencies

    form: dict[str, str] = {"csrf_token": csrf_token,
                            "next": NEXT_URI,
                            "date": txn.date,
                            "note": "  \n \n\n  " if txn.note is None
                            else f"\n    \n\n \n  \n{txn.note}  \n\n   "}
    currency_indices_used: set[int] = set()
    currency_no: int = 0
    for currency in currencies:
        currency_index: int = __get_new_index(currency_indices_used)
        currency_no = currency_no + 3 + randbelow(3)
        currency_prefix: str = f"currency-{currency_index}"
        form[f"{currency_prefix}-no"] = str(currency_no)
        form[f"{currency_prefix}-code"] = currency.code
        entry_indices_used: set[int]
        entry_no: int
        prefix: str

        entry_indices_used = set()
        entry_no = 0
        for entry in currency.debit:
            entry_index: int = __get_new_index(entry_indices_used)
            entry_no = entry_no + 3 + randbelow(3)
            prefix = f"{currency_prefix}-debit-{entry_index}"
            form[f"{prefix}-eid"] = str(entry.id)
            form[f"{prefix}-no"] = str(entry_no)
            form[f"{prefix}-account_code"] = entry.account.code
            form[f"{prefix}-summary"] \
                = "  " if entry.summary is None else f" {entry.summary} "
            form[f"{prefix}-amount"] = str(entry.amount)

        entry_indices_used = set()
        entry_no = 0
        for entry in currency.credit:
            entry_index: int = __get_new_index(entry_indices_used)
            entry_no = entry_no + 3 + randbelow(3)
            prefix = f"{currency_prefix}-credit-{entry_index}"
            form[f"{prefix}-eid"] = str(entry.id)
            form[f"{prefix}-no"] = str(entry_no)
            form[f"{prefix}-account_code"] = entry.account.code
            form[f"{prefix}-summary"] \
                = "  " if entry.summary is None else f" {entry.summary} "
            form[f"{prefix}-amount"] = str(entry.amount)

    return form


def __get_new_index(indices_used: set[int]) -> int:
    """Returns a new random index that is not used.

    :param indices_used: The set of indices that are already used.
    :return: The newly-generated random index that is not used.
    """
    while True:
        index: int = randbelow(100)
        if index not in indices_used:
            indices_used.add(index)
            return index


def get_update_form(txn_id: int, app: Flask,
                    csrf_token: str, is_debit: bool | None) -> dict[str, str]:
    """Returns the form data to update a transaction, where the data are
    changed.

    :param txn_id: The transaction ID.
    :param app: The Flask application.
    :param csrf_token: The CSRF token.
    :param is_debit: True for a cash expense transaction, False for a cash
        income transaction, or None for a transfer transaction
    :return: The form data to update the transaction, where the data are
        changed.
    """
    form: dict[str, str] = get_unchanged_update_form(
        txn_id, app, csrf_token)

    # Mess up the entries in a currency
    currency_prefix: str = __get_currency_prefix(form, "USD")
    if is_debit is None or is_debit:
        form = __mess_up_debit(form, currency_prefix)
    if is_debit is None or not is_debit:
        form = __mess_up_credit(form, currency_prefix)

    # Mess-up the currencies
    form = __mess_up_currencies(form)

    return form


def __mess_up_debit(form: dict[str, str], currency_prefix: str) \
        -> dict[str, str]:
    """Mess up the debit journal entries in the form data.

    :param form: The form data.
    :param currency_prefix: The key prefix of the currency sub-form.
    :return: The messed-up form.
    """
    key: str
    m: re.Match

    # Remove the office expense
    key = [x for x in form
           if x.startswith(currency_prefix)
           and form[x] == Accounts.OFFICE][0]
    m = re.match(r"^((.+-)\d+-)account_code$", key)
    debit_prefix: str = m.group(2)
    entry_prefix: str = m.group(1)
    amount: Decimal = Decimal(form[f"{entry_prefix}amount"])
    form = {x: form[x] for x in form if not x.startswith(entry_prefix)}
    # Add a new travel expense
    indices: set[int] = set()
    for key in form:
        m = re.match(r"^.+-(\d+)-amount$", key)
        if m is not None:
            indices.add(int(m.group(1)))
    new_index: int = max(indices) + 5 + randbelow(20)
    min_no: int = min({int(form[x]) for x in form if x.endswith("-no")
                       and x.startswith(debit_prefix)})
    form[f"{debit_prefix}{new_index}-no"] = str(1 + randbelow(min_no - 1))
    form[f"{debit_prefix}{new_index}-amount"] = str(amount)
    form[f"{debit_prefix}{new_index}-account_code"] = Accounts.TRAVEL
    # Swap the cash and the bank order
    key_cash: str = __get_entry_no_key(form, currency_prefix, Accounts.CASH)
    key_bank: str = __get_entry_no_key(form, currency_prefix, Accounts.BANK)
    form[key_cash], form[key_bank] = form[key_bank], form[key_cash]
    return form


def __mess_up_credit(form: dict[str, str], currency_prefix: str) \
        -> dict[str, str]:
    """Mess up the credit journal entries in the form data.

    :param form: The form data.
    :param currency_prefix: The key prefix of the currency sub-form.
    :return: The messed-up form.
    """
    key: str
    m: re.Match

    # Remove the sales income
    key = [x for x in form
           if x.startswith(currency_prefix)
           and form[x] == Accounts.SALES][0]
    m = re.match(r"^((.+-)\d+-)account_code$", key)
    credit_prefix: str = m.group(2)
    entry_prefix: str = m.group(1)
    amount: Decimal = Decimal(form[f"{entry_prefix}amount"])
    form = {x: form[x] for x in form if not x.startswith(entry_prefix)}
    # Add a new agency income
    indices: set[int] = set()
    for key in form:
        m = re.match(r"^.+-(\d+)-amount$", key)
        if m is not None:
            indices.add(int(m.group(1)))
    new_index: int = max(indices) + 5 + randbelow(20)
    min_no: int = min({int(form[x]) for x in form if x.endswith("-no")
                       and x.startswith(credit_prefix)})
    form[f"{credit_prefix}{new_index}-no"] = str(1 + randbelow(min_no - 1))
    form[f"{credit_prefix}{new_index}-amount"] = str(amount)
    form[f"{credit_prefix}{new_index}-account_code"] = Accounts.AGENCY
    # Swap the service and the interest order
    key_srv: str = __get_entry_no_key(form, currency_prefix, Accounts.SERVICE)
    key_int: str = __get_entry_no_key(form, currency_prefix, Accounts.INTEREST)
    form[key_srv], form[key_int] = form[key_int], form[key_srv]
    return form


def __mess_up_currencies(form: dict[str, str]) -> dict[str, str]:
    """Mess up the currency sub-forms in the form data.

    :param form: The form data.
    :return: The messed-up form.
    """
    key: str
    m: re.Match

    # Remove JPY
    currency_prefix: str = __get_currency_prefix(form, "JPY")
    form = {x: form[x] for x in form if not x.startswith(currency_prefix)}
    # Add AUD
    indices: set[int] = set()
    for key in form:
        m = re.match(r"^currency-(\d+)-code$", key)
        if m is not None:
            indices.add(int(m.group(1)))
    new_index: int = max(indices) + 5 + randbelow(20)
    min_no: int = min({int(form[x]) for x in form if x.endswith("-no")
                       and "-debit-" not in x and "-credit-" not in x})
    prefix: str = f"currency-{new_index}-"
    form.update({
        f"{prefix}code": "AUD",
        f"{prefix}no": str(1 + randbelow(min_no - 1)),
        f"{prefix}debit-0-no": "6",
        f"{prefix}debit-0-account_code": Accounts.OFFICE,
        f"{prefix}debit-0-summary": " Envelop ",
        f"{prefix}debit-0-amount": "5.45",
        f"{prefix}debit-14-no": "6",
        f"{prefix}debit-14-account_code": Accounts.CASH,
        f"{prefix}debit-14-summary": "  ",
        f"{prefix}debit-14-amount": "14.55",
        f"{prefix}credit-16-no": "7",
        f"{prefix}credit-16-account_code": Accounts.RENT,
        f"{prefix}credit-16-summary": " Bike ",
        f"{prefix}credit-16-amount": "19.5",
        f"{prefix}credit-22-no": "5",
        f"{prefix}credit-22-account_code": Accounts.DONATION,
        f"{prefix}credit-22-summary": " Artist ",
        f"{prefix}credit-22-amount": "0.5",
    })
    # Swap the USD and TWD order
    usd_prefix: str = __get_currency_prefix(form, "USD")
    key_usd: str = f"{usd_prefix}no"
    twd_prefix: str = __get_currency_prefix(form, "TWD")
    key_twd: str = f"{twd_prefix}no"
    form[key_usd], form[key_twd] = form[key_twd], form[key_usd]
    # Change TWD to EUR
    key = [x for x in form if form[x] == "TWD"][0]
    form[key] = "EUR"
    return form


def __get_entry_no_key(form: dict[str, str], currency_prefix: str,
                       code: str) -> str:
    """Returns the key of an entry number in the form data.

    :param form: The form data.
    :param currency_prefix: The prefix of the currency.
    :param code: The code of the account.
    :return: The key of the entry number in the form data.
    """
    key: str = [x for x in form
                if x.startswith(currency_prefix)
                and form[x] == code][0]
    m: re.Match = re.match(r"^(.+-\d+-)account_code$", key)
    return f"{m.group(1)}no"


def __get_currency_prefix(form: dict[str, str], code: str) -> str:
    """Returns the prefix of a currency in the form data.

    :param form: The form data.
    :param code: The code of the currency.
    :return: The prefix of the currency.
    """
    key: str = [x for x in form if form[x] == code][0]
    m: re.Match = re.match(r"^(.+-)code$", key)
    return m.group(1)


def add_txn(client: httpx.Client, form: dict[str, str]) -> int:
    """Adds a transfer transaction.

    :param client: The client.
    :param form: The form data.
    :return: The newly-added transaction ID.
    """
    prefix: str = "/accounting/transactions"
    txn_type: str \
        = "income" if len({x for x in form if "-debit-" in x}) == 0 else\
        ("expense" if len({x for x in form if "-credit-" in x}) == 0 else
         "transfer")
    store_uri = f"{prefix}/store/{txn_type}"
    response: httpx.Response = client.post(store_uri, data=form)
    assert response.status_code == 302
    return match_txn_detail(response.headers["Location"])


def match_txn_detail(location: str) -> int:
    """Validates if the redirect location is the transaction detail, and
    returns the transaction ID on success.

    :param location: The redirect location.
    :return: The transaction ID.
    :raise AssertionError: When the location is not the transaction detail.
    """
    m: re.Match = re.match(
        r"^/accounting/transactions/(\d+)\?next=%2F_next",
        location)
    assert m is not None
    return int(m.group(1))


def set_negative_amount(form: dict[str, str]) -> None:
    """Sets a negative amount in the form data, keeping the balance.

    :param form: The form data.
    :return: None.
    """
    amount_keys: list[str] = []
    prefix: str = ""
    for key in form.keys():
        m: re.Match = re.match(r"^(.+)-\d+-amount$", key)
        if m is None:
            continue
        if prefix != "" and prefix != m.group(1):
            continue
        prefix = m.group(1)
        amount_keys.append(key)
    form[amount_keys[0]] = str(-Decimal(form[amount_keys[0]]))
    form[amount_keys[1]] = str(Decimal(form[amount_keys[1]])
                               + 2 * Decimal(form[amount_keys[0]]))


def remove_debit_in_a_currency(form: dict[str, str]) -> None:
    """Removes credit entries in a currency sub-form.

    :param form: The form data.
    :return: None.
    """
    key: str = [x for x in form if "-debit-" in x][0]
    m: re.Match = re.match(r"^(.+-debit-)", key)
    keys: set[str] = {x for x in form if x.startswith(m.group(1))}
    for key in keys:
        del form[key]


def remove_credit_in_a_currency(form: dict[str, str]) -> None:
    """Removes credit entries in a currency sub-form.

    :param form: The form data.
    :return: None.
    """
    key: str = [x for x in form if "-credit-" in x][0]
    m: re.Match = re.match(r"^(.+-credit-)", key)
    keys: set[str] = {x for x in form if x.startswith(m.group(1))}
    for key in keys:
        del form[key]
