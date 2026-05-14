(function () {
    'use strict';

    function showToast(message, isError) {
        var toast = document.getElementById('toast');
        document.getElementById('toastMessage').textContent = message;
        var icon = document.getElementById('toastIcon');
        icon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        icon.style.color = isError ? '#e74c3c' : 'var(--secondary)';
        toast.classList.remove('hidden');
        setTimeout(function () { toast.classList.add('hidden'); }, 4000);
    }

    // ─── Navigation ───

    var hamburger = document.getElementById('hamburger');
    if (hamburger) {
        var navLinks = document.getElementById('navLinks');
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // ─── Scroll Reveal ───

    document.querySelectorAll('section, .service-card, .portfolio-card, .review-card').forEach(function (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    function revealOnScroll() {
        document.querySelectorAll('section, .service-card, .portfolio-card, .review-card').forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight - 80) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    }

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('load', revealOnScroll);

    // ─── Contact form (Web3Forms) ───

    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = document.getElementById('name').value.trim();
            var email = document.getElementById('email').value.trim();
            var company = document.getElementById('company').value.trim();
            var message = document.getElementById('message').value.trim();

            if (!name || !email || !message) {
                return showToast('Veuillez remplir tous les champs obligatoires.', true);
            }

            var btnText = document.getElementById('btnText');
            var btnSpinner = document.getElementById('btnSpinner');
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');

            function resetBtn() {
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
            }

            var w3k = localStorage.getItem('web3forms_key') || '8a049345-927c-4ff2-b9c6-f7bea57a48d5';

            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://api.web3forms.com/submit', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                if (xhr.status === 200) {
                    showToast('Votre demande a bien été envoyée !');
                    contactForm.reset();
                } else {
                    openMailto(name, email, company, message);
                }
                resetBtn();
            };
            xhr.onerror = function () {
                openMailto(name, email, company, message);
                resetBtn();
            };
            xhr.send(JSON.stringify({
                access_key: w3k,
                subject: 'Nouvelle demande site vitrine de ' + name,
                from_name: name,
                email: email,
                company: company || 'Non renseigné',
                message: message
            }));
        });
    }

    function openMailto(name, email, company, message) {
        var sub = encodeURIComponent('Demande de site vitrine');
        var body = encodeURIComponent(
            'Nouvelle demande de site vitrine\n\n' +
            'Nom : ' + name + '\n' +
            'Email : ' + email + '\n' +
            'Projet : ' + (company || 'Non renseigné') + '\n\n' +
            'Message :\n' + message
        );
        showToast('Ouverture de votre messagerie...', false);
        window.open('mailto:abdelwarisousmanechappuis@gmail.com?subject=' + sub + '&body=' + body, '_blank');
    }

    // ─── Reviews ───

    var STORAGE_KEY = 'devshowcase_reviews';

    function getReviews() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; } }
    function saveReviews(r) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

    function escapeHtml(text) {
        var d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    function renderReviews() {
        var list = document.getElementById('reviewsList');
        if (!list) return;
        var reviews = getReviews();
        if (reviews.length === 0) {
            list.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-star" style="font-size:2rem;margin-bottom:12px;opacity:0.3;"></i><p>Soyez le premier à laisser un avis !</p></div>';
            return;
        }
        list.innerHTML = reviews.map(function (r) {
            var stars = '\u2605'.repeat(r.rating) + '\u2606'.repeat(5 - r.rating);
            var date = new Date(r.date).toLocaleDateString('fr-FR');
            return '<div class="review-card"><div class="review-header"><div class="review-avatar">' + escapeHtml(r.name).charAt(0).toUpperCase() + '</div><div class="review-meta"><h4>' + escapeHtml(r.name) + '</h4><span>' + date + '</span></div></div><div class="review-stars">' + stars + '</div><p class="review-text">' + escapeHtml(r.text) + '</p></div>';
        }).join('');
    }

    var starRating = document.getElementById('starRating');
    var selectedRating = 0;

    if (starRating) {
        starRating.querySelectorAll('i').forEach(function (star) {
            star.addEventListener('mouseenter', function () {
                var v = parseInt(star.dataset.value);
                starRating.querySelectorAll('i').forEach(function (s) { s.classList.toggle('hover', parseInt(s.dataset.value) <= v); });
            });
            star.addEventListener('mouseleave', function () { starRating.querySelectorAll('i').forEach(function (s) { s.classList.remove('hover'); }); });
            star.addEventListener('click', function () {
                selectedRating = parseInt(star.dataset.value);
                starRating.querySelectorAll('i').forEach(function (s) { s.className = parseInt(s.dataset.value) <= selectedRating ? 'fas fa-star' : 'far fa-star'; });
            });
        });
    }

    var showReviewBtn = document.getElementById('showReviewFormBtn');
    var reviewFormWrapper = document.getElementById('reviewFormWrapper');

    if (showReviewBtn) {
        showReviewBtn.addEventListener('click', function () {
            reviewFormWrapper.classList.toggle('hidden');
            this.textContent = reviewFormWrapper.classList.contains('hidden') ? 'Laisser un avis' : 'Fermer le formulaire';
        });
    }

    var reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = document.getElementById('reviewName').value.trim();
            var email = document.getElementById('reviewEmail').value.trim();
            var text = document.getElementById('reviewMessage').value.trim();
            if (!name || !email || !text) return showToast('Veuillez remplir tous les champs.', true);
            if (selectedRating === 0) return showToast('Veuillez sélectionner une note.', true);

            var existing = getReviews().find(function (r) { return r.email === email; });
            if (existing) return showToast('Vous avez déjà laissé un avis avec cet email.', true);

            var reviews = getReviews();
            reviews.unshift({ name: name, email: email, text: text, rating: selectedRating, date: new Date().toISOString() });
            saveReviews(reviews);
            renderReviews();
            showToast('Merci pour votre avis !');
            this.reset();
            selectedRating = 0;
            starRating.querySelectorAll('i').forEach(function (s) { s.className = 'far fa-star'; });
            reviewFormWrapper.classList.add('hidden');
            showReviewBtn.textContent = 'Laisser un avis';
        });
    }

    renderReviews();

    // ─── Admin panel ───

    var adminPassword = localStorage.getItem('admin_password') || 'admin123';
    var adminTrigger = document.getElementById('adminTrigger');
    var configPanel = document.getElementById('configPanel');
    var cfgKey = document.getElementById('cfgKey');
    var cfgSave = document.getElementById('cfgSave');
    var cfgClose = document.getElementById('cfgClose');
    var clearReviewsBtn = document.getElementById('clearReviewsBtn');

    if (adminTrigger && configPanel) {
        cfgKey.value = localStorage.getItem('web3forms_key') || '8a049345-927c-4ff2-b9c6-f7bea57a48d5';

        adminTrigger.addEventListener('dblclick', function () {
            var pwd = prompt('Mot de passe admin :');
            if (pwd === adminPassword) {
                configPanel.classList.toggle('hidden');
            } else if (pwd !== null) {
                showToast('Mot de passe incorrect.', true);
            }
        });

        cfgClose.addEventListener('click', function () {
            configPanel.classList.add('hidden');
        });

        cfgSave.addEventListener('click', function () {
            if (cfgKey.value) {
                localStorage.setItem('web3forms_key', cfgKey.value.trim());
            }
            showToast('Configuration sauvegardée !');
            configPanel.classList.add('hidden');
        });

        clearReviewsBtn.addEventListener('click', function () {
            if (confirm('Supprimer tous les avis ?')) {
                localStorage.removeItem(STORAGE_KEY);
                renderReviews();
                showToast('Tous les avis ont été supprimés.');
                configPanel.classList.add('hidden');
            }
        });
    }

})();
