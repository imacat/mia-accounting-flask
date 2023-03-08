/* The Mia! Accounting Flask Project
 * material-fab-speed-dial.js: The JavaScript for the speed dial for the material floating buttons
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
    initializeMaterialFabSpeedDial();
});

/**
 * Initializes the speed dial of the material floating buttons.
 *
 * @private
 */
function initializeMaterialFabSpeedDial() {
    const btnFab = document.getElementById("accounting-btn-material-fab-speed-dial");
    const fab = document.getElementById(btnFab.dataset.target);
    btnFab.onclick = () => {
        if (fab.classList.contains("show")) {
            fab.classList.remove("show");
        } else {
            fab.classList.add("show");
        }
    }
}
