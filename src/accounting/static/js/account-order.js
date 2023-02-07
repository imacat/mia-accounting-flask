/* The Mia! Accounting Flask Project
 * account-order.js: The JavaScript for the account order
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
 * First written: 2023/2/2
 */

// Initializes the page JavaScript.
document.addEventListener("DOMContentLoaded", function () {
    const list = document.getElementById("accounting-order-list");
    if (list !== null) {
        const onReorder = function () {
            const accounts = Array.from(list.children);
            for (let i = 0; i < accounts.length; i++) {
                const no = document.getElementById("accounting-order-" + accounts[i].dataset.id + "-no");
                const code = document.getElementById("accounting-order-" + accounts[i].dataset.id + "-code");
                no.value = String(i + 1);
                code.innerText = list.dataset.baseCode + "-" + ("000" + (i + 1)).slice(-3);
            }
        };
        initializeDragAndDropReordering(list, onReorder);
    }
});
