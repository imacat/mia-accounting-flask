# The Mia! Accounting Flask Project.
# Author: imacat@mail.imacat.idv.tw (imacat), 2023/2/1

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
"""The forms for the account management.

"""
import sqlalchemy as sa
from flask import request
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField
from wtforms.validators import DataRequired, ValidationError

from accounting.database import db
from accounting.locale import lazy_gettext
from accounting.models import BaseAccount, Account
from accounting.utils.random_id import new_id
from accounting.utils.strip_text import strip_text
from accounting.utils.user import get_current_user_pk


class BaseAccountExists:
    """The validator to check if the base account exists."""

    def __call__(self, form: FlaskForm, field: StringField) -> None:
        if field.data == "":
            return
        if db.session.get(BaseAccount, field.data) is None:
            raise ValidationError(lazy_gettext(
                "The base account does not exist."))


class BaseAccountAvailable:
    """The validator to check if the base account is available."""

    def __call__(self, form: FlaskForm, field: StringField) -> None:
        if field.data == "":
            return
        if len(field.data) != 4:
            raise ValidationError(lazy_gettext(
                "The base account is not available."))


class AccountForm(FlaskForm):
    """The form to create or edit an account."""
    base_code = StringField(
        filters=[strip_text],
        validators=[
            DataRequired(lazy_gettext("Please select the base account.")),
            BaseAccountExists(),
            BaseAccountAvailable()])
    """The code of the base account."""
    title = StringField(
        filters=[strip_text],
        validators=[DataRequired(lazy_gettext("Please fill in the title"))])
    """The title."""
    is_offset_needed = BooleanField()
    """Whether the the entries of this account need offsets."""

    def populate_obj(self, obj: Account) -> None:
        """Populates the form data into an account object.

        :param obj: The account object.
        :return: None.
        """
        is_new: bool = obj.id is None
        prev_base_code: str | None = obj.base_code
        if is_new:
            obj.id = new_id(Account)
        obj.base_code = self.base_code.data
        if prev_base_code != self.base_code.data:
            max_no: int = db.session.scalars(
                sa.select(sa.func.max(Account.no))
                .filter(Account.base_code == self.base_code.data)).one()
            obj.no = 1 if max_no is None else max_no + 1
        obj.title = self.title.data
        obj.is_offset_needed = self.is_offset_needed.data
        if is_new:
            current_user_pk: int = get_current_user_pk()
            obj.created_by_id = current_user_pk
            obj.updated_by_id = current_user_pk
        if prev_base_code is not None \
                and prev_base_code != self.base_code.data:
            setattr(self, "__post_update",
                    lambda: sort_accounts_in(prev_base_code, obj.id))

    def post_update(self, obj) -> None:
        """The post-processing after the update.

        :return: None
        """
        current_user_pk: int = get_current_user_pk()
        obj.updated_by_id = current_user_pk
        obj.updated_at = sa.func.now()
        if hasattr(self, "__post_update"):
            getattr(self, "__post_update")()

    @property
    def selected_base(self) -> BaseAccount | None:
        """The selected base account in the form.

        :return: The selected base account in the form.
        """
        return db.session.get(BaseAccount, self.base_code.data)

    @property
    def base_options(self) -> list[BaseAccount]:
        """The selectable base accounts.

        :return: The selectable base accounts.
        """
        return BaseAccount.query\
            .filter(sa.func.char_length(BaseAccount.code) == 4)\
            .order_by(BaseAccount.code).all()


def sort_accounts_in(base_code: str, exclude: int) -> None:
    """Sorts the accounts under a base account after changing the base
    account or deleting an account.

    :param base_code: The code of the base account.
    :param exclude: The account ID to exclude.
    :return: None.
    """
    accounts: list[Account] = Account.query\
        .filter(Account.base_code == base_code,
                Account.id != exclude)\
        .order_by(Account.no).all()
    for i in range(len(accounts)):
        if accounts[i].no != i + 1:
            accounts[i].no = i + 1


class AccountReorderForm:
    """The form to reorder the accounts."""

    def __init__(self, base: BaseAccount):
        """Constructs the form to reorder the accounts under a base account.

        :param base: The base account.
        """
        self.base: BaseAccount = base
        self.is_modified: bool = False

    def save_order(self) -> None:
        """Saves the order of the account.

        :return:
        """
        accounts: list[Account] = self.base.accounts

        # Collects the specified order.
        orders: dict[Account, int] = {}
        for account in accounts:
            if f"{account.id}-no" in request.form:
                try:
                    orders[account] = int(request.form[f"{account.id}-no"])
                except ValueError:
                    pass

        # Missing and invalid orders are appended to the end.
        missing: list[Account] = [x for x in accounts if x not in orders]
        if len(missing) > 0:
            next_no: int = 1 if len(orders) == 0 else max(orders.values()) + 1
            for account in missing:
                orders[account] = next_no

        # Sort by the specified order first, and their original order.
        accounts = sorted(accounts, key=lambda x: (orders[x], x.no, x.code))

        # Update the orders.
        with db.session.no_autoflush:
            for i in range(len(accounts)):
                if accounts[i].no != i + 1:
                    accounts[i].no = i + 1
                    self.is_modified = True
