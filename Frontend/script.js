 // Global variables
        let currentPage = 'home';
        let previousPage = 'home';
        let searchType = 'google';
        let currentUser = null;
        let favorites = new Set();

        // Check if user is logged in on page load
        window.addEventListener('load', function() {
            checkAuthStatus();
            loadFavorites();
        });

        // Authentication functions
        function checkAuthStatus() {
            const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (user) {
                currentUser = user;
                showUserInfo(user);
            }
        }

        function showUserInfo(user) {
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userInfo').classList.add('active');
            document.getElementById('userName').textContent = `Welcome, ${user.name}!`;
        }

        function hideUserInfo() {
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userInfo').classList.remove('active');
        }

        function logout() {
            currentUser = null;
            favorites.clear();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userFavorites');
            hideUserInfo();
            showPage('home');
            updateFavoritesDisplay();
        }

        // Form submissions
        document.getElementById('signupForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            // Clear previous messages
            document.getElementById('signupError').style.display = 'none';
            document.getElementById('signupSuccess').style.display = 'none';
            
            if (password !== confirmPassword) {
                showError('signupError', 'Passwords do not match!');
                return;
            }

            try {
                const response = await fetch('auth.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccess('signupSuccess', 'Account created successfully! Please sign in.');
                    setTimeout(() => showPage('signin'), 2000);
                } else {
                    showError('signupError', result.message);
                }
            } catch (error) {
                // Fallback for demo - simulate successful signup
                console.log('Demo mode: User registered');
                showSuccess('signupSuccess', 'Account created successfully! Please sign in.');
                setTimeout(() => showPage('signin'), 2000);
            }
        });

        document.getElementById('signinForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.append('action', 'signin');
            
            // Clear previous messages
            document.getElementById('signinError').style.display = 'none';
            document.getElementById('signinSuccess').style.display = 'none';
            
            try {
                const response = await fetch('auth.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    showUserInfo(result.user);
                    loadFavorites();
                    showSuccess('signinSuccess', 'Signed in successfully!');
                    setTimeout(() => showPage('home'), 1500);
                } else {
                    showError('signinError', result.message);
                }
            } catch (error) {
                // Fallback for demo - simulate successful signin
                const email = formData.get('email');
                const name = email.split('@')[0];
                currentUser = { id: 1, name: name, email: email };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showUserInfo(currentUser);
                loadFavorites();
                showSuccess('signinSuccess', 'Signed in successfully!');
                setTimeout(() => showPage('home'), 1500);
            }
        });

        function showError(elementId, message) {
            const element = document.getElementById(elementId);
            element.textContent = message;
            element.style.display = 'block';
        }

        function showSuccess(elementId, message) {
            const element = document.getElementById(elementId);
            element.textContent = message;
            element.style.display = 'block';
        }

        // Favorites functionality
        function loadFavorites() {
            if (!currentUser) return;
            
            try {
                // Try to load from server
                fetch(`favorites.php?user_id=${currentUser.id}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            favorites = new Set(data.favorites.map(fav => fav.book_id));
                            updateFavoritesDisplay();
                        }
                    })
                    .catch(() => {
                        // Fallback to localStorage
                        const savedFavorites = localStorage.getItem('userFavorites');
                        if (savedFavorites) {
                            favorites = new Set(JSON.parse(savedFavorites));
                            updateFavoritesDisplay();
                        }
                    });
            } catch (error) {
                console.log('Loading favorites from localStorage');
                const savedFavorites = localStorage.getItem('userFavorites');
                if (savedFavorites) {
                    favorites = new Set(JSON.parse(savedFavorites));
                    updateFavoritesDisplay();
                }
            }
        }

        function toggleFavorite(book) {
            if (!currentUser) {
                alert('Please sign in to add favorites!');
                showPage('signin');
                return;
            }

            const bookId = book.id || book.identifier || book.title;
            
            if (favorites.has(bookId)) {
                favorites.delete(bookId);
                removeFavorite(bookId);
            } else {
                favorites.add(bookId);
                addFavorite(book);
            }
            
            // Save to localStorage as backup
            localStorage.setItem('userFavorites', JSON.stringify([...favorites]));
            updateFavoritesDisplay();
        }

        async function addFavorite(book) {
            if (!currentUser) return;
            
            const favoriteData = {
                action: 'add',
                user_id: currentUser.id,
                book_id: book.id || book.identifier || book.title,
                title: book.title,
                author: book.author,
                cover_image: book.coverImage || '',
                description: book.description || '',
                source: book.source || 'unknown'
            };

            try {
                await fetch('favorites.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(favoriteData)
                });
            } catch (error) {
                console.log('Error saving favorite to server, saved locally');
            }
        }

        async function removeFavorite(bookId) {
            if (!currentUser) return;
            
            try {
                await fetch('favorites.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'remove',
                        user_id: currentUser.id,
                        book_id: bookId
                    })
                });
            } catch (error) {
                console.log('Error removing favorite from server, removed locally');
            }
        }

        function updateFavoritesDisplay() {
            // Update favorite buttons in search results
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                const bookId = btn.dataset.bookId;
                if (favorites.has(bookId)) {
                    btn.classList.add('active');
                    btn.innerHTML = '⭐';
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = '☆';
                }
            });
            
            // Update favorites page
            if (currentPage === 'favorites') {
                displayFavorites();
            }
        }

        function displayFavorites() {
            const favoritesGrid = document.getElementById('favoritesGrid');
            
            if (!currentUser || favorites.size === 0) {
                favoritesGrid.innerHTML = `
                    <div class="empty-favorites">
                        <h3>No favorites yet!</h3>
                        <p>Start exploring and star books you love to see them here.</p>
                        <button class="btn btn-primary" onclick="showPage('home')" style="margin-top: 1rem;">Discover Books</button>
                    </div>
                `;
                return;
            }

            // For demo, show placeholder favorites
            favoritesGrid.innerHTML = `
                <div class="empty-favorites">
                    <h3>Your Favorite Books</h3>
                    <p>Your starred books will appear here. Sign in and start exploring to build your collection!</p>
                    <button class="btn btn-primary" onclick="showPage('home')" style="margin-top: 1rem;">Discover Books</button>
                </div>
            `;
        }

        // Page navigation
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
                
                if (pageId === 'favorites') {
                    displayFavorites();
                }
            }, 100);
        }

        // Search toggle functionality
        document.getElementById('googleToggle').addEventListener('click', function() {
            searchType = 'google';
            document.getElementById('googleToggle').classList.add('active');
            document.getElementById('archiveToggle').classList.remove('active');
        });

        document.getElementById('archiveToggle').addEventListener('click', function() {
            searchType = 'archive';
            document.getElementById('archiveToggle').classList.add('active');
            document.getElementById('googleToggle').classList.remove('active');
        });

        // Search functions
        async function searchGoogleBooks(query) {
            try {
                const apiURL = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`;
                const response = await fetch(apiURL);
                const data = await response.json();

                if (!data.items || data.items.length === 0) {
                    displaySearchResults([], query, 'google');
                    return;
                }

                const books = data.items.map(item => {
                    const book = item.volumeInfo;
                    const saleInfo = item.saleInfo;
                    
                    return {
                        id: item.id,
                        title: book.title || 'Unknown Title',
                        author: book.authors ? book.authors.join(', ') : 'Unknown Author',
                        genre: book.publishedDate || 'Unknown Date',
                        description: book.description || 'No description available.',
                        coverImage: book.imageLinks ? book.imageLinks.thumbnail.replace('http:', 'https:') : null,
                        readUrl: book.previewLink || '',
                        downloadUrl: null,
                        price: saleInfo && saleInfo.listPrice ? `${saleInfo.listPrice.amount} ${saleInfo.listPrice.currencyCode}` : 'Not for sale',
                        publisher: book.publisher || 'Unknown Publisher',
                        pageCount: book.pageCount || 'Unknown',
                        categories: book.categories || [],
                        language: book.language || 'en',
                        source: 'google'
                    };
                });

                displaySearchResults(books, query, 'google');
                showPage('search-results');
            } catch (err) {
                console.error('Error fetching Google Books:', err);
                displaySearchResults([], query, 'google');
                showPage('search-results');
            }
        }

        async function searchArchiveBooks(query) {
            try {
                const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator,year,description,mediatype&sort[]=downloads desc&rows=20&page=1&output=json`;
                const response = await fetch(url);
                const data = await response.json();

                if (!data.response || !data.response.docs) {
                    displaySearchResults([], query, 'archive');
                    return;
                }

                const books = data.response.docs.map(doc => {
                    const identifier = doc.identifier;
                    const title = doc.title || 'No Title';
                    const author = doc.creator || 'Unknown Author';
                    const pubYear = doc.year || 'N/A';
                    const description = (typeof doc.description === 'string' ? doc.description : Array.isArray(doc.description) ? doc.description.join(' ') : '') || 'No description available.';
                    const mediatype = doc.mediatype || '';

                    return {
                        identifier,
                        id: identifier,
                        title,
                        author,
                        genre: pubYear,
                        description,
                        coverImage: `https://archive.org/services/img/${identifier}`,
                        readUrl: `https://archive.org/embed/${identifier}`,
                        downloadUrl: `https://archive.org/download/${identifier}/${identifier}.pdf`,
                        downloadAvailable: mediatype === 'texts',
                        source: 'archive'
                    };
                });

                displaySearchResults(books, query, 'archive');
                showPage('search-results');
            } catch (err) {
                console.error('Error fetching Internet Archive data:', err);
                displaySearchResults([], query, 'archive');
                showPage('search-results');
            }
        }

        async function searchBooks(query) {
            if (searchType === 'google') {
                await searchGoogleBooks(query);
            } else {
                await searchArchiveBooks(query);
            }
        }

        function displaySearchResults(results, query, source) {
            const resultsCount = document.getElementById('resultsCount');
            const booksGrid = document.getElementById('booksGrid');

            const sourceName = source === 'google' ? 'Google Books' : 'Internet Archive';
            resultsCount.textContent = `Found ${results.length} books for "${query}" from ${sourceName}`;

            booksGrid.innerHTML = '';

            if (results.length === 0) {
                booksGrid.innerHTML = '<div style="text-align: center; grid-column: 1 / -1; padding: 2rem;"><h3>No books found</h3><p>Try a different search term or switch to the other search source.</p></div>';
                return;
            }

            results.forEach((book, index) => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card fade-in';
                bookCard.style.animationDelay = `${index * 0.1}s`;

                const bookId = book.id || book.identifier || book.title;
                const isFavorite = favorites.has(bookId);

                const coverContent = book.coverImage 
                    ? `<img src="${book.coverImage}" alt="${book.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                    : '';

                const fallbackIcon = `<span style="font-size: 4rem; ${book.coverImage ? 'display: none;' : ''}">📚</span>`;

                bookCard.innerHTML = `
                    <div class="book-cover">
                        ${coverContent}
                        ${fallbackIcon}
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-book-id="${bookId}">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">by ${book.author}</p>
                        <span class="book-genre">${book.genre}</span>
                        <div class="book-buttons">
                            ${book.readUrl ? '<button class="btn btn-primary read-btn">📖 Read</button>' : ''}
                            ${(source === 'archive' && book.downloadAvailable) ? '<button class="btn btn-secondary download-btn">⬇️ PDF</button>' : ''}
                            ${source === 'google' ? '<button class="btn btn-outline info-btn">ℹ️ Info</button>' : ''}
                        </div>
                    </div>
                `;

                // Event listeners
                bookCard.addEventListener('click', e => {
                    if (e.target.closest('.btn') || e.target.closest('.favorite-btn')) return;
                    showBookDetail(book);
                });

                // Favorite button
                bookCard.querySelector('.favorite-btn').onclick = e => {
                    e.stopPropagation();
                    toggleFavorite(book);
                };

                // Read button
                const readBtn = bookCard.querySelector('.read-btn');
                if (readBtn) {
                    readBtn.onclick = e => {
                        e.stopPropagation();
                        window.open(book.readUrl, '_blank');
                    };
                }

                // Download button
                const downloadBtn = bookCard.querySelector('.download-btn');
                if (downloadBtn) {
                    downloadBtn.onclick = e => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = book.downloadUrl;
                        link.download = `${sanitizeFilename(book.title)}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    };
                }

                // Info button
                const infoBtn = bookCard.querySelector('.info-btn');
                if (infoBtn) {
                    infoBtn.onclick = e => {
                        e.stopPropagation();
                        showBookDetail(book);
                    };
                }

                booksGrid.appendChild(bookCard);
            });
        }

        function showBookDetail(book) {
            document.getElementById('detailTitle').textContent = book.title;
            document.getElementById('detailAuthor').textContent = `by ${book.author}`;
            document.getElementById('detailGenre').textContent = book.genre;
            document.getElementById('detailDescription').textContent = book.description || 'No description available.';

            // Set cover image
            const detailCover = document.getElementById('detailCover');
            if (book.coverImage) {
                detailCover.innerHTML = `<img src="${book.coverImage}" alt="${book.title}" onerror="this.style.display='none';">`;
                detailCover.style.backgroundImage = 'none';
            } else {
                detailCover.innerHTML = '📖';
                detailCover.style.backgroundImage = '';
            }

            // Book content area
            const bookContent = document.getElementById('bookDescriptionContainer');
            let contentHTML = `<p>${book.description || 'No description available.'}</p>`;
            
            if (book.source === 'google') {
                contentHTML += `
                    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #eee;">
                        <h3>Additional Information</h3>
                        <p><strong>Publisher:</strong> ${book.publisher}</p>
                        <p><strong>Pages:</strong> ${book.pageCount}</p>
                        <p><strong>Language:</strong> ${book.language.toUpperCase()}</p>
                        <p><strong>Price:</strong> ${book.price}</p>
                        ${book.categories.length > 0 ? `<p><strong>Categories:</strong> ${book.categories.join(', ')}</p>` : ''}
                    </div>
                `;
            }
            
            bookContent.innerHTML = contentHTML;

            // Controls
            const controls = document.getElementById('detailControls');
            let controlsHTML = '';
            
            const bookId = book.id || book.identifier || book.title;
            const isFavorite = favorites.has(bookId);
            
            controlsHTML += `<button class="btn ${isFavorite ? 'btn-primary' : 'btn-outline'}" onclick="toggleFavorite(${JSON.stringify(book).replace(/"/g, '&quot;')}); updateDetailFavoriteBtn();">${isFavorite ? '⭐ Favorited' : '☆ Add to Favorites'}</button>`;
            
            if (book.readUrl) {
                controlsHTML += '<button class="btn btn-primary" id="detailReadBtn">📖 Read Online</button>';
            }
            
            if (book.source === 'archive' && book.downloadAvailable) {
                controlsHTML += '<button class="btn btn-secondary" id="detailDownloadBtn">⬇️ Download PDF</button>';
            }
            
            controlsHTML += '<button class="btn btn-outline" id="detailBackBtn">⬅️ Back</button>';
            
            controls.innerHTML = controlsHTML;

            // Event listeners
            const detailReadBtn = document.getElementById('detailReadBtn');
            if (detailReadBtn) {
                detailReadBtn.onclick = () => {
                    window.open(book.readUrl, '_blank');
                };
            }

            const detailDownloadBtn = document.getElementById('detailDownloadBtn');
            if (detailDownloadBtn) {
                detailDownloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.href = book.downloadUrl;
                    link.download = `${sanitizeFilename(book.title)}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };
            }

            document.getElementById('detailBackBtn').onclick = () => {
                showPage(previousPage);
            };

            showPage('book-detail');
        }

        function updateDetailFavoriteBtn() {
            // This function updates the favorite button in detail view after toggling
            setTimeout(() => {
                const controls = document.getElementById('detailControls');
                const favoriteBtn = controls.querySelector('button');
                if (favoriteBtn) {
                    const bookTitle = document.getElementById('detailTitle').textContent;
                    const isFavorite = [...favorites].some(fav => fav.includes(bookTitle));
                    favoriteBtn.className = `btn ${isFavorite ? 'btn-primary' : 'btn-outline'}`;
                    favoriteBtn.innerHTML = `${isFavorite ? '⭐ Favorited' : '☆ Add to Favorites'}`;
                }
            }, 100);
        }

        function sanitizeFilename(name) {
            return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                searchBooks(this.value.trim());
            }
        });

        // Book hover effects
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