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
      <h3>${dataset.title}</h3>
      <p>${dataset.description || 'No description available.'}</p>
      <small>Creator: ${dataset.creator || 'N/A'} | Created: ${dataset.dateCreated ? new Date(dataset.dateCreated).toLocaleDateString() : 'N/A'}</small>
      <ul>${distributionsHtml}</ul>
    `;

    return container;
  }
}