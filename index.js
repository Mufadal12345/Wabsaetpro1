// ============================================
// Firebase Configuration and Initialization
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Initialize Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ============================================
// App State and Global Variables
// ============================================
let emailMode = 'login'; // 'login' or 'register'
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
let viewedIdeas = new Set();
let currentIdeaId = null;
let replyingToCommentId = null;

// Admin Credentials
const ADMINS = [
    { name: 'Rasha', specialty: '20250929' },
    { name: 'MUF', specialty: 'CS' }
];

// Default Inspirational Quotes
const DEFAULT_QUOTES = [
    { text: "العقل كالمظلة، لا يعمل إلا إذا كان مفتوحاً", author: "حكمة شعبية", id: "default_1", isDefault: true },
    { text: "أنا أفكر، إذن أنا موجود", author: "رينيه ديكارت", id: "default_2", isDefault: true },
    { text: "الخيال أهم من المعرفة، فالمعرفة محدودة أما الخيال فيحيط بالعالم", author: "ألبرت أينشتاين", id: "default_3", isDefault: true },
    { text: "القراءة تمنح الإنسان حيوات متعددة في حياة واحدة", author: "من حكم الأدب", id: "default_4", isDefault: true },
    { text: "الفكرة التي لا تتحول إلى فعل، ليست أكثر من حلم", author: "حكمة عملية", id: "default_5", isDefault: true },
    { text: "المعرفة قوة، ولكن التطبيق هو السلطان", author: "فرانسيس بيكون", id: "default_6", isDefault: true },
    { text: "النجاح ليس نهاية، والفشل ليس قاتلاً، إنها الشجاعة على الاستمرار هي التي تحسب", author: "ونستون تشرشل", id: "default_7", isDefault: true },
    { text: "التغيير يبدأ من الداخل، وينمو نحو الخارج", author: "من حكم التطور الذاتي", id: "default_8", isDefault: true },
    { text: "كن كالماء، مرناً وقوياً في آن واحد", author: "بروس لي", id: "default_9", isDefault: true },
    { text: "الإبداع هو الذكاء وهو يستمتع", author: "ألبرت أينشتاين", id: "default_10", isDefault: true },
    { text: "الحياة إما مغامرة جريئة أو لا شيء", author: "هيلين كيلر", id: "default_11", isDefault: true },
    { text: "القمة ليست الهدف، بل الرحلة إليها", author: "من حكم المسافرين", id: "default_12", isDefault: true },
    { text: "الفكرة هي البذرة، والعقل هو التربة، والإبداع هو الثمرة", author: "من حكم متحف الفكر", id: "default_13", isDefault: true }
];

// Icons Mapping
const CATEGORY_ICONS = {
    'فلسفة': '🧠',
    'تقنية': '💻',
    'أدب': '📖',
    'علوم': '🔬',
    'فن': '🎨',
    'اجتماع': '👥'
};

const COURSE_ICONS = {
    'قناة يوتيوب': '📺',
    'كورس أونلاين': '🎓',
    'منصة تعليمية': '💻',
    'مقالات': '📝',
    'كتب': '📚',
    'بودكاست': '🎙️'
};

const roleIcons = { admin: '👑', premium: '💡', user: '👤' };

// ============================================
// Authentication Functions
// ============================================

// Switch between auth tabs
function switchAuthTab(tab) {
    document.getElementById('tabTraditional').classList.remove('active');
    document.getElementById('tabEmail').classList.remove('active');
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
    
    document.getElementById('traditionalLogin').classList.add('hidden');
    document.getElementById('emailLogin').classList.add('hidden');
    document.getElementById(`${tab}Login`).classList.remove('hidden');
    
    if (tab === 'email') {
        emailMode = 'login';
        document.getElementById('emailToggleText').textContent = 'إنشاء حساب جديد';
        document.getElementById('emailAuthBtnText').textContent = 'تسجيل الدخول';
        document.getElementById('registerFields').classList.add('hidden');
        document.getElementById('emailLoginFields').classList.remove('hidden');
    }
}

// Toggle between login and register for email auth
function toggleEmailMode() {
    if (emailMode === 'login') {
        emailMode = 'register';
        document.getElementById('emailToggleText').textContent = 'لديك حساب بالفعل؟ سجل الدخول';
        document.getElementById('emailAuthBtnText').textContent = 'إنشاء حساب';
        document.getElementById('registerFields').classList.remove('hidden');
    } else {
        emailMode = 'login';
        document.getElementById('emailToggleText').textContent = 'إنشاء حساب جديد';
        document.getElementById('emailAuthBtnText').textContent = 'تسجيل الدخول';
        document.getElementById('registerFields').classList.add('hidden');
    }
}

// Handle Traditional Login
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
    
    try {
        // Check if user is banned
        const bannedUsers = appData.users.filter(u => u.isBanned);
        const isBanned = bannedUsers.some(u => u.name === name);
        
        if (isBanned) {
            showToast('هذا الحساب محظور من قبل المدير', 'error');
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            return;
        }
        
        // Check if admin
        const isAdmin = ADMINS.some(a => a.name === name && a.specialty === specialty);
        
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
            await db.collection('codes').doc(usedCode.id).update({
                usedBy: name,
                usedAt: new Date().toISOString()
            });
        }
        
        // Check if user already exists
        let userDoc = await db.collection('users').where('name', '==', name).get();
        
        if (!userDoc.empty) {
            const existingUser = userDoc.docs[0];
            const userData = existingUser.data();
            
            if (upgradeCode && userData.role === 'user') {
                await db.collection('users').doc(existingUser.id).update({
                    role: 'premium',
                    upgradeCode: upgradeCode
                });
                role = 'premium';
            } else {
                role = userData.role;
                upgradeCode = userData.upgradeCode;
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
            const userData = {
                name,
                specialty: role === 'premium' ? 'عضو مميز' : (specialty || 'مستخدم'),
                role,
                upgradeCode: upgradeCode || '',
                isBanned: false,
                authMethod: 'traditional',
                createdAt: new Date().toISOString()
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
    }
}

// Handle Google Login
async function handleGoogleLogin() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
    } catch (error) {
        console.error('Google login error:', error);
        
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

// Handle Email Authentication
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
    
    try {
        if (emailMode === 'login') {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            const name = document.getElementById('registerName').value.trim();
            const specialty = document.getElementById('registerSpecialty').value.trim();
            
            if (!name) {
                showToast('يرجى إدخال اسم المستخدم', 'error');
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                return;
            }
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.sendEmailVerification();
            
            const userData = {
                name,
                specialty: specialty || 'مستخدم',
                role: 'user',
                upgradeCode: '',
                isBanned: false,
                authMethod: 'email',
                email: email,
                emailVerified: false,
                createdAt: new Date().toISOString()
            };
            
            await db.collection('users').doc(userCredential.user.uid).set(userData);
            
            showToast('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني', 'success');
            
            document.getElementById('registerName').value = '';
            document.getElementById('registerSpecialty').value = '';
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            
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
                errorMessage = 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل';
                break;
            case 'auth/user-not-found':
                errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'تم إجراء محاولات كثيرة، يرجى المحاولة لاحقاً';
                break;
        }
        
        showToast(errorMessage, 'error');
    } finally {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// Handle authenticated user from Firebase Auth
async function handleAuthenticatedUser(firebaseUser) {
    try {
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
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
                photoURL: firebaseUser.photoURL,
                authMethod: userData.authMethod || 'email'
            };
            
            await db.collection('users').doc(firebaseUser.uid).update({
                lastLogin: new Date().toISOString()
            });
        } else {
            let name = '';
            let specialty = 'مستخدم';
            
            if (firebaseUser.providerData[0].providerId === 'google.com') {
                name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
            } else {
                name = firebaseUser.email.split('@')[0];
            }
            
            const userData = {
                name,
                specialty,
                role: 'user',
                upgradeCode: '',
                isBanned: false,
                authMethod: firebaseUser.providerData[0].providerId,
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
    }
}

// ============================================
// Data Management Functions
// ============================================

// Initialize App
async function initApp() {
    try {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await handleAuthenticatedUser(user);
            } else {
                console.log('User signed out');
            }
        });

        const savedUser = localStorage.getItem('muf_user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            await loadAllData();
            showMainApp();
        }

        renderQuotes();

        if (window.innerWidth < 769) {
            document.getElementById('menuToggle').classList.remove('hidden');
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth < 769) {
                document.getElementById('menuToggle').classList.remove('hidden');
            } else {
                document.getElementById('menuToggle').classList.add('hidden');
                document.getElementById('sidebar').classList.remove('sidebar-open');
                document.getElementById('sidebarOverlay').classList.remove('active');
            }
        });

    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('خطأ في تهيئة التطبيق', 'error');
    }
}

// Load all data from Firestore
async function loadAllData() {
    try {
        const promises = [
            db.collection('users').get(),
            db.collection('ideas').get(),
            db.collection('content').get(),
            db.collection('suggestions').get(),
            db.collection('codes').get(),
            db.collection('quotes').get(),
            db.collection('messages').get(),
            db.collection('courses').get(),
            db.collection('comments').get()
        ];

        const results = await Promise.all(promises);

        appData = {
            users: results[0].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ideas: results[1].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            content: results[2].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            suggestions: results[3].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            codes: results[4].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            quotes: results[5].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            messages: results[6].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            courses: results[7].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            comments: results[8].docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };

        setupRealtimeListeners();
        updateUI();

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('خطأ في تحميل البيانات', 'error');
    }
}

// Set up real-time listeners
function setupRealtimeListeners() {
    db.collection('users').onSnapshot((snapshot) => {
        appData.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'members' || currentPage === 'home' || currentPage === 'settings') {
            updateUI();
        }
    });

    db.collection('ideas').onSnapshot((snapshot) => {
        appData.ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'ideas' || currentPage === 'home' || currentPage === 'settings') {
            updateUI();
        }
    });

    db.collection('content').onSnapshot((snapshot) => {
        appData.content = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'content') {
            updateUI();
        }
    });

    db.collection('suggestions').onSnapshot((snapshot) => {
        appData.suggestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'suggestions' || currentPage === 'home' || currentPage === 'settings') {
            updateUI();
        }
    });

    db.collection('codes').onSnapshot((snapshot) => {
        appData.codes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'codes' || currentPage === 'settings') {
            updateUI();
        }
    });

    db.collection('quotes').onSnapshot((snapshot) => {
        appData.quotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'quotes' || currentPage === 'home') {
            updateUI();
        }
    });

    db.collection('messages').onSnapshot((snapshot) => {
        appData.messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'messages' || currentPage === 'settings') {
            updateUI();
        }
        updateMessagesBadge();
    });

    db.collection('courses').onSnapshot((snapshot) => {
        appData.courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'skills') {
            updateUI();
        }
    });

    db.collection('comments').onSnapshot((snapshot) => {
        appData.comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'ideas' || currentPage === 'comments' || currentPage === 'home') {
            updateUI();
        }
        if (currentIdeaId && document.getElementById('ideaDetailsModal').classList.contains('hidden') === false) {
            updateComments();
        }
    });
}

// ============================================
// UI Management Functions
// ============================================

// Toggle Sidebar (Mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('sidebar-open');
    overlay.classList.toggle('active');
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Navigation
function navigateTo(page) {
    currentPage = page;
    
    if (window.innerWidth < 769) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('active');
    }
    
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    updateUI();
}

// Show Main App
function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('currentUserName').textContent = currentUser.name;
        document.getElementById('currentUserSpecialty').textContent = currentUser.specialty;
        document.getElementById('welcomeName').textContent = currentUser.name;
        
        const avatarMap = { admin: '👑', premium: '💡', user: '👤' };
        document.getElementById('userAvatar').textContent = avatarMap[currentUser.role] || '👤';
        
        const roleMap = { admin: 'مدير', premium: 'عضو مميز', user: 'عضو' };
        document.getElementById('userRoleDisplay').textContent = roleMap[currentUser.role] || 'عضو';
        
        const statusElement = document.getElementById('userStatus');
        if (currentUser.isBanned) {
            statusElement.innerHTML = '<span class="text-red-400">🚫 محظور</span>';
        } else {
            statusElement.innerHTML = '<span class="text-green-400">✅ نشط</span>';
        }
        
        const isAdmin = currentUser.role === 'admin';
        const isPremium = currentUser.role === 'premium';
        const isRegularUser = currentUser.role === 'user';
        
        document.getElementById('adminMenuItems').classList.toggle('hidden', !isAdmin);
        document.getElementById('addIdeaBtn').classList.toggle('hidden', !(isAdmin || isPremium));
        document.getElementById('addContentBtn').classList.toggle('hidden', !isAdmin);
        document.getElementById('addQuoteBtn').classList.toggle('hidden', !(isAdmin || isPremium));
        document.getElementById('addCourseBtn').classList.toggle('hidden', !(isAdmin || isPremium));
        document.getElementById('userMessageButton').classList.toggle('hidden', !isRegularUser);
    }
    
    navigateTo('home');
}

// Update UI
function updateUI() {
    if (!currentUser) return;
    
    updateStats();
    updateQuoteOfDay();
    updateLatestIdeas();
    updateTopComments();
    updateIdeasGrid();
    updateContentGrid();
    updateSuggestions();
    updateMembers();
    updateMessages();
    updateCourses();
    updateCodes();
    updateSettings();
    renderQuotes();
    
    if (currentPage === 'comments') {
        updateCommentsStats();
        renderAllComments();
    }
}

// Update Stats
function updateStats() {
    const activeIdeas = appData.ideas.filter(i => !i.deleted);
    const totalViews = activeIdeas.reduce((sum, i) => sum + (i.views || 0), 0);
    const totalComments = appData.comments.length;
    
    document.getElementById('totalIdeas').textContent = activeIdeas.length;
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalMembers').textContent = appData.users.length;
    document.getElementById('totalInteractions').textContent = totalComments;
    
    const pendingSuggestions = appData.suggestions.filter(s => s.status === 'pending').length;
    const suggestionsBadge = document.getElementById('suggestionsBadge');
    if (currentUser && currentUser.role === 'admin' && pendingSuggestions > 0) {
        suggestionsBadge.textContent = pendingSuggestions;
        suggestionsBadge.classList.remove('hidden');
    } else {
        suggestionsBadge.classList.add('hidden');
    }
}

// ============================================
// Ideas Management Functions
// ============================================

// Open Add Idea Modal
function openAddIdeaModal() {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium')) {
        document.getElementById('addIdeaModal').classList.remove('hidden');
    } else {
        showToast('لا تملك صلاحية إضافة أفكار. استخدم رمز ترقية لتصبح عضواً مميزاً.', 'error');
    }
}

// Submit New Idea
async function submitNewIdea() {
    const title = document.getElementById('newIdeaTitle').value.trim();
    const category = document.getElementById('newIdeaCategory').value;
    const content = document.getElementById('newIdeaContent').value.trim();
    
    if (!title || !content) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const ideaData = {
            title,
            category,
            content,
            author: currentUser.name,
            authorRole: currentUser.role,
            views: 0,
            likes: 0,
            likedBy: '',
            featured: false,
            deleted: false,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('ideas').add(ideaData);
        
        closeModal('addIdeaModal');
        document.getElementById('newIdeaTitle').value = '';
        document.getElementById('newIdeaContent').value = '';
        
        showToast('تمت إضافة الفكرة بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error adding idea:', error);
        showToast('حدث خطأ أثناء إضافة الفكرة', 'error');
    }
}

// Filter Ideas
function filterIdeas(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.closest('#ideasPage')) {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        }
    });
    
    updateIdeasGrid();
}

// Update Ideas Grid
function updateIdeasGrid() {
    let ideas = appData.ideas
        .filter(i => !i.deleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (currentFilter !== 'all') {
        ideas = ideas.filter(i => i.category === currentFilter);
    }
    
    const grid = document.getElementById('ideasGrid');
    
    if (!grid) return;
    
    if (ideas.length === 0) {
        grid.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400 col-span-full">
                <p class="text-5xl mb-4">💭</p>
                <p>لا توجد أفكار ${currentFilter !== 'all' ? 'في هذا التصنيف' : 'حتى الآن'}</p>
                ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium') ? '<p class="text-sm mt-2">كن أول من يشارك فكرة!</p>' : ''}
            </div>
        `;
        return;
    }
    
    grid.innerHTML = ideas.map(idea => createIdeaCard(idea)).join('');
}

// Create Idea Card
function createIdeaCard(idea) {
    const icon = CATEGORY_ICONS[idea.category] || '💡';
    const likedBy = idea.likedBy ? idea.likedBy.split(',').filter(Boolean) : [];
    const isLiked = currentUser && likedBy.includes(currentUser.name);
    const commentsCount = appData.comments.filter(c => c.ideaId === idea.id && !c.deleted).length;
    
    const roleIcon = roleIcons[idea.authorRole] || '👤';
    
    const deleteButton = currentUser && currentUser.role === 'admin' ? `
        <div class="absolute left-3 top-3">
            <button onclick="deleteIdea('${idea.id}')" class="text-red-400 hover:text-red-300 text-sm">🗑️</button>
        </div>
    ` : '';
    
    return `
        <div class="glass-card rounded-xl p-5 card-hover animate-fade-in relative">
            ${deleteButton}
            <div class="flex items-start justify-between mb-3">
                <span class="category-tag px-3 py-1 rounded-full text-xs">${icon} ${idea.category}</span>
                ${idea.featured ? '<span class="text-yellow-400 text-xl">⭐</span>' : ''}
            </div>
            <h4 class="font-bold text-lg mb-2 line-clamp-2">${idea.title}</h4>
            <p class="text-gray-400 text-sm mb-4 line-clamp-3">${idea.content}</p>
            <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 flex items-center gap-1">${roleIcon} ${idea.author}</span>
                <div class="flex items-center gap-3">
                    <span class="text-gray-500">👁️ ${idea.views || 0}</span>
                    <span class="${isLiked ? 'text-red-400' : 'text-gray-500'}">❤️ ${idea.likes || 0}</span>
                    <span class="text-blue-400">💬 ${commentsCount}</span>
                </div>
            </div>
            <div class="mt-4 pt-4 border-t border-white/10">
                <button onclick="openIdeaDetails('${idea.id}')" class="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                    <span>💬</span>
                    <span>التعليقات (${commentsCount})</span>
                </button>
            </div>
        </div>
    `;
}

// Open Idea Details
function openIdeaDetails(ideaId) {
    currentIdeaId = ideaId;
    replyingToCommentId = null;
    
    const idea = appData.ideas.find(i => i.id === ideaId);
    if (!idea) return;
    
    document.getElementById('ideaDetailsTitle').textContent = idea.title;
    
    document.getElementById('ideaDetailsContent').innerHTML = `
        <div class="glass-card rounded-xl p-5">
            <div class="flex items-start justify-between mb-3">
                <span class="category-tag px-3 py-1 rounded-full text-xs">${CATEGORY_ICONS[idea.category]} ${idea.category}</span>
                ${idea.featured ? '<span class="text-yellow-400 text-xl">⭐</span>' : ''}
            </div>
            <h4 class="font-bold text-xl mb-3">${idea.title}</h4>
            <p class="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">${idea.content}</p>
            <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 flex items-center gap-1">${roleIcons[idea.authorRole]} ${idea.author}</span>
                <div class="flex items-center gap-4">
                    <span class="text-gray-500">👁️ ${idea.views || 0}</span>
                    <span class="text-gray-500">❤️ ${idea.likes || 0}</span>
                    <span class="text-blue-400">💬 ${appData.comments.filter(c => c.ideaId === ideaId && !c.deleted).length}</span>
                </div>
            </div>
        </div>
    `;
    
    updateComments();
    document.getElementById('ideaDetailsModal').classList.remove('hidden');
    increaseViews(ideaId);
}

// Increase Views
async function increaseViews(ideaId) {
    if (!currentUser) return;
    
    try {
        const ideaRef = db.collection('ideas').doc(ideaId);
        const ideaDoc = await ideaRef.get();
        if (ideaDoc.exists) {
            const currentViews = ideaDoc.data().views || 0;
            await ideaRef.update({ views: currentViews + 1 });
        }
    } catch (error) {
        console.error('Error increasing views:', error);
    }
}

// Delete Idea (Admin only)
async function deleteIdea(ideaId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('لا تملك صلاحية حذف الأفكار', 'error');
        return;
    }
    
    confirmAction = async () => {
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
        }
    };
    showConfirmModal('حذف الفكرة', 'هل أنت متأكد من حذف هذه الفكرة؟');
}

// ============================================
// Comments Management Functions
// ============================================

// Update Comments in Modal
function updateComments() {
    if (!currentIdeaId) return;
    
    const ideaComments = appData.comments
        .filter(c => c.ideaId === currentIdeaId && !c.parentCommentId && !c.deleted)
        .sort((a, b) => {
            const likesDiff = (b.likes || 0) - (a.likes || 0);
            if (likesDiff !== 0) return likesDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    
    document.getElementById('commentsCount').textContent = appData.comments.filter(c => c.ideaId === currentIdeaId && !c.deleted).length;
    
    const commentsList = document.getElementById('commentsList');
    if (ideaComments.length === 0) {
        commentsList.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400">
                <p>لا توجد تعليقات حتى الآن</p>
                ${currentUser ? '<p class="text-sm mt-2">كن أول من يعلق!</p>' : '<p class="text-sm mt-2">سجل الدخول لإضافة تعليق</p>'}
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = ideaComments.map(comment => renderComment(comment, 0)).join('');
}

// Render Comment
function renderComment(comment, level = 0) {
    const replies = appData.comments.filter(c => c.parentCommentId === comment.id && !c.deleted);
    const userLiked = comment.likedBy && currentUser ? comment.likedBy.includes(currentUser.id) : false;
    
    return `
        <div class="glass-card rounded-xl p-4 ${level > 0 ? 'mr-4 border-r-2 border-blue-500/30' : ''}">
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${roleIcons[comment.authorRole] || '👤'}</span>
                    <div>
                        <p class="font-bold">${comment.authorName}</p>
                        <p class="text-xs text-gray-500">${formatDate(comment.createdAt)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="likeComment('${comment.id}', ${userLiked})" class="flex items-center gap-1 ${userLiked ? 'text-red-400' : 'text-gray-400'} hover:text-red-300">
                        <span>❤️</span>
                        <span>${comment.likes || 0}</span>
                    </button>
                    ${currentUser ? `
                        <button onclick="startReply('${comment.id}', '${comment.authorName}')" class="text-blue-400 hover:text-blue-300">
                            🔁 رد
                        </button>
                    ` : ''}
                    ${(currentUser && (currentUser.id === comment.userId || currentUser.role === 'admin')) ? `
                        <button onclick="deleteComment('${comment.id}')" class="text-red-400 hover:text-red-300">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
            <p class="text-gray-300 mb-3 whitespace-pre-wrap">${comment.text}</p>
            
            ${replyingToCommentId === comment.id ? `
                <div class="mr-4 mt-3">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-sm text-gray-400">→ رد على ${comment.authorName}</span>
                        <button onclick="cancelReply()" class="text-xs text-red-400">إلغاء</button>
                    </div>
                    <textarea id="replyText" class="input-style w-full px-4 py-2 rounded-xl h-20 resize-none" placeholder="اكتب ردك..."></textarea>
                    <button onclick="submitReply()" class="btn-primary mt-2 px-4 py-2 rounded-xl text-sm">إرسال الرد</button>
                </div>
            ` : ''}
            
            ${replies.length > 0 ? `
                <div class="mt-4 space-y-3">
                    ${replies.map(reply => renderComment(reply, level + 1)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Submit Comment
async function submitComment() {
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        return;
    }
    
    if (!currentIdeaId) {
        showToast('لا توجد فكرة مفتوحة', 'error');
        return;
    }
    
    let text = document.getElementById('newCommentText').value.trim();
    if (replyingToCommentId) {
        text = document.getElementById('replyText')?.value.trim() || text;
    }
    
    if (!text) {
        showToast('يرجى كتابة التعليق', 'error');
        return;
    }
    
    try {
        const commentData = {
            ideaId: currentIdeaId,
            text: text,
            userId: currentUser.id,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            likes: 0,
            likedBy: [],
            parentCommentId: replyingToCommentId || null,
            replies: 0,
            deleted: false,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('comments').add(commentData);
        
        if (replyingToCommentId) {
            const parentComment = appData.comments.find(c => c.id === replyingToCommentId);
            if (parentComment) {
                await db.collection('comments').doc(replyingToCommentId).update({
                    replies: (parentComment.replies || 0) + 1
                });
            }
        }
        
        document.getElementById('newCommentText').value = '';
        if (document.getElementById('replyText')) {
            document.getElementById('replyText').value = '';
        }
        replyingToCommentId = null;
        
        showToast('تم إضافة التعليق بنجاح', 'success');
        
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('حدث خطأ أثناء إضافة التعليق', 'error');
    }
}

// Start Reply
function startReply(commentId, authorName) {
    replyingToCommentId = commentId;
    document.getElementById('newCommentText').value = `@${authorName} `;
    document.getElementById('newCommentText').focus();
    updateComments();
}

// Cancel Reply
function cancelReply() {
    replyingToCommentId = null;
    document.getElementById('newCommentText').value = '';
    updateComments();
}

// Submit Reply
function submitReply() {
    submitComment();
}

// Like Comment
async function likeComment(commentId, isLiked) {
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        return;
    }
    
    try {
        const comment = appData.comments.find(c => c.id === commentId);
        if (!comment) return;
        
        let likedBy = comment.likedBy || [];
        let likes = comment.likes || 0;
        
        if (isLiked) {
            likedBy = likedBy.filter(id => id !== currentUser.id);
            likes = Math.max(0, likes - 1);
        } else {
            if (!likedBy.includes(currentUser.id)) {
                likedBy.push(currentUser.id);
                likes += 1;
            }
        }
        
        await db.collection('comments').doc(commentId).update({
            likes: likes,
            likedBy: likedBy
        });
        
    } catch (error) {
        console.error('Error liking comment:', error);
        showToast('حدث خطأ أثناء الإعجاب', 'error');
    }
}

// Delete Comment
function deleteComment(commentId) {
    confirmAction = async () => {
        try {
            const comment = appData.comments.find(c => c.id === commentId);
            
            if (comment.replies > 0) {
                await db.collection('comments').doc(commentId).update({
                    deleted: true,
                    text: 'تم حذف هذا التعليق',
                    authorName: 'مستخدم محذوف',
                    authorRole: 'user'
                });
            } else {
                await db.collection('comments').doc(commentId).delete();
                
                if (comment.parentCommentId) {
                    const parentComment = appData.comments.find(c => c.id === comment.parentCommentId);
                    if (parentComment) {
                        await db.collection('comments').doc(comment.parentCommentId).update({
                            replies: Math.max(0, (parentComment.replies || 0) - 1)
                        });
                    }
                }
            }
            
            showToast('تم حذف التعليق بنجاح', 'success');
            
        } catch (error) {
            console.error('Error deleting comment:', error);
            showToast('حدث خطأ أثناء حذف التعليق', 'error');
        }
    };
    
    showConfirmModal('حذف التعليق', 'هل أنت متأكد من حذف هذا التعليق؟');
}

// ============================================
// Quotes Management Functions
// ============================================

// Open Add Quote Modal
function openAddQuoteModal() {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium')) {
        document.getElementById('addQuoteModal').classList.remove('hidden');
    } else {
        showToast('لا تملك صلاحية إضافة عبارات ملهمة.', 'error');
    }
}

// Submit New Quote
async function submitNewQuote() {
    const text = document.getElementById('newQuoteText').value.trim();
    const author = document.getElementById('newQuoteAuthor').value.trim();
    
    if (!text || !author) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const quoteData = {
            text,
            author,
            addedBy: currentUser.name,
            isDefault: false,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('quotes').add(quoteData);
        
        closeModal('addQuoteModal');
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteAuthor').value = '';
        
        showToast('تمت إضافة العبارة بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error adding quote:', error);
        showToast('حدث خطأ أثناء إضافة العبارة', 'error');
    }
}

// Render Quotes
function renderQuotes() {
    const grid = document.getElementById('quotesGrid');
    if (!grid) return;
    
    const allQuotes = [...DEFAULT_QUOTES, ...appData.quotes];
    
    allQuotes.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
    });
    
    if (allQuotes.length === 0) {
        grid.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400">
                <p>لا توجد عبارات حتى الآن</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = allQuotes.map((quote, i) => {
        const isUserAdded = !quote.isDefault;
        const addedByText = isUserAdded ? `<p class="text-xs text-gray-500 mt-1">أضافه: ${quote.addedBy || 'مستخدم'}</p>` : '';
        
        return `
            <div class="quote-card glass-card rounded-xl p-5 card-hover animate-fade-in" style="animation-delay: ${i * 0.05}s">
                <p class="font-amiri text-lg leading-relaxed mb-3">"${quote.text}"</p>
                <p class="text-pink-300 text-sm">— ${quote.author}</p>
                ${addedByText}
                ${currentUser && currentUser.role === 'admin' && !quote.isDefault ? `
                    <div class="mt-2 text-left">
                        <button onclick="deleteQuote('${quote.id}')" class="text-red-400 hover:text-red-300 text-sm">🗑️ حذف</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Delete Quote (Admin only)
async function deleteQuote(quoteId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    confirmAction = async () => {
        try {
            await db.collection('quotes').doc(quoteId).delete();
            showToast('تم حذف العبارة بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting quote:', error);
            showToast('خطأ في حذف العبارة', 'error');
        }
    };
    showConfirmModal('حذف العبارة', 'هل أنت متأكد من حذف هذه العبارة؟');
}

// Update Quote of Day
function updateQuoteOfDay() {
    const allQuotes = [...DEFAULT_QUOTES, ...appData.quotes];
    
    allQuotes.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
    });
    
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % allQuotes.length;
    const quote = allQuotes[quoteIndex];
    
    document.getElementById('quoteOfDay').textContent = `"${quote.text}"`;
    document.getElementById('quoteAuthor').textContent = `- ${quote.author}`;
}

// ============================================
// Courses Management Functions
// ============================================

// Open Add Course Modal
function openAddCourseModal() {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium')) {
        document.getElementById('addCourseModal').classList.remove('hidden');
    } else {
        showToast('لا تملك صلاحية إضافة مصادر تعليمية.', 'error');
    }
}

// Submit New Course
async function submitNewCourse() {
    const title = document.getElementById('newCourseTitle').value.trim();
    const type = document.getElementById('newCourseType').value;
    const description = document.getElementById('newCourseDescription').value.trim();
    const link = document.getElementById('newCourseLink').value.trim();
    
    if (!title || !description) {
        showToast('يرجى ملء العنوان والوصف', 'error');
        return;
    }
    
    try {
        const courseData = {
            title,
            type,
            description,
            link: link || '',
            addedBy: currentUser.name,
            addedByRole: currentUser.role,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('courses').add(courseData);
        
        closeModal('addCourseModal');
        document.getElementById('newCourseTitle').value = '';
        document.getElementById('newCourseDescription').value = '';
        document.getElementById('newCourseLink').value = '';
        
        showToast('تمت إضافة المصدر التعليمي بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error adding course:', error);
        showToast('حدث خطأ أثناء إضافة المصدر التعليمي', 'error');
    }
}

// Filter Courses
function filterCourses(filter) {
    currentCourseFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.closest('#skillsPage')) {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        }
    });
    
    updateCourses();
}

// Update Courses
function updateCourses() {
    const grid = document.getElementById('coursesGrid');
    
    if (!grid) return;
    
    let courses = [...appData.courses].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    if (currentCourseFilter !== 'all') {
        courses = courses.filter(c => c.type === currentCourseFilter);
    }
    
    if (courses.length === 0) {
        grid.innerHTML = `
            <div class="course-card glass-card rounded-xl p-6 text-center text-gray-400 col-span-full">
                <p class="text-5xl mb-4">🚀</p>
                <p>لا توجد مصادر تعليمية ${currentCourseFilter !== 'all' ? 'من هذا النوع' : 'حتى الآن'}</p>
                ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium') ? '<p class="text-sm mt-2">أضف أول مصدر تعليمي!</p>' : ''}
            </div>
        `;
        return;
    }
    
    grid.innerHTML = courses.map(course => {
        const icon = COURSE_ICONS[course.type] || '📚';
        const isDeletable = currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium');
        
        return `
            <div class="course-card glass-card rounded-xl p-5 card-hover animate-fade-in">
                <div class="flex items-start justify-between mb-3">
                    <span class="category-tag px-3 py-1 rounded-full text-xs">${icon} ${course.type}</span>
                    ${isDeletable ? `
                        <button onclick="deleteCourse('${course.id}')" class="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                    ` : ''}
                </div>
                <h4 class="font-bold text-lg mb-2 line-clamp-2">${course.title}</h4>
                <p class="text-gray-400 text-sm mb-4 line-clamp-3">${course.description}</p>
                ${course.link ? `
                    <div class="mb-3">
                        <a href="${course.link}" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                            <span>🔗</span>
                            <span>زيارة الرابط</span>
                        </a>
                    </div>
                ` : ''}
                <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>أضافه: ${course.addedBy}</span>
                    <span class="text-xs">${formatDate(course.createdAt)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Delete Course (Admin or Premium only)
async function deleteCourse(courseId) {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'premium')) {
        showToast('لا تملك صلاحية حذف المصادر التعليمية', 'error');
        return;
    }
    
    confirmAction = async () => {
        try {
            await db.collection('courses').doc(courseId).delete();
            showToast('تم حذف المصدر التعليمي بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('خطأ في حذف المصدر التعليمي', 'error');
        }
    };
    showConfirmModal('حذف المصدر التعليمي', 'هل أنت متأكد من حذف هذا المصدر التعليمي؟');
}

// ============================================
// Messages Management Functions
// ============================================

// Open Message Admin Modal
function openMessageAdminModal() {
    if (currentUser && currentUser.role === 'user') {
        document.getElementById('messageAdminModal').classList.remove('hidden');
    }
}

// Open Request Code Modal (for regular users)
function openRequestCodeModal() {
    if (currentUser && currentUser.role === 'user') {
        document.getElementById('messageTitle').value = 'طلب رمز ترقية';
        document.getElementById('messageType').value = 'طلب رمز ترقية';
        document.getElementById('messageContent').value = 'أود طلب رمز ترقية لتصبح عضوية مميزة. شكراً.';
        document.getElementById('messageAdminModal').classList.remove('hidden');
    }
}

// Send Message to Admin
async function sendMessageToAdmin() {
    const title = document.getElementById('messageTitle').value.trim();
    const type = document.getElementById('messageType').value;
    const content = document.getElementById('messageContent').value.trim();
    
    if (!title || !content) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const messageData = {
            title,
            type,
            content,
            from: currentUser.name,
            fromId: currentUser.id,
            read: false,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('messages').add(messageData);
        
        closeModal('messageAdminModal');
        document.getElementById('messageTitle').value = '';
        document.getElementById('messageContent').value = '';
        
        showToast('تم إرسال رسالتك إلى المدير بنجاح!', 'success');
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('حدث خطأ أثناء إرسال الرسالة', 'error');
    }
}

// Update Messages Badge for admin
function updateMessagesBadge() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const unreadMessages = appData.messages.filter(m => !m.read && m.type !== 'system').length;
    const badge = document.getElementById('adminMessagesBadge');
    
    if (unreadMessages > 0) {
        badge.textContent = unreadMessages;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Mark Message as Read (Admin only)
async function markMessageAsRead(messageId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        await db.collection('messages').doc(messageId).update({
            read: true,
            readAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

// Mark all messages as read (Admin only)
async function markAllMessagesAsRead() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        const unreadMessages = appData.messages.filter(m => !m.read);
        const updatePromises = unreadMessages.map(msg => 
            db.collection('messages').doc(msg.id).update({
                read: true,
                readAt: new Date().toISOString()
            })
        );
        
        await Promise.all(updatePromises);
        showToast('تم تعيين جميع الرسائل كمقروءة', 'success');
    } catch (error) {
        console.error('Error marking all messages as read:', error);
        showToast('خطأ في تعيين الرسائل كمقروءة', 'error');
    }
}

// ============================================
// Suggestions Management Functions
// ============================================

// Submit Suggestion
async function submitSuggestion() {
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const type = document.getElementById('suggestionType')?.value;
    const title = document.getElementById('suggestionTitle')?.value.trim();
    const content = document.getElementById('suggestionContent')?.value.trim();
    
    if (!title || !content) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const suggestionData = {
            type: 'suggestion',
            suggestionType: type,
            title,
            content,
            author: currentUser.name,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        await db.collection('suggestions').add(suggestionData);
        
        if (document.getElementById('suggestionTitle')) {
            document.getElementById('suggestionTitle').value = '';
        }
        if (document.getElementById('suggestionContent')) {
            document.getElementById('suggestionContent').value = '';
        }
        showToast('تم إرسال اقتراحك! شكراً لمساهمتك 📝', 'success');
        
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showToast('فشل إرسال الاقتراح', 'error');
    }
}

// Update Suggestion Status
async function updateSuggestionStatus(id, status) {
    try {
        await db.collection('suggestions').doc(id).update({
            status
        });
        
        showToast(`تم ${status === 'approved' ? 'قبول ✅' : 'رفض ❌'} الاقتراح`, 'success');
        
    } catch (error) {
        console.error('Error updating suggestion status:', error);
        showToast('خطأ في تحديث حالة الاقتراح', 'error');
    }
}

// ============================================
// Codes Management Functions
// ============================================

// Generate Code
async function generateCode() {
    const input = document.getElementById('newCodeInput');
    let code = input?.value.trim();
    
    if (!code) {
        code = 'MUF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    const existingCode = appData.codes.find(c => c.code === code);
    if (existingCode) {
        showToast('هذا الرمز موجود بالفعل', 'error');
        return;
    }
    
    try {
        const codeData = {
            code,
            usedBy: '',
            usedAt: '',
            createdAt: new Date().toISOString()
        };
        
        await db.collection('codes').add(codeData);
        
        if (input) input.value = '';
        showToast(`تم إنشاء الرمز: ${code} 🎫`, 'success');
        
    } catch (error) {
        console.error('Error generating code:', error);
        showToast('خطأ في إنشاء الرمز', 'error');
    }
}

// Generate code for message response
async function generateCodeForMessage() {
    const code = 'MUF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
        const codeData = {
            code,
            usedBy: '',
            usedAt: '',
            createdAt: new Date().toISOString(),
            generatedFor: 'رسالة'
        };
        
        await db.collection('codes').add(codeData);
        showToast(`تم إنشاء الرمز: ${code} 🎫`, 'success');
    } catch (error) {
        console.error('Error generating code:', error);
        showToast('خطأ في إنشاء الرمز', 'error');
    }
}

// Delete Code
function deleteCode(id) {
    confirmAction = async () => {
        try {
            await db.collection('codes').doc(id).delete();
            showToast('تم حذف الرمز بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting code:', error);
            showToast('خطأ في حذف الرمز', 'error');
        }
    };
    showConfirmModal('حذف الرمز', 'هل أنت متأكد من حذف هذا الرمز؟');
}

// ============================================
// Users Management Functions (Admin only)
// ============================================

// Ban/Unban User (Admin only)
async function toggleBanUser(userId, isCurrentlyBanned) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('لا تملك صلاحية حظر المستخدمين', 'error');
        return;
    }
    
    const action = isCurrentlyBanned ? 'فك الحظر' : 'حظر';
    
    confirmAction = async () => {
        try {
            await db.collection('users').doc(userId).update({
                isBanned: !isCurrentlyBanned,
                bannedAt: !isCurrentlyBanned ? new Date().toISOString() : null,
                bannedBy: !isCurrentlyBanned ? currentUser.name : null
            });
            
            showToast(`تم ${action} المستخدم بنجاح`, 'success');
            
            if (!isCurrentlyBanned && currentUser.id === userId) {
                await handleLogout();
            }
            
        } catch (error) {
            console.error('Error toggling user ban:', error);
            showToast(`خطأ في ${action} المستخدم`, 'error');
        }
    };
    showConfirmModal(`${action} المستخدم`, `هل أنت متأكد من ${action} هذا المستخدم؟`);
}

// Delete Member
function deleteMember(id) {
    confirmAction = async () => {
        try {
            await db.collection('users').doc(id).delete();
            showToast('تم حذف العضو بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting member:', error);
            showToast('خطأ في حذف العضو', 'error');
        }
    };
    showConfirmModal('حذف العضو', 'هل أنت متأكد من حذف هذا العضو؟ سيتم حذف جميع بياناته.');
}

// ============================================
// Logout Function
// ============================================

// Logout Handler
async function handleLogout() {
    try {
        if (currentUser && (currentUser.authMethod === 'email' || currentUser.authMethod === 'google.com')) {
            await auth.signOut();
        }
        
        currentUser = null;
        localStorage.removeItem('muf_user');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        
        document.getElementById('loginName').value = '';
        document.getElementById('loginSpecialty').value = '';
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerName').value = '';
        document.getElementById('registerSpecialty').value = '';
        
        switchAuthTab('traditional');
        
        showToast('تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
}

// ============================================
// Helper Functions
// ============================================

// Helper function to format dates
function formatDate(dateStr) {
    if (!dateStr) return 'غير محدد';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return `قبل ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
        return `قبل ${diffHours} ساعة`;
    } else if (diffDays < 7) {
        return `قبل ${diffDays} يوم`;
    } else {
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// Show Confirm Modal
function showConfirmModal(title, message) {
    if (confirm(`${title}\n\n${message}\n\nهل تريد المتابعة؟`)) {
        if (confirmAction) {
            confirmAction();
            confirmAction = null;
        }
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500/90',
        error: 'bg-red-500/90',
        info: 'bg-pink-500/90'
    };
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    
    toast.className = `toast ${colors[type]} backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg`;
    toast.innerHTML = `<span class="text-xl">${icons[type]}</span><span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// Initialize the app
// ============================================
document.addEventListener('DOMContentLoaded', initApp);