(function () {
    const template = document.createElement("template");

    template.innerHTML = `
        <style>
            :host {
                display: block;
                width: 100%;
                height: 100%;
                font-family: "72", Arial, sans-serif;
                box-sizing: border-box;
            }

            * {
                box-sizing: border-box;
            }

            .dropdown-container {
                position: relative;
                width: 100%;
                height: 100%;
            }

            .dropdown-field {
                width: 100%;
                min-height: 42px;
                height: 100%;
                border: 1px solid #89919a;
                border-radius: 2px;
                background: #ffffff;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: border 0.15s ease;
            }

            .dropdown-field:hover {
                border-color: #0070f2;
            }

            .dropdown-field.open {
                border: 2px solid #0070f2;
            }

            .selected-text {
                flex: 1;
                padding: 0 12px;
                font-size: 16px;
                color: #32363a;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            .placeholder {
                color: #556b82;
            }

            .arrow-container {
                width: 42px;
                height: 100%;
                min-height: 40px;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .arrow {
                width: 8px;
                height: 8px;
                border-right: 2px solid #5b6670;
                border-bottom: 2px solid #5b6670;
                transform: rotate(45deg);
                margin-top: -4px;
                transition: transform 0.2s ease;
            }

            .dropdown-field.open .arrow {
                transform: rotate(225deg);
                margin-top: 4px;
            }

            .dropdown-panel {
                display: none;
                position: fixed;
                z-index: 999999;
                background: #ffffff;
                border: 1px solid #89919a;
                border-radius: 2px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
                max-height: 350px;
                overflow: hidden;
            }

            .dropdown-panel.open {
                display: block;
            }

            .search-container {
                padding: 8px;
                border-bottom: 1px solid #d9d9d9;
                background: #ffffff;
            }

            .search-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }

            .search-icon {
                position: absolute;
                left: 10px;
                font-size: 16px;
                color: #5b6670;
                pointer-events: none;
            }

            .search-input {
                width: 100%;
                height: 38px;
                padding: 0 34px 0 34px;
                border: 1px solid #89919a;
                border-radius: 2px;
                font-family: "72", Arial, sans-serif;
                font-size: 14px;
                outline: none;
            }

            .search-input:focus {
                border: 2px solid #0070f2;
            }

            .clear-search {
                position: absolute;
                right: 10px;
                cursor: pointer;
                color: #5b6670;
                font-size: 18px;
                display: none;
            }

            .options-container {
                max-height: 280px;
                overflow-y: auto;
                overflow-x: hidden;
            }

            .option {
                min-height: 40px;
                padding: 9px 12px;
                display: flex;
                align-items: center;
                cursor: pointer;
                font-size: 14px;
                color: #32363a;
                border-bottom: 1px solid #f2f2f2;
            }

            .option:hover {
                background: #e5f0fa;
            }

            .option.selected {
                background: #d1e8ff;
                font-weight: 600;
            }

            .option-id {
                color: #556b82;
                margin-right: 6px;
            }

            .no-results {
                padding: 20px;
                text-align: center;
                color: #6a6d70;
                font-size: 14px;
            }

            .result-count {
                padding: 6px 12px;
                font-size: 12px;
                color: #6a6d70;
                background: #f7f7f7;
                border-bottom: 1px solid #e5e5e5;
            }
        </style>

        <div class="dropdown-container">

            <div class="dropdown-field">
                <div class="selected-text placeholder">Required</div>

                <div class="arrow-container">
                    <div class="arrow"></div>
                </div>
            </div>

            <div class="dropdown-panel">

                <div class="search-container">
                    <div class="search-wrapper">

                        <span class="search-icon">⌕</span>

                        <input
                            type="text"
                            class="search-input"
                            placeholder="Search..."
                        >

                        <span class="clear-search">×</span>

                    </div>
                </div>

                <div class="result-count"></div>

                <div class="options-container"></div>

            </div>

        </div>
    `;


    class SearchableDropdown extends HTMLElement {

        constructor() {
            super();

            this.attachShadow({ mode: "open" });
            this.shadowRoot.appendChild(
                template.content.cloneNode(true)
            );

            this._items = [];
            this._filteredItems = [];

            this._selectedKey = "";
            this._selectedText = "";

            this._placeholder = "Required";
            this._isOpen = false;

            this._field =
                this.shadowRoot.querySelector(".dropdown-field");

            this._selectedTextElement =
                this.shadowRoot.querySelector(".selected-text");

            this._panel =
                this.shadowRoot.querySelector(".dropdown-panel");

            this._searchInput =
                this.shadowRoot.querySelector(".search-input");

            this._clearSearch =
                this.shadowRoot.querySelector(".clear-search");

            this._optionsContainer =
                this.shadowRoot.querySelector(".options-container");

            this._resultCount =
                this.shadowRoot.querySelector(".result-count");


            this._field.addEventListener(
                "click",
                this._toggleDropdown.bind(this)
            );


            this._searchInput.addEventListener(
                "input",
                this._handleSearch.bind(this)
            );


            this._clearSearch.addEventListener(
                "click",
                this._clearSearchText.bind(this)
            );


            document.addEventListener(
                "click",
                this._handleOutsideClick.bind(this)
            );


            window.addEventListener(
                "resize",
                this._positionDropdown.bind(this)
            );


            window.addEventListener(
                "scroll",
                this._positionDropdown.bind(this),
                true
            );
        }



        /* ==========================================
           SAC LIFECYCLE METHODS
        ========================================== */


        onCustomWidgetBeforeUpdate(changedProperties) {

            if ("placeholder" in changedProperties) {

                this._placeholder =
                    changedProperties["placeholder"] || "Required";

            }

        }


        onCustomWidgetAfterUpdate(changedProperties) {

            if (
                "placeholder" in changedProperties &&
                !this._selectedKey
            ) {

                this._selectedTextElement.textContent =
                    this._placeholder;

                this._selectedTextElement.classList.add(
                    "placeholder"
                );

            }

        }



        /* ==========================================
           PUBLIC SAC METHODS
        ========================================== */


        setItems(items) {

            try {

                let parsedItems = items;

                if (typeof items === "string") {

                    parsedItems = JSON.parse(items);

                }


                if (!Array.isArray(parsedItems)) {

                    console.error(
                        "SearchableDropdown: Data must be an array."
                    );

                    return;

                }


                this._items = parsedItems.map((item) => {

                    return {

                        id:
                            item.id !== undefined
                                ? String(item.id)
                                : "",

                        description:
                            item.description !== undefined
                                ? String(item.description)
                                : String(item.id || "")

                    };

                });


                this._filteredItems = [...this._items];

                this._renderOptions();


            } catch (error) {

                console.error(
                    "SearchableDropdown: Invalid JSON passed to setItems.",
                    error
                );

            }

        }



        getSelectedKey() {

            return this._selectedKey;

        }



        getSelectedText() {

            return this._selectedText;

        }



        setSelectedKey(key) {

            const searchKey = String(key);

            const item = this._items.find(
                (member) =>
                    member.id === searchKey
            );


            if (item) {

                this._selectItem(
                    item,
                    false
                );

            }

        }



        clearSelection() {

            this._selectedKey = "";
            this._selectedText = "";

            this._selectedTextElement.textContent =
                this._placeholder;

            this._selectedTextElement.classList.add(
                "placeholder"
            );

            this._renderOptions();

        }



        /* ==========================================
           DROPDOWN
        ========================================== */


        _toggleDropdown(event) {

            event.stopPropagation();

            if (this._isOpen) {

                this._closeDropdown();

            } else {

                this._openDropdown();

            }

        }



        _openDropdown() {

            this._isOpen = true;

            this._field.classList.add("open");
            this._panel.classList.add("open");

            this._positionDropdown();

            this._filteredItems = [...this._items];

            this._searchInput.value = "";

            this._clearSearch.style.display = "none";

            this._renderOptions();


            setTimeout(() => {

                this._searchInput.focus();

            }, 50);

        }



        _closeDropdown() {

            this._isOpen = false;

            this._field.classList.remove("open");
            this._panel.classList.remove("open");

        }



        _positionDropdown() {

            if (!this._isOpen) {
                return;
            }


            const rect =
                this._field.getBoundingClientRect();


            this._panel.style.left =
                rect.left + "px";


            this._panel.style.top =
                rect.bottom + 4 + "px";


            this._panel.style.width =
                rect.width + "px";

        }



        _handleOutsideClick(event) {

            if (
                !this.contains(event.target) &&
                !this.shadowRoot.contains(event.target)
            ) {

                this._closeDropdown();

            }

        }



        /* ==========================================
           SEARCH
        ========================================== */


        _handleSearch() {

            const searchValue =
                this._searchInput.value
                    .trim()
                    .toLowerCase();


            if (searchValue.length > 0) {

                this._clearSearch.style.display =
                    "block";

            } else {

                this._clearSearch.style.display =
                    "none";

            }


            this._filteredItems =
                this._items.filter((item) => {

                    const id =
                        item.id.toLowerCase();

                    const description =
                        item.description.toLowerCase();


                    return (
                        id.includes(searchValue) ||
                        description.includes(searchValue)
                    );

                });


            this._renderOptions();

        }



        _clearSearchText(event) {

            event.stopPropagation();

            this._searchInput.value = "";

            this._clearSearch.style.display =
                "none";

            this._filteredItems =
                [...this._items];

            this._renderOptions();

            this._searchInput.focus();

        }



        /* ==========================================
           RENDER OPTIONS
        ========================================== */


        _renderOptions() {

            this._optionsContainer.innerHTML = "";


            this._resultCount.textContent =
                this._filteredItems.length +
                " result(s)";


            if (
                this._filteredItems.length === 0
            ) {

                const noResults =
                    document.createElement("div");

                noResults.className =
                    "no-results";

                noResults.textContent =
                    "No matching results found";

                this._optionsContainer.appendChild(
                    noResults
                );

                return;

            }


            const fragment =
                document.createDocumentFragment();


            this._filteredItems.forEach((item) => {

                const option =
                    document.createElement("div");


                option.className =
                    "option";


                if (
                    item.id ===
                    this._selectedKey
                ) {

                    option.classList.add(
                        "selected"
                    );

                }


                const idSpan =
                    document.createElement("span");

                idSpan.className =
                    "option-id";

                idSpan.textContent =
                    item.id;


                const descriptionSpan =
                    document.createElement("span");

                descriptionSpan.textContent =
                    item.description;


                option.appendChild(
                    idSpan
                );


                if (
                    item.description &&
                    item.description !== item.id
                ) {

                    option.appendChild(
                        document.createTextNode(
                            " - "
                        )
                    );

                    option.appendChild(
                        descriptionSpan
                    );

                }


                option.addEventListener(
                    "click",
                    (event) => {

                        event.stopPropagation();

                        this._selectItem(
                            item,
                            true
                        );

                    }
                );


                fragment.appendChild(
                    option
                );

            });


            this._optionsContainer.appendChild(
                fragment
            );

        }



        /* ==========================================
           SELECT ITEM
        ========================================== */


        _selectItem(
            item,
            fireEvent
        ) {

            this._selectedKey =
                item.id;

            this._selectedText =
                item.description;


            if (
                item.description &&
                item.description !== item.id
            ) {

                this._selectedTextElement.textContent =
                    item.id +
                    " - " +
                    item.description;

            } else {

                this._selectedTextElement.textContent =
                    item.id;

            }


            this._selectedTextElement.classList.remove(
                "placeholder"
            );


            this._closeDropdown();

            this._renderOptions();


            if (fireEvent) {

                this.dispatchEvent(
                    new CustomEvent(
                        "onSelectionChange"
                    )
                );

            }

        }

    }



    customElements.define(
        "com-madhav-searchable-dropdown",
        SearchableDropdown
    );

})();