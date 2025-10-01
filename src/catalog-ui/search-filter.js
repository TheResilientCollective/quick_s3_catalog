export class SearchFilter {
  constructor(onSearch) {
    this.onSearch = onSearch;
    this.debouncedSearch = this.debounce(this.onSearch, 300);
  }

  render() {
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Search datasets...';
    input.className = 'search-input';
    input.addEventListener('input', (e) => {
      this.debouncedSearch(e.target.value);
    });
    return input;
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