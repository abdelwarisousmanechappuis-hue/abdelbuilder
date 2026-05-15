(function () {
    'use strict';

    var db = null;
    try { if (firebase.firestore) db = firebase.firestore(); } catch (e) {}

    function showToast(message, isError) {
        var toast = document.getElementById('toast');
        document.getElementById('toastMessage').textContent = message;
        var icon = document.getElementById('toastIcon');
        icon.className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        icon.style.color = isError ? '#e74c3c' : 'var(--secondary)';
        toast.classList.remove('hidden');
        setTimeout(function () { toast.classList.add('hidden'); }, 4000);
    }

    // ─── Auth state ───

    var currentUser = null;

    function getUserRole(email) {
        if (!db) return Promise.resolve('consumer');
        return db.collection('roles').doc(email).get().then(function (doc) {
            return doc.exists && doc.data().role === 'admin' ? 'admin' : 'consumer';
        }).catch(function () { return 'consumer'; });
    }

    function updateUI() {
        var btn = document.getElementById('authNavBtn');
        if (currentUser) {
            btn.textContent = currentUser.role === 'admin' ? '\u{1F451} ' + currentUser.name : currentUser.name;
            btn.classList.add('user-badge');
        } else {
            btn.textContent = 'Connexion';
            btn.classList.remove('user-badge');
        }
    }

    if (firebase.auth) {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user && user.emailVerified) {
                getUserRole(user.email).then(function (role) {
                    currentUser = { email: user.email, name: user.displayName || user.email.split('@')[0], role: role };
                    updateUI();
                });
            } else {
                currentUser = null;
                updateUI();
            }
        });
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
            if (!name || !email || !message) return showToast('Veuillez remplir tous les champs obligatoires.', true);

            var btnText = document.getElementById('btnText');
            var btnSpinner = document.getElementById('btnSpinner');
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');

            function resetBtn() {
                btnText.classList.remove('hidden');
                btnSpinner.classList.add('hidden');
            }

            var w3k = localStorage.getItem('web3forms_key') || 'fa94af8e-8b30-4f97-a8dc-63e6f990b365';
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://api.web3forms.com/submit', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                if (xhr.status === 200) {
                    showToast('Votre demande a bien été envoyée !');
                    contactForm.reset();
                } else { openMailto(name, email, company, message); }
                resetBtn();
            };
            xhr.onerror = function () { openMailto(name, email, company, message); resetBtn(); };
            var subjectEl = document.querySelector('input[name="subject"]:checked');
            var subject = subjectEl ? subjectEl.value : 'site-vitrine';
            xhr.send(JSON.stringify({
                access_key: w3k,
                subject: '[' + subject + '] Demande de ' + name,
                from_name: name, email: email,
                company: company || 'Non renseigné',
                message: message
            }));
        });
    }

    function openMailto(name, email, company, message, subject) {
        subject = subject || 'site-vitrine';
        var sub = encodeURIComponent('[' + subject + '] Demande de ' + name);
        var body = encodeURIComponent('Nouvelle demande\n\nNom: ' + name + '\nEmail: ' + email + '\nProjet: ' + (company || '-') + '\nSujet: ' + subject + '\n\nMessage:\n' + message);
        showToast('Ouverture de votre messagerie...', false);
        window.open('mailto:abdelbuildepro@proton.me?subject=' + sub + '&body=' + body, '_blank');
    }

    // ─── Auth Modal ───

    var authModal = document.getElementById('authModal');
    var authNavBtn = document.getElementById('authNavBtn');
    var modalClose = document.getElementById('authModalClose');
    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');
    var verifyInfo = document.getElementById('verifyInfo');

    function openModal() { authModal.classList.remove('hidden'); }
    function closeModal() { authModal.classList.add('hidden'); }

    if (authNavBtn) {
        authNavBtn.addEventListener('click', function () {
            if (currentUser) {
                if (confirm('Se déconnecter ?')) {
                    firebase.auth().signOut();
                    currentUser = null;
                    updateUI();
                    showToast('Déconnecté.');
                }
            } else {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                verifyInfo.classList.add('hidden');
                openModal();
            }
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (authModal) authModal.addEventListener('click', function (e) { if (e.target === authModal) closeModal(); });

    document.getElementById('showRegisterLink').addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        verifyInfo.classList.add('hidden');
    });

    document.getElementById('showLoginLink').addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        verifyInfo.classList.add('hidden');
    });

    document.getElementById('verifyBackToLogin').addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        verifyInfo.classList.add('hidden');
    });

    document.getElementById('registerBtn').addEventListener('click', function () {
        var name = document.getElementById('regName').value.trim();
        var email = document.getElementById('regEmail').value.trim();
        var password = document.getElementById('regPassword').value;
        if (!name || !email || !password) return showToast('Tous les champs sont requis.', true);

        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Inscription...';

        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (cred) {
            return cred.user.updateProfile({ displayName: name }).then(function () {
                return cred.user.sendEmailVerification();
            });
        })
        .then(function () {
            showToast('Compte créé ! Vérifie ta boîte mail.');
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            loginForm.classList.add('hidden');
            registerForm.classList.add('hidden');
            verifyInfo.classList.remove('hidden');
        })
        .catch(function (err) {
            var msg = err.code === 'auth/email-already-in-use' ? 'Cet email est déjà utilisé.'
                : err.code === 'auth/weak-password' ? 'Mot de passe trop court (6 car. min).'
                : err.code === 'auth/invalid-email' ? 'Email invalide.'
                : 'Erreur : ' + err.message;
            showToast(msg, true);
        })
        .finally(function () {
            btn.disabled = false;
            btn.textContent = 'Créer mon compte';
        });
    });

    document.getElementById('loginBtn').addEventListener('click', function () {
        var email = document.getElementById('loginEmail').value.trim();
        var password = document.getElementById('loginPassword').value;
        if (!email || !password) return showToast('Remplis tous les champs.', true);

        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Connexion...';

        firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function (cred) {
            if (!cred.user.emailVerified) {
                return firebase.auth().signOut().then(function () { throw { code: 'unverified' }; });
            }
            return getUserRole(cred.user.email).then(function (role) {
                currentUser = { email: cred.user.email, name: cred.user.displayName || email.split('@')[0], role: role };
                updateUI();
                closeModal();
                showToast('Connecté en tant que ' + currentUser.name);
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
            });
        })
        .catch(function (err) {
            var msg = err.code === 'unverified' ? 'Vérifie ton email avant de te connecter.'
                : err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' ? 'Email ou mot de passe incorrect.'
                : 'Erreur : ' + (err.message || err);
            showToast(msg, true);
        })
        .finally(function () {
            btn.disabled = false;
            btn.textContent = 'Se connecter';
        });
    });

    document.getElementById('resendVerifyBtn').addEventListener('click', function () {
        var user = firebase.auth().currentUser;
        if (user) {
            user.sendEmailVerification().then(function () { showToast('Email renvoyé !'); })
            .catch(function () { showToast('Erreur.', true); });
        } else {
            showToast('Inscris-toi d\'abord.', true);
        }
    });

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
            this.textContent = reviewFormWrapper.classList.contains('hidden') ? 'Laisser un avis' : 'Fermer';
        });
    }

    var reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = document.getElementById('reviewName').value.trim();
            var email = document.getElementById('reviewEmail').value.trim();
            var text = document.getElementById('reviewMessage').value.trim();
            if (!name || !email || !text) return showToast('Remplis tous les champs.', true);
            if (selectedRating === 0) return showToast('Choisis une note.', true);

            if (getReviews().find(function (r) { return r.email === email; })) {
                return showToast('Tu as déjà laissé un avis.', true);
            }

            var reviews = getReviews();
            reviews.unshift({ name: name, email: email, text: text, rating: selectedRating, date: new Date().toISOString() });
            saveReviews(reviews);
            renderReviews();
            showToast('Merci pour ton avis !');
            this.reset();
            selectedRating = 0;
            starRating.querySelectorAll('i').forEach(function (s) { s.className = 'far fa-star'; });
            reviewFormWrapper.classList.add('hidden');
            showReviewBtn.textContent = 'Laisser un avis';
        });
    }

    renderReviews();

    // ─── Admin panel (auth + password protected) ───

    var adminPassword = localStorage.getItem('admin_password') || 'admin123';
    var adminTrigger = document.getElementById('adminTrigger');
    var configPanel = document.getElementById('configPanel');
    var cfgKey = document.getElementById('cfgKey');
    var cfgSave = document.getElementById('cfgSave');
    var cfgClose = document.getElementById('cfgClose');
    var clearReviewsBtn = document.getElementById('clearReviewsBtn');

    if (adminTrigger && configPanel) {
        cfgKey.value = localStorage.getItem('web3forms_key') || 'b4adb0a9-f8e8-44ef-a456-777e675efb00';

        adminTrigger.addEventListener('dblclick', function () {
            if (!currentUser) return showToast('Connecte-toi d\'abord.', true);
            if (currentUser.role !== 'admin') return showToast('Accès réservé aux admins.', true);

            var pwd = prompt('Mot de passe admin :');
            if (pwd === adminPassword) {
                configPanel.classList.toggle('hidden');
            } else if (pwd !== null) {
                showToast('Mot de passe incorrect.', true);
            }
        });

        cfgClose.addEventListener('click', function () { configPanel.classList.add('hidden'); });

        cfgSave.addEventListener('click', function () {
            if (cfgKey.value) localStorage.setItem('web3forms_key', cfgKey.value.trim());
            showToast('Configuration sauvegardée !');
            configPanel.classList.add('hidden');
        });

        clearReviewsBtn.addEventListener('click', function () {
            if (confirm('Supprimer tous les avis ?')) {
                localStorage.removeItem(STORAGE_KEY);
                renderReviews();
                showToast('Avis supprimés.');
                configPanel.classList.add('hidden');
            }
        });
    }

})();
