// ============================================
// ملف JavaScript الرئيسي لمتحف الفكر
// يحتوي على جميع الوظائف المطلوبة
// ============================================

// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC8E6o4xX9q3Lw7jT1XqKX7K9L2M1N3O4P5Q",
    authDomain: "thought-museum.firebaseapp.com",
    projectId: "thought-museum",
    storageBucket: "thought-museum.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// تهيئة Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
    console.log("Firebase already initialized");
}

const auth = firebase.auth();
const db = firebase.firestore();

// حالة التطبيق
let currentUser = null;
let currentPage = 'home';
let allIdeas = [];
let allComments = [];
let allQuotes = [];
let allCourses = [];
let allMembers = [];
let allMessages = [];
let allCodes = [];

// تهيئة المستخدمين المدراء (يمكن تغييرها في الإعدادات)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
    checkAuthState();
});

// تهيئة التطبيق
function initApp() {
    // تعيين الحدث على حقل البحث
    document.getElementById('searchIdeasInput')?.addEventListener('input', searchIdeas);
    document.getElementById('searchCommentsInput')?.addEventListener('input', searchComments);
    document.getElementById('searchQuotesInput')?.addEventListener('input', searchQuotes);
    document.getElementById('searchCoursesInput')?.addEventListener('input', searchCourses);
    document.getElementById('searchMembersInput')?.addEventListener('input', searchMembers);
    
    // تهيئة بيانات أولية إذا لم تكن موجودة
    initializeDefaultData();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // مستمع لحقل البحث
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            // البحث في الصفحة الحالية
            if (currentPage === 'ideas') searchIdeas();
            else if (currentPage === 'comments') searchComments();
            else if (currentPage === 'quotes') searchQuotes();
            else if (currentPage === 'skills') searchCourses();
            else if (currentPage === 'members') searchMembers();
        }
    });
}

// التحقق من حالة المصادقة
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // المستخدم مسجل الدخول
            handleUserLogin(user);
        } else {
            // المستخدم غير مسجل
            showLoginScreen();
        }
    });
}

// ============================================
// نظام المصادقة
// ============================================

// تبديل تبويبات المصادقة
function switchAuthTab(tab) {
    // إزالة النشاط من جميع الألسنة
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // إخفاء جميع النماذج
    document.getElementById('traditionalLogin').classList.add('hidden');
    document.getElementById('emailLogin').classList.add('hidden');
    document.getElementById('adminLogin').classList.add('hidden');
    
    // إضافة النشاط للسان المحدد وعرض النموذج المناسب
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
    document.getElementById(`${tab}Login`).classList.remove('hidden');
}

// تسجيل الدخول التقليدي
async function handleTraditionalLogin() {
    const name = document.getElementById('loginName').value.trim();
    const specialty = document.getElementById('loginSpecialty').value.trim();
    
    if (!name) {
        showToast('يرجى إدخال اسم المستخدم', 'error');
        return;
    }
    
    const btn = document.getElementById('traditionalLoginBtnText');
    const spinner = document.getElementById('traditionalLoginSpinner');
    
    btn.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    try {
        // التحقق من رمز الترقية
        let role = 'user';
        let points = 0;
        
        if (specialty) {
            // التحقق إذا كان الرمز صحيحاً
            const codeDoc = await db.collection('codes').where('code', '==', specialty).get();
            if (!codeDoc.empty) {
                const codeData = codeDoc.docs[0].data();
                if (codeData.active && !codeData.used) {
                    role = 'premium';
                    points = 10; // نقاط بدائية للمستخدم المميز
                    
                    // تحديث حالة الرمز
                    await db.collection('codes').doc(codeDoc.docs[0].id).update({
                        used: true,
                        usedBy: name,
                        usedAt: new Date().toISOString()
                    });
                    
                    showToast('تم تفعيل العضوية المميزة بنجاح!', 'success');
                }
            }
        }
        
        // إنشاء معرف فريد للمستخدم
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // حفظ بيانات المستخدم
        const userData = {
            id: userId,
            name: name,
            specialty: specialty || 'غير محدد',
            role: role,
            points: points,
            level: 1,
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            ideasCount: 0,
            commentsCount: 0,
            likesCount: 0,
            avatar: getAvatarFromName(name)
        };
        
        await db.collection('users').doc(userId).set(userData);
        
        // تعيين المستخدم الحالي
        currentUser = {
            uid: userId,
            ...userData
        };
        
        showMainApp();
        loadDashboardData();
        
        showToast(`مرحباً ${name}!`, 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
    } finally {
        btn.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// تسجيل الدخول بالبريد الإلكتروني
function handleEmailAuth() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const isRegisterMode = document.getElementById('registerFields').classList.contains('hidden');
    
    const btn = document.getElementById('emailAuthBtnText');
    const spinner = document.getElementById('emailAuthSpinner');
    
    btn.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    if (isRegisterMode) {
        // تسجيل الدخول
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return handleUserLogin(userCredential.user);
            })
            .catch((error) => {
                console.error('Login error:', error);
                showToast('خطأ في تسجيل الدخول: ' + error.message, 'error');
            })
            .finally(() => {
                btn.classList.remove('hidden');
                spinner.classList.add('hidden');
            });
    } else {
        // إنشاء حساب جديد
        const name = document.getElementById('registerName').value.trim();
        const specialty = document.getElementById('registerSpecialty').value.trim();
        
        if (!name) {
            showToast('يرجى إدخال اسم المستخدم', 'error');
            btn.classList.remove('hidden');
            spinner.classList.add('hidden');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const userId = userCredential.user.uid;
                
                const userData = {
                    id: userId,
                    name: name,
                    email: email,
                    specialty: specialty || 'غير محدد',
                    role: 'user',
                    points: 0,
                    level: 1,
                    joinDate: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    ideasCount: 0,
                    commentsCount: 0,
                    likesCount: 0,
                    avatar: getAvatarFromName(name)
                };
                
                return db.collection('users').doc(userId).set(userData);
            })
            .then(() => {
                showToast('تم إنشاء الحساب بنجاح!', 'success');
                toggleEmailMode(); // العودة إلى وضع تسجيل الدخول
            })
            .catch((error) => {
                console.error('Registration error:', error);
                showToast('خطأ في إنشاء الحساب: ' + error.message, 'error');
            })
            .finally(() => {
                btn.classList.remove('hidden');
                spinner.classList.add('hidden');
            });
    }
}

// تسجيل الدخول كمدير
async function handleAdminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    
    if (!username || !password) {
        showToast('يرجى إدخال بيانات المدير', 'error');
        return;
    }
    
    const btn = document.getElementById('adminLoginBtnText');
    const spinner = document.getElementById('adminLoginSpinner');
    
    btn.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    try {
        // التحقق من بيانات المدير
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            const userId = `admin_${Date.now()}`;
            
            const userData = {
                id: userId,
                name: 'مدير النظام',
                role: 'admin',
                points: 0,
                level: 100,
                joinDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                ideasCount: 0,
                commentsCount: 0,
                likesCount: 0,
                avatar: '👑'
            };
            
            await db.collection('users').doc(userId).set(userData);
            
            currentUser = {
                uid: userId,
                ...userData
            };
            
            showMainApp();
            loadDashboardData();
            
            showToast('مرحباً أيها المدير!', 'success');
        } else {
            showToast('بيانات المدير غير صحيحة', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showToast('حدث خطأ أثناء تسجيل الدخول', 'error');
    } finally {
        btn.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// تسجيل الدخول بحساب جوجل
function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            return handleUserLogin(result.user);
        })
        .catch((error) => {
            console.error('Google login error:', error);
            showToast('خطأ في تسجيل الدخول بحساب جوجل', 'error');
        });
}

// تبديل وضع البريد الإلكتروني (تسجيل دخول/إنشاء حساب)
function toggleEmailMode() {
    const loginFields = document.getElementById('emailLoginFields');
    const registerFields = document.getElementById('registerFields');
    const toggleText = document.getElementById('emailToggleText');
    const authBtnText = document.getElementById('emailAuthBtnText');
    
    if (registerFields.classList.contains('hidden')) {
        // الانتقال إلى وضع إنشاء حساب
        loginFields.classList.add('hidden');
        registerFields.classList.remove('hidden');
        toggleText.textContent = 'تسجيل الدخول';
        authBtnText.textContent = 'إنشاء حساب';
    } else {
        // الانتقال إلى وضع تسجيل الدخول
        registerFields.classList.add('hidden');
        loginFields.classList.remove('hidden');
        toggleText.textContent = 'إنشاء حساب جديد';
        authBtnText.textContent = 'تسجيل الدخول';
    }
}

// معالجة تسجيل دخول المستخدم
async function handleUserLogin(user) {
    try {
        // التحقق إذا كان المستخدم موجوداً في قاعدة البيانات
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            // تحديث آخر دخول
            await db.collection('users').doc(user.uid).update({
                lastLogin: new Date().toISOString()
            });
            
            currentUser = {
                uid: user.uid,
                ...userDoc.data()
            };
        } else {
            // إنشاء مستخدم جديد إذا لم يكن موجوداً
            const userData = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                specialty: 'غير محدد',
                role: 'user',
                points: 0,
                level: 1,
                joinDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                ideasCount: 0,
                commentsCount: 0,
                likesCount: 0,
                avatar: getAvatarFromName(user.displayName || user.email)
            };
            
            await db.collection('users').doc(user.uid).set(userData);
            
            currentUser = {
                uid: user.uid,
                ...userData
            };
        }
        
        showMainApp();
        loadDashboardData();
        
        showToast(`مرحباً ${currentUser.name}!`, 'success');
        
    } catch (error) {
        console.error('Error handling user login:', error);
        showToast('حدث خطأ أثناء تحميل بيانات المستخدم', 'error');
    }
}

// تسجيل الخروج
function handleLogout() {
    auth.signOut()
        .then(() => {
            currentUser = null;
            showLoginScreen();
            showToast('تم تسجيل الخروج بنجاح', 'success');
        })
        .catch((error) => {
            console.error('Logout error:', error);
            showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
        });
}

// ============================================
// العرض والتنقل
// ============================================

// عرض شاشة تسجيل الدخول
function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('menuToggle').classList.add('hidden');
    
    // إعادة تعيين حقول تسجيل الدخول
    document.getElementById('loginName').value = '';
    document.getElementById('loginSpecialty').value = '';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

// عرض التطبيق الرئيسي
function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // تحديث معلومات المستخدم في الشريط الجانبي
    updateUserInfo();
    
    // إظهار/إخفاء أزرار الإضافة بناءً على الصلاحيات
    updateAddButtons();
    
    // تحديث القائمة الجانبية بناءً على دور المستخدم
    updateSidebar();
    
    // إظهار زر القائمة على الهاتف
    if (window.innerWidth <= 768) {
        document.getElementById('menuToggle').classList.remove('hidden');
    }
}

// تحديث معلومات المستخدم في الشريط الجانبي
function updateUserInfo() {
    if (!currentUser) return;
    
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserSpecialty').textContent = currentUser.specialty;
    document.getElementById('userAvatar').textContent = currentUser.avatar;
    document.getElementById('userRoleDisplay').textContent = getRoleDisplay(currentUser.role);
    document.getElementById('welcomeName').textContent = currentUser.name;
    
    // تحديث حالة المستخدم
    const userStatus = document.getElementById('userStatus');
    let statusText = '';
    let statusColor = '';
    
    switch (currentUser.role) {
        case 'admin':
            statusText = '👑 مدير النظام';
            statusColor = 'text-yellow-400';
            break;
        case 'premium':
            statusText = '💡 عضو مميز';
            statusColor = 'text-purple-400';
            break;
        default:
            statusText = '👤 عضو عادي';
            statusColor = 'text-blue-400';
    }
    
    userStatus.innerHTML = `<span class="${statusColor}">${statusText}</span>`;
}

// تحديث أزرار الإضافة بناءً على الصلاحيات
function updateAddButtons() {
    const addIdeaBtn = document.getElementById('addIdeaBtn');
    const addQuoteBtn = document.getElementById('addQuoteBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');
    
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'premium')) {
        addIdeaBtn?.classList.remove('hidden');
        addQuoteBtn?.classList.remove('hidden');
        addCourseBtn?.classList.remove('hidden');
    } else {
        addIdeaBtn?.classList.add('hidden');
        addQuoteBtn?.classList.add('hidden');
        addCourseBtn?.classList.add('hidden');
    }
}

// تحديث القائمة الجانبية بناءً على دور المستخدم
function updateSidebar() {
    const adminMenuItems = document.getElementById('adminMenuItems');
    
    if (currentUser && currentUser.role === 'admin') {
        adminMenuItems.classList.remove('hidden');
    } else {
        adminMenuItems.classList.add('hidden');
    }
}

// التنقل بين الصفحات
function navigateTo(page) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page-content').forEach(p => {
        p.classList.add('hidden');
    });
    
    // إزالة النشاط من جميع عناصر القائمة الجانبية
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // إضافة النشاط للعنصر الحالي
    const activeItem = document.querySelector(`.sidebar-item[data-page="${page}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // عرض الصفحة المحددة
    document.getElementById(`${page}Page`).classList.remove('hidden');
    currentPage = page;
    
    // تحميل بيانات الصفحة
    loadPageData(page);
    
    // إغلاق القائمة الجانبية على الهاتف
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

// تحميل بيانات الصفحة
function loadPageData(page) {
    switch (page) {
        case 'home':
            loadDashboardData();
            break;
        case 'ideas':
            loadIdeas();
            break;
        case 'comments':
            loadAllComments();
            break;
        case 'quotes':
            loadQuotes();
            break;
        case 'skills':
            loadCourses();
            break;
        case 'members':
            if (currentUser?.role === 'admin') loadMembers();
            break;
        case 'messages':
            if (currentUser?.role === 'admin') loadMessages();
            break;
        case 'codes':
            if (currentUser?.role === 'admin') loadCodes();
            break;
        case 'analytics':
            if (currentUser?.role === 'admin') loadAnalytics();
            break;
        case 'suggestions':
            loadSuggestions();
            break;
        case 'about':
            // لا تحتاج لتحميل بيانات
            break;
    }
}

// تحميل بيانات لوحة التحكم
async function loadDashboardData() {
    try {
        // تحميل الإحصائيات
        const ideasSnapshot = await db.collection('ideas').get();
        const usersSnapshot = await db.collection('users').get();
        const commentsSnapshot = await db.collection('comments').get();
        
        const totalIdeas = ideasSnapshot.size;
        const totalMembers = usersSnapshot.size;
        const totalComments = commentsSnapshot.size;
        
        // حساب المشاهدات الكلية
        let totalViews = 0;
        ideasSnapshot.forEach(doc => {
            const idea = doc.data();
            totalViews += idea.views || 0;
        });
        
        // حساب التفاعلات الكلية
        let totalInteractions = totalComments;
        ideasSnapshot.forEach(doc => {
            const idea = doc.data();
            totalInteractions += idea.likes?.length || 0;
        });
        
        // تحديث الإحصائيات
        document.getElementById('totalIdeas').textContent = totalIdeas;
        document.getElementById('totalViews').textContent = totalViews;
        document.getElementById('totalMembers').textContent = totalMembers;
        document.getElementById('totalInteractions').textContent = totalInteractions;
        
        // تحميل أحدث الأفكار
        loadLatestIdeas();
        
        // تحميل عبارة اليوم
        loadQuoteOfTheDay();
        
        // تحميل أفضل التعليقات
        loadTopComments();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// ============================================
// نظام الأفكار
// ============================================

// فتح نافذة إضافة فكرة
function openAddIdeaModal() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'premium')) {
        showToast('غير مصرح لك بإضافة أفكار', 'error');
        return;
    }
    
    // إظهار/إخفاء حقل النقاط للمديرين فقط
    const pointsField = document.getElementById('ideaPointsField');
    if (currentUser.role === 'admin') {
        pointsField.classList.remove('hidden');
    } else {
        pointsField.classList.add('hidden');
    }
    
    openModal('addIdeaModal');
}

// إضافة فكرة جديدة
async function submitNewIdea() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'premium')) {
        showToast('غير مصرح لك بإضافة أفكار', 'error');
        return;
    }
    
    const title = document.getElementById('newIdeaTitle').value.trim();
    const category = document.getElementById('newIdeaCategory').value;
    const content = document.getElementById('newIdeaContent').value.trim();
    const points = document.getElementById('newIdeaPoints')?.value || 0;
    
    if (!title || !content) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    try {
        const ideaId = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const ideaData = {
            id: ideaId,
            title: title,
            content: content,
            category: category,
            authorId: currentUser.uid,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            createdAt: new Date().toISOString(),
            views: 0,
            likes: [],
            commentsCount: 0,
            points: currentUser.role === 'admin' ? parseInt(points) || 5 : 5,
            featured: false,
            active: true
        };
        
        await db.collection('ideas').doc(ideaId).set(ideaData);
        
        // تحديث عدد أفكار المستخدم
        await db.collection('users').doc(currentUser.uid).update({
            ideasCount: firebase.firestore.FieldValue.increment(1),
            points: firebase.firestore.FieldValue.increment(5)
        });
        
        // إعادة تحميل الأفكار
        loadIdeas();
        loadLatestIdeas();
        
        closeModal('addIdeaModal');
        showToast('تم إضافة الفكرة بنجاح!', 'success');
        
        // مسح حقول النموذج
        document.getElementById('newIdeaTitle').value = '';
        document.getElementById('newIdeaContent').value = '';
        
    } catch (error) {
        console.error('Error adding idea:', error);
        showToast('حدث خطأ أثناء إضافة الفكرة', 'error');
    }
}

// تحميل الأفكار
async function loadIdeas() {
    try {
        const ideasGrid = document.getElementById('ideasGrid');
        ideasGrid.innerHTML = '<div class="glass-card rounded-xl p-6 text-center text-gray-400 col-span-full"><p class="text-5xl mb-4">⏳</p><p>جاري تحميل الأفكار...</p></div>';
        
        const snapshot = await db.collection('ideas')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        allIdeas = [];
        snapshot.forEach(doc => {
            allIdeas.push(doc.data());
        });
        
        renderIdeas(allIdeas);
        
    } catch (error) {
        console.error('Error loading ideas:', error);
        document.getElementById('ideasGrid').innerHTML = '<div class="glass-card rounded-xl p-6 text-center text-gray-400 col-span-full"><p class="text-5xl mb-4">❌</p><p>حدث خطأ في تحميل الأفكار</p></div>';
    }
}

// عرض الأفكار
function renderIdeas(ideas) {
    const ideasGrid = document.getElementById('ideasGrid');
    
    if (ideas.length === 0) {
        ideasGrid.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400 col-span-full">
                <p class="text-5xl mb-4">💭</p>
                <p>لا توجد أفكار حتى الآن</p>
                <p class="text-sm mt-2">كن أول من يشارك فكرة!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    ideas.forEach(idea => {
        const isLiked = idea.likes?.includes(currentUser?.uid);
        const likesCount = idea.likes?.length || 0;
        const viewsCount = idea.views || 0;
        
        html += `
            <div class="idea-card glass-card rounded-xl p-6 card-hover" onclick="openIdeaDetails('${idea.id}')">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-lg">
                            ${idea.authorAvatar || '👤'}
                        </div>
                        <div>
                            <p class="font-bold">${idea.authorName}</p>
                            <p class="text-xs text-gray-400">${formatDate(idea.createdAt)}</p>
                        </div>
                    </div>
                    <span class="category-tag px-3 py-1 rounded-full text-sm">${idea.category}</span>
                </div>
                
                <h3 class="text-lg font-bold mb-3">${idea.title}</h3>
                <p class="text-gray-300 mb-4 line-clamp-3">${idea.content.substring(0, 150)}...</p>
                
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div class="flex items-center gap-4">
                        <button onclick="event.stopPropagation(); toggleLike('${idea.id}')" class="flex items-center gap-1 ${isLiked ? 'text-pink-400' : 'text-gray-400'} hover:text-pink-300">
                            <span>${isLiked ? '❤️' : '🤍'}</span>
                            <span>${likesCount}</span>
                        </button>
                        <button onclick="event.stopPropagation(); openIdeaDetails('${idea.id}')" class="flex items-center gap-1 text-gray-400 hover:text-blue-300">
                            <span>💬</span>
                            <span>${idea.commentsCount || 0}</span>
                        </button>
                        <div class="flex items-center gap-1 text-gray-400">
                            <span>👁️</span>
                            <span>${viewsCount}</span>
                        </div>
                    </div>
                    <div class="text-yellow-400 flex items-center gap-1">
                        <span>⭐</span>
                        <span>${idea.points || 0}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    ideasGrid.innerHTML = html;
}

// تحميل أحدث الأفكار
async function loadLatestIdeas() {
    try {
        const snapshot = await db.collection('ideas')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();
        
        const latestIdeas = [];
        snapshot.forEach(doc => {
            latestIdeas.push(doc.data());
        });
        
        renderLatestIdeas(latestIdeas);
        
    } catch (error) {
        console.error('Error loading latest ideas:', error);
    }
}

// عرض أحدث الأفكار
function renderLatestIdeas(ideas) {
    const grid = document.getElementById('latestIdeasGrid');
    
    if (ideas.length === 0) {
        grid.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400">
                <p>لا توجد أفكار حتى الآن</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    ideas.forEach(idea => {
        html += `
            <div class="glass-card rounded-xl p-6 card-hover" onclick="openIdeaDetails('${idea.id}')">
                <h4 class="font-bold mb-2">${idea.title}</h4>
                <p class="text-sm text-gray-400 mb-3">${idea.category}</p>
                <p class="text-sm text-gray-300 line-clamp-2 mb-3">${idea.content.substring(0, 100)}...</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">${formatDate(idea.createdAt)}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-pink-400">❤️ ${idea.likes?.length || 0}</span>
                        <span class="text-blue-400">💬 ${idea.commentsCount || 0}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// فتح تفاصيل الفكرة
async function openIdeaDetails(ideaId) {
    try {
        const doc = await db.collection('ideas').doc(ideaId).get();
        
        if (!doc.exists) {
            showToast('الفكرة غير موجودة', 'error');
            return;
        }
        
        const idea = doc.data();
        
        // زيادة عدد المشاهدات
        await db.collection('ideas').doc(ideaId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
        
        // تحديث الفكرة بالمشاهدات الجديدة
        idea.views = (idea.views || 0) + 1;
        
        // عرض تفاصيل الفكرة
        document.getElementById('ideaDetailsTitle').textContent = idea.title;
        
        const contentDiv = document.getElementById('ideaDetailsContent');
        contentDiv.innerHTML = `
            <div class="glass-card rounded-xl p-6 mb-4">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-xl">
                        ${idea.authorAvatar || '👤'}
                    </div>
                    <div>
                        <p class="font-bold">${idea.authorName}</p>
                        <p class="text-sm text-gray-400">${formatDate(idea.createdAt)} • ${idea.category}</p>
                    </div>
                </div>
                
                <h3 class="text-xl font-bold mb-3 text-pink-300">${idea.title}</h3>
                <div class="prose prose-invert max-w-none">
                    <p class="text-gray-300 leading-relaxed whitespace-pre-line">${idea.content}</p>
                </div>
            </div>
        `;
        
        // عرض إحصائيات الفكرة
        const statsDiv = document.getElementById('ideaStats');
        statsDiv.classList.remove('hidden');
        document.getElementById('ideaViews').textContent = idea.views || 0;
        document.getElementById('ideaLikes').textContent = idea.likes?.length || 0;
        document.getElementById('ideaCommentsCount').textContent = idea.commentsCount || 0;
        document.getElementById('ideaPoints').textContent = idea.points || 0;
        
        // عرض أزرار الإدارة للمديرين
        const adminActions = document.getElementById('ideaAdminActions');
        if (currentUser?.role === 'admin') {
            adminActions.classList.remove('hidden');
            adminActions.innerHTML = `
                <div class="flex gap-2">
                    <button onclick="deleteIdea('${ideaId}')" class="btn-danger px-4 py-2 rounded-xl">🗑️ حذف الفكرة</button>
                    <button onclick="markAsFeatured('${ideaId}')" class="btn-secondary px-4 py-2 rounded-xl">
                        ${idea.featured ? '⭐ إلغاء التميز' : '⭐ تمييز الفكرة'}
                    </button>
                </div>
            `;
        } else {
            adminActions.classList.add('hidden');
        }
        
        // تحميل التعليقات
        await loadComments(ideaId);
        
        // تعيين معرف الفكرة في نافذة التعليقات
        document.getElementById('newCommentText').dataset.ideaId = ideaId;
        
        // فتح النافذة
        openModal('ideaDetailsModal');
        
    } catch (error) {
        console.error('Error opening idea details:', error);
        showToast('حدث خطأ في تحميل الفكرة', 'error');
    }
}

// تصفية الأفكار
function filterIdeas(category) {
    // تحديث أزرار الفلتر
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filteredIdeas = allIdeas;
    
    if (category !== 'all') {
        filteredIdeas = allIdeas.filter(idea => idea.category === category);
    }
    
    renderIdeas(filteredIdeas);
}

// البحث في الأفكار
function searchIdeas() {
    const searchTerm = document.getElementById('searchIdeasInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderIdeas(allIdeas);
        return;
    }
    
    const filtered = allIdeas.filter(idea => 
        idea.title.toLowerCase().includes(searchTerm) || 
        idea.content.toLowerCase().includes(searchTerm) ||
        idea.category.toLowerCase().includes(searchTerm) ||
        idea.authorName.toLowerCase().includes(searchTerm)
    );
    
    renderIdeas(filtered);
}

// الإعجاب/عدم الإعجاب بالفكرة
async function toggleLike(ideaId) {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول للإعجاب', 'error');
        return;
    }
    
    try {
        const doc = await db.collection('ideas').doc(ideaId).get();
        const idea = doc.data();
        
        if (!idea) return;
        
        const likes = idea.likes || [];
        const userIndex = likes.indexOf(currentUser.uid);
        
        if (userIndex > -1) {
            // إزالة الإعجاب
            likes.splice(userIndex, 1);
        } else {
            // إضافة الإعجاب
            likes.push(currentUser.uid);
        }
        
        await db.collection('ideas').doc(ideaId).update({
            likes: likes
        });
        
        // تحديث عدد إعجابات المستخدم
        if (userIndex > -1) {
            // تم إزالة الإعجاب
            await db.collection('users').doc(idea.authorId).update({
                likesCount: firebase.firestore.FieldValue.increment(-1)
            });
        } else {
            // تمت إضافة الإعجاب
            await db.collection('users').doc(idea.authorId).update({
                likesCount: firebase.firestore.FieldValue.increment(1)
            });
        }
        
        // إعادة تحميل الأفكار
        if (currentPage === 'ideas') {
            loadIdeas();
        }
        
        // إعادة تحميل أحدث الأفكار
        loadLatestIdeas();
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showToast('حدث خطأ أثناء الإعجاب', 'error');
    }
}

// حذف الفكرة (للمديرين فقط)
async function deleteIdea(ideaId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بحذف الأفكار', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذه الفكرة؟')) return;
    
    try {
        // حذف الفكرة
        await db.collection('ideas').doc(ideaId).delete();
        
        // حذف جميع التعليقات المرتبطة بالفكرة
        const commentsSnapshot = await db.collection('comments').where('ideaId', '==', ideaId).get();
        const batch = db.batch();
        
        commentsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        closeModal('ideaDetailsModal');
        showToast('تم حذف الفكرة بنجاح', 'success');
        
        // إعادة تحميل الأفكار
        loadIdeas();
        loadLatestIdeas();
        
    } catch (error) {
        console.error('Error deleting idea:', error);
        showToast('حدث خطأ أثناء حذف الفكرة', 'error');
    }
}

// تمييز الفكرة (للمديرين فقط)
async function markAsFeatured(ideaId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بتمييز الأفكار', 'error');
        return;
    }
    
    try {
        const doc = await db.collection('ideas').doc(ideaId).get();
        const idea = doc.data();
        
        await db.collection('ideas').doc(ideaId).update({
            featured: !idea.featured
        });
        
        showToast(idea.featured ? 'تم إلغاء تمييز الفكرة' : 'تم تمييز الفكرة', 'success');
        
        // إعادة تحميل الفكرة
        openIdeaDetails(ideaId);
        
    } catch (error) {
        console.error('Error marking as featured:', error);
        showToast('حدث خطأ أثناء تمييز الفكرة', 'error');
    }
}

// ============================================
// نظام التعليقات
// ============================================

// تحميل التعليقات لفكرة محددة
async function loadComments(ideaId) {
    try {
        const snapshot = await db.collection('comments')
            .where('ideaId', '==', ideaId)
            .where('active', '==', true)
            .orderBy('createdAt', 'asc')
            .get();
        
        const comments = [];
        snapshot.forEach(doc => {
            comments.push(doc.data());
        });
        
        renderComments(comments);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('commentsList').innerHTML = '<p class="text-gray-400 text-center">حدث خطأ في تحميل التعليقات</p>';
    }
}

// عرض التعليقات
function renderComments(comments) {
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    
    commentsCount.textContent = comments.length;
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="text-gray-400 text-center">لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>';
        return;
    }
    
    let html = '';
    
    comments.forEach(comment => {
        const isLiked = comment.likes?.includes(currentUser?.uid);
        const likesCount = comment.likes?.length || 0;
        
        html += `
            <div class="comment-item glass-card rounded-xl p-4" data-comment-id="${comment.id}">
                <div class="flex items-start gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg">
                        ${comment.authorAvatar || '👤'}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <p class="font-bold">${comment.authorName}</p>
                            <span class="text-xs text-gray-400">${formatDate(comment.createdAt)}</span>
                        </div>
                        <p class="text-gray-300">${comment.content}</p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div class="flex items-center gap-4">
                        <button onclick="toggleCommentLike('${comment.id}')" class="flex items-center gap-1 ${isLiked ? 'text-pink-400' : 'text-gray-400'} hover:text-pink-300">
                            <span>${isLiked ? '❤️' : '🤍'}</span>
                            <span>${likesCount}</span>
                        </button>
                        <button onclick="replyToComment('${comment.id}', '${comment.authorName}')" class="text-gray-400 hover:text-blue-300 text-sm">
                            رد
                        </button>
                    </div>
                    
                    ${currentUser && (currentUser.role === 'admin' || currentUser.uid === comment.authorId) ? `
                        <button onclick="deleteComment('${comment.id}')" class="text-red-400 hover:text-red-300 text-sm">
                            حذف
                        </button>
                    ` : ''}
                </div>
                
                ${comment.featured ? `
                    <div class="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                        ⭐ تعليق مميز
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    commentsList.innerHTML = html;
}

// إضافة تعليق جديد
async function submitComment() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول لإضافة تعليق', 'error');
        return;
    }
    
    const commentText = document.getElementById('newCommentText').value.trim();
    const ideaId = document.getElementById('newCommentText').dataset.ideaId;
    
    if (!commentText) {
        showToast('يرجى كتابة تعليق', 'error');
        return;
    }
    
    if (!ideaId) {
        showToast('حدث خطأ في تحديد الفكرة', 'error');
        return;
    }
    
    try {
        const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const commentData = {
            id: commentId,
            ideaId: ideaId,
            content: commentText,
            authorId: currentUser.uid,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            createdAt: new Date().toISOString(),
            likes: [],
            replies: [],
            featured: false,
            active: true
        };
        
        await db.collection('comments').doc(commentId).set(commentData);
        
        // تحديث عدد تعليقات الفكرة
        await db.collection('ideas').doc(ideaId).update({
            commentsCount: firebase.firestore.FieldValue.increment(1)
        });
        
        // تحديث عدد تعليقات المستخدم
        await db.collection('users').doc(currentUser.uid).update({
            commentsCount: firebase.firestore.FieldValue.increment(1),
            points: firebase.firestore.FieldValue.increment(2)
        });
        
        // إعادة تحميل التعليقات
        await loadComments(ideaId);
        
        // مسح حقل التعليق
        document.getElementById('newCommentText').value = '';
        
        showToast('تم إضافة التعليق بنجاح', 'success');
        
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('حدث خطأ أثناء إضافة التعليق', 'error');
    }
}

// تحميل جميع التعليقات (لصفحة التعليقات)
async function loadAllComments() {
    try {
        const snapshot = await db.collection('comments')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        allComments = [];
        snapshot.forEach(doc => {
            allComments.push(doc.data());
        });
        
        renderAllComments(allComments);
        updateCommentsStats();
        
    } catch (error) {
        console.error('Error loading all comments:', error);
    }
}

// عرض جميع التعليقات
function renderAllComments(comments) {
    const container = document.getElementById('allCommentsList');
    
    if (comments.length === 0) {
        container.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400">
                <p>لا توجد تعليقات حتى الآن</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    comments.forEach(comment => {
        const isLiked = comment.likes?.includes(currentUser?.uid);
        const likesCount = comment.likes?.length || 0;
        
        html += `
            <div class="glass-card rounded-xl p-6">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                        ${comment.authorAvatar || '👤'}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                            <div>
                                <p class="font-bold">${comment.authorName}</p>
                                <p class="text-sm text-gray-400">${formatDate(comment.createdAt)}</p>
                            </div>
                            ${currentUser?.role === 'admin' ? `
                                <div class="flex gap-2">
                                    <button onclick="toggleCommentFeatured('${comment.id}')" class="text-xs ${comment.featured ? 'text-yellow-400' : 'text-gray-400'}">
                                        ${comment.featured ? '⭐ إلغاء التميز' : '⭐ تمييز'}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        
                        <p class="text-gray-300 mb-3">${comment.content}</p>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <button onclick="toggleCommentLike('${comment.id}')" class="flex items-center gap-1 ${isLiked ? 'text-pink-400' : 'text-gray-400'} hover:text-pink-300">
                                    <span>${isLiked ? '❤️' : '🤍'}</span>
                                    <span>${likesCount}</span>
                                </button>
                                <button onclick="openIdeaByComment('${comment.ideaId}')" class="text-blue-400 hover:text-blue-300 text-sm">
                                    عرض الفكرة
                                </button>
                            </div>
                            
                            ${currentUser && (currentUser.role === 'admin' || currentUser.uid === comment.authorId) ? `
                                <button onclick="deleteComment('${comment.id}')" class="text-red-400 hover:text-red-300 text-sm">
                                    حذف
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// تحديث إحصائيات التعليقات
function updateCommentsStats() {
    const totalComments = allComments.length;
    let totalLikes = 0;
    
    allComments.forEach(comment => {
        totalLikes += comment.likes?.length || 0;
    });
    
    const avgReplies = totalComments > 0 ? Math.round(totalLikes / totalComments) : 0;
    
    document.getElementById('totalComments').textContent = totalComments;
    document.getElementById('totalLikes').textContent = totalLikes;
    document.getElementById('avgReplies').textContent = avgReplies;
}

// تصفية التعليقات
function filterComments(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filteredComments = allComments;
    
    switch (filter) {
        case 'latest':
            // الأحدث (مسبقاً)
            break;
        case 'popular':
            // الأكثر شعبية (حسب الإعجابات)
            filteredComments.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
            break;
        case 'featured':
            // المميزة فقط
            filteredComments = allComments.filter(comment => comment.featured);
            break;
    }
    
    renderAllComments(filteredComments);
}

// البحث في التعليقات
function searchComments() {
    const searchTerm = document.getElementById('searchCommentsInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderAllComments(allComments);
        return;
    }
    
    const filtered = allComments.filter(comment => 
        comment.content.toLowerCase().includes(searchTerm) ||
        comment.authorName.toLowerCase().includes(searchTerm)
    );
    
    renderAllComments(filtered);
}

// الإعجاب/عدم الإعجاب بالتعليق
async function toggleCommentLike(commentId) {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول للإعجاب', 'error');
        return;
    }
    
    try {
        const doc = await db.collection('comments').doc(commentId).get();
        const comment = doc.data();
        
        if (!comment) return;
        
        const likes = comment.likes || [];
        const userIndex = likes.indexOf(currentUser.uid);
        
        if (userIndex > -1) {
            likes.splice(userIndex, 1);
        } else {
            likes.push(currentUser.uid);
        }
        
        await db.collection('comments').doc(commentId).update({
            likes: likes
        });
        
        // إعادة تحميل التعليقات
        if (document.getElementById('ideaDetailsModal').classList.contains('hidden')) {
            loadAllComments();
        } else {
            loadComments(comment.ideaId);
        }
        
    } catch (error) {
        console.error('Error toggling comment like:', error);
    }
}

// حذف التعليق
async function deleteComment(commentId) {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول', 'error');
        return;
    }
    
    try {
        const doc = await db.collection('comments').doc(commentId).get();
        const comment = doc.data();
        
        // التحقق من الصلاحيات
        if (currentUser.role !== 'admin' && currentUser.uid !== comment.authorId) {
            showToast('غير مصرح لك بحذف هذا التعليق', 'error');
            return;
        }
        
        if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
        
        await db.collection('comments').doc(commentId).update({
            active: false
        });
        
        // تحديث عدد تعليقات الفكرة
        await db.collection('ideas').doc(comment.ideaId).update({
            commentsCount: firebase.firestore.FieldValue.increment(-1)
        });
        
        // تحديث عدد تعليقات المستخدم
        await db.collection('users').doc(comment.authorId).update({
            commentsCount: firebase.firestore.FieldValue.increment(-1)
        });
        
        showToast('تم حذف التعليق بنجاح', 'success');
        
        // إعادة تحميل التعليقات
        if (document.getElementById('ideaDetailsModal').classList.contains('hidden')) {
            loadAllComments();
        } else {
            loadComments(comment.ideaId);
        }
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast('حدث خطأ أثناء حذف التعليق', 'error');
    }
}

// تمييز التعليق (للمديرين فقط)
async function toggleCommentFeatured(commentId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بتمييز التعليقات', 'error');
        return;
    }
    
    try {
        const doc = await db.collection('comments').doc(commentId).get();
        const comment = doc.data();
        
        await db.collection('comments').doc(commentId).update({
            featured: !comment.featured
        });
        
        showToast(comment.featured ? 'تم إلغاء تمييز التعليق' : 'تم تمييز التعليق', 'success');
        
        // إعادة تحميل التعليقات
        loadAllComments();
        
    } catch (error) {
        console.error('Error toggling comment featured:', error);
        showToast('حدث خطأ أثناء تمييز التعليق', 'error');
    }
}

// الرد على التعليق
function replyToComment(commentId, authorName) {
    const commentText = document.getElementById('newCommentText');
    commentText.value = `@${authorName} `;
    commentText.focus();
}

// فتح الفكرة المرتبطة بالتعليق
function openIdeaByComment(ideaId) {
    closeModal('ideaDetailsModal');
    openIdeaDetails(ideaId);
}

// تحميل أفضل التعليقات (للصفحة الرئيسية)
async function loadTopComments() {
    try {
        const snapshot = await db.collection('comments')
            .where('active', '==', true)
            .orderBy('likes', 'desc')
            .limit(5)
            .get();
        
        const topComments = [];
        snapshot.forEach(doc => {
            topComments.push(doc.data());
        });
        
        renderTopComments(topComments);
        
    } catch (error) {
        console.error('Error loading top comments:', error);
    }
}

// عرض أفضل التعليقات
function renderTopComments(comments) {
    const container = document.getElementById('topCommentsSection');
    
    if (comments.length === 0) return;
    
    let html = `
        <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">💬 أفضل التعليقات</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `;
    
    comments.forEach(comment => {
        html += `
            <div class="glass-card rounded-xl p-4">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        ${comment.authorAvatar || '👤'}
                    </div>
                    <div>
                        <p class="font-bold text-sm">${comment.authorName}</p>
                        <p class="text-xs text-gray-400">${comment.likes?.length || 0} ❤️</p>
                    </div>
                </div>
                <p class="text-sm text-gray-300 line-clamp-3">${comment.content}</p>
                <button onclick="openIdeaByComment('${comment.ideaId}')" class="text-blue-400 text-sm mt-2">عرض الفكرة →</button>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================
// نظام العبارات الملهمة
// ============================================

// فتح نافذة إضافة عبارة
function openAddQuoteModal() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'premium')) {
        showToast('غير مصرح لك بإضافة عبارات', 'error');
        return;
    }
    
    openModal('addQuoteModal');
}

// إضافة عبارة جديدة
async function submitNewQuote() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'premium')) {
        showToast('غير مصرح لك بإضافة عبارات', 'error');
        return;
    }
    
    const text = document.getElementById('newQuoteText').value.trim();
    const author = document.getElementById('newQuoteAuthor').value.trim();
    const category = document.getElementById('newQuoteCategory').value;
    
    if (!text) {
        showToast('يرجى كتابة نص العبارة', 'error');
        return;
    }
    
    try {
        const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const quoteData = {
            id: quoteId,
            text: text,
            author: author || 'مجهول',
            category: category,
            addedBy: currentUser.uid,
            addedByName: currentUser.name,
            createdAt: new Date().toISOString(),
            likes: 0,
            featured: false,
            active: true
        };
        
        await db.collection('quotes').doc(quoteId).set(quoteData);
        
        closeModal('addQuoteModal');
        showToast('تم إضافة العبارة بنجاح', 'success');
        
        // مسح حقول النموذج
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteAuthor').value = '';
        
        // إعادة تحميل العبارات
        loadQuotes();
        
    } catch (error) {
        console.error('Error adding quote:', error);
        showToast('حدث خطأ أثناء إضافة العبارة', 'error');
    }
}

// تحميل العبارات
async function loadQuotes() {
    try {
        const snapshot = await db.collection('quotes')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        allQuotes = [];
        snapshot.forEach(doc => {
            allQuotes.push(doc.data());
        });
        
        renderQuotes(allQuotes);
        
    } catch (error) {
        console.error('Error loading quotes:', error);
    }
}

// عرض العبارات
function renderQuotes(quotes) {
    const grid = document.getElementById('quotesGrid');
    
    if (quotes.length === 0) {
        grid.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400 col-span-full">
                <p class="text-5xl mb-4">✨</p>
                <p>لا توجد عبارات ملهمة حتى الآن</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    quotes.forEach(quote => {
        html += `
            <div class="quote-item glass-card rounded-xl p-6 card-hover">
                <div class="text-4xl mb-4 text-center">"</div>
                <p class="text-lg text-center font-amiri leading-relaxed mb-4">${quote.text}</p>
                <div class="text-center">
                    <p class="text-sm text-gray-400">— ${quote.author}</p>
                    <div class="flex items-center justify-center gap-2 mt-2">
                        <span class="text-xs text-gray-500">${quote.category}</span>
                        ${quote.featured ? '<span class="text-xs text-yellow-400">⭐</span>' : ''}
                    </div>
                </div>
                ${currentUser?.role === 'admin' ? `
                    <div class="flex gap-2 mt-4 justify-center">
                        <button onclick="deleteQuote('${quote.id}')" class="text-red-400 text-sm">حذف</button>
                        <button onclick="toggleQuoteFeatured('${quote.id}')" class="text-yellow-400 text-sm">
                            ${quote.featured ? 'إلغاء التميز' : 'تمييز'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// تحميل عبارة اليوم
async function loadQuoteOfTheDay() {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // محاولة الحصول على عبارة محددة لليوم
        let quoteDoc = await db.collection('quotes')
            .where('active', '==', true)
            .where('featured', '==', true)
            .limit(1)
            .get();
        
        let quote = null;
        
        if (!quoteDoc.empty) {
            quote = quoteDoc.docs[0].data();
        } else {
            // إذا لم توجد عبارة مميزة، خذ أحدث عبارة
            const allQuotes = await db.collection('quotes')
                .where('active', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            if (!allQuotes.empty) {
                quote = allQuotes.docs[0].data();
            }
        }
        
        // إذا لم توجد أي عبارات، استخدم العبارات الافتراضية
        if (!quote) {
            const defaultQuotes = [
                {
                    text: "الفكرة هي البذرة، والعقل هو التربة، والإبداع هو الثمرة",
                    author: "متحف الفكر"
                },
                {
                    text: "العقل الذي ينفتح على فكرة جديدة لن يعود أبداً إلى حجمه الأصلي",
                    author: "ألبرت أينشتاين"
                },
                {
                    text: "الإبداع هو الذكاء وهو يستمتع",
                    author: "ألبرت أينشتاين"
                }
            ];
            
            const randomIndex = Math.floor(Math.random() * defaultQuotes.length);
            quote = defaultQuotes[randomIndex];
        }
        
        document.getElementById('quoteOfDay').textContent = `"${quote.text}"`;
        document.getElementById('quoteAuthor').textContent = `- ${quote.author}`;
        
    } catch (error) {
        console.error('Error loading quote of the day:', error);
    }
}

// البحث في العبارات
function searchQuotes() {
    const searchTerm = document.getElementById('searchQuotesInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderQuotes(allQuotes);
        return;
    }
    
    const filtered = allQuotes.filter(quote => 
        quote.text.toLowerCase().includes(searchTerm) ||
        quote.author.toLowerCase().includes(searchTerm) ||
        quote.category.toLowerCase().includes(searchTerm)
    );
    
    renderQuotes(filtered);
}

// حذف العبارة (للمديرين فقط)
async function deleteQuote(quoteId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بحذف العبارات', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذه العبارة؟')) return;
    
    try {
        await db.collection('quotes').doc(quoteId).update({
            active: false
        });
        
        showToast('تم حذف العبارة بنجاح', 'success');
        loadQuotes();
        
    } catch (error) {
        console.error('Error deleting quote:', error);
        showToast('حدث خطأ أثناء حذف العبارة', 'error');
    }
}

// تمييز العبارة (للمديرين فقط)
async function toggleQuoteFeatured(quoteId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بتمييز العبارات', 'error');
        return;
    }
    
    try {
        const doc = await db.collection('quotes').doc(quoteId).get();
        const quote = doc.data();
        
        await db.collection('quotes').doc(quoteId).update({
            featured: !quote.featured
        });
        
        showToast(quote.featured ? 'تم إلغاء تمييز العبارة' : 'تم تمييز العبارة', 'success');
        loadQuotes();
        
    } catch (error) {
        console.error('Error toggling quote featured:', error);
        showToast('حدث خطأ أثناء تمييز العبارة', 'error');
    }
}

// ============================================
// نظام تطوير المهارات
// ============================================

// فتح نافذة إضافة مصدر تعليمي
function openAddCourseModal() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'premium')) {
        showToast('غير مصرح لك بإضافة مصادر تعليمية', 'error');
        return;
    }
    
    openModal('addCourseModal');
}

// إضافة مصدر تعليمي جديد
async function submitNewCourse() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'premium')) {
        showToast('غير مصرح لك بإضافة مصادر تعليمية', 'error');
        return;
    }
    
    const title = document.getElementById('newCourseTitle').value.trim();
    const type = document.getElementById('newCourseType').value;
    const description = document.getElementById('newCourseDescription').value.trim();
    const link = document.getElementById('newCourseLink').value.trim();
    const skill = document.getElementById('newCourseSkill').value.trim();
    
    if (!title || !description) {
        showToast('يرجى ملء الحقول المطلوبة', 'error');
        return;
    }
    
    try {
        const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const courseData = {
            id: courseId,
            title: title,
            type: type,
            description: description,
            link: link || '',
            skill: skill || 'عام',
            addedBy: currentUser.uid,
            addedByName: currentUser.name,
            createdAt: new Date().toISOString(),
            rating: 0,
            ratingsCount: 0,
            active: true
        };
        
        await db.collection('courses').doc(courseId).set(courseData);
        
        closeModal('addCourseModal');
        showToast('تم إضافة المصدر بنجاح', 'success');
        
        // مسح حقول النموذج
        document.getElementById('newCourseTitle').value = '';
        document.getElementById('newCourseDescription').value = '';
        document.getElementById('newCourseLink').value = '';
        document.getElementById('newCourseSkill').value = '';
        
        // إعادة تحميل المصادر
        loadCourses();
        
    } catch (error) {
        console.error('Error adding course:', error);
        showToast('حدث خطأ أثناء إضافة المصدر', 'error');
    }
}

// تحميل المصادر التعليمية
async function loadCourses() {
    try {
        const snapshot = await db.collection('courses')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        allCourses = [];
        snapshot.forEach(doc => {
            allCourses.push(doc.data());
        });
        
        renderCourses(allCourses);
        
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// عرض المصادر التعليمية
function renderCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    
    if (courses.length === 0) {
        grid.innerHTML = `
            <div class="course-card glass-card rounded-xl p-6 text-center text-gray-400">
                <p class="text-5xl mb-4">🚀</p>
                <p>لا توجد مصادر تعليمية حتى الآن</p>
                <p class="text-sm mt-2">أضف أول مصدر تعليمي!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    courses.forEach(course => {
        const typeIcon = getCourseTypeIcon(course.type);
        
        html += `
            <div class="course-card glass-card rounded-xl p-6 card-hover">
                <div class="flex items-center gap-3 mb-4">
                    <span class="text-3xl">${typeIcon}</span>
                    <div>
                        <h3 class="font-bold">${course.title}</h3>
                        <p class="text-sm text-gray-400">${course.type}</p>
                    </div>
                </div>
                
                <p class="text-gray-300 mb-4">${course.description}</p>
                
                <div class="flex items-center justify-between mb-4">
                    <span class="text-sm text-purple-400">${course.skill}</span>
                    <div class="text-yellow-400">
                        ${getRatingStars(course.rating)}
                    </div>
                </div>
                
                ${course.link ? `
                    <a href="${course.link}" target="_blank" class="block w-full btn-secondary py-2 rounded-xl text-center">
                        زيارة الموقع
                    </a>
                ` : ''}
                
                ${currentUser?.role === 'admin' ? `
                    <div class="flex gap-2 mt-4 justify-center">
                        <button onclick="deleteCourse('${course.id}')" class="text-red-400 text-sm">حذف</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// تصفية المصادر التعليمية
function filterCourses(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filteredCourses = allCourses;
    
    if (type !== 'all') {
        filteredCourses = allCourses.filter(course => course.type === type);
    }
    
    renderCourses(filteredCourses);
}

// البحث في المصادر التعليمية
function searchCourses() {
    const searchTerm = document.getElementById('searchCoursesInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderCourses(allCourses);
        return;
    }
    
    const filtered = allCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.skill.toLowerCase().includes(searchTerm) ||
        course.type.toLowerCase().includes(searchTerm)
    );
    
    renderCourses(filtered);
}

// حذف مصدر تعليمي (للمديرين فقط)
async function deleteCourse(courseId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بحذف المصادر التعليمية', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا المصدر التعليمي؟')) return;
    
    try {
        await db.collection('courses').doc(courseId).update({
            active: false
        });
        
        showToast('تم حذف المصدر التعليمي بنجاح', 'success');
        loadCourses();
        
    } catch (error) {
        console.error('Error deleting course:', error);
        showToast('حدث خطأ أثناء حذف المصدر التعليمي', 'error');
    }
}

// ============================================
// نظام الاقتراحات
// ============================================

// إرسال اقتراح
async function submitSuggestion() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول لإرسال اقتراح', 'error');
        return;
    }
    
    const type = document.getElementById('suggestionType').value;
    const title = document.getElementById('suggestionTitle').value.trim();
    const content = document.getElementById('suggestionContent').value.trim();
    
    if (!title || !content) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const btn = document.getElementById('submitSuggestionText');
    const spinner = document.getElementById('submitSuggestionSpinner');
    
    btn.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    try {
        const suggestionId = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const suggestionData = {
            id: suggestionId,
            type: type,
            title: title,
            content: content,
            userId: currentUser.uid,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            createdAt: new Date().toISOString(),
            status: 'pending', // pending, reviewed, implemented, rejected
            adminReply: '',
            active: true
        };
        
        await db.collection('suggestions').doc(suggestionId).set(suggestionData);
        
        // مسح حقول النموذج
        document.getElementById('suggestionTitle').value = '';
        document.getElementById('suggestionContent').value = '';
        
        showToast('تم إرسال الاقتراح بنجاح', 'success');
        
        // إعادة تحميل الاقتراحات
        loadSuggestions();
        
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showToast('حدث خطأ أثناء إرسال الاقتراح', 'error');
    } finally {
        btn.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

// تحميل الاقتراحات
async function loadSuggestions() {
    try {
        let query = db.collection('suggestions').where('active', '==', true);
        
        // إذا كان المستخدم ليس مديراً، يعرض اقتراحاته فقط
        if (currentUser?.role !== 'admin') {
            query = query.where('userId', '==', currentUser?.uid);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        
        const suggestions = [];
        snapshot.forEach(doc => {
            suggestions.push(doc.data());
        });
        
        renderSuggestions(suggestions);
        
        // تحديث العداد في القائمة الجانبية
        if (currentUser?.role === 'admin') {
            const pendingCount = suggestions.filter(s => s.status === 'pending').length;
            const badge = document.getElementById('suggestionsBadge');
            
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

// عرض الاقتراحات
function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsList');
    
    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400">
                <p>لا توجد اقتراحات حتى الآن</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    suggestions.forEach(suggestion => {
        const statusColor = getSuggestionStatusColor(suggestion.status);
        const statusText = getSuggestionStatusText(suggestion.status);
        
        html += `
            <div class="suggestion-item glass-card rounded-xl p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                            ${suggestion.userAvatar || '👤'}
                        </div>
                        <div>
                            <p class="font-bold">${suggestion.userName}</p>
                            <p class="text-sm text-gray-400">${formatDate(suggestion.createdAt)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs px-2 py-1 rounded-full ${statusColor}">${statusText}</span>
                        <span class="text-xs px-2 py-1 rounded-full bg-white/10">${suggestion.type}</span>
                    </div>
                </div>
                
                <h4 class="font-bold mb-2">${suggestion.title}</h4>
                <p class="text-gray-300 mb-4">${suggestion.content}</p>
                
                ${suggestion.adminReply ? `
                    <div class="bg-white/5 rounded-xl p-4 mb-4">
                        <p class="text-sm text-gray-400 mb-1">رد الإدارة:</p>
                        <p class="text-gray-300">${suggestion.adminReply}</p>
                    </div>
                ` : ''}
                
                ${currentUser?.role === 'admin' && suggestion.status === 'pending' ? `
                    <div class="flex gap-2">
                        <button onclick="updateSuggestionStatus('${suggestion.id}', 'reviewed')" class="text-blue-400 text-sm">تم المراجعة</button>
                        <button onclick="updateSuggestionStatus('${suggestion.id}', 'implemented')" class="text-green-400 text-sm">تم التنفيذ</button>
                        <button onclick="updateSuggestionStatus('${suggestion.id}', 'rejected')" class="text-red-400 text-sm">رفض</button>
                        <button onclick="replyToSuggestion('${suggestion.id}')" class="text-yellow-400 text-sm">رد</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// تحديث حالة الاقتراح (للمديرين فقط)
async function updateSuggestionStatus(suggestionId, status) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بتحديث حالة الاقتراح', 'error');
        return;
    }
    
    try {
        await db.collection('suggestions').doc(suggestionId).update({
            status: status
        });
        
        showToast('تم تحديث حالة الاقتراح', 'success');
        loadSuggestions();
        
    } catch (error) {
        console.error('Error updating suggestion status:', error);
        showToast('حدث خطأ أثناء تحديث حالة الاقتراح', 'error');
    }
}

// الرد على الاقتراح (للمديرين فقط)
async function replyToSuggestion(suggestionId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بالرد على الاقتراح', 'error');
        return;
    }
    
    const reply = prompt('أدخل رد الإدارة:');
    
    if (!reply) return;
    
    try {
        await db.collection('suggestions').doc(suggestionId).update({
            adminReply: reply,
            status: 'reviewed'
        });
        
        showToast('تم إرسال الرد بنجاح', 'success');
        loadSuggestions();
        
    } catch (error) {
        console.error('Error replying to suggestion:', error);
        showToast('حدث خطأ أثناء إرسال الرد', 'error');
    }
}

// ============================================
// نظام المراسلة
// ============================================

// فتح نافذة مراسلة المدير
function openMessageAdminModal() {
    openModal('messageAdminModal');
}

// إرسال رسالة للمدير
async function sendMessageToAdmin() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول لإرسال رسالة', 'error');
        return;
    }
    
    const title = document.getElementById('messageTitle').value.trim();
    const type = document.getElementById('messageType').value;
    const content = document.getElementById('messageContent').value.trim();
    
    if (!title || !content) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    try {
        const messageId = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const messageData = {
            id: messageId,
            title: title,
            type: type,
            content: content,
            userId: currentUser.uid,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            userRole: currentUser.role,
            createdAt: new Date().toISOString(),
            read: false,
            adminReply: '',
            repliedAt: null,
            active: true
        };
        
        await db.collection('messages').doc(messageId).set(messageData);
        
        closeModal('messageAdminModal');
        showToast('تم إرسال الرسالة بنجاح', 'success');
        
        // مسح حقول النموذج
        document.getElementById('messageTitle').value = '';
        document.getElementById('messageContent').value = '';
        
        // إذا كان المرسل هو المدير، إعادة تحميل الرسائل
        if (currentUser.role === 'admin') {
            loadMessages();
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('حدث خطأ أثناء إرسال الرسالة', 'error');
    }
}

// تحميل الرسائل (للمديرين فقط)
async function loadMessages() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        const snapshot = await db.collection('messages')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        allMessages = [];
        snapshot.forEach(doc => {
            allMessages.push(doc.data());
        });
        
        renderMessages(allMessages);
        updateMessagesStats();
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// عرض الرسائل
function renderMessages(messages) {
    const container = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400">
                <p>لا توجد رسائل حتى الآن</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    messages.forEach(message => {
        const isUnread = !message.read;
        
        html += `
            <div class="message-item glass-card rounded-xl p-6 ${isUnread ? 'border-r-4 border-yellow-500' : ''}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            ${message.userAvatar || '👤'}
                        </div>
                        <div>
                            <p class="font-bold">${message.userName}</p>
                            <p class="text-sm text-gray-400">${getRoleDisplay(message.userRole)} • ${formatDate(message.createdAt)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs px-2 py-1 rounded-full bg-white/10">${message.type}</span>
                        ${isUnread ? '<span class="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">جديد</span>' : ''}
                    </div>
                </div>
                
                <h4 class="font-bold mb-2">${message.title}</h4>
                <p class="text-gray-300 mb-4">${message.content}</p>
                
                ${message.adminReply ? `
                    <div class="bg-white/5 rounded-xl p-4 mb-4">
                        <p class="text-sm text-gray-400 mb-1">رد المدير:</p>
                        <p class="text-gray-300">${message.adminReply}</p>
                        <p class="text-xs text-gray-500 mt-1">${formatDate(message.repliedAt)}</p>
                    </div>
                ` : ''}
                
                <div class="flex gap-2">
                    <button onclick="markMessageAsRead('${message.id}')" class="text-blue-400 text-sm">
                        ${isUnread ? 'تعيين كمقروء' : '✓ مقروء'}
                    </button>
                    <button onclick="replyToMessage('${message.id}')" class="text-green-400 text-sm">رد</button>
                    <button onclick="deleteMessage('${message.id}')" class="text-red-400 text-sm">حذف</button>
                    
                    ${message.type === 'طلب رمز ترقية' && !message.adminReply ? `
                        <button onclick="generateCodeForMessage('${message.id}')" class="text-yellow-400 text-sm">🎫 إنشاء رمز</button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// تحديث إحصائيات الرسائل
function updateMessagesStats() {
    const totalMessages = allMessages.length;
    const newMessages = allMessages.filter(m => !m.read).length;
    const codeRequests = allMessages.filter(m => m.type === 'طلب رمز ترقية').length;
    
    document.getElementById('totalMessagesCount').textContent = totalMessages;
    document.getElementById('newMessagesCount').textContent = newMessages;
    document.getElementById('codeRequestsCount').textContent = codeRequests;
    
    // تحديث العداد في القائمة الجانبية
    const badge = document.getElementById('adminMessagesBadge');
    if (newMessages > 0) {
        badge.textContent = newMessages;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// تعيين الرسالة كمقروءة (للمديرين فقط)
async function markMessageAsRead(messageId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        await db.collection('messages').doc(messageId).update({
            read: true
        });
        
        showToast('تم تعيين الرسالة كمقروءة', 'success');
        loadMessages();
        
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

// تعيين جميع الرسائل كمقروءة (للمديرين فقط)
async function markAllMessagesAsRead() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (!confirm('هل تريد تعيين جميع الرسائل كمقروءة؟')) return;
    
    try {
        const batch = db.batch();
        const snapshot = await db.collection('messages').where('read', '==', false).get();
        
        snapshot.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
        
        showToast('تم تعيين جميع الرسائل كمقروءة', 'success');
        loadMessages();
        
    } catch (error) {
        console.error('Error marking all messages as read:', error);
        showToast('حدث خطأ أثناء تحديث الرسائل', 'error');
    }
}

// الرد على الرسالة (للمديرين فقط)
async function replyToMessage(messageId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const reply = prompt('أدخل ردك على الرسالة:');
    
    if (!reply) return;
    
    try {
        await db.collection('messages').doc(messageId).update({
            adminReply: reply,
            repliedAt: new Date().toISOString(),
            read: true
        });
        
        showToast('تم إرسال الرد بنجاح', 'success');
        loadMessages();
        
    } catch (error) {
        console.error('Error replying to message:', error);
        showToast('حدث خطأ أثناء إرسال الرد', 'error');
    }
}

// حذف الرسالة (للمديرين فقط)
async function deleteMessage(messageId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    
    try {
        await db.collection('messages').doc(messageId).update({
            active: false
        });
        
        showToast('تم حذف الرسالة بنجاح', 'success');
        loadMessages();
        
    } catch (error) {
        console.error('Error deleting message:', error);
        showToast('حدث خطأ أثناء حذف الرسالة', 'error');
    }
}

// إنشاء رمز لطلب رسالة (للمديرين فقط)
async function generateCodeForMessage(messageId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        const doc = await db.collection('messages').doc(messageId).get();
        const message = doc.data();
        
        if (!message) return;
        
        // إنشاء رمز عشوائي
        const code = generateRandomCode();
        
        const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const codeData = {
            id: codeId,
            code: code,
            createdBy: currentUser.uid,
            createdFor: message.userId,
            createdForName: message.userName,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 يوم
            used: false,
            usedBy: null,
            usedAt: null,
            active: true
        };
        
        await db.collection('codes').doc(codeId).set(codeData);
        
        // تحديث الرسالة بالرد التلقائي
        await db.collection('messages').doc(messageId).update({
            adminReply: `تم إنشاء رمز الترقية لك: ${code}\n\nيمكنك استخدامه في صفحة تفعيل الرمز للترقية إلى عضو مميز.`,
            repliedAt: new Date().toISOString(),
            read: true
        });
        
        showToast(`تم إنشاء الرمز: ${code}`, 'success');
        loadMessages();
        loadCodes();
        
    } catch (error) {
        console.error('Error generating code for message:', error);
        showToast('حدث خطأ أثناء إنشاء الرمز', 'error');
    }
}

// ============================================
// نظام الرموز والترقيات
// ============================================

// فتح نافذة تفعيل الرمز
function openActivationCodeModal() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول لتفعيل الرمز', 'error');
        return;
    }
    
    openModal('activationCodeModal');
}

// تفعيل رمز الترقية
async function activateCode() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول لتفعيل الرمز', 'error');
        return;
    }
    
    const code = document.getElementById('activationCode').value.trim();
    
    if (!code) {
        showToast('يرجى إدخال رمز الترقية', 'error');
        return;
    }
    
    try {
        // البحث عن الرمز
        const snapshot = await db.collection('codes')
            .where('code', '==', code)
            .where('active', '==', true)
            .get();
        
        if (snapshot.empty) {
            showToast('رمز الترقية غير صحيح أو منتهي الصلاحية', 'error');
            return;
        }
        
        const codeDoc = snapshot.docs[0];
        const codeData = codeDoc.data();
        
        // التحقق من صلاحية الرمز
        if (codeData.used) {
            showToast('هذا الرمز مستخدم بالفعل', 'error');
            return;
        }
        
        if (new Date(codeData.expiresAt) < new Date()) {
            showToast('هذا الرمز منتهي الصلاحية', 'error');
            return;
        }
        
        // تحديث حالة الرمز
        await db.collection('codes').doc(codeDoc.id).update({
            used: true,
            usedBy: currentUser.uid,
            usedAt: new Date().toISOString()
        });
        
        // ترقية المستخدم إلى عضو مميز
        await db.collection('users').doc(currentUser.uid).update({
            role: 'premium',
            points: firebase.firestore.FieldValue.increment(20)
        });
        
        // تحديث المستخدم الحالي
        currentUser.role = 'premium';
        currentUser.points += 20;
        
        // تحديث واجهة المستخدم
        updateUserInfo();
        updateAddButtons();
        
        closeModal('activationCodeModal');
        showToast('مبروك! تمت ترقيتك إلى عضو مميز', 'success');
        
    } catch (error) {
        console.error('Error activating code:', error);
        showToast('حدث خطأ أثناء تفعيل الرمز', 'error');
    }
}

// إنشاء رمز جديد (للمديرين فقط)
async function generateCode() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بإنشاء رموز', 'error');
        return;
    }
    
    let code = document.getElementById('newCodeInput').value.trim();
    
    if (!code) {
        // إنشاء رمز عشوائي
        code = generateRandomCode();
    }
    
    try {
        const codeId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const codeData = {
            id: codeId,
            code: code,
            createdBy: currentUser.uid,
            createdFor: null,
            createdForName: null,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 يوم
            used: false,
            usedBy: null,
            usedAt: null,
            active: true
        };
        
        await db.collection('codes').doc(codeId).set(codeData);
        
        document.getElementById('newCodeInput').value = '';
        showToast(`تم إنشاء الرمز: ${code}`, 'success');
        
        loadCodes();
        
    } catch (error) {
        console.error('Error generating code:', error);
        showToast('حدث خطأ أثناء إنشاء الرمز', 'error');
    }
}

// تحميل الرموز (للمديرين فقط)
async function loadCodes() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        const snapshot = await db.collection('codes')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        allCodes = [];
        snapshot.forEach(doc => {
            allCodes.push(doc.data());
        });
        
        renderCodes(allCodes);
        
    } catch (error) {
        console.error('Error loading codes:', error);
    }
}

// عرض الرموز
function renderCodes(codes) {
    const container = document.getElementById('codesList');
    
    if (codes.length === 0) {
        container.innerHTML = `
            <p class="text-gray-400 text-center">لا توجد رموز</p>
        `;
        return;
    }
    
    let html = '';
    
    codes.forEach(code => {
        const isExpired = new Date(code.expiresAt) < new Date();
        const isUsed = code.used;
        
        html += `
            <div class="code-item glass-card rounded-xl p-4 ${isUsed ? 'bg-green-500/10' : isExpired ? 'bg-red-500/10' : 'bg-blue-500/10'}">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <p class="font-mono font-bold text-lg">${code.code}</p>
                        <p class="text-sm text-gray-400">أنشئ في: ${formatDate(code.createdAt)}</p>
                    </div>
                    <div class="flex flex-col items-end">
                        ${isUsed ? 
                            `<span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">مستخدم</span>` : 
                            isExpired ? 
                            `<span class="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">منتهي</span>` :
                            `<span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">نشط</span>`
                        }
                        <p class="text-xs text-gray-400 mt-1">${formatDate(code.expiresAt)}</p>
                    </div>
                </div>
                
                <div class="text-sm text-gray-300">
                    ${code.createdForName ? `
                        <p>مخصص لـ: ${code.createdForName}</p>
                    ` : `
                        <p>رمز عام</p>
                    `}
                    
                    ${code.used ? `
                        <p>تم الاستخدام بواسطة: ${code.usedBy || 'غير معروف'}</p>
                        <p>في: ${formatDate(code.usedAt)}</p>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// نظام الأعضاء
// ============================================

// تحميل الأعضاء (للمديرين فقط)
async function loadMembers() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        const snapshot = await db.collection('users').get();
        
        allMembers = [];
        snapshot.forEach(doc => {
            allMembers.push(doc.data());
        });
        
        renderMembers(allMembers);
        
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// عرض الأعضاء
function renderMembers(members) {
    // فصل الأعضاء حسب الدور
    const admins = members.filter(m => m.role === 'admin');
    const premium = members.filter(m => m.role === 'premium');
    const regular = members.filter(m => m.role === 'user');
    
    // تحديث العدد
    document.getElementById('adminCount').textContent = admins.length;
    
    // عرض المدراء
    renderMemberList('adminMembersList', admins);
    
    // عرض الأعضاء المميزين
    renderMemberList('premiumMembersList', premium);
    
    // عرض الأعضاء العاديين
    renderMemberList('regularMembersList', regular);
}

// عرض قائمة الأعضاء
function renderMemberList(containerId, members) {
    const container = document.getElementById(containerId);
    
    if (members.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">لا يوجد أعضاء</p>';
        return;
    }
    
    let html = '';
    
    members.forEach(member => {
        const joinDate = new Date(member.joinDate);
        const daysSinceJoin = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
        
        html += `
            <div class="member-item glass-card rounded-xl p-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-xl">
                        ${member.avatar || '👤'}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-bold">${member.name}</p>
                                <p class="text-sm text-gray-400">${member.specialty}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-gray-400">المستوى ${member.level || 1}</p>
                                <p class="text-xs text-yellow-400">${member.points || 0} نقطة</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-2 mt-2 text-center">
                            <div class="text-xs">
                                <p class="text-gray-400">الأفكار</p>
                                <p class="font-bold">${member.ideasCount || 0}</p>
                            </div>
                            <div class="text-xs">
                                <p class="text-gray-400">التعليقات</p>
                                <p class="font-bold">${member.commentsCount || 0}</p>
                            </div>
                            <div class="text-xs">
                                <p class="text-gray-400">الإعجابات</p>
                                <p class="font-bold">${member.likesCount || 0}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between mt-2">
                            <p class="text-xs text-gray-500">منضم منذ ${daysSinceJoin} يوم</p>
                            ${currentUser?.role === 'admin' && member.role !== 'admin' ? `
                                <div class="flex gap-1">
                                    <button onclick="deleteMember('${member.id}')" class="text-red-400 text-xs">حذف</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// البحث في الأعضاء
function searchMembers() {
    const searchTerm = document.getElementById('searchMembersInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderMembers(allMembers);
        return;
    }
    
    const filtered = allMembers.filter(member => 
        member.name.toLowerCase().includes(searchTerm) ||
        member.specialty.toLowerCase().includes(searchTerm)
    );
    
    renderMembers(filtered);
}

// حذف العضو (للمديرين فقط)
async function deleteMember(memberId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بحذف الأعضاء', 'error');
        return;
    }
    
    // منع المدير من حذف نفسه
    if (memberId === currentUser.uid) {
        showToast('لا يمكنك حذف حسابك الخاص', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟ سيتم حذف جميع بياناته.')) return;
    
    try {
        // حذف العضو
        await db.collection('users').doc(memberId).delete();
        
        // حذف أفكار العضو
        const ideasSnapshot = await db.collection('ideas').where('authorId', '==', memberId).get();
        const batch = db.batch();
        
        ideasSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // حذف تعليقات العضو
        const commentsSnapshot = await db.collection('comments').where('authorId', '==', memberId).get();
        commentsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        showToast('تم حذف العضو بنجاح', 'success');
        loadMembers();
        
    } catch (error) {
        console.error('Error deleting member:', error);
        showToast('حدث خطأ أثناء حذف العضو', 'error');
    }
}

// ============================================
// نظام التحليلات
// ============================================

// تحميل التحليلات (للمديرين فقط)
async function loadAnalytics() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        // تحميل الإحصائيات الأساسية
        const ideasSnapshot = await db.collection('ideas').where('active', '==', true).get();
        const usersSnapshot = await db.collection('users').get();
        const commentsSnapshot = await db.collection('comments').where('active', '==', true).get();
        
        const activeIdeas = ideasSnapshot.size;
        const totalMembers = usersSnapshot.size;
        
        // حساب الأعضاء الجدد (آخر 30 يوم)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let newMembers = 0;
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            if (new Date(user.joinDate) > thirtyDaysAgo) {
                newMembers++;
            }
        });
        
        // حساب التفاعل اليومي (آخر 24 ساعة)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let dailyInteractions = 0;
        
        commentsSnapshot.forEach(doc => {
            const comment = doc.data();
            if (new Date(comment.createdAt) > yesterday) {
                dailyInteractions++;
            }
        });
        
        // حساب معدل النمو
        const growthRate = totalMembers > 0 ? Math.round((newMembers / totalMembers) * 100) : 0;
        
        // تحديث الإحصائيات
        document.getElementById('activeIdeas').textContent = activeIdeas;
        document.getElementById('newMembers').textContent = newMembers;
        document.getElementById('dailyInteractions').textContent = dailyInteractions;
        document.getElementById('growthRate').textContent = growthRate + '%';
        
        // تحميل النشاط الأخير
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// تحميل النشاط الأخير
async function loadRecentActivity() {
    try {
        // الحصول على أحدث 10 أنشطة من مختلف المجموعات
        const recentIdeas = await db.collection('ideas')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        const recentComments = await db.collection('comments')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        const recentUsers = await db.collection('users')
            .orderBy('joinDate', 'desc')
            .limit(5)
            .get();
        
        const activities = [];
        
        recentIdeas.forEach(doc => {
            const idea = doc.data();
            activities.push({
                type: 'idea',
                text: `تمت إضافة فكرة جديدة: "${idea.title}"`,
                time: idea.createdAt,
                icon: '💡'
            });
        });
        
        recentComments.forEach(doc => {
            const comment = doc.data();
            activities.push({
                type: 'comment',
                text: `تمت إضافة تعليق جديد من ${comment.authorName}`,
                time: comment.createdAt,
                icon: '💬'
            });
        });
        
        recentUsers.forEach(doc => {
            const user = doc.data();
            activities.push({
                type: 'user',
                text: `انضم عضو جديد: ${user.name}`,
                time: user.joinDate,
                icon: '👤'
            });
        });
        
        // ترتيب حسب الوقت
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        // عرض النشاط
        renderRecentActivity(activities.slice(0, 10));
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// عرض النشاط الأخير
function renderRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">لا يوجد نشاط حديث</p>';
        return;
    }
    
    let html = '';
    
    activities.forEach(activity => {
        const timeAgo = getTimeAgo(activity.time);
        
        html += `
            <div class="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <span class="text-xl">${activity.icon}</span>
                <div class="flex-1">
                    <p class="text-sm">${activity.text}</p>
                    <p class="text-xs text-gray-400">${timeAgo}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// الملف الشخصي
// ============================================

// فتح نافذة الملف الشخصي
function openProfileModal() {
    if (!currentUser) return;
    
    // تحديث بيانات الملف الشخصي
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileSpecialty').textContent = currentUser.specialty;
    document.getElementById('profileAvatar').textContent = currentUser.avatar;
    document.getElementById('profileLevel').textContent = currentUser.level || 1;
    document.getElementById('profilePoints').textContent = currentUser.points || 0;
    document.getElementById('profileIdeas').textContent = currentUser.ideasCount || 0;
    document.getElementById('profileComments').textContent = currentUser.commentsCount || 0;
    
    // تحميل الإنجازات
    loadAchievements();
    
    openModal('profileModal');
}

// تحميل الإنجازات
function loadAchievements() {
    const achievementsContainer = document.getElementById('profileAchievements');
    const achievementsList = document.getElementById('achievementsList');
    
    if (!currentUser) return;
    
    const achievements = [];
    
    // إنجازات بناءً على النقاط
    if (currentUser.points >= 100) {
        achievements.push({ name: '💎 الماس', description: '100 نقطة' });
    } else if (currentUser.points >= 50) {
        achievements.push({ name: '🥇 الذهب', description: '50 نقطة' });
    } else if (currentUser.points >= 25) {
        achievements.push({ name: '🥈 الفضة', description: '25 نقطة' });
    } else if (currentUser.points >= 10) {
        achievements.push({ name: '🥉 البرونز', description: '10 نقاط' });
    }
    
    // إنجازات بناءً على المشاركات
    if (currentUser.ideasCount >= 10) {
        achievements.push({ name: '💡 المبدع', description: '10 أفكار' });
    } else if (currentUser.ideasCount >= 5) {
        achievements.push({ name: '✨ المبتكر', description: '5 أفكار' });
    }
    
    if (currentUser.commentsCount >= 20) {
        achievements.push({ name: '💬 النشط', description: '20 تعليق' });
    } else if (currentUser.commentsCount >= 10) {
        achievements.push({ name: '🗣️ المتحدث', description: '10 تعليقات' });
    }
    
    // إنجازات بناءً على الدور
    if (currentUser.role === 'admin') {
        achievements.push({ name: '👑 المدير', description: 'مدير النظام' });
    } else if (currentUser.role === 'premium') {
        achievements.push({ name: '💡 المميز', description: 'عضو مميز' });
    }
    
    if (achievements.length > 0) {
        achievementsContainer.classList.remove('hidden');
        
        let html = '';
        achievements.forEach(achievement => {
            html += `
                <div class="achievement-item px-3 py-2 rounded-lg bg-white/5 text-center">
                    <p class="font-bold">${achievement.name}</p>
                    <p class="text-xs text-gray-400">${achievement.description}</p>
                </div>
            `;
        });
        
        achievementsList.innerHTML = html;
    } else {
        achievementsContainer.classList.add('hidden');
    }
}

// ============================================
// الأدوات المساعدة
// ============================================

// توليد رمز عشوائي
function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
}

// الحصول على أيقونة بناءً على اسم المستخدم
function getAvatarFromName(name) {
    if (!name) return '👤';
    
    const avatars = ['👤', '🧑', '👩', '🧔', '👨', '👩‍💻', '🧑‍💻', '👨‍💻', '👩‍🎨', '🧑‍🎨', '👨‍🎨'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatars[hash % avatars.length];
}

// الحصول على عرض الدور
function getRoleDisplay(role) {
    switch (role) {
        case 'admin': return '👑 مدير';
        case 'premium': return '💡 عضو مميز';
        default: return '👤 عضو عادي';
    }
}

// الحصول على أيقونة نوع المصدر التعليمي
function getCourseTypeIcon(type) {
    switch (type) {
        case 'قناة يوتيوب': return '📺';
        case 'كورس أونلاين': return '🎓';
        case 'منصة تعليمية': return '💻';
        case 'مقالات': return '📝';
        case 'كتب': return '📚';
        case 'بودكاست': return '🎙️';
        default: return '📚';
    }
}

// الحصول على نجوم التقييم
function getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (halfStar) stars += '☆';
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    
    return stars;
}

// الحصول على لون حالة الاقتراح
function getSuggestionStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-yellow-500/20 text-yellow-400';
        case 'reviewed': return 'bg-blue-500/20 text-blue-400';
        case 'implemented': return 'bg-green-500/20 text-green-400';
        case 'rejected': return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
}

// الحصول على نص حالة الاقتراح
function getSuggestionStatusText(status) {
    switch (status) {
        case 'pending': return 'قيد المراجعة';
        case 'reviewed': return 'تمت المراجعة';
        case 'implemented': return 'تم التنفيذ';
        case 'rejected': return 'مرفوض';
        default: return 'غير معروف';
    }
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // إذا كان أقل من دقيقة
    if (diff < 60 * 1000) {
        return 'الآن';
    }
    
    // إذا كان أقل من ساعة
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `قبل ${minutes} دقيقة`;
    }
    
    // إذا كان أقل من يوم
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `قبل ${hours} ساعة`;
    }
    
    // إذا كان أقل من أسبوع
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `قبل ${days} يوم`;
    }
    
    // عرض التاريخ الكامل
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// حساب الوقت المنقضي
function getTimeAgo(dateString) {
    return formatDate(dateString);
}

// فتح نافذة مودال
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// إغلاق نافذة مودال
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// تبديل القائمة الجانبية على الهاتف
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar.classList.contains('sidebar-mobile-hidden')) {
        sidebar.classList.remove('sidebar-mobile-hidden');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('sidebar-mobile-hidden');
        overlay.classList.add('hidden');
    }
}

// عرض رسالة تنبيه
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toastId = `toast_${Date.now()}`;
    
    const colors = {
        success: 'bg-green-500/20 border-green-500/50 text-green-300',
        error: 'bg-red-500/20 border-red-500/50 text-red-300',
        warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
        info: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast-item glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in ${colors[type]}`;
    toast.innerHTML = `
        <span class="text-xl">${icons[type]}</span>
        <div class="flex-1">
            <p class="text-sm">${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    // إزالة التوست بعد 5 ثواني
    setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
            toastElement.classList.add('animate-fade-out');
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.parentNode.removeChild(toastElement);
                }
            }, 300);
        }
    }, 5000);
}

// تهيئة البيانات الافتراضية
async function initializeDefaultData() {
    // التحقق من وجود بيانات أولية
    const quotesSnapshot = await db.collection('quotes').get();
    
    if (quotesSnapshot.empty) {
        // إضافة عبارات افتراضية
        const defaultQuotes = [
            {
                id: 'quote_default_1',
                text: "الفكرة هي البذرة، والعقل هو التربة، والإبداع هو الثمرة",
                author: "متحف الفكر",
                category: "حكمة",
                addedBy: "system",
                addedByName: "النظام",
                createdAt: new Date().toISOString(),
                likes: 0,
                featured: true,
                active: true
            },
            {
                id: 'quote_default_2',
                text: "العقل الذي ينفتح على فكرة جديدة لن يعود أبداً إلى حجمه الأصلي",
                author: "ألبرت أينشتاين",
                category: "فلسفية",
                addedBy: "system",
                addedByName: "النظام",
                createdAt: new Date().toISOString(),
                likes: 0,
                featured: false,
                active: true
            },
            {
                id: 'quote_default_3',
                text: "الإبداع هو الذكاء وهو يستمتع",
                author: "ألبرت أينشتاين",
                category: "إبداعية",
                addedBy: "system",
                addedByName: "النظام",
                createdAt: new Date().toISOString(),
                likes: 0,
                featured: false,
                active: true
            }
        ];
        
        const batch = db.batch();
        defaultQuotes.forEach(quote => {
            batch.set(db.collection('quotes').doc(quote.id), quote);
        });
        
        await batch.commit();
    }
    
    // التحقق من وجود مصادر تعليمية افتراضية
    const coursesSnapshot = await db.collection('courses').get();
    
    if (coursesSnapshot.empty) {
        // إضافة مصادر تعليمية افتراضية
        const defaultCourses = [
            {
                id: 'course_default_1',
                title: "أكاديمية حسوب",
                type: "منصة تعليمية",
                description: "منصة عربية تقدم دورات في البرمجة والتصميم والتسويق الرقمي",
                link: "https://academy.hsoub.com",
                skill: "برمجة",
                addedBy: "system",
                addedByName: "النظام",
                createdAt: new Date().toISOString(),
                rating: 4.5,
                ratingsCount: 0,
                active: true
            },
            {
                id: 'course_default_2',
                title: "قناة الزيرو",
                type: "قناة يوتيوب",
                description: "قناة تقدم شروحات في البرمجة وتطوير الويب",
                link: "https://youtube.com/c/ElzeroWebSchool",
                skill: "برمجة",
                addedBy: "system",
                addedByName: "النظام",
                createdAt: new Date().toISOString(),
                rating: 4.8,
                ratingsCount: 0,
                active: true
            }
        ];
        
        const batch = db.batch();
        defaultCourses.forEach(course => {
            batch.set(db.collection('courses').doc(course.id), course);
        });
        
        await batch.commit();
    }
}

// ============================================
// إدارة البيانات
// ============================================

// تصدير البيانات (للمديرين فقط)
async function exportData() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بتصدير البيانات', 'error');
        return;
    }
    
    try {
        // جمع البيانات من جميع المجموعات
        const data = {
            users: [],
            ideas: [],
            comments: [],
            quotes: [],
            courses: [],
            suggestions: [],
            messages: [],
            codes: []
        };
        
        // جلب البيانات
        const collections = Object.keys(data);
        for (const collection of collections) {
            const snapshot = await db.collection(collection).get();
            snapshot.forEach(doc => {
                data[collection].push(doc.data());
            });
        }
        
        // تحويل البيانات إلى JSON
        const jsonData = JSON.stringify(data, null, 2);
        
        // إنشاء ملف للتحميل
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `museum-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('تم تصدير البيانات بنجاح', 'success');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('حدث خطأ أثناء تصدير البيانات', 'error');
    }
}

// تأكيد حذف جميع البيانات (للمديرين فقط)
function confirmClearData() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('غير مصرح لك بحذف البيانات', 'error');
        return;
    }
    
    if (confirm('⚠️ تحذير: هذا الإجراء سيمسح جميع البيانات ولا يمكن التراجع عنه.\nهل أنت متأكد من حذف جميع البيانات؟')) {
        clearAllData();
    }
}

// حذف جميع البيانات (للمديرين فقط)
async function clearAllData() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        // حذف جميع البيانات من جميع المجموعات
        const collections = ['ideas', 'comments', 'quotes', 'courses', 'suggestions', 'messages', 'codes'];
        
        for (const collection of collections) {
            const snapshot = await db.collection(collection).get();
            const batch = db.batch();
            
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
        }
        
        // إعادة تهيئة البيانات الافتراضية
        initializeDefaultData();
        
        showToast('تم حذف جميع البيانات وإعادة التعيين', 'success');
        
        // إعادة تحميل الصفحة الحالية
        if (currentUser.role === 'admin') {
            loadPageData(currentPage);
        }
        
    } catch (error) {
        console.error('Error clearing data:', error);
        showToast('حدث خطأ أثناء حذف البيانات', 'error');
    }
}

// ============================================
// معالجة حجم الشاشة
// ============================================

// تحديث واجهة المستخدم بناءً على حجم الشاشة
window.addEventListener('resize', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth <= 768) {
        menuToggle.classList.remove('hidden');
        sidebar.classList.add('sidebar-mobile-hidden');
    } else {
        menuToggle.classList.add('hidden');
        sidebar.classList.remove('sidebar-mobile-hidden');
    }
});

// ============================================
// منع الإرسال التلقائي للنماذج
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    });
});