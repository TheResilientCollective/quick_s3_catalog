import { CatalogService } from '../catalog-core/browser/catalog-service.js';
import { DatasetDisplay } from './dataset-display.js';
import { SearchFilter } from './search-filter.js';

export class CatalogBrowser {
  constructor(options) {
    this.rootElement = document.querySelector(options.selector);
    if (!this.rootElement) {
      throw new Error(`Root element with selector '${options.selector}' not found.`);
    }

    this.catalogService = options.catalogService || new CatalogService(options.bucketName, options);
    this.datasetDisplay = new DatasetDisplay();

    // Enhanced SearchFilter with options change callback
    this.searchFilter = new SearchFilter(
      (query, searchOptions) => this.handleSearch(query, searchOptions),
      (options) => this.handleOptionsChange(options)
    );

    // State management
    this.allSections = {};
    this.currentSections = {};
    this.currentQuery = '';
    this.catalogMetadata = null;
    this.isLoaded = false;

    // UI elements
    this.statusContainer = null;
    this.contentContainer = null;
  }

  async load() {
    this.renderLoading();
    try {
      const catalogResponse = await this.catalogService.loadCatalog();
      this.allSections = catalogResponse.sections;
      this.catalogMetadata = catalogResponse.metadata;
      this.currentSections = this.allSections;
      this.isLoaded = true;
      this.render();
    } catch (error) {
      this.renderError(error);
    }
  }

  /**
   * Handles search with enhanced options
   * @param {string} query - Search query
   * @param {Object} searchOptions - Search options from filter
   */
  handleSearch(query, searchOptions = {}) {
    this.currentQuery = query;

    if (!query) {
      this.currentSections = this.allSections;
      this.render();
      return;
    }

    try {
      const searchResult = this.catalogService.search(query, {
        deduplicate: searchOptions.enableDeduplication
      });
      this.currentSections = searchResult.sections;
      this.render();
    } catch (error) {
      console.error('Search failed:', error);
      this.renderError(error);
    }
  }

  /**
   * Handles changes to display options (timestamps, deduplication, etc.)
   * @param {Object} options - Updated options from SearchFilter
   */
  async handleOptionsChange(options) {
    if (!this.isLoaded) return;

    try {
      // Update catalog service configurations
      await this._updateCatalogConfigurations(options);

      // Re-apply current search with new options
      this.handleSearch(this.currentQuery, options);
    } catch (error) {
      console.error('Failed to apply options change:', error);
      this._showErrorMessage('Failed to apply display options');
    }
  }

  /**
   * Updates catalog service configurations based on options
   * @private
   * @param {Object} options - Display options
   */
  async _updateCatalogConfigurations(options) {
    // Update deduplication configuration
    const deduplicationConfig = this.catalogService.getDeduplicationConfig();
    deduplicationConfig.update({
      enabled: options.enableDeduplication,
      caseSensitive: options.caseSensitive
    });

    // Update date display configuration
    const dateDisplayConfig = this.catalogService.getDateDisplayConfig();
    dateDisplayConfig.update({
      format: options.dateFormat
    });

    // Apply deduplication changes if enabled
    if (options.enableDeduplication !== this.catalogMetadata?.deduplicationEnabled) {
      const updatedCatalog = await this.catalogService.applyDeduplication();
      this.allSections = updatedCatalog.sections;
      this.catalogMetadata = updatedCatalog.metadata;
    }
  }

  renderLoading() {
    this.rootElement.innerHTML = '<p class="loading">🔄 Loading catalog...</p>';
  }

  renderError(error) {
    this.rootElement.innerHTML = `<p class="error">❌ Failed to load catalog: ${error.message}</p>`;
  }

  /**
   * Enhanced render method with status information
   */
  render() {
    this.rootElement.innerHTML = ''; // Clear previous content

    // Create main layout containers
    const headerContainer = document.createElement('div');
    headerContainer.className = 'catalog-header';

    this.statusContainer = document.createElement('div');
    this.statusContainer.className = 'catalog-status';

    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'catalog-content';

    // Add search filter to header
    headerContainer.appendChild(this.searchFilter.render());

    // Add status information
    this._renderStatusInfo();

    // Add sections content
    this._renderSections();

    // Assemble the complete interface
    this.rootElement.appendChild(headerContainer);
    this.rootElement.appendChild(this.statusContainer);
    this.rootElement.appendChild(this.contentContainer);
  }

  /**
   * Renders status information about the catalog
   * @private
   */
  _renderStatusInfo() {
    if (!this.catalogMetadata) {
      this.statusContainer.innerHTML = '';
      return;
    }

    const options = this.searchFilter.getOptions();
    const totalDatasets = Object.values(this.currentSections).reduce((sum, datasets) => sum + datasets.length, 0);

    let statusHtml = `
      <div class="catalog-stats">
        <span class="stat">📊 ${totalDatasets} datasets shown</span>
    `;

    if (this.catalogMetadata.deduplicationEnabled) {
      statusHtml += `<span class="stat deduplication-active">🔄 ${this.catalogMetadata.duplicatesRemoved} duplicates removed</span>`;
    }

    if (options.showDates && this.catalogMetadata.validDatasets > 0) {
      statusHtml += `<span class="stat">📅 Timestamps: ${options.dateFormat}</span>`;
    }

    if (this.currentQuery) {
      statusHtml += `<span class="stat search-active">🔍 "${this.currentQuery}"</span>`;
    }

    if (this.catalogMetadata.processingTimeMs) {
      statusHtml += `<span class="stat">⚡ ${Math.round(this.catalogMetadata.processingTimeMs)}ms</span>`;
    }

    statusHtml += '</div>';

    this.statusContainer.innerHTML = statusHtml;
  }

  /**
   * Renders the sections and datasets
   * @private
   */
  _renderSections() {
    const options = this.searchFilter.getOptions();

    if (Object.keys(this.currentSections).length === 0) {
      this.contentContainer.innerHTML = '<p class="no-results">📭 No datasets found.</p>';
      return;
    }

    this.contentContainer.innerHTML = '';

    for (const [sectionName, datasets] of Object.entries(this.currentSections)) {
      const sectionElement = document.createElement('details');
      sectionElement.className = 'dataset-section';
      sectionElement.open = true;

      const summary = document.createElement('summary');
      summary.className = 'section-summary';
      summary.innerHTML = `
        <span class="section-name">${sectionName}</span>
        <span class="section-count">(${datasets.length})</span>
      `;
      sectionElement.appendChild(summary);

      const sectionContent = document.createElement('div');
      sectionContent.className = 'section-content';

      datasets.forEach(dataset => {
        const datasetElement = this.datasetDisplay.renderWithOptions(dataset, {
          showTimestamps: options.showDates,
          showDeduplication: options.enableDeduplication
        });
        sectionContent.appendChild(datasetElement);
      });

      sectionElement.appendChild(sectionContent);
      this.contentContainer.appendChild(sectionElement);
    }
  }

  /**
   * Shows a temporary error message
   * @private
   * @param {string} message - Error message to display
   */
  _showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message temporary';
    errorElement.textContent = `❌ ${message}`;

    this.rootElement.insertBefore(errorElement, this.rootElement.firstChild);

    // Remove after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 5000);
  }

  /**
   * Gets current catalog statistics
   * @returns {Object} Statistics about the catalog
   */
  getStatistics() {
    return {
      totalSections: Object.keys(this.allSections).length,
      currentSections: Object.keys(this.currentSections).length,
      totalDatasets: Object.values(this.allSections).reduce((sum, datasets) => sum + datasets.length, 0),
      currentDatasets: Object.values(this.currentSections).reduce((sum, datasets) => sum + datasets.length, 0),
      searchQuery: this.currentQuery,
      options: this.searchFilter.getOptions(),
      metadata: this.catalogMetadata
    };
  }

  /**
   * Refreshes the catalog data
   */
  async refresh() {
    if (!this.isLoaded) {
      await this.load();
    } else {
      await this.load();
    }
  }

  /**
   * Updates display options programmatically
   * @param {Object} newOptions - Options to update
   */
  updateDisplayOptions(newOptions) {
    this.searchFilter.updateOptions(newOptions);
  }

  /**
   * Gets the current search query
   * @returns {string} Current search query
   */
  getCurrentQuery() {
    return this.currentQuery;
  }

  /**
   * Sets a new search query
   * @param {string} query - New search query
   */
  setSearchQuery(query) {
    this.searchFilter.setSearchQuery(query);
    this.handleSearch(query, this.searchFilter.getOptions());
  }
}