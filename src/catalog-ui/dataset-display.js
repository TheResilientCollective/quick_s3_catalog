export class DatasetDisplay {
  render(dataset) {
    const container = document.createElement('div');
    container.className = 'dataset-container';

    if (!dataset.isValid) {
      container.classList.add('invalid');
      container.innerHTML = `
        <h3>${dataset.title}</h3>
        <p><strong>Error:</strong> ${dataset.description}</p>
        <small>Path: ${dataset.metadataUrl}</small>
      `;
      return container;
    }

    // Generate enhanced date display with S3 timestamps
    const dateInfoHtml = this._generateDateInfo(dataset);

    // Generate deduplication status if applicable
    const deduplicationHtml = this._generateDeduplicationInfo(dataset);

    const distributionsHtml = dataset.distribution.map(dist => {
      // Resolve relative URLs to full S3 URLs if needed
      let downloadUrl = dist.contentUrl;
      if (downloadUrl && !downloadUrl.startsWith('http') && !downloadUrl.startsWith('#')) {
        // Construct full S3 URL for relative paths
        const s3Config = window.S3_CONFIG || {
          endpoint: 'https://oss.resilientservice.mooo.com',
          bucketName: 'resilentpublic'
        };
        downloadUrl = `${s3Config.endpoint}/${s3Config.bucketName}/${downloadUrl}`;
      }

      return `
        <li>
          <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer">
            ${dist.name || dist.encodingFormat || 'Download'}
          </a>
          <small>(${dist.encodingFormat || 'N/A'})</small>
        </li>
      `;
    }).join('');

    container.innerHTML = `
      <h3>${dataset.title}${deduplicationHtml}</h3>
      <p>${dataset.description || 'No description available.'}</p>
      <div class="dataset-metadata">
        <small>Creator: ${dataset.creator || 'N/A'} | Created: ${dataset.dateCreated ? new Date(dataset.dateCreated).toLocaleDateString() : 'N/A'}</small>
        ${dateInfoHtml}
      </div>
      <ul>${distributionsHtml}</ul>
    `;

    return container;
  }

  /**
   * Generates enhanced date information display
   * @private
   * @param {Dataset} dataset - Dataset to display date info for
   * @returns {string} HTML for date information
   */
  _generateDateInfo(dataset) {
    if (!dataset.timestampAvailable || !dataset.lastModified) {
      return '';
    }

    // Use formatted display if available, otherwise fall back to default formatting
    const displayText = dataset.dateDisplay || dataset.lastModified.toLocaleString();
    const relativeText = dataset.relativeDisplay || '';

    const timestampClass = 'dataset-timestamp';
    const relativeClass = relativeText ? 'dataset-timestamp-relative' : '';

    let dateHtml = `<div class="${timestampClass}">`;
    dateHtml += `<small><strong>Last Modified:</strong> ${displayText}</small>`;

    if (relativeText && relativeText !== displayText) {
      dateHtml += `<small class="${relativeClass}"> (${relativeText})</small>`;
    }

    dateHtml += '</div>';

    return dateHtml;
  }

  /**
   * Generates deduplication status information
   * @private
   * @param {Dataset} dataset - Dataset to display deduplication info for
   * @returns {string} HTML for deduplication status
   */
  _generateDeduplicationInfo(dataset) {
    if (!dataset.deduplicationInfo) {
      return '';
    }

    const { isDuplicate, duplicateCount } = dataset.deduplicationInfo;

    if (isDuplicate) {
      // This dataset was removed as a duplicate (shouldn't normally be displayed)
      return ' <span class="duplicate-indicator" title="This is a duplicate dataset">🔄</span>';
    } else if (duplicateCount > 1) {
      // This dataset was kept but had duplicates
      const duplicatesRemoved = duplicateCount - 1;
      return ` <span class="kept-indicator" title="${duplicatesRemoved} duplicate${duplicatesRemoved > 1 ? 's' : ''} removed">📌</span>`;
    }

    return '';
  }

  /**
   * Renders a dataset with enhanced options
   * @param {Dataset} dataset - Dataset to render
   * @param {Object} options - Rendering options
   * @param {boolean} options.showTimestamps - Whether to show timestamp information
   * @param {boolean} options.showDeduplication - Whether to show deduplication information
   * @returns {HTMLElement} Rendered dataset element
   */
  renderWithOptions(dataset, options = {}) {
    const { showTimestamps = true, showDeduplication = true } = options;

    // Temporarily store original options
    const originalTimestamp = dataset.timestampAvailable;
    const originalDedup = dataset.deduplicationInfo;

    // Apply display options
    if (!showTimestamps) {
      dataset.timestampAvailable = false;
    }
    if (!showDeduplication) {
      dataset.deduplicationInfo = null;
    }

    // Render with modified options
    const result = this.render(dataset);

    // Restore original values
    dataset.timestampAvailable = originalTimestamp;
    dataset.deduplicationInfo = originalDedup;

    return result;
  }

  /**
   * Updates an existing rendered dataset with new timestamp display
   * @param {HTMLElement} container - Existing dataset container
   * @param {Dataset} dataset - Updated dataset
   */
  updateTimestampDisplay(container, dataset) {
    const timestampContainer = container.querySelector('.dataset-timestamp');

    if (dataset.timestampAvailable && dataset.lastModified) {
      const newTimestampHtml = this._generateDateInfo(dataset);

      if (timestampContainer) {
        // Update existing timestamp
        timestampContainer.outerHTML = newTimestampHtml;
      } else {
        // Add new timestamp to metadata section
        const metadataSection = container.querySelector('.dataset-metadata');
        if (metadataSection) {
          metadataSection.insertAdjacentHTML('beforeend', newTimestampHtml);
        }
      }
    } else if (timestampContainer) {
      // Remove timestamp if no longer available
      timestampContainer.remove();
    }
  }

  /**
   * Updates an existing rendered dataset with new deduplication status
   * @param {HTMLElement} container - Existing dataset container
   * @param {Dataset} dataset - Updated dataset
   */
  updateDeduplicationDisplay(container, dataset) {
    const titleElement = container.querySelector('h3');
    if (!titleElement) return;

    // Remove existing deduplication indicators
    const existingIndicators = titleElement.querySelectorAll('.duplicate-indicator, .kept-indicator');
    existingIndicators.forEach(indicator => indicator.remove());

    // Add new deduplication info if applicable
    const deduplicationHtml = this._generateDeduplicationInfo(dataset);
    if (deduplicationHtml) {
      titleElement.insertAdjacentHTML('beforeend', deduplicationHtml);
    }
  }
}