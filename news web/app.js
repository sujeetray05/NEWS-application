/**
 * GlobalNews Intelligence Hub - Core Engine
 * Powered by async/await & NewsAPI.
 */

const CONFIG = {
    API_KEY: '8aa583c71a6c448099c401a2bbc8f632',
    BASE_URL: 'https://newsapi.org/v2',
    PAGE_SIZE: 12,
    DEFAULT_IMAGE: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000'
};
/* this is the current state of the application.*/
const state = {
    category: 'general',
    query: '',
    isLoading: false
};

const elements = {
    newsGrid: document.getElementById('newsGrid'),
    loadingGrid: document.getElementById('loading'),
    errorContainer: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    retryBtn: document.getElementById('retryBtn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    categoryBtns: document.querySelectorAll('.category-btn')
};

/**
 * Core fetching logic
 */
async function fetchNews(endpoint, params = {}) {
    setLoading(true);
    setError(null);
    elements.newsGrid.style.opacity = '0';

    try {
        const queryParams = new URLSearchParams({
            apiKey: CONFIG.API_KEY,
            pageSize: CONFIG.PAGE_SIZE,
            language: 'en',
            ...params
        });

        // Add country only for headlines
        if (endpoint === 'top-headlines' && !params.q) {
            queryParams.append('country', 'us');
        }

        const response = await fetch(`${CONFIG.BASE_URL}/${endpoint}?${queryParams.toString()}`);
        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        if (data.articles.length === 0) {
            showEmptyState();
        } else {
            renderArticles(data.articles);
        }
    } catch (err) {
        console.error('Core Error:', err);
        setError(err.message || 'System encountered an unexpected disruption.');
    } finally {
        setLoading(false);
        setTimeout(() => { elements.newsGrid.style.opacity = '1'; }, 50);
    }
}

/**
 * Render engine
 */
function renderArticles(articles) {
    elements.newsGrid.innerHTML = articles
        .filter(a => a.title !== '[Removed]')
        .map(article => `
            <article class="news-card">
                <div class="image-container">
                    <div class="source-tag">${article.source.name}</div>
                    <img src="${article.urlToImage || CONFIG.DEFAULT_IMAGE}" 
                         alt="News" 
                         class="card-image" 
                         onerror="this.src='${CONFIG.DEFAULT_IMAGE}';">
                </div>
                <div class="card-content">
                    <h2>${article.title}</h2>
                    <p>${article.description || 'Full coverage for this headline is available via the source link below.'}</p>
                    <div class="card-footer">
                        <span class="date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            ${new Date(article.publishedAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                        </span>
                        <a href="${article.url}" target="_blank" class="read-more">Read Insight →</a>
                    </div>
                </div>
            </article>
        `).join('');
}

/**
 * UI State Handlers
 */
function setLoading(loading) {
    state.isLoading = loading;
    elements.loadingGrid.classList.toggle('hidden', !loading);
    if (loading) {
        elements.newsGrid.classList.add('hidden');
        elements.errorContainer.classList.add('hidden');
    } else {
        elements.newsGrid.classList.remove('hidden');
    }
}

function setError(msg) {
    if (msg) {
        elements.errorText.textContent = msg;
        elements.errorContainer.classList.remove('hidden');
        elements.newsGrid.classList.add('hidden');
    } else {
        elements.errorContainer.classList.add('hidden');
    }
}

function showEmptyState() {
    elements.newsGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🔎</div>
            <p>Intelligence scan yielded no results for "${state.query || state.category}".</p>
        </div>
    `;
}

/**
 * Event Hub
 */
elements.categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        state.category = btn.dataset.category;
        state.query = '';
        elements.searchInput.value = '';
        fetchNews('top-headlines', { category: state.category });
    });
});

elements.searchBtn.addEventListener('click', () => {
    const q = elements.searchInput.value.trim();
    if (q) {
        state.query = q;
        fetchNews('everything', { q, sortBy: 'publishedAt' });
    }
});

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') elements.searchBtn.click();
});

elements.retryBtn.addEventListener('click', () => {
    if (state.query) {
        fetchNews('everything', { q: state.query });
    } else {
        fetchNews('top-headlines', { category: state.category });
    }
});

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    fetchNews('top-headlines', { category: state.category });
});