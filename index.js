<script>
    // ============================================
    // Firebase Configuration
    // ============================================
    const firebaseConfig = {
        apiKey: "AIzaSyAVp26636YGOwPIT8X6kWsxKWEnta3A0G4",
        authDomain: "ideas-museum.firebaseapp.com",
        projectId: "ideas-museum",
        storageBucket: "ideas-museum.firebasestorage.app",
        messagingSenderId: "776953892130",
        appId: "1:776953892130:web:b72d1a6e4c9b5f8290697b",
        measurementId: "G-FNKDJSJLE6"
    };

    // Initialize Firebase
    let db, auth, googleProvider;
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        
        // Configure Google provider
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showToast('خطأ في تهيئة قاعدة البيانات', 'error');
    }

    // App State
    let appData = {
        users: [],
        ideas: [],
        content: [],
        suggestions: [],
        codes: [],
        quotes: [],
        messages: [],
        courses: [],
        comments: []
    };
    
    let currentUser = null;
    let currentPage = 'home';
    let currentFilter = 'all';
    let currentCourseFilter = 'all';
    let confirmAction = null;
    let confirmModalCallback = null;
    let viewedIdeas = new Set();
    let emailMode = 'login';
    let currentIdeaId = null;
    let replyingToCommentId = null;

    // Admin Credentials
    const ADMINS = [
        { name: 'Rasha', specialty: '20250929' },
        { name: 'MUF', specialty: 'CS' },
        { name: 'رشا', specialty: '20250929' },
        { name: 'مفضل', specialty: 'CS' }
    ];

    // Default Inspirational Quotes
    const DEFAULT_QUOTES = [
        { text: "العقل كالمظلة، لا يعمل إلا إذا كان مفتوحاً", author: "حكمة شعبية", id: "default_1", isDefault: true },
        { text: "أنا أفكر، إذن أنا موجود", author: "رينيه ديكارت", id: "default_2", isDefault: true },
        { text: "الخيال أهم من المعرفة، فالمعرفة محدودة أما الخيال فيحيط بالعالم", author: "ألبرت أينشتاين", id: "default_3", isDefault: true },
        { text: "القراءة تمنح الإنسان حيوات متعددة في حياة واحدة", author: "من حكم الأدب", id: "default_4", isDefault: true },
        { text: "الفكرة التي لا تتحول إلى فعل، ليست أكثر من حلم", author: "حكمة عملية", id: "default_5", isDefault: true }
    ];

    // Category Icons
    const CATEGORY_ICONS = {
        'فلسفة': '🧠',
        'تقنية': '💻',
        'أدب': '📖',
        'علوم': '🔬',
        'فن': '🎨',
        'اجتماع': '👥'
    };

    // Course Type Icons
    const COURSE_ICONS = {
        'قناة يوتيوب': '📺',
        'كورس أونلاين': '🎓',
        'منصة تعليمية': '💻',
        'مقالات': '📝',
        'كتب': '📚',
        'بودكاست': '🎙️'
    };

    // ============================================
    // Utility Functions
    // ============================================

    function showLoadingBar() {
        const loadingBar = document.getElementById('loadingBar');
        const progressBar = loadingBar?.querySelector('div');
        if (loadingBar && progressBar) {
            loadingBar.classList.remove('hidden');
            progressBar.style.width = '0%';
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                progressBar.style.width = `${progress}%`;
                
                if (progress >= 90) {
                    clearInterval(interval);
                }
            }, 100);
        }
    }

    function hideLoadingBar() {
        const loadingBar = document.getElementById('loadingBar');
        const progressBar = loadingBar?.querySelector('div');
        if (loadingBar && progressBar) {
            progressBar.style.width = '100%';
            setTimeout(() => {
                loadingBar.classList.add('hidden');
                progressBar.style.width = '0%';
            }, 500);
        }
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toastId = 'toast-' + Date.now();
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        const bgColor = type === 'success' ? 'bg-green-500/20' : type === 'error' ? 'bg-red-500/20' : type === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20';
        const borderColor = type === 'success' ? 'border-green-500/30' : type === 'error' ? 'border-red-500/30' : type === 'warning' ? 'border-yellow-500/30' : 'border-blue-500/30';
        
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast glass-light ${bgColor} border ${borderColor} p-4 flex items-start gap-3 animate-slide-in-up`;
        toast.innerHTML = `
            <span class="text-xl">${icon}</span>
            <div class="flex-1">
                <p class="text-sm">${message}</p>
            </div>
            <button onclick="document.getElementById('${toastId}').remove()" class="text-gray-400 hover:text-white text-lg transition-colors duration-300">
                &times;
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.classList.add('animate-fade-out');
                setTimeout(() => toastElement.remove(), 300);
            }
        }, 5000);
    }

    function showConfirmModal(title, message, icon = '⚠️', callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmIcon').textContent = icon;
        confirmModalCallback = callback;
        document.getElementById('confirmModal').classList.remove('hidden');
    }

    function closeConfirmModal() {
        document.getElementById('confirmModal').classList.add('hidden');
        confirmModalCallback = null;
    }

    function executeConfirmedAction() {
        if (confirmModalCallback) {
            confirmModalCallback();
        }
        closeConfirmModal();
    }

    function showNotificationModal(title, message, icon = '✅') {
        document.getElementById('notificationTitle').textContent = title;
        document.getElementById('notificationMessage').textContent = message;
        document.getElementById('notificationIcon').textContent = icon;
        document.getElementById('notificationModal').classList.remove('hidden');
    }

    function closeNotificationModal() {
        document.getElementById('notificationModal').classList.add('hidden');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // ============================================
    // Authentication Functions
    // ============================================

    function switchAuthTab(tab) {
        // Update tabs
        document.getElementById('tabTraditional').classList.remove('active');
        document.getElementById('tabEmail').classList.remove('active');
        document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
        
        // Update forms
        document.getElementById('traditionalLogin').classList.add('hidden');
        document.getElementById('emailLogin').classList.add('hidden');
        document.getElementById(`${tab}Login`).classList.remove('hidden');
        
        // Reset email mode
        if (tab === 'email') {
            emailMode = 'login';
            document.getElementById('emailToggleText').textContent = 'إنشاء حساب جديد';
            document.getElementById('emailAuthBtnText').textContent = 'تسجيل الدخول';
            document.getElementById('registerFields').classList.add('hidden');
            document.getElementById('emailLoginFields').classList.remove('hidden');
        }
    }

    function toggleEmailMode() {
        const emailToggleText = document.getElementById('emailToggleText');
        const emailAuthBtnText = document.getElementById('emailAuthBtnText');
        const registerFields = document.getElementById('registerFields');
        const emailLoginFields = document.getElementById('emailLoginFields');
        
        if (emailMode === 'login') {
            emailMode = 'register';
            emailToggleText.textContent = 'لديك حساب بالفعل؟ سجل الدخول';
            emailAuthBtnText.textContent = 'إنشاء حساب';
            registerFields.classList.remove('hidden');
            emailLoginFields.classList.add('hidden');
        } else {
            emailMode = 'login';
            emailToggleText.textContent = 'إنشاء حساب جديد';
            emailAuthBtnText.textContent = 'تسجيل الدخول';
            registerFields.classList.add('hidden');
            emailLoginFields.classList.remove('hidden');
        }
    }

    async function handleTraditionalLogin() {
        const name = document.getElementById('loginName').value.trim();
        const specialty = document.getElementById('loginSpecialty').value.trim();
        
        if (!name) {
            showToast('يرجى إدخال اسم المستخدم', 'error');
            return;
        }
        
        const btnText = document.getElementById('traditionalLoginBtnText');
        const spinner = document.getElementById('traditionalLoginSpinner');
        
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        showLoadingBar();
        
        try {
            // Check if user is banned
            const bannedUsers = appData.users.filter(u => u.isBanned);
            const isBanned = bannedUsers.some(u => u.name === name);
            
            if (isBanned) {
                showToast('هذا الحساب محظور من قبل المدير', 'error');
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                hideLoadingBar();
                return;
            }
            
            // Check if admin
            const isAdmin = ADMINS.some(a => 
                a.name.toLowerCase() === name.toLowerCase() && 
                a.specialty === specialty
            );
            
            // Check if using upgrade code
            const unusedCodes = appData.codes.filter(c => !c.usedBy);
            const usedCode = unusedCodes.find(c => c.code === specialty);
            
            let role = 'user';
            let upgradeCode = null;
            
            if (isAdmin) {
                role = 'admin';
            } else if (usedCode) {
                role = 'premium';
                upgradeCode = specialty;
                // Mark code as used
                await db.collection('codes').doc(usedCode.id).update({
                    usedBy: name,
                    usedAt: new Date().toISOString()
                });
            }
            
            // Check if user already exists
            let userDoc = await db.collection('users').where('name', '==', name).limit(1).get();
            
            if (!userDoc.empty) {
                // User exists
                const existingUser = userDoc.docs[0];
                const userData = existingUser.data();
                
                if (upgradeCode && userData.role === 'user') {
                    await db.collection('users').doc(existingUser.id).update({
                        role: 'premium',
                        upgradeCode: upgradeCode,
                        lastLogin: new Date().toISOString()
                    });
                    role = 'premium';
                } else {
                    role = userData.role;
                    upgradeCode = userData.upgradeCode;
                    
                    // Update last login
                    await db.collection('users').doc(existingUser.id).update({
                        lastLogin: new Date().toISOString()
                    });
                }
                
                currentUser = {
                    id: existingUser.id,
                    name: userData.name,
                    specialty: userData.specialty,
                    role: role,
                    upgradeCode: upgradeCode,
                    isBanned: userData.isBanned || false,
                    authMethod: 'traditional'
                };
            } else {
                // Create new user
                const userData = {
                    name,
                    specialty: role === 'premium' ? 'عضو مميز' : (specialty || 'مستخدم'),
                    role,
                    upgradeCode: upgradeCode || '',
                    isBanned: false,
                    authMethod: 'traditional',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                
                const docRef = await db.collection('users').add(userData);
                currentUser = {
                    id: docRef.id,
                    ...userData
                };
            }
            
            localStorage.setItem('muf_user', JSON.stringify(currentUser));
            await loadAllData();
            showMainApp();
            
            const roleText = role === 'admin' ? '👑 مدير' : role === 'premium' ? '💡 عضو مميز' : '👤 عضو';
            showToast(`مرحباً ${name}! تم تسجيل الدخول كـ ${roleText}`, 'success');
            
        } catch (error) {
            console.error('Traditional login error:', error);
            showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
        } finally {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            hideLoadingBar();
        }
    }

    async function handleGoogleLogin() {
        try {
            showLoadingBar();
            const result = await auth.signInWithPopup(googleProvider);
            // User will be handled by onAuthStateChanged
        } catch (error) {
            console.error('Google login error:', error);
            hideLoadingBar();
            
            let errorMessage = 'حدث خطأ في تسجيل الدخول بحساب جوجل';
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'تم إغلاق نافذة تسجيل الدخول';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = 'تم إلغاء طلب تسجيل الدخول';
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'هذا الحساب موجود بالفعل بوسيلة تسجيل دخول مختلفة';
                    break;
            }
            
            showToast(errorMessage, 'error');
        }
    }

    async function handleEmailAuth() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!email || !password) {
            showToast('يرجى ملء جميع الحقول', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }
        
        const btnText = document.getElementById('emailAuthBtnText');
        const spinner = document.getElementById('emailAuthSpinner');
        
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        showLoadingBar();
        
        try {
            if (emailMode === 'login') {
                // Sign in with email
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                // Register new user
                const name = document.getElementById('registerName').value.trim();
                const specialty = document.getElementById('registerSpecialty').value.trim();
                
                if (!name) {
                    showToast('يرجى إدخال اسم المستخدم', 'error');
                    throw new Error('Name required');
                }
                
                // Create user with email/password
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                // Create user document
                const userData = {
                    name,
                    specialty: specialty || 'مستخدم',
                    role: 'user',
                    upgradeCode: '',
                    isBanned: false,
                    authMethod: 'email',
                    email: email,
                    emailVerified: false,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                
                await db.collection('users').doc(userCredential.user.uid).set(userData);
                
                // Send email verification
                await userCredential.user.sendEmailVerification();
                
                showToast('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني', 'success');
                
                // Reset form and switch to login mode
                document.getElementById('registerName').value = '';
                document.getElementById('registerSpecialty').value = '';
                toggleEmailMode();
            }
        } catch (error) {
            console.error('Email auth error:', error);
            
            let errorMessage = 'حدث خطأ أثناء المصادقة';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'بريد إلكتروني غير صالح';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'كلمة المرور ضعيفة';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'لا يوجد حساب بهذا البريد';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'كلمة المرور غير صحيحة';
                    break;
            }
            
            showToast(errorMessage, 'error');
        } finally {
            hideLoadingBar();
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    }

    async function handleAuthenticatedUser(firebaseUser) {
        try {
            showLoadingBar();
            
            // Get user document
            const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Check if banned
                if (userData.isBanned) {
                    showToast('هذا الحساب محظور من قبل المدير', 'error');
                    await auth.signOut();
                    return;
                }
                
                currentUser = {
                    id: firebaseUser.uid,
                    ...userData,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                    photoURL: firebaseUser.photoURL
                };
                
                // Update last login
                await db.collection('users').doc(firebaseUser.uid).update({
                    lastLogin: new Date().toISOString()
                });
            } else {
                // Create new user document
                const name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
                const provider = firebaseUser.providerData[0]?.providerId || 'email';
                
                const userData = {
                    name,
                    specialty: 'مستخدم',
                    role: 'user',
                    upgradeCode: '',
                    isBanned: false,
                    authMethod: provider,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                    photoURL: firebaseUser.photoURL,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                
                await db.collection('users').doc(firebaseUser.uid).set(userData);
                currentUser = {
                    id: firebaseUser.uid,
                    ...userData
                };
            }
            
            localStorage.setItem('muf_user', JSON.stringify(currentUser));
            await loadAllData();
            showMainApp();
            
            const roleText = currentUser.role === 'admin' ? '👑 مدير' : 
                           currentUser.role === 'premium' ? '💡 عضو مميز' : '👤 عضو';
            showToast(`مرحباً ${currentUser.name}! تم تسجيل الدخول كـ ${roleText}`, 'success');
            
        } catch (error) {
            console.error('Error handling authenticated user:', error);
            showToast('حدث خطأ في تحميل بيانات المستخدم', 'error');
        } finally {
            hideLoadingBar();
        }
    }

    // ============================================
    // Data Management Functions
    // ============================================

    async function loadAllData() {
        try {
            showLoadingBar();
            
            // Load all collections in parallel
            const collections = [
                'users', 'ideas', 'content', 'suggestions',
                'codes', 'quotes', 'messages', 'courses', 'comments'
            ];
            
            const promises = collections.map(collection => 
                db.collection(collection).get().catch(error => {
                    console.error(`Error loading ${collection}:`, error);
                    return { docs: [] };
                })
            );
            
            const results = await Promise.all(promises);
            
            // Map results to appData
            appData.users = results[0].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.ideas = results[1].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.content = results[2].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.suggestions = results[3].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.codes = results[4].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.quotes = results[5].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.messages = results[6].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.courses = results[7].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            appData.comments = results[8].docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Setup real-time listeners
            setupRealtimeListeners();
            
            // Update UI
            updateUI();
            
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('خطأ في تحميل البيانات', 'error');
        } finally {
            hideLoadingBar();
        }
    }

    function setupRealtimeListeners() {
        // Users listener
        db.collection('users').onSnapshot((snapshot) => {
            appData.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (['members', 'home', 'settings'].includes(currentPage)) updateUI();
        }, (error) => console.error('Users listener error:', error));

        // Ideas listener
        db.collection('ideas').onSnapshot((snapshot) => {
            appData.ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (['ideas', 'home', 'settings'].includes(currentPage)) updateUI();
        }, (error) => console.error('Ideas listener error:', error));

        // Comments listener
        db.collection('comments').onSnapshot((snapshot) => {
            appData.comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (['ideas', 'comments', 'home'].includes(currentPage)) updateUI();
            if (currentIdeaId && !document.getElementById('ideaDetailsModal').classList.contains('hidden')) {
                updateComments();
            }
        }, (error) => console.error('Comments listener error:', error));

        // Quotes listener
        db.collection('quotes').onSnapshot((snapshot) => {
            appData.quotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (['quotes', 'home'].includes(currentPage)) updateUI();
        }, (error) => console.error('Quotes listener error:', error));

        // Courses listener
        db.collection('courses').onSnapshot((snapshot) => {
            appData.courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (currentPage === 'skills') updateUI();
        }, (error) => console.error('Courses listener error:', error));

        // Messages listener
        db.collection('messages').onSnapshot((snapshot) => {
            appData.messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (['messages', 'settings'].includes(currentPage)) updateUI();
            updateMessagesBadge();
        }, (error) => console.error('Messages listener error:', error));
    }

    function updateMessagesBadge() {
        if (!currentUser || currentUser.role !== 'admin') return;
        
        const unreadMessages = appData.messages.filter(m => !m.read).length;
        const badge = document.getElementById('adminMessagesBadge');
        
        if (unreadMessages > 0) {
            badge.textContent = unreadMessages;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // ============================================
    // UI Navigation Functions
    // ============================================

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        sidebar.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
    }

    async function handleLogout() {
        showConfirmModal('تسجيل الخروج', 'هل تريد تسجيل الخروج من حسابك؟', '🚪', async () => {
            try {
                showLoadingBar();
                
                // Sign out from Firebase
                if (currentUser?.authMethod === 'email' || currentUser?.authMethod === 'google.com') {
                    await auth.signOut();
                }
                
                // Clear user data
                currentUser = null;
                localStorage.removeItem('muf_user');
                
                // Reset UI
                document.getElementById('mainApp').classList.add('hidden');
                document.getElementById('loginScreen').classList.remove('hidden');
                
                // Reset forms
                document.getElementById('loginName').value = '';
                document.getElementById('loginSpecialty').value = '';
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
                document.getElementById('registerName').value = '';
                document.getElementById('registerSpecialty').value = '';
                
                // Switch to traditional login
                switchAuthTab('traditional');
                
                showToast('تم تسجيل الخروج بنجاح', 'success');
                
            } catch (error) {
                console.error('Logout error:', error);
                showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
            } finally {
                hideLoadingBar();
            }
        });
    }

    function showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        if (currentUser) {
            // Update user info
            document.getElementById('currentUserName').textContent = currentUser.name;
            document.getElementById('currentUserSpecialty').textContent = currentUser.specialty;
            document.getElementById('welcomeName').textContent = currentUser.name;
            
            // Set avatar based on role
            const avatarMap = { admin: '👑', premium: '💡', user: '👤' };
            document.getElementById('userAvatar').textContent = avatarMap[currentUser.role] || '👤';
            
            // Set role display
            const roleMap = { admin: 'مدير', premium: 'عضو مميز', user: 'عضو' };
            document.getElementById('userRoleDisplay').textContent = roleMap[currentUser.role] || 'عضو';
            
            // Update status
            const statusElement = document.getElementById('userStatus');
            if (currentUser.isBanned) {
                statusElement.innerHTML = '<span class="text-red-400">🚫 محظور</span>';
            } else {
                statusElement.innerHTML = '<span class="text-green-400">✅ نشط</span>';
            }
            
            // Show/hide elements based on role
            const isAdmin = currentUser.role === 'admin';
            const isPremium = currentUser.role === 'premium';
            const isRegular = currentUser.role === 'user';
            
            document.getElementById('adminMenuItems').classList.toggle('hidden', !isAdmin);
            document.getElementById('addIdeaBtn').classList.toggle('hidden', !(isAdmin || isPremium));
            document.getElementById('addQuoteBtn').classList.toggle('hidden', !(isAdmin || isPremium));
            document.getElementById('addCourseBtn').classList.toggle('hidden', !(isAdmin || isPremium));
            document.getElementById('userMessageButton').classList.toggle('hidden', !isRegular);
        }
        
        navigateTo('home');
    }

    function navigateTo(page) {
        currentPage = page;
        
        // Close sidebar on mobile
        if (window.innerWidth < 769) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        }
        
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
        
        // Show selected page
        const pageElement = document.getElementById(page + 'Page');
        if (pageElement) {
            pageElement.classList.remove('hidden');
            
            // Update active menu item
            document.querySelectorAll('.menu-item-advanced').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`[data-page="${page}"]`);
            if (activeItem) activeItem.classList.add('active');
            
            // Update page content
            updatePageContent(page);
        }
    }

    function updatePageContent(page) {
        switch(page) {
            case 'home':
                updateHomePage();
                break;
            case 'ideas':
                renderIdeas();
                break;
            case 'comments':
                renderCommentsPage();
                break;
            case 'quotes':
                renderQuotes();
                break;
            case 'skills':
                renderCourses();
                break;
            case 'suggestions':
                renderSuggestions();
                break;
            case 'members':
                renderMembersPage();
                break;
            case 'messages':
                renderMessagesPage();
                break;
            case 'codes':
                renderCodesPage();
                break;
            case 'settings':
                updateSettingsPage();
                break;
        }
    }

    function updateUI() {
        updateGlobalStats();
        updatePageContent(currentPage);
    }

    function updateGlobalStats() {
        // Total ideas
        const activeIdeas = appData.ideas.filter(idea => !idea.deleted);
        document.getElementById('totalIdeas').textContent = activeIdeas.length;
        
        // Total views
        const totalViews = activeIdeas.reduce((sum, idea) => sum + (idea.views || 0), 0);
        document.getElementById('totalViews').textContent = totalViews.toLocaleString();
        
        // Total members
        const activeMembers = appData.users.filter(user => !user.isBanned);
        document.getElementById('totalMembers').textContent = activeMembers.length;
        
        // Total interactions
        const totalComments = appData.comments.length;
        const totalLikes = appData.comments.reduce((sum, comment) => sum + (comment.likes || 0), 0);
        document.getElementById('totalInteractions').textContent = (totalComments + totalLikes).toLocaleString();
        
        // Update other stats
        const totalCommentsEl = document.getElementById('totalComments');
        const totalLikesEl = document.getElementById('totalLikes');
        const avgRepliesEl = document.getElementById('avgReplies');
        
        if (totalCommentsEl) totalCommentsEl.textContent = totalComments;
        if (totalLikesEl) totalLikesEl.textContent = totalLikes;
        if (avgRepliesEl) {
            const repliesCount = appData.comments.filter(c => c.replies && c.replies.length > 0).length;
            const avgReplies = totalComments > 0 ? (repliesCount / totalComments).toFixed(1) : 0;
            avgRepliesEl.textContent = avgReplies;
        }
    }

    // ============================================
    // Ideas Functions
    // ============================================

    function openAddIdeaModal() {
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium')) {
            document.getElementById('addIdeaModal').classList.remove('hidden');
        } else {
            showToast('لا تملك صلاحية إضافة أفكار. قم بترقية حسابك أولاً.', 'error');
        }
    }

    async function submitNewIdea() {
        const title = document.getElementById('newIdeaTitle').value.trim();
        const category = document.getElementById('newIdeaCategory').value;
        const content = document.getElementById('newIdeaContent').value.trim();
        
        if (!title || !content) {
            showToast('يرجى ملء العنوان والمحتوى', 'error');
            return;
        }
        
        showLoadingBar();
        
        try {
            const ideaData = {
                title,
                category,
                content,
                author: currentUser.name,
                authorRole: currentUser.role,
                views: 0,
                likes: 0,
                likedBy: [],
                featured: false,
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await db.collection('ideas').add(ideaData);
            
            // Clear form and close modal
            document.getElementById('newIdeaTitle').value = '';
            document.getElementById('newIdeaContent').value = '';
            closeModal('addIdeaModal');
            
            showToast('تمت إضافة الفكرة بنجاح!', 'success');
            
        } catch (error) {
            console.error('Error adding idea:', error);
            showToast('حدث خطأ أثناء إضافة الفكرة', 'error');
        } finally {
            hideLoadingBar();
        }
    }

    function filterIdeas(category) {
        currentFilter = category;
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === category);
        });
        renderIdeas();
    }

    function renderIdeas() {
        const grid = document.getElementById('ideasGrid');
        if (!grid) return;
        
        let filteredIdeas = appData.ideas.filter(idea => !idea.deleted);
        
        if (currentFilter !== 'all') {
            filteredIdeas = filteredIdeas.filter(idea => idea.category === currentFilter);
        }
        
        filteredIdeas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (filteredIdeas.length === 0) {
            grid.innerHTML = `
                <div class="advanced-card text-center text-gray-400 p-8 col-span-full">
                    <p class="text-5xl mb-4">💭</p>
                    <p>${currentFilter === 'all' ? 'لا توجد أفكار حتى الآن' : 'لا توجد أفكار في هذا التصنيف'}</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = filteredIdeas.map(idea => `
            <div class="advanced-card card-hover">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${CATEGORY_ICONS[idea.category] || '💡'}</span>
                        <span class="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-pink-300">
                            ${idea.category}
                        </span>
                    </div>
                    ${idea.featured ? '<span class="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">⭐</span>' : ''}
                </div>
                <h4 class="font-bold text-xl mb-3">${idea.title}</h4>
                <p class="text-gray-300 mb-4 line-clamp-3">
                    ${idea.content.substring(0, 150)}${idea.content.length > 150 ? '...' : ''}
                </p>
                <div class="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div class="flex items-center gap-2">
                        <span>👤 ${idea.author}</span>
                        <span>${idea.authorRole === 'admin' ? '👑' : idea.authorRole === 'premium' ? '💡' : '👤'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span>👁️ ${idea.views || 0}</span>
                        <span>❤️ ${idea.likes || 0}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="openIdeaDetails('${idea.id}')" class="btn-advanced flex-1 py-2 rounded-xl text-sm">
                        💬 عرض التفاصيل
                    </button>
                    ${currentUser?.role === 'admin' ? `
                        <button onclick="deleteIdea('${idea.id}')" class="btn-secondary py-2 px-4 rounded-xl text-sm hover:bg-red-500/20 hover:text-red-300">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    async function openIdeaDetails(ideaId) {
        const idea = appData.ideas.find(i => i.id === ideaId);
        if (!idea) return;
        
        currentIdeaId = ideaId;
        
        // Increment view count
        if (!viewedIdeas.has(ideaId)) {
            viewedIdeas.add(ideaId);
            try {
                await db.collection('ideas').doc(ideaId).update({
                    views: (idea.views || 0) + 1
                });
            } catch (error) {
                console.error('Error updating views:', error);
            }
        }
        
        // Update modal content
        document.getElementById('ideaDetailsTitle').textContent = idea.title;
        document.getElementById('ideaDetailsContent').innerHTML = `
            <div class="advanced-card">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">${CATEGORY_ICONS[idea.category] || '💡'}</span>
                        <div>
                            <h4 class="font-bold text-xl">${idea.title}</h4>
                            <div class="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <span>👤 ${idea.author}</span>
                                <span>${idea.authorRole === 'admin' ? '👑' : idea.authorRole === 'premium' ? '💡' : '👤'}</span>
                                <span>•</span>
                                <span>${new Date(idea.createdAt).toLocaleDateString('ar-SA')}</span>
                                <span>•</span>
                                <span>👁️ ${idea.views || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-white/5 rounded-xl p-4 mb-4">
                    <p class="text-gray-300 leading-relaxed whitespace-pre-line">${idea.content}</p>
                </div>
            </div>
        `;
        
        // Update comments
        updateComments();
        
        // Show modal
        document.getElementById('ideaDetailsModal').classList.remove('hidden');
    }

    async function deleteIdea(ideaId) {
        if (!currentUser || currentUser.role !== 'admin') {
            showToast('لا تملك صلاحية حذف الأفكار', 'error');
            return;
        }
        
        showConfirmModal('حذف الفكرة', 'هل أنت متأكد من حذف هذه الفكرة؟', '🗑️', async () => {
            showLoadingBar();
            try {
                await db.collection('ideas').doc(ideaId).update({
                    deleted: true,
                    deletedAt: new Date().toISOString(),
                    deletedBy: currentUser.name
                });
                showToast('تم حذف الفكرة بنجاح', 'success');
            } catch (error) {
                console.error('Error deleting idea:', error);
                showToast('خطأ في حذف الفكرة', 'error');
            } finally {
                hideLoadingBar();
            }
        });
    }

    // ============================================
    // Comments Functions
    // ============================================

    function updateComments() {
        if (!currentIdeaId) return;
        
        const ideaComments = appData.comments
            .filter(comment => comment.ideaId === currentIdeaId && !comment.parentCommentId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const totalComments = ideaComments.length + ideaComments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);
        document.getElementById('commentsCount').textContent = totalComments;
        
        const commentsList = document.getElementById('commentsList');
        if (ideaComments.length === 0) {
            commentsList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <p class="text-5xl mb-4">💭</p>
                    <p>لا توجد تعليقات حتى الآن</p>
                </div>
            `;
            return;
        }
        
        commentsList.innerHTML = ideaComments.map(comment => renderComment(comment)).join('');
    }

    function renderComment(comment) {
        const replies = appData.comments.filter(c => c.parentCommentId === comment.id);
        const isAdmin = currentUser?.role === 'admin';
        const isOwner = currentUser?.name === comment.author;
        
        return `
            <div class="comment-advanced ${comment.best ? 'best-comment' : ''}">
                <div class="flex items-start gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-lg font-bold">
                        ${comment.author?.charAt(0) || '👤'}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <p class="font-bold">${comment.author}</p>
                            <span class="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20">
                                ${comment.authorRole === 'admin' ? '👑 مدير' : comment.authorRole === 'premium' ? '💡 مميز' : '👤 عضو'}
                            </span>
                        </div>
                        <p class="text-xs text-gray-400">
                            ${new Date(comment.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                    </div>
                    ${(isAdmin || isOwner) ? `
                        <button onclick="deleteComment('${comment.id}')" class="text-red-400 hover:text-red-300 text-xl">
                            🗑️
                        </button>
                    ` : ''}
                </div>
                <p class="text-gray-300 mb-4 whitespace-pre-line">${comment.content}</p>
                <div class="comment-actions">
                    <button onclick="toggleLikeComment('${comment.id}')" class="comment-like-btn ${comment.likedBy?.includes(currentUser?.id) ? 'liked' : ''}">
                        <span>❤️</span>
                        <span>${comment.likes || 0}</span>
                    </button>
                    <button onclick="setReplyingTo('${comment.id}', '${comment.author}')" class="btn-secondary px-4 py-2 rounded-xl text-sm">
                        ↩️ رد
                    </button>
                    ${isAdmin ? `
                        <button onclick="toggleBestComment('${comment.id}')" class="btn-secondary px-4 py-2 rounded-xl text-sm">
                            ${comment.best ? '⭐' : '☆'} ${comment.best ? 'إلغاء التميز' : 'تمييز'}
                        </button>
                    ` : ''}
                </div>
                ${replies.length > 0 ? `
                    <div class="reply-section mt-4">
                        <div class="space-y-3">
                            ${replies.map(reply => renderComment(reply)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async function submitComment() {
        if (!currentUser) {
            showToast('يرجى تسجيل الدخول لإضافة تعليق', 'error');
            return;
        }
        
        const content = document.getElementById('newCommentText').value.trim();
        if (!content) {
            showToast('يرجى كتابة تعليق', 'error');
            return;
        }
        
        if (!currentIdeaId) {
            showToast('خطأ في تحديد الفكرة', 'error');
            return;
        }
        
        showLoadingBar();
        
        try {
            const commentData = {
                ideaId: currentIdeaId,
                content,
                author: currentUser.name,
                authorRole: currentUser.role,
                authorId: currentUser.id,
                likes: 0,
                likedBy: [],
                best: false,
                parentCommentId: replyingToCommentId || '',
                createdAt: new Date().toISOString()
            };
            
            await db.collection('comments').add(commentData);
            
            // Clear form
            document.getElementById('newCommentText').value = '';
            replyingToCommentId = null;
            
            showToast('تمت إضافة التعليق بنجاح!', 'success');
            
            // Update comments
            updateComments();
            
        } catch (error) {
            console.error('Error adding comment:', error);
            showToast('حدث خطأ أثناء إضافة التعليق', 'error');
        } finally {
            hideLoadingBar();
        }
    }

    function setReplyingTo(commentId, authorName) {
        replyingToCommentId = commentId;
        const textarea = document.getElementById('newCommentText');
        textarea.value = `@${authorName} `;
        textarea.focus();
        showToast(`جارٍ الرد على ${authorName}...`, 'info');
    }

    async function toggleLikeComment(commentId) {
        if (!currentUser) {
            showToast('يرجى تسجيل الدخول للإعجاب', 'error');
            return;
        }
        
        const comment = appData.comments.find(c => c.id === commentId);
        if (!comment) return;
        
        const likedBy = comment.likedBy || [];
        const hasLiked = likedBy.includes(currentUser.id);
        
        try {
            if (hasLiked) {
                // Remove like
                const newLikedBy = likedBy.filter(id => id !== currentUser.id);
                await db.collection('comments').doc(commentId).update({
                    likes: (comment.likes || 1) - 1,
                    likedBy: newLikedBy
                });
                showToast('تم إزالة الإعجاب', 'info');
            } else {
                // Add like
                likedBy.push(currentUser.id);
                await db.collection('comments').doc(commentId).update({
                    likes: (comment.likes || 0) + 1,
                    likedBy: likedBy
                });
                showToast('تم الإعجاب بالتعليق!', 'success');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            showToast('حدث خطأ أثناء الإعجاب', 'error');
        }
    }

    async function deleteComment(commentId) {
        const comment = appData.comments.find(c => c.id === commentId);
        if (!comment) return;
        
        const isAdmin = currentUser?.role === 'admin';
        const isOwner = currentUser?.name === comment.author;
        
        if (!isAdmin && !isOwner) {
            showToast('لا تملك صلاحية حذف هذا التعليق', 'error');
            return;
        }
        
        showConfirmModal('حذف التعليق', 'هل أنت متأكد من حذف هذا التعليق؟', '🗑️', async () => {
            showLoadingBar();
            try {
                await db.collection('comments').doc(commentId).delete();
                showToast('تم حذف التعليق بنجاح', 'success');
                updateComments();
            } catch (error) {
                console.error('Error deleting comment:', error);
                showToast('خطأ في حذف التعليق', 'error');
            } finally {
                hideLoadingBar();
            }
        });
    }

    async function toggleBestComment(commentId) {
        if (!currentUser || currentUser.role !== 'admin') {
            showToast('لا تملك صلاحية تحديد التعليقات المميزة', 'error');
            return;
        }
        
        const comment = appData.comments.find(c => c.id === commentId);
        if (!comment) return;
        
        showLoadingBar();
        try {
            await db.collection('comments').doc(commentId).update({
                best: !comment.best
            });
            showToast(`تم ${comment.best ? 'إلغاء تمييز' : 'تمييز'} التعليق`, 'success');
        } catch (error) {
            console.error('Error toggling best comment:', error);
            showToast('خطأ في تحديث التعليق', 'error');
        } finally {
            hideLoadingBar();
        }
    }

    // ============================================
    // Other Page Functions
    // ============================================

    function updateHomePage() {
        // Update quote of the day
        const quotes = [...appData.quotes, ...DEFAULT_QUOTES];
        if (quotes.length > 0) {
            const today = new Date().getDate();
            const quoteIndex = today % quotes.length;
            const quote = quotes[quoteIndex];
            document.getElementById('quoteOfDay').textContent = `"${quote.text}"`;
            document.getElementById('quoteAuthor').textContent = `- ${quote.author}`;
        }
        
        // Update latest ideas
        updateLatestIdeas();
    }

    function updateLatestIdeas() {
        const grid = document.getElementById('latestIdeasGrid');
        if (!grid) return;
        
        const latestIdeas = appData.ideas
            .filter(idea => !idea.deleted)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);
        
        if (latestIdeas.length === 0) {
            grid.innerHTML = `
                <div class="advanced-card text-center text-gray-400 p-8 col-span-full">
                    <p class="text-5xl mb-4">💭</p>
                    <p>لا توجد أفكار حتى الآن</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = latestIdeas.map(idea => `
            <div class="advanced-card card-hover cursor-pointer" onclick="openIdeaDetails('${idea.id}')">
                <div class="flex items-start justify-between mb-3">
                    <span class="text-2xl">${CATEGORY_ICONS[idea.category] || '💡'}</span>
                    ${idea.featured ? '<span class="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">⭐</span>' : ''}
                </div>
                <h4 class="font-bold text-lg mb-2 line-clamp-2">${idea.title}</h4>
                <p class="text-gray-400 text-sm mb-3 line-clamp-2">
                    ${idea.content.substring(0, 100)}${idea.content.length > 100 ? '...' : ''}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <div class="flex items-center gap-1">
                        <span>👤</span>
                        <span>${idea.author}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span>👁️ ${idea.views || 0}</span>
                        <span>❤️ ${idea.likes || 0}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Initialize the app
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // Check for saved user
            const savedUser = localStorage.getItem('muf_user');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                await loadAllData();
                showMainApp();
            }
            
            // Set up auth state listener
            auth?.onAuthStateChanged(async (user) => {
                if (user) {
                    await handleAuthenticatedUser(user);
                }
            });
            
            // Show menu toggle on mobile
            if (window.innerWidth < 769) {
                document.getElementById('menuToggle').classList.remove('hidden');
            }
            
            // Handle window resize
            window.addEventListener('resize', () => {
                const menuToggle = document.getElementById('menuToggle');
                if (window.innerWidth < 769) {
                    menuToggle?.classList.remove('hidden');
                } else {
                    menuToggle?.classList.add('hidden');
                    document.getElementById('sidebar')?.classList.remove('sidebar-open');
                    document.getElementById('sidebarOverlay')?.classList.remove('active');
                }
            });
            
        } catch (error) {
            console.error('App initialization error:', error);
            showToast('خطأ في تهيئة التطبيق', 'error');
        }
    });
</script>