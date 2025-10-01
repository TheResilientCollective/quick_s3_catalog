export class SearchFilter {
  constructor(onSearch, onOptionsChange) {
    this.onSearch = onSearch;
    this.onOptionsChange = onOptionsChange;
    this.debouncedSearch = this.debounce(this.onSearch, 300);

    // Load saved preferences from localStorage
    this.options = this._loadOptionsFromStorage();

    // Container for the complete filter interface
    this.container = null;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'search-filter-container';

    // Search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-input-container';

    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Search datasets...';
    input.className = 'search-input';
    input.addEventListener('input', (e) => {
      this.debouncedSearch(e.target.value, this.options);
    });

    searchContainer.appendChild(input);

    // Display options toggles
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'search-options-container';

    // Date display toggle
    const dateToggleContainer = this._createToggle(
      'show-dates',
      'Show Timestamps',
      this.options.showDates,
      (checked) => {
        this.options.showDates = checked;
        this._saveOptionsToStorage();
        this._notifyOptionsChange();
      }
    );

    // Deduplication toggle
    const deduplicationToggleContainer = this._createToggle(
      'enable-deduplication',
      'Remove Duplicates',
      this.options.enableDeduplication,
      (checked) => {
        this.options.enableDeduplication = checked;
        this._saveOptionsToStorage();
        this._notifyOptionsChange();
      }
    );

    // Advanced options (collapsible)
    const advancedContainer = document.createElement('div');
    advancedContainer.className = 'advanced-options-container';

    const advancedToggle = document.createElement('button');
    advancedToggle.className = 'advanced-toggle';
    advancedToggle.textContent = 'Advanced Options';
    advancedToggle.type = 'button';

    const advancedContent = document.createElement('div');
    advancedContent.className = 'advanced-content';
    advancedContent.style.display = 'none';

    // Date format selector
    const dateFormatContainer = this._createSelect(
      'date-format',
      'Date Format',
      [
        { value: 'relative', label: 'Relative (2 hours ago)' },
        { value: 'absolute', label: 'Absolute (Oct 1, 2023)' },
        { value: 'both', label: 'Both (2 hours ago - Oct 1, 2023)' }
      ],
      this.options.dateFormat,
      (value) => {
        this.options.dateFormat = value;
        this._saveOptionsToStorage();
        this._notifyOptionsChange();
      }
    );

    // Case sensitive toggle for deduplication
    const caseSensitiveToggleContainer = this._createToggle(
      'case-sensitive',
      'Case Sensitive Deduplication',
      this.options.caseSensitive,
      (checked) => {
        this.options.caseSensitive = checked;
        this._saveOptionsToStorage();
        this._notifyOptionsChange();
      }
    );

    advancedContent.appendChild(dateFormatContainer);
    advancedContent.appendChild(caseSensitiveToggleContainer);

    advancedToggle.addEventListener('click', () => {
      const isVisible = advancedContent.style.display !== 'none';
      advancedContent.style.display = isVisible ? 'none' : 'block';
      advancedToggle.textContent = isVisible ? 'Advanced Options' : 'Hide Advanced';
    });

    advancedContainer.appendChild(advancedToggle);
    advancedContainer.appendChild(advancedContent);

    // Assemble the complete filter interface
    optionsContainer.appendChild(dateToggleContainer);
    optionsContainer.appendChild(deduplicationToggleContainer);
    optionsContainer.appendChild(advancedContainer);

    this.container.appendChild(searchContainer);
    this.container.appendChild(optionsContainer);

    return this.container;
  }

  /**
   * Creates a toggle switch element
   * @private
   * @param {string} id - Unique identifier for the toggle
   * @param {string} label - Display label for the toggle
   * @param {boolean} checked - Initial checked state
   * @param {Function} onChange - Callback when toggle changes
   * @returns {HTMLElement} Toggle container element
   */
  _createToggle(id, label, checked, onChange) {
    const container = document.createElement('div');
    container.className = 'toggle-container';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = id;
    toggle.className = 'toggle-input';
    toggle.checked = checked;
    toggle.addEventListener('change', (e) => onChange(e.target.checked));

    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = id;
    toggleLabel.className = 'toggle-label';
    toggleLabel.textContent = label;

    container.appendChild(toggle);
    container.appendChild(toggleLabel);

    return container;
  }

  /**
   * Creates a select dropdown element
   * @private
   * @param {string} id - Unique identifier for the select
   * @param {string} label - Display label for the select
   * @param {Array} options - Array of {value, label} objects for options
   * @param {string} selected - Currently selected value
   * @param {Function} onChange - Callback when selection changes
   * @returns {HTMLElement} Select container element
   */
  _createSelect(id, label, options, selected, onChange) {
    const container = document.createElement('div');
    container.className = 'select-container';

    const selectLabel = document.createElement('label');
    selectLabel.htmlFor = id;
    selectLabel.className = 'select-label';
    selectLabel.textContent = label;

    const select = document.createElement('select');
    select.id = id;
    select.className = 'select-input';

    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      optionElement.selected = option.value === selected;
      select.appendChild(optionElement);
    });

    select.addEventListener('change', (e) => onChange(e.target.value));

    container.appendChild(selectLabel);
    container.appendChild(select);

    return container;
  }

  /**
   * Gets current search and display options
   * @returns {Object} Current options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Updates options programmatically
   * @param {Object} newOptions - Options to update
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this._saveOptionsToStorage();
    this._updateUI();
    this._notifyOptionsChange();
  }

  /**
   * Loads options from localStorage
   * @private
   * @returns {Object} Loaded options with defaults
   */
  _loadOptionsFromStorage() {
    const defaultOptions = {
      showDates: true,
      enableDeduplication: false,
      dateFormat: 'relative',
      caseSensitive: false
    };

    try {
      const stored = localStorage.getItem('search-filter-options');
      if (stored) {
        return { ...defaultOptions, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load search filter options from localStorage:', error);
    }

    return defaultOptions;
  }

  /**
   * Saves current options to localStorage
   * @private
   */
  _saveOptionsToStorage() {
    try {
      localStorage.setItem('search-filter-options', JSON.stringify(this.options));
    } catch (error) {
      console.warn('Failed to save search filter options to localStorage:', error);
    }
  }

  /**
   * Updates the UI to reflect current options
   * @private
   */
  _updateUI() {
    if (!this.container) return;

    // Update toggle states
    const showDatesToggle = this.container.querySelector('#show-dates');
    if (showDatesToggle) showDatesToggle.checked = this.options.showDates;

    const deduplicationToggle = this.container.querySelector('#enable-deduplication');
    if (deduplicationToggle) deduplicationToggle.checked = this.options.enableDeduplication;

    const caseSensitiveToggle = this.container.querySelector('#case-sensitive');
    if (caseSensitiveToggle) caseSensitiveToggle.checked = this.options.caseSensitive;

    // Update select values
    const dateFormatSelect = this.container.querySelector('#date-format');
    if (dateFormatSelect) dateFormatSelect.value = this.options.dateFormat;
  }

  /**
   * Notifies listeners of options changes
   * @private
   */
  _notifyOptionsChange() {
    if (this.onOptionsChange) {
      this.onOptionsChange(this.options);
    }
  }

  /**
   * Resets all options to defaults
   */
  resetToDefaults() {
    this.options = {
      showDates: true,
      enableDeduplication: false,
      dateFormat: 'relative',
      caseSensitive: false
    };
    this._saveOptionsToStorage();
    this._updateUI();
    this._notifyOptionsChange();
  }

  /**
   * Gets current search input value
   * @returns {string} Search query
   */
  getSearchQuery() {
    const input = this.container?.querySelector('.search-input');
    return input ? input.value : '';
  }

  /**
   * Sets search input value
   * @param {string} query - Search query to set
   */
  setSearchQuery(query) {
    const input = this.container?.querySelector('.search-input');
    if (input) {
      input.value = query;
    }
  }

  debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
}