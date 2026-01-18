<script>
// ============================================
// تهيئة وتكوين Firebase
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyAVp26636YGOwPIT8X6kWsxKWEnta3A0G4",
    authDomain: "ideas-museum.firebaseapp.com",
    projectId: "ideas-museum",
    storageBucket: "ideas-museum.firebasestorage.app",
    messagingSenderId: "776953892130",
    appId: "1:776953892130:web:b72d1a6e4c9b5f8290697b"
};

// متغيرات Firebase العالمية
let db, auth, googleProvider;

// ============================================
// حالة التطبيق
// ============================================
let appData = {
    users: [], ideas: [], content: [], suggestions: [],
    codes: [], quotes: [], messages: [], courses: [], comments: []
};
let currentUser = null;
let currentPage = 'home';
let currentFilter = 'all';
let currentCourseFilter = 'all';
let emailMode = 'login';
let currentIdeaId = null;
let replyingToCommentId = null;
let viewedIdeas = new Set();
let confirmModalCallback = null;

// حسابات المديرين
const ADMINS = [
    { name: 'Rasha', specialty: '20250929' },
    { name: 'MUF', specialty: 'CS' },
    { name: 'رشا', specialty: '20250929' },
    { name: 'مفضل', specialty: 'CS' },
    { name: 'admin', specialty: 'admin123' }
];

// العبارات الافتراضية
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
    { text: "الإبداع هو الذكاء وهو يستمتع", author: "ألبرت أينشتاين", id: "default_10", isDefault: true }
];

// رموز التصنيفات
const CATEGORY_ICONS = {
    'فلسفة': '🧠', 'تقنية': '💻', 'أدب': '📖', 'علوم': '🔬', 'فن': '🎨', 'اجتماع': '👥'
};

// رموز أنواع الدورات
const COURSE_ICONS = {
    'قناة يوتيوب': '📺', 'كورس أونلاين': '🎓', 'منصة تعليمية': '💻',
    'مقالات': '📝', 'كتب': '📚', 'بودكاست': '🎙️'
};

// ============================================
// الدوال الأساسية
// ============================================

// تهيئة Firebase
function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        db = firebase.firestore();
        auth = firebase.auth();
        
        googleProvider = new firebase.auth.GoogleAuthProvider();
        googleProvider.addScope('profile');
        googleProvider.addScope('email');
        googleProvider.setCustomParameters({ prompt: 'select_account' });
        
        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        showToast('خطأ في تهيئة قاعدة البيانات', 'error');
        return false;
    }
}

// التحقق من اتصال الإنترنت
function checkInternetConnection() {
    return navigator.onLine;
}

// عرض شريط التحميل
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
            if (progress >= 90) clearInterval(interval);
        }, 100);
    }
}

// إخفاء شريط التحميل
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

// عرض إشعار
function showToast(message, type = 'info') {
    if (!checkInternetConnection() && type === 'error') {
        message = 'فقدان الاتصال بالإنترنت. ' + message;
    }
    
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('⚠️ حاوية الإشعارات غير موجودة');
        return;
    }
    
    const toastId = 'toast-' + Date.now();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast glass-light p-4 flex items-start gap-3 animate-slide-in-up 
        ${type === 'success' ? 'bg-green-500/20 border-green-500/30' :
          type === 'error' ? 'bg-red-500/20 border-red-500/30' :
          type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/30' :
          'bg-blue-500/20 border-blue-500/30'}`;
    
    toast.innerHTML = `
        <span class="text-xl">${icons[type] || icons.info}</span>
        <div class="flex-1">
            <p class="text-sm font-medium">${message}</p>
        </div>
        <button onclick="document.getElementById('${toastId}').remove()" 
                class="text-gray-400 hover:text-white text-lg transition-colors">
            &times;
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.classList.add('animate-fade-out');
            setTimeout(() => toastElement.remove(), 300);
        }
    }, 5000);
}

// عرض نافذة التأكيد
function showConfirmModal(title, message, icon = '⚠️', callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmIcon').textContent = icon;
    confirmModalCallback = callback;
    document.getElementById('confirmModal').classList.remove('hidden');
}

// إغلاق نافذة التأكيد
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    confirmModalCallback = null;
}

// تنفيذ الإجراء المؤكد
function executeConfirmedAction() {
    if (confirmModalCallback) {
        confirmModalCallback();
    }
    closeConfirmModal();
}

// عرض نافذة الإشعار
function showNotificationModal(title, message, icon = '✅') {
    document.getElementById('notificationTitle').textContent = title;
    document.getElementById('notificationMessage').textContent = message;
    document.getElementById('notificationIcon').textContent = icon;
    document.getElementById('notificationModal').classList.remove('hidden');
}

// إغلاق نافذة الإشعار
function closeNotificationModal() {
    document.getElementById('notificationModal').classList.add('hidden');
}

// إغلاق أي نافذة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

// ============================================
// دوال المصادقة
// ============================================

// تبديل تبويبات المصادقة
function switchAuthTab(tab) {
    console.log('🔀 تبديل التبويب إلى:', tab);
    
    ['traditional', 'email'].forEach(tabName => {
        const tabElement = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        const formElement = document.getElementById(`${tabName}Login`);
        
        if (tabElement && formElement) {
            if (tabName === tab) {
                tabElement.classList.add('active');
                formElement.classList.remove('hidden');
            } else {
                tabElement.classList.remove('active');
                formElement.classList.add('hidden');
            }
        }
    });
    
    if (tab === 'email' && emailMode === 'register') {
        toggleEmailMode();
    }
}

// تبديل وضع البريد الإلكتروني (تسجيل/تسجيل دخول)
function toggleEmailMode() {
    const emailToggleText = document.getElementById('emailToggleText');
    const emailAuthBtnText = document.getElementById('emailAuthBtnText');
    const registerFields = document.getElementById('registerFields');
    const emailLoginFields = document.getElementById('emailLoginFields');
    
    if (!emailToggleText || !emailAuthBtnText || !registerFields || !emailLoginFields) {
        console.error('❌ عناصر تبديل وضع البريد غير موجودة');
        return;
    }
    
    if (emailMode === 'login') {
        emailMode = 'register';
        emailToggleText.textContent = 'لديك حساب بالفعل؟ سجل الدخول';
        emailAuthBtnText.innerHTML = '<span class="relative z-10">إنشاء حساب</span>';
        registerFields.classList.remove('hidden');
        emailLoginFields.classList.add('hidden');
    } else {
        emailMode = 'login';
        emailToggleText.textContent = 'إنشاء حساب جديد';
        emailAuthBtnText.innerHTML = '<span class="relative z-10">تسجيل الدخول</span>';
        registerFields.classList.add('hidden');
        emailLoginFields.classList.remove('hidden');
    }
    
    console.log('🔄 تبديل وضع البريد إلى:', emailMode);
}

// تسجيل الدخول التقليدي
async function handleTraditionalLogin() {
    const nameInput = document.getElementById('loginName');
    const specialtyInput = document.getElementById('loginSpecialty');
    
    if (!nameInput || !specialtyInput) {
        showToast('عناصر الإدخال غير موجودة', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const specialty = specialtyInput.value.trim();
    
    if (!name) {
        showToast('يرجى إدخال اسم المستخدم', 'error');
        nameInput.focus();
        return;
    }
    
    const btnText = document.getElementById('traditionalLoginBtnText');
    const spinner = document.getElementById('traditionalLoginSpinner');
    
    if (!btnText || !spinner) {
        showToast('عناصر الواجهة غير موجودة', 'error');
        return;
    }
    
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    showLoadingBar();
    
    try {
        console.log('🔐 محاولة تسجيل دخول:', { name, specialty });
        
        let isAdmin = false;
        let adminRole = 'user';
        
        for (const admin of ADMINS) {
            if (admin.name.toLowerCase() === name.toLowerCase() && 
                admin.specialty === specialty) {
                isAdmin = true;
                adminRole = admin.role || 'admin';
                console.log('✅ تم التعرف على المدير:', admin.name);
                break;
            }
        }
        
        let userDoc = null;
        let userExists = false;
        let userData = null;
        
        try {
            const querySnapshot = await db.collection('users')
                .where('name', '==', name)
                .limit(1)
                .get();
            
            if (!querySnapshot.empty) {
                userDoc = querySnapshot.docs[0];
                userData = userDoc.data();
                userExists = true;
                console.log('👤 المستخدم موجود:', userData);
            }
        } catch (dbError) {
            console.warn('⚠️ لم يتم العثور على المستخدم:', dbError);
        }
        
        let upgradeCode = null;
        let isPremium = false;
        
        if (!isAdmin && specialty) {
            try {
                const codesQuery = await db.collection('codes')
                    .where('code', '==', specialty)
                    .where('usedBy', '==', '')
                    .limit(1)
                    .get();
                
                if (!codesQuery.empty) {
                    const codeDoc = codesQuery.docs[0];
                    const codeData = codeDoc.data();
                    
                    if (!codeData.usedBy) {
                        upgradeCode = specialty;
                        isPremium = true;
                        
                        await db.collection('codes').doc(codeDoc.id).update({
                            usedBy: name,
                            usedAt: new Date().toISOString()
                        });
                        
                        console.log('🎫 تم استخدام رمز الترقية:', specialty);
                    }
                }
            } catch (codeError) {
                console.warn('⚠️ خطأ في التحقق من الرمز:', codeError);
            }
        }
        
        let role = 'user';
        if (isAdmin) {
            role = adminRole;
        } else if (isPremium) {
            role = 'premium';
        } else if (userExists) {
            role = userData.role || 'user';
        }
        
        let userId;
        
        if (userExists) {
            userId = userDoc.id;
            
            const updates = {
                lastLogin: new Date().toISOString()
            };
            
            if (isPremium && userData.role !== 'premium') {
                updates.role = 'premium';
                updates.upgradeCode = upgradeCode;
            }
            
            await db.collection('users').doc(userId).update(updates);
            
            currentUser = {
                id: userId,
                name: userData.name,
                specialty: userData.specialty || 'مستخدم',
                role: updates.role || userData.role || 'user',
                upgradeCode: updates.upgradeCode || userData.upgradeCode || '',
                isBanned: userData.isBanned || false,
                authMethod: 'traditional'
            };
            
        } else {
            const newUserData = {
                name: name,
                specialty: isAdmin ? 'مدير النظام' : (specialty || 'مستخدم'),
                role: role,
                upgradeCode: upgradeCode || '',
                isBanned: false,
                authMethod: 'traditional',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            const docRef = await db.collection('users').add(newUserData);
            userId = docRef.id;
            
            currentUser = {
                id: userId,
                ...newUserData
            };
            
            console.log('🆕 تم إنشاء مستخدم جديد:', currentUser);
        }
        
        localStorage.setItem('muf_user', JSON.stringify(currentUser));
        await loadAllData();
        showMainApp();
        
        const roleNames = {
            'admin': '👑 مدير النظام',
            'premium': '💡 عضو مميز', 
            'user': '👤 عضو عادي'
        };
        
        showToast(`مرحباً ${name}! ${roleNames[role]}`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول التقليدي:', error);
        
        let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
        
        if (error.message.includes('network') || error.message.includes('internet')) {
            errorMessage = 'يرجى التحقق من اتصال الإنترنت';
        } else if (error.message.includes('permission')) {
            errorMessage = 'لا تملك صلاحية الدخول';
        }
        
        showToast(errorMessage, 'error');
        
    } finally {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        hideLoadingBar();
    }
}

// تسجيل الدخول/إنشاء حساب بالبريد الإلكتروني
async function handleEmailAuth() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();
    
    if (!email || !password) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('يرجى إدخال بريد إلكتروني صحيح', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    const btnText = document.getElementById('emailAuthBtnText');
    const spinner = document.getElementById('emailAuthSpinner');
    
    if (!btnText || !spinner) {
        showToast('عناصر الواجهة غير موجودة', 'error');
        return;
    }
    
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    showLoadingBar();
    
    try {
        console.log('📧 محاولة مصادقة بالبريد:', { email, mode: emailMode });
        
        if (emailMode === 'login') {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;
            
            console.log('✅ تسجيل دخول ناجح:', firebaseUser.email);
            
            const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                if (userData.isBanned) {
                    await auth.signOut();
                    showToast('هذا الحساب محظور من قبل المدير', 'error');
                    return;
                }
                
                await db.collection('users').doc(firebaseUser.uid).update({
                    lastLogin: new Date().toISOString()
                });
                
                currentUser = {
                    id: firebaseUser.uid,
                    ...userData,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified
                };
                
            } else {
                const newUserData = {
                    name: firebaseUser.email.split('@')[0],
                    specialty: 'مستخدم',
                    role: 'user',
                    upgradeCode: '',
                    isBanned: false,
                    authMethod: 'email',
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                
                await db.collection('users').doc(firebaseUser.uid).set(newUserData);
                
                currentUser = {
                    id: firebaseUser.uid,
                    ...newUserData
                };
            }
            
            localStorage.setItem('muf_user', JSON.stringify(currentUser));
            await loadAllData();
            showMainApp();
            
            showToast(`مرحباً ${currentUser.name}!`, 'success');
            
        } else {
            const name = document.getElementById('registerName')?.value.trim();
            const specialty = document.getElementById('registerSpecialty')?.value.trim();
            
            if (!name) {
                showToast('يرجى إدخال اسم المستخدم', 'error');
                throw new Error('اسم المستخدم مطلوب');
            }
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;
            
            console.log('✅ حساب جديد:', firebaseUser.uid);
            
            await firebaseUser.sendEmailVerification();
            
            const userData = {
                name: name,
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
            
            await db.collection('users').doc(firebaseUser.uid).set(userData);
            
            showToast('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني', 'success');
            
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            document.getElementById('registerName').value = '';
            document.getElementById('registerSpecialty').value = '';
            
            toggleEmailMode();
            
            currentUser = {
                id: firebaseUser.uid,
                ...userData
            };
            
            localStorage.setItem('muf_user', JSON.stringify(currentUser));
            await loadAllData();
            showMainApp();
            
            showToast(`مرحباً ${name}! تم إنشاء حسابك بنجاح`, 'success');
        }
        
    } catch (error) {
        console.error('❌ خطأ في مصادقة البريد الإلكتروني:', error);
        
        let errorMessage = 'حدث خطأ أثناء المصادقة';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'بريد إلكتروني غير صالح';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة جداً';
                break;
            case 'auth/user-not-found':
                errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'خطأ في الاتصال بالشبكة';
                break;
        }
        
        showToast(errorMessage, 'error');
        
    } finally {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        hideLoadingBar();
    }
}

// تسجيل الدخول بحساب جوجل
async function handleGoogleLogin() {
    try {
        showLoadingBar();
        
        if (!auth) {
            if (!initializeFirebase()) {
                throw new Error('فشل تهيئة Firebase');
            }
        }
        
        console.log('🔐 بدء تسجيل الدخول بجوجل...');
        
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        console.log('✅ تسجيل دخول جوجل ناجح:', user.email);
        
        hideLoadingBar();
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول بجوجل:', error);
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
            case 'auth/popup-blocked':
                errorMessage = 'تم حظر النافذة المنبثقة، يرجى السماح بالنوافذ المنبثقة';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'خطأ في الاتصال بالشبكة';
                break;
        }
        
        showToast(errorMessage, 'error');
    }
}

// معالجة المستخدم المصادق
async function handleAuthenticatedUser(firebaseUser) {
    try {
        showLoadingBar();
        console.log('👤 معالجة مستخدم مصادق:', firebaseUser.email);
        
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            if (userData.isBanned) {
                await auth.signOut();
                showToast('هذا الحساب محظور من قبل المدير', 'error');
                return;
            }
            
            currentUser = {
                id: firebaseUser.uid,
                ...userData,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                photoURL: firebaseUser.photoURL
            };
            
            await db.collection('users').doc(firebaseUser.uid).update({
                lastLogin: new Date().toISOString()
            });
            
        } else {
            const name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
            const provider = firebaseUser.providerData[0]?.providerId || 'unknown';
            
            const userData = {
                name: name,
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
            
            console.log('🆕 تم إنشاء مستخدم جديد من المصادقة:', currentUser);
        }
        
        localStorage.setItem('muf_user', JSON.stringify(currentUser));
        await loadAllData();
        showMainApp();
        
        showToast(`مرحباً ${currentUser.name}!`, 'success');
        
    } catch (error) {
        console.error('❌ خطأ في معالجة المستخدم المصادق:', error);
        showToast('حدث خطأ في تحميل بيانات المستخدم', 'error');
    } finally {
        hideLoadingBar();
    }
}

// ============================================
// إدارة البيانات
// ============================================

// تحميل جميع البيانات
async function loadAllData() {
    try {
        showLoadingBar();
        
        const collections = [
            'users', 'ideas', 'content', 'suggestions',
            'codes', 'quotes', 'messages', 'courses', 'comments'
        ];
        
        const promises = collections.map(collection => 
            db.collection(collection).get().catch(error => {
                console.error(`❌ Error loading ${collection}:`, error);
                return { docs: [] };
            })
        );
        
        const results = await Promise.all(promises);
        
        appData.users = results[0].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.ideas = results[1].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.content = results[2].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.suggestions = results[3].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.codes = results[4].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.quotes = results[5].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.messages = results[6].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.courses = results[7].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appData.comments = results[8].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setupRealtimeListeners();
        updateUI();
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showToast('خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoadingBar();
    }
}

// إعداد المستمعات في الوقت الحقيقي
function setupRealtimeListeners() {
    db.collection('users').onSnapshot((snapshot) => {
        appData.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (['members', 'home', 'settings'].includes(currentPage)) updateUI();
    }, (error) => console.error('Users listener error:', error));

    db.collection('ideas').onSnapshot((snapshot) => {
        appData.ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (['ideas', 'home', 'settings'].includes(currentPage)) updateUI();
    }, (error) => console.error('Ideas listener error:', error));

    db.collection('comments').onSnapshot((snapshot) => {
        appData.comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (['ideas', 'comments', 'home'].includes(currentPage)) updateUI();
        if (currentIdeaId && !document.getElementById('ideaDetailsModal').classList.contains('hidden')) {
            updateComments();
        }
    }, (error) => console.error('Comments listener error:', error));

    db.collection('quotes').onSnapshot((snapshot) => {
        appData.quotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (['quotes', 'home'].includes(currentPage)) updateUI();
    }, (error) => console.error('Quotes listener error:', error));

    db.collection('courses').onSnapshot((snapshot) => {
        appData.courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentPage === 'skills') updateUI();
    }, (error) => console.error('Courses listener error:', error));

    db.collection('messages').onSnapshot((snapshot) => {
        appData.messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (['messages', 'settings'].includes(currentPage)) updateUI();
        updateMessagesBadge();
    }, (error) => console.error('Messages listener error:', error));
}

// تحديث شارة الرسائل
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
// التنقل والواجهة
// ============================================

// تبديل القائمة الجانبية
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('sidebar-open');
    overlay.classList.toggle('active');
}

// تسجيل الخروج
async function handleLogout() {
    showConfirmModal('تسجيل الخروج', 'هل تريد تسجيل الخروج من حسابك؟', '🚪', async () => {
        try {
            showLoadingBar();
            
            if (currentUser?.authMethod === 'email' || currentUser?.authMethod === 'google.com') {
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
            console.error('❌ خطأ في تسجيل الخروج:', error);
            showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
        } finally {
            hideLoadingBar();
        }
    });
}

// عرض التطبيق الرئيسي
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
        const isRegular = currentUser.role === 'user';
        
        document.getElementById('adminMenuItems').classList.toggle('hidden', !isAdmin);
        document.getElementById('addIdeaBtn').classList.toggle('hidden', !(isAdmin || isPremium));
        document.getElementById('addQuoteBtn').classList.toggle('hidden', !(isAdmin || isPremium));
        document.getElementById('addCourseBtn').classList.toggle('hidden', !(isAdmin || isPremium));
        document.getElementById('userMessageButton').classList.toggle('hidden', !isRegular);
    }
    
    navigateTo('home');
}

// التنقل بين الصفحات
function navigateTo(page) {
    currentPage = page;
    
    if (window.innerWidth < 769) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('active');
    }
    
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.remove('hidden');
        
        document.querySelectorAll('.menu-item-advanced').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) activeItem.classList.add('active');
        
        updatePageContent(page);
    }
}

// تحديث محتوى الصفحة
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

// تحديث واجهة المستخدم
function updateUI() {
    updateGlobalStats();
    updatePageContent(currentPage);
}

// تحديث الإحصائيات العامة
function updateGlobalStats() {
    const activeIdeas = appData.ideas.filter(idea => !idea.deleted);
    document.getElementById('totalIdeas').textContent = activeIdeas.length;
    
    const totalViews = activeIdeas.reduce((sum, idea) => sum + (idea.views || 0), 0);
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    
    const activeMembers = appData.users.filter(user => !user.isBanned);
    document.getElementById('totalMembers').textContent = activeMembers.length;
    
    const totalComments = appData.comments.length;
    const totalLikes = appData.comments.reduce((sum, comment) => sum + (comment.likes || 0), 0);
    document.getElementById('totalInteractions').textContent = (totalComments + totalLikes).toLocaleString();
    
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
// دوال الأفكار
// ============================================

// فتح نافذة إضافة فكرة
function openAddIdeaModal() {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium')) {
        document.getElementById('addIdeaModal').classList.remove('hidden');
    } else {
        showToast('لا تملك صلاحية إضافة أفكار. قم بترقية حسابك أولاً.', 'error');
    }
}

// إضافة فكرة جديدة
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
        
        document.getElementById('newIdeaTitle').value = '';
        document.getElementById('newIdeaContent').value = '';
        closeModal('addIdeaModal');
        
        showToast('تمت إضافة الفكرة بنجاح!', 'success');
        
    } catch (error) {
        console.error('❌ Error adding idea:', error);
        showToast('حدث خطأ أثناء إضافة الفكرة', 'error');
    } finally {
        hideLoadingBar();
    }
}

// تصفية الأفكار
function filterIdeas(category) {
    currentFilter = category;
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === category);
    });
    renderIdeas();
}

// عرض الأفكار
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

// فتح تفاصيل الفكرة
async function openIdeaDetails(ideaId) {
    const idea = appData.ideas.find(i => i.id === ideaId);
    if (!idea) return;
    
    currentIdeaId = ideaId;
    
    if (!viewedIdeas.has(ideaId)) {
        viewedIdeas.add(ideaId);
        try {
            await db.collection('ideas').doc(ideaId).update({
                views: (idea.views || 0) + 1
            });
        } catch (error) {
            console.error('❌ Error updating views:', error);
        }
    }
    
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
    
    updateComments();
    document.getElementById('ideaDetailsModal').classList.remove('hidden');
}

// حذف الفكرة
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
            console.error('❌ Error deleting idea:', error);
            showToast('خطأ في حذف الفكرة', 'error');
        } finally {
            hideLoadingBar();
        }
    });
}

// ============================================
// دوال التعليقات
// ============================================

// تحديث التعليقات
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

// عرض تعليق
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

// إضافة تعليق جديد
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
        
        document.getElementById('newCommentText').value = '';
        replyingToCommentId = null;
        
        showToast('تمت إضافة التعليق بنجاح!', 'success');
        updateComments();
        
    } catch (error) {
        console.error('❌ Error adding comment:', error);
        showToast('حدث خطأ أثناء إضافة التعليق', 'error');
    } finally {
        hideLoadingBar();
    }
}

// ضبط حالة الرد
function setReplyingTo(commentId, authorName) {
    replyingToCommentId = commentId;
    const textarea = document.getElementById('newCommentText');
    textarea.value = `@${authorName} `;
    textarea.focus();
    showToast(`جارٍ الرد على ${authorName}...`, 'info');
}

// تفعيل/إلغاء الإعجاب
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
            const newLikedBy = likedBy.filter(id => id !== currentUser.id);
            await db.collection('comments').doc(commentId).update({
                likes: (comment.likes || 1) - 1,
                likedBy: newLikedBy
            });
            showToast('تم إزالة الإعجاب', 'info');
        } else {
            likedBy.push(currentUser.id);
            await db.collection('comments').doc(commentId).update({
                likes: (comment.likes || 0) + 1,
                likedBy: likedBy
            });
            showToast('تم الإعجاب بالتعليق!', 'success');
        }
    } catch (error) {
        console.error('❌ Error toggling like:', error);
        showToast('حدث خطأ أثناء الإعجاب', 'error');
    }
}

// حذف التعليق
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
            console.error('❌ Error deleting comment:', error);
            showToast('خطأ في حذف التعليق', 'error');
        } finally {
            hideLoadingBar();
        }
    });
}

// تمييز/إلغاء تمييز التعليق
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
        console.error('❌ Error toggling best comment:', error);
        showToast('خطأ في تحديث التعليق', 'error');
    } finally {
        hideLoadingBar();
    }
}

// ============================================
// دوال الصفحات الأخرى
// ============================================

// تحديث الصفحة الرئيسية
function updateHomePage() {
    const quotes = [...appData.quotes, ...DEFAULT_QUOTES];
    if (quotes.length > 0) {
        const today = new Date().getDate();
        const quoteIndex = today % quotes.length;
        const quote = quotes[quoteIndex];
        document.getElementById('quoteOfDay').textContent = `"${quote.text}"`;
        document.getElementById('quoteAuthor').textContent = `- ${quote.author}`;
    }
    
    updateLatestIdeas();
}

// تحديث أحدث الأفكار
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

// معالجة تغيير حجم النافذة
function handleWindowResize() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth >= 769) {
        if (menuToggle) menuToggle.classList.add('hidden');
        if (sidebar) sidebar.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
    } else {
        if (menuToggle) menuToggle.classList.remove('hidden');
    }
}

// تهيئة التطبيق
async function initApp() {
    try {
        console.log('🚀 بدء تهيئة التطبيق...');
        
        if (!initializeFirebase()) {
            throw new Error('فشل تهيئة Firebase');
        }
        
        auth.onAuthStateChanged(async (user) => {
            console.log('🔄 تغيير حالة المصادقة:', user ? 'مستخدم مسجل' : 'لا يوجد مستخدم');
            
            if (user) {
                await handleAuthenticatedUser(user);
            } else {
                const savedUser = localStorage.getItem('muf_user');
                if (savedUser && !currentUser) {
                    try {
                        currentUser = JSON.parse(savedUser);
                        console.log('📂 تحميل مستخدم محفوظ:', currentUser.name);
                        await loadAllData();
                        showMainApp();
                    } catch (e) {
                        console.error('❌ خطأ في تحميل المستخدم المحفوظ:', e);
                        localStorage.removeItem('muf_user');
                    }
                }
            }
        });
        
        const savedUser = localStorage.getItem('muf_user');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                console.log('📂 مستخدم محفوظ موجود:', currentUser.name);
                
                if (currentUser.authMethod === 'traditional') {
                    await loadAllData();
                    showMainApp();
                }
            } catch (e) {
                console.error('❌ خطأ في تحميل المستخدم المحفوظ:', e);
                localStorage.removeItem('muf_user');
            }
        }
        
        renderQuotes();
        
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle && window.innerWidth < 769) {
            menuToggle.classList.remove('hidden');
            menuToggle.addEventListener('click', toggleSidebar);
        }
        
        window.addEventListener('resize', handleWindowResize);
        
        console.log('✅ تم تهيئة التطبيق بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
        showToast('خطأ في تهيئة التطبيق، يرجى تحديث الصفحة', 'error');
    }
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 تم تحميل DOM، بدء التطبيق...');
    initApp();
});
</script>