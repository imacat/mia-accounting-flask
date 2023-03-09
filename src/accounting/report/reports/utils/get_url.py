# The Mia! Accounting Flask Project.
# Author: imacat@mail.imacat.idv.tw (imacat), 2023/3/9

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
"""The utilities to get the ledger URL.

"""
from flask import url_for

from accounting.models import Currency, Account
from accounting.report.period import Period


def get_ledger_url(currency: Currency, account: Account, period: Period) \
        -> str:
    """Returns the URL of a ledger.

    :param currency: The currency.
    :param account: The account.
    :param period: The period.
    :return: The URL of the ledger.
    """
    if period.is_default:
        return url_for("accounting.report.ledger-default",
                       currency=currency, account=account)
    return url_for("accounting.report.ledger",
                   currency=currency, account=account,
                   period=period)