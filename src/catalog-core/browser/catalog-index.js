class CatalogIndex {
  constructor() {
    this.sections = new Map();
    this.searchableText = new Map();
    this.projectPaths = new Map();
    this.lastUpdated = null;
  }

  update(newDatasets) {
    this.sections.clear();
    this.searchableText.clear();
    this.projectPaths.clear();

    for (const dataset of newDatasets) {
      if (!this.sections.has(dataset.section)) {
        this.sections.set(dataset.section, []);
      }
      this.sections.get(dataset.section).push(dataset);

      this.searchableText.set(dataset.id, `${dataset.title} ${dataset.description}`.toLowerCase());

      if (!this.projectPaths.has(dataset.section)) {
        this.projectPaths.set(dataset.section, []);
      }
      this.projectPaths.get(dataset.section).push(dataset.projectPath);
    }

    this.lastUpdated = new Date();
  }

  search(query) {
    const lowerCaseQuery = query.toLowerCase();
    const results = new Map();
    let totalResults = 0;

    for (const [section, datasets] of this.sections.entries()) {
      const matchingDatasets = datasets.filter(dataset => {
        const text = this.searchableText.get(dataset.id);
        return text && text.includes(lowerCaseQuery);
      });

      if (matchingDatasets.length > 0) {
        results.set(section, matchingDatasets);
        totalResults += matchingDatasets.length;
      }
    }

    return { sections: Object.fromEntries(results), totalResults };
  }

  getSections() {
    return Array.from(this.sections.keys());
  }

  getDatasetsInSection(section) {
    return this.sections.get(section) || [];
  }
}

export { CatalogIndex };