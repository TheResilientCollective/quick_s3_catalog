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
    this.searchFilter = new SearchFilter((query) => this.handleSearch(query));
    this.allSections = {};
  }

  async load() {
    this.renderLoading();
    try {
      this.allSections = await this.catalogService.loadCatalog();
      this.render(this.allSections);
    } catch (error) {
      this.renderError(error);
    }
  }

  handleSearch(query) {
    if (!query) {
      this.render(this.allSections);
      return;
    }
    const searchResult = this.catalogService.search(query);
    this.render(searchResult.sections);
  }

  renderLoading() {
    this.rootElement.innerHTML = '<p class="loading">Loading catalog...</p>';
  }

  renderError(error) {
    this.rootElement.innerHTML = `<p class="error">Failed to load catalog: ${error.message}</p>`;
  }

  render(sections) {
    this.rootElement.innerHTML = ''; // Clear previous content
    this.rootElement.appendChild(this.searchFilter.render());

    if (Object.keys(sections).length === 0) {
      this.rootElement.insertAdjacentHTML('beforeend', '<p class="no-results">No datasets found.</p>');
      return;
    }

    for (const [sectionName, datasets] of Object.entries(sections)) {
      const sectionElement = document.createElement('details');
      sectionElement.className = 'dataset-section';
      sectionElement.open = true;

      const summary = document.createElement('summary');
      summary.textContent = `${sectionName} (${datasets.length})`;
      sectionElement.appendChild(summary);

      datasets.forEach(dataset => {
        sectionElement.appendChild(this.datasetDisplay.render(dataset));
      });

      this.rootElement.appendChild(sectionElement);
    }
  }
}