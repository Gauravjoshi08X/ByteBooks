// Sanitize filename for download
function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Show and hide pages
let currentPage = 'home';
let previousPage = 'home';

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    setTimeout(() => {
        document.getElementById(pageId).classList.add('active');
        const navLink = document.querySelector(`[onclick="showPage('${pageId}')"]`);
        if (navLink) navLink.classList.add('active');
        previousPage = currentPage;
        currentPage = pageId;
    }, 100);
}

// Fetch books from Internet Archive API by search query
async function searchBooks(query) {
    try {
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator,year,description,mediatype&sort[]=downloads desc&rows=20&page=1&output=json`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.response || !data.response.docs) {
            displaySearchResults([], query);
            return;
        }

        const books = data.response.docs.map(doc => {
            const identifier = doc.identifier;
            const title = doc.title || 'No Title';
            const author = doc.creator || 'Unknown Author';
            const pubYear = doc.year || 'N/A';
            const description = (typeof doc.description === 'string' ? doc.description : Array.isArray(doc.description) ? doc.description.join(' ') : '') || 'No description available.';
            const mediatype = doc.mediatype || '';

            // Construct URLs for read and pdf download
            const readUrl = `https://archive.org/embed/${identifier}`;
            const pdfUrl = `https://archive.org/download/${identifier}/${identifier}.pdf`;
            const pdfAvailable = mediatype === 'texts'; // We consider texts mediatype as downloadable PDFs available

            return {
                identifier,
                title,
                author,
                genre: pubYear,
                description,
                readUrl,
                pdfUrl,
                pdfAvailable
            };
        });

        displaySearchResults(books, query);
        showPage('search-results');
    } catch (err) {
        console.error('Error fetching data:', err);
        displaySearchResults([], query);
        showPage('search-results');
    }
}

// Display search results on page
function displaySearchResults(results, query) {
    const resultsCount = document.getElementById('resultsCount');
    const booksGrid = document.getElementById('booksGrid');

    resultsCount.textContent = `Found ${results.length} books for "${query}"`;

    booksGrid.innerHTML = '';

    results.forEach((book, index) => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card fade-in';
        bookCard.style.animationDelay = `${index * 0.1}s`;

        bookCard.innerHTML = `
            <div class="book-cover" style="background-image:url('https://archive.org/services/img/${book.identifier}'); background-size: cover; background-position: center;">
                <span style="font-size: 4rem; display:none;">📚</span>
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <span class="book-genre">${book.genre}</span>
                <div class="book-buttons" style="margin-top: 10px;">
                    <button class="btn btn-primary read-btn">Read</button>
                    <button class="btn btn-secondary download-btn" ${book.pdfAvailable ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'}>Download PDF</button>
                </div>
            </div>
        `;

        // Clicking the card except buttons opens detail page
        bookCard.addEventListener('click', e => {
            if (e.target.closest('.read-btn') || e.target.closest('.download-btn')) return; // skip if clicked button
            showBookDetail(book);
        });

        // Read button opens embed in new fullscreen tab
        bookCard.querySelector('.read-btn').onclick = e => {
            e.stopPropagation();
            window.open(book.readUrl, '_blank', 'fullscreen=yes');
        };

        // Download PDF button
        bookCard.querySelector('.download-btn').onclick = e => {
            e.stopPropagation();
            if (!book.pdfAvailable) return;
            const link = document.createElement('a');
            link.href = book.pdfUrl;
            link.download = `${sanitizeFilename(book.title)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        booksGrid.appendChild(bookCard);
    });
}

// Show book detail page with info and Read/Download buttons and Back button
function showBookDetail(book) {
    document.getElementById('detailTitle').textContent = book.title;
    document.getElementById('detailAuthor').textContent = `by ${book.author}`;
    document.getElementById('detailGenre').textContent = book.genre;
    document.getElementById('detailDescription').textContent = book.description || 'No description available.';

    const detailCover = document.getElementById('detailCover');
    detailCover.style.backgroundImage = `url('https://archive.org/services/img/${book.identifier}')`;
    detailCover.style.backgroundSize = 'cover';
    detailCover.style.backgroundPosition = 'center';
    detailCover.innerHTML = ''; // clear fallback emoji

    // Insert short description in the book content area
    const bookContent = document.getElementById('bookDescriptionContainer');
    if (book.description && book.description !== 'No description available.') {
        bookContent.innerHTML = `<p>${book.description}</p>`;
    } else {
        bookContent.innerHTML = `<p>No description available.</p>`;
    }

    // Add Read, Download, and Back buttons
    const controls = document.getElementById('detailControls');
    controls.innerHTML = `
        <button class="btn btn-primary" id="detailReadBtn">📖 Read</button>
        <button class="btn btn-secondary" id="detailDownloadBtn" ${book.pdfAvailable ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'}>⬇️ Download PDF</button>
        <button class="btn btn-outline" id="detailBackBtn">⬅️ Back</button>
    `;

    document.getElementById('detailReadBtn').onclick = () => {
        window.open(book.readUrl, '_blank', 'fullscreen=yes');
    };
    document.getElementById('detailDownloadBtn').onclick = () => {
        if (!book.pdfAvailable) return;
        const link = document.createElement('a');
        link.href = book.pdfUrl;
        link.download = `${sanitizeFilename(book.title)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    document.getElementById('detailBackBtn').onclick = () => {
        showPage(previousPage);
    };

    showPage('book-detail');
}

// Search on Enter key in input box
document.getElementById('searchInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && this.value.trim() !== '') {
        searchBooks(this.value.trim());
    }
});

// Initial load animation etc.
window.addEventListener('load', function () {
    setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) heroContent.style.animation = 'fadeInUp 1s ease';
    }, 200);
});

// Smooth scroll/parallax for hero image
window.addEventListener('scroll', function () {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    const heroImage = document.querySelector('.hero-image');
    if (heroImage) heroImage.style.transform = `translateY(${rate}px)`;
});

// Book hover effects on hero stack
document.addEventListener('DOMContentLoaded', function () {
    const books = document.querySelectorAll('.book');
    books.forEach(book => {
        book.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.05) rotate(0deg)';
            this.style.zIndex = '10';
        });

        book.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.zIndex = '';
        });
    });
});
