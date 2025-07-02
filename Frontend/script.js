        const books = [
            {
                id: 1,
                title: "The Great Gatsby",
                author: "F. Scott Fitzgerald",
                genre: "Classic",
                description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, idealism, and moral decay.",
                emoji: "🎭"
            },
            {
                id: 2,
                title: "To Kill a Mockingbird",
                author: "Harper Lee",
                genre: "Drama",
                description: "A gripping tale of racial injustice and childhood innocence in the American South.",
                emoji: "🕊️"
            },
            {
                id: 3,
                title: "1984",
                author: "George Orwell",
                genre: "Dystopian",
                description: "A dystopian social science fiction novel about totalitarian control and surveillance.",
                emoji: "👁️"
            },
            {
                id: 4,
                title: "Pride and Prejudice",
                author: "Jane Austen",
                genre: "Romance",
                description: "A romantic novel of manners set in Georgian England, exploring themes of love, reputation, and class.",
                emoji: "💕"
            },
            {
                id: 5,
                title: "The Catcher in the Rye",
                author: "J.D. Salinger",
                genre: "Coming-of-age",
                description: "A controversial novel following teenager Holden Caulfield's experiences in New York City.",
                emoji: "🌆"
            },
            {
                id: 6,
                title: "Harry Potter and the Sorcerer's Stone",
                author: "J.K. Rowling",
                genre: "Fantasy",
                description: "The first book in the magical Harry Potter series, following a young wizard's adventures.",
                emoji: "⚡"
            },
            {
                id: 7,
                title: "The Lord of the Rings",
                author: "J.R.R. Tolkien",
                genre: "Fantasy",
                description: "An epic high-fantasy novel following the quest to destroy the One Ring.",
                emoji: "💍"
            },
            {
                id: 8,
                title: "Dune",
                author: "Frank Herbert",
                genre: "Science Fiction",
                description: "A science fiction masterpiece set on the desert planet Arrakis.",
                emoji: "🏜️"
            }
        ];

        let currentPage = 'home';

        // Page navigation
        function showPage(pageId) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });

            // Update nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            // Show selected page
            setTimeout(() => {
                document.getElementById(pageId).classList.add('active');
                if (pageId !== 'home') {
                    document.querySelector(`[onclick="showPage('${pageId}')"]`).classList.add('active');
                } else {
                    document.querySelector(`[onclick="showPage('home')"]`).classList.add('active');
                }
                currentPage = pageId;
            }, 100);
        }

        // Search functionality
        function searchBooks(query) {
            const filteredBooks = books.filter(book =>
                book.title.toLowerCase().includes(query.toLowerCase()) ||
                book.author.toLowerCase().includes(query.toLowerCase()) ||
                book.genre.toLowerCase().includes(query.toLowerCase())
            );

            displaySearchResults(filteredBooks, query);
            showPage('search-results');
        }

        // Display search results
        function displaySearchResults(results, query) {
            const resultsCount = document.getElementById('resultsCount');
            const booksGrid = document.getElementById('booksGrid');

            resultsCount.textContent = `Found ${results.length} books for "${query}"`;
            
            booksGrid.innerHTML = '';
            
            results.forEach((book, index) => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card fade-in';
                bookCard.style.animationDelay = `${index * 0.1}s`;
                bookCard.onclick = () => showBookDetail(book);
                
                bookCard.innerHTML = `
                    <div class="book-cover" style="background: linear-gradient(135deg, ${getRandomGradient()})">
                        <span style="font-size: 4rem;">${book.emoji}</span>
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">by ${book.author}</p>
                        <span class="book-genre">${book.genre}</span>
                    </div>
                `;
                
                booksGrid.appendChild(bookCard);
            });
        }

        // Show book details
        function showBookDetail(book) {
            document.getElementById('detailTitle').textContent = book.title;
            document.getElementById('detailAuthor').textContent = `by ${book.author}`;
            document.getElementById('detailGenre').textContent = book.genre;
            document.getElementById('detailDescription').textContent = book.description;
            document.getElementById('detailCover').innerHTML = `<span style="font-size: 6rem;">${book.emoji}</span>`;
            document.getElementById('detailCover').style.background = `linear-gradient(135deg, ${getRandomGradient()})`;
            
            showPage('book-detail');
        }

        // Generate random gradient colors
        function getRandomGradient() {
            const colors = [
                '#667eea 0%, #764ba2 100%',
                '#f093fb 0%, #f5576c 100%',
                '#4facfe 0%, #00f2fe 100%',
                '#43e97b 0%, #38f9d7 100%',
                '#fa709a 0%, #fee140 100%',
                '#a8edea 0%, #fed6e3 100%',
                '#ff9a9e 0%, #fecfef 100%',
                '#a18cd1 0%, #fbc2eb 100%'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        // Event listeners
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                searchBooks(this.value.trim());
            }
        });

        // Initialize with some sample results when page loads
        window.addEventListener('load', function() {
            // Add some entrance animations
            setTimeout(() => {
                document.querySelector('.hero-content').style.animation = 'fadeInUp 1s ease';
            }, 200);
        });

        // Add smooth scrolling and parallax effects
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (document.querySelector('.hero-image')) {
                document.querySelector('.hero-image').style.transform = `translateY(${rate}px)`;
            }
        });

        // Add book hover effects
        document.addEventListener('DOMContentLoaded', function() {
            const books = document.querySelectorAll('.book');
            books.forEach(book => {
                book.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05) rotate(0deg)';
                    this.style.zIndex = '10';
                });
                
                book.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                    this.style.zIndex = '';
                });
            });
        });