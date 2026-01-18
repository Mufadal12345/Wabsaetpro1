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
let emailMode = 'login';
let appData = {
    users: [],
    ideas: [],
    content: [],
    suggestions: [],
    codes: [],
    quotes: [],
    messages: [],
    courses: [],
    comments: [],
    notifications: [],
    achievements: [],
    userStats: [],
    pointsHistory: [],
    savedQuotes: []
};
let currentUser = null;
let currentPage = 'home';
let currentFilter = 'all';
let currentCourseFilter = 'all';
let currentSearchQuery = '';
let confirmAction = null;
let viewedIdeas = new Set();
let currentIdeaId = null;
let replyingToCommentId = null;
let notificationPermission = false;

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

// Achievement Definitions
const ACHIEVEMENTS = {
    FIRST_IDEA: { id: 'first_idea', name: '💡 أول فكرة', description: 'نشر أول فكرة', points: 50 },
    FIRST_COMMENT: { id: 'first_comment', name: '💬 أول تعليق', description: 'كتابة أول تعليق', points: 20 },
    TEN_IDEAS: { id: 'ten_ideas', name: '🎯 10 أفكار', description: 'نشر 10 أفكار', points: 100 },
    FIFTY_COMMENTS: { id: 'fifty_comments', name: '💬 50 تعليق', description: 'كتابة 50 تعليق', points: 150 },
    HUNDRED_LIKES: { id: 'hundred_likes', name: '❤️ 100 إعجاب', description: 'الحصول على 100 إعجاب', points: 200 },
    IDEA_OF_THE_DAY: { id: 'idea_of_day', name: '⭐ فكرة اليوم', description: 'فكرة تم تمييزها كفكرة اليوم', points: 300 },
    POPULAR_AUTHOR: { id: 'popular_author', name: '🏆 كاتب مشهور', description: 'الحصول على 500 إعجاب على الأفكار', points: 500 },
    ACTIVE_MEMBER: { id: 'active_member', name: '⚡ عضو نشط', description: 'التفاعل لمدة 7 أيام متتالية', points: 100 },
    COMMUNITY_LEADER: { id: 'community_leader', name: '👑 قائد مجتمع', description: 'مساعدة 10 أعضاء جدد', points: 400 }
};

// ============================================
// نظام النقاط والمستويات والإنجازات
// ============================================

// إضافة نقاط للمستخدم
async function addUserPoints(userId, points, reason) {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        const currentPoints = userData.points || 0;
        const newPoints = currentPoints + points;
        const newLevel = calculateLevel(newPoints);
        
        // تحديث النقاط والمستوى
        await userRef.update({
            points: newPoints,
            level: newLevel,
            lastActivity: new Date().toISOString()
        });
        
        // تسجيل تاريخ النقاط
        await db.collection('pointsHistory').add({
            userId,
            points,
            reason,
            totalPoints: newPoints,
            createdAt: new Date().toISOString()
        });
        
        // تحديث الإحصائيات في الوقت الحقيقي
        updateUserStats();
        
        // التحقق من الإنجازات
        await checkAndAwardAchievements(userId, newPoints, userData);
        
    } catch (error) {
        console.error('Error adding user points:', error);
    }
}

// حساب المستوى بناءً على النقاط
function calculateLevel(points) {
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2100) return 6;
    if (points < 2800) return 7;
    if (points < 3600) return 8;
    if (points < 4500) return 9;
    return 10;
}

// التحقق من الإنجازات ومنحها
async function checkAndAwardAchievements(userId, totalPoints, userData) {
    try {
        const userStats = await getUserStats(userId);
        const userAchievements = userData.achievements || [];
        const newAchievements = [];
        
        // التحقق من إنجاز أول فكرة
        if (userStats.ideasCount >= 1 && !userAchievements.includes('first_idea')) {
            newAchievements.push('first_idea');
        }
        
        // التحقق من إنجاز أول تعليق
        if (userStats.commentsCount >= 1 && !userAchievements.includes('first_comment')) {
            newAchievements.push('first_comment');
        }
        
        // التحقق من إنجاز 10 أفكار
        if (userStats.ideasCount >= 10 && !userAchievements.includes('ten_ideas')) {
            newAchievements.push('ten_ideas');
        }
        
        // التحقق من إنجاز 50 تعليق
        if (userStats.commentsCount >= 50 && !userAchievements.includes('fifty_comments')) {
            newAchievements.push('fifty_comments');
        }
        
        // التحقق من إنجاز 100 إعجاب
        if (userStats.totalLikes >= 100 && !userAchievements.includes('hundred_likes')) {
            newAchievements.push('hundred_likes');
        }
        
        // منح النقاط للإنجازات الجديدة
        if (newAchievements.length > 0) {
            const userRef = db.collection('users').doc(userId);
            await userRef.update({
                achievements: firebase.firestore.FieldValue.arrayUnion(...newAchievements)
            });
            
            // إضافة نقاط لكل إنجاز
            for (const achievementId of newAchievements) {
                const achievement = ACHIEVEMENTS[achievementId.toUpperCase()];
                if (achievement) {
                    await addUserPoints(userId, achievement.points, `إنجاز: ${achievement.name}`);
                    
                    // إرسال إشعار
                    sendNotification({
                        userId,
                        title: '🎉 إنجاز جديد!',
                        message: `مبروك! لقد حصلت على إنجاز "${achievement.name}"`,
                        type: 'achievement',
                        data: { achievementId }
                    });
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking achievements:', error);
    }
}

// الحصول على إحصائيات المستخدم
async function getUserStats(userId) {
    try {
        const userIdeas = appData.ideas.filter(i => i.authorId === userId && !i.deleted);
        const userComments = appData.comments.filter(c => c.userId === userId && !c.deleted);
        const userLikes = userIdeas.reduce((sum, idea) => sum + (idea.likes || 0), 0);
        
        return {
            ideasCount: userIdeas.length,
            commentsCount: userComments.length,
            totalLikes: userLikes,
            totalViews: userIdeas.reduce((sum, idea) => sum + (idea.views || 0), 0),
            points: appData.users.find(u => u.id === userId)?.points || 0,
            level: appData.users.find(u => u.id === userId)?.level || 1
        };
    } catch (error) {
        console.error('Error getting user stats:', error);
        return { ideasCount: 0, commentsCount: 0, totalLikes: 0, totalViews: 0, points: 0, level: 1 };
    }
}

// تحديث إحصائيات المستخدم في الواجهة
function updateUserStats() {
    if (!currentUser) return;
    
    const userStats = getUserStats(currentUser.id);
    const statsElement = document.getElementById('userStats');
    
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="grid grid-cols-2 gap-2 mt-2">
                <div class="text-xs text-center">
                    <div class="text-yellow-400 font-bold">${userStats.points}</div>
                    <div class="text-gray-400">النقاط</div>
                </div>
                <div class="text-xs text-center">
                    <div class="text-blue-400 font-bold">المستوى ${userStats.level}</div>
                    <div class="text-gray-400">المستوى</div>
                </div>
            </div>
        `;
    }
}

// ============================================
// نظام البحث والتوصيات
// ============================================

// بحث في الأفكار
function searchIdeas() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    currentSearchQuery = searchInput.value.trim();
    
    if (!currentSearchQuery) {
        updateIdeasGrid();
        return;
    }
    
    const filteredIdeas = appData.ideas.filter(idea => 
        !idea.deleted && (
            idea.title.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
            idea.content.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
            idea.category.includes(currentSearchQuery) ||
            idea.author.toLowerCase().includes(currentSearchQuery.toLowerCase())
        )
    );
    
    const grid = document.getElementById('ideasGrid');
    if (!grid) return;
    
    if (filteredIdeas.length === 0) {
        grid.innerHTML = `
            <div class="glass-card rounded-xl p-6 text-center text-gray-400 col-span-full">
                <p class="text-5xl mb-4">🔍</p>
                <p>لا توجد نتائج لـ "${currentSearchQuery}"</p>
                <p class="text-sm mt-2">جرب استخدام كلمات أخرى</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredIdeas.map(idea => createIdeaCard(idea)).join('');
}

// الحصول على توصيات شخصية
function getPersonalizedRecommendations() {
    if (!currentUser) return [];
    
    const userIdeas = appData.ideas.filter(i => i.authorId === currentUser.id);
    const userCategories = {};
    
    // تحليل اهتمامات المستخدم
    userIdeas.forEach(idea => {
        userCategories[idea.category] = (userCategories[idea.category] || 0) + 1;
    });
    
    // الحصول على أكثر الفئات اهتماماً
    const favoriteCategory = Object.keys(userCategories).reduce((a, b) => 
        userCategories[a] > userCategories[b] ? a : b, 'فلسفة'
    );
    
    // التوصيات بناءً على الاهتمامات
    return appData.ideas.filter(idea => 
        !idea.deleted && 
        idea.category === favoriteCategory &&
        idea.authorId !== currentUser.id
    ).slice(0, 5);
}

// ============================================
// نظام الإشعارات الفورية
// ============================================

// طلب إذن الإشعارات
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('هذا المتصفح لا يدعم الإشعارات');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermission = true;
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === 'granted';
        return notificationPermission;
    }
    
    return false;
}

// إرسال إشعار
function sendNotification(notificationData) {
    // إشعار المتصفح
    if (notificationPermission && Notification.permission === 'granted') {
        new Notification(notificationData.title, {
            body: notificationData.message,
            icon: '/icon.png',
            badge: '/badge.png'
        });
    }
    
    // حفظ الإشعار في قاعدة البيانات
    saveNotificationToDB(notificationData);
    
    // تحديث عداد الإشعارات في الواجهة
    updateNotificationBadge();
}

// حفظ الإشعار في قاعدة البيانات
async function saveNotificationToDB(notificationData) {
    try {
        const notification = {
            ...notificationData,
            read: false,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('notifications').add(notification);
    } catch (error) {
        console.error('Error saving notification:', error);
    }
}

// تحديث عداد الإشعارات
function updateNotificationBadge() {
    if (!currentUser) return;
    
    const unreadNotifications = appData.notifications.filter(n => 
        n.userId === currentUser.id && !n.read
    ).length;
    
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadNotifications > 0) {
            badge.textContent = unreadNotifications;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// ============================================
// نظام المخططات والبيانات التفاعلية (للمدير)
// ============================================

// عرض مخطط الإحصائيات
function renderStatisticsCharts() {
    // مخطط توزيع الأفكار حسب التصنيف
    renderCategoryDistributionChart();
    
    // مخطط تطور المستخدمين
    renderUserGrowthChart();
    
    // مخطط النشاط اليومي
    renderDailyActivityChart();
}

// مخطط توزيع الأفكار حسب التصنيف
function renderCategoryDistributionChart() {
    const categories = {};
    appData.ideas.filter(i => !i.deleted).forEach(idea => {
        categories[idea.category] = (categories[idea.category] || 0) + 1;
    });
    
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#e94560',
                    '#f472b6',
                    '#fb923c',
                    '#3b82f6',
                    '#10b981',
                    '#8b5cf6'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    rtl: true
                }
            }
        }
    });
}

// مخطط تطور المستخدمين
function renderUserGrowthChart() {
    const usersByMonth = {};
    appData.users.forEach(user => {
        const date = new Date(user.createdAt);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        usersByMonth[monthYear] = (usersByMonth[monthYear] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(usersByMonth).sort();
    
    const ctx = document.getElementById('userGrowthChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'عدد المستخدمين',
                data: sortedMonths.map(month => usersByMonth[month]),
                borderColor: '#e94560',
                backgroundColor: 'rgba(233, 69, 96, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    rtl: true
                }
            }
        }
    });
}

// ============================================
// نظام حفظ العبارات المفضلة
// ============================================

// حفظ عبارة مفضلة
async function saveFavoriteQuote(quoteId) {
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول لحفظ العبارات', 'error');
        return;
    }
    
    try {
        const savedQuote = {
            userId: currentUser.id,
            quoteId,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('savedQuotes').add(savedQuote);
        showToast('تم حفظ العبارة في المفضلة', 'success');
    } catch (error) {
        console.error('Error saving favorite quote:', error);
        showToast('حدث خطأ أثناء حفظ العبارة', 'error');
    }
}

// الحصول على العبارات المفضلة للمستخدم
function getFavoriteQuotes() {
    if (!currentUser) return [];
    
    const userSavedQuotes = appData.savedQuotes.filter(sq => sq.userId === currentUser.id);
    return userSavedQuotes.map(saved => {
        const quote = appData.quotes.find(q => q.id === saved.quoteId) ||
                     DEFAULT_QUOTES.find(q => q.id === saved.quoteId);
        return { ...quote, savedAt: saved.createdAt };
    });
}

// ============================================
// نظام تقييم المصادر التعليمية
// ============================================

// تقييم مصدر تعليمي
async function rateCourse(courseId, rating) {
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول للتقييم', 'error');
        return;
    }
    
    try {
        const existingRating = appData.courseRatings?.find(cr => 
            cr.courseId === courseId && cr.userId === currentUser.id
        );
        
        if (existingRating) {
            await db.collection('courseRatings').doc(existingRating.id).update({
                rating,
                updatedAt: new Date().toISOString()
            });
        } else {
            await db.collection('courseRatings').add({
                courseId,
                userId: currentUser.id,
                rating,
                createdAt: new Date().toISOString()
            });
        }
        
        showToast('شكراً لتقييمك!', 'success');
    } catch (error) {
        console.error('Error rating course:', error);
        showToast('حدث خطأ أثناء التقييم', 'error');
    }
}

// حساب متوسط تقييم المصدر
function getCourseAverageRating(courseId) {
    const ratings = appData.courseRatings?.filter(cr => cr.courseId === courseId) || [];
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, r) => total + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
}

// ============================================
// نظام التميز والتعزيز
// ============================================

// تمييز أفضل تعليق
async function markAsBestComment(commentId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('لا تملك صلاحية تمييز التعليقات', 'error');
        return;
    }
    
    try {
        await db.collection('comments').doc(commentId).update({
            isBestComment: true,
            featuredAt: new Date().toISOString(),
            featuredBy: currentUser.name
        });
        
        // منح نقاط لصاحب التعليق
        const comment = appData.comments.find(c => c.id === commentId);
        if (comment) {
            await addUserPoints(comment.userId, 100, 'تمييز التعليق كأفضل تعليق');
        }
        
        showToast('تم تمييز التعليق كأفضل تعليق!', 'success');
    } catch (error) {
        console.error('Error marking best comment:', error);
        showToast('حدث خطأ أثناء تمييز التعليق', 'error');
    }
}

// تمييز فكرة اليوم
async function markAsIdeaOfTheDay(ideaId) {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('لا تملك صلاحية تمييز فكرة اليوم', 'error');
        return;
    }
    
    try {
        // إلغاء تمييز فكرة اليوم السابقة
        const previousIdeaOfDay = appData.ideas.find(i => i.isIdeaOfDay);
        if (previousIdeaOfDay) {
            await db.collection('ideas').doc(previousIdeaOfDay.id).update({
                isIdeaOfDay: false
            });
        }
        
        // تمييز الفكرة الجديدة
        await db.collection('ideas').doc(ideaId).update({
            isIdeaOfDay: true,
            ideaOfDayDate: new Date().toISOString()
        });
        
        // منح نقاط لصاحب الفكرة
        const idea = appData.ideas.find(i => i.id === ideaId);
        if (idea) {
            await addUserPoints(idea.authorId, 200, 'تمييز الفكرة كفكرة اليوم');
        }
        
        showToast('تم تمييز الفكرة كفكرة اليوم!', 'success');
    } catch (error) {
        console.error('Error marking idea of the day:', error);
        showToast('حدث خطأ أثناء تمييز الفكرة', 'error');
    }
}

// ============================================
// نظام الاقتراحات والتوصيات الشخصية
// ============================================

// إرسال اقتراح تحسين
async function submitImprovementSuggestion(title, content, category) {
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول لإرسال الاقتراحات', 'error');
        return;
    }
    
    try {
        const suggestion = {
            title,
            content,
            category,
            userId: currentUser.id,
            userName: currentUser.name,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        await db.collection('improvementSuggestions').add(suggestion);
        
        // منح نقاط للمستخدم
        await addUserPoints(currentUser.id, 30, 'إرسال اقتراح تحسين');
        
        showToast('شكراً لاقتراحك! سيتم دراسته قريباً', 'success');
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showToast('حدث خطأ أثناء إرسال الاقتراح', 'error');
    }
}

// الحصول على اقتراحات تحسين المستخدم
function getUserImprovementSuggestions() {
    if (!currentUser) return [];
    return appData.improvementSuggestions?.filter(s => s.userId === currentUser.id) || [];
}

// ============================================
// نظام النشاط اليومي
// ============================================

// تسجيل النشاط اليومي
async function recordDailyActivity(activityType, details) {
    if (!currentUser) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const existingActivity = appData.dailyActivities?.find(da => 
            da.userId === currentUser.id && 
            da.date === today && 
            da.activityType === activityType
        );
        
        if (!existingActivity) {
            await db.collection('dailyActivities').add({
                userId: currentUser.id,
                activityType,
                details,
                date: today,
                createdAt: new Date().toISOString()
            });
            
            // التحقق من إنجاز النشاط اليومي
            await checkDailyActivityAchievement();
        }
    } catch (error) {
        console.error('Error recording daily activity:', error);
    }
}

// التحقق من إنجاز النشاط اليومي
async function checkDailyActivityAchievement() {
    if (!currentUser) return;
    
    try {
        const userActivities = appData.dailyActivities?.filter(da => 
            da.userId === currentUser.id
        ) || [];
        
        // تجميع الأيام المتتالية
        const sortedDates = [...new Set(userActivities.map(a => a.date))].sort();
        let consecutiveDays = 1;
        let maxConsecutiveDays = 1;
        
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currentDate = new Date(sortedDates[i]);
            const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                consecutiveDays++;
                maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
            } else if (diffDays > 1) {
                consecutiveDays = 1;
            }
        }
        
        // منح إنجازات للأيام المتتالية
        if (maxConsecutiveDays >= 7) {
            await awardAchievement('active_member', currentUser.id);
        }
        
    } catch (error) {
        console.error('Error checking daily activity:', error);
    }
}

// ============================================
// نظام الصفحة الشخصية
// ============================================

// عرض الصفحة الشخصية للمستخدم
function showUserProfile(userId) {
    const user = appData.users.find(u => u.id === userId);
    if (!user) return;
    
    const userIdeas = appData.ideas.filter(i => i.authorId === userId && !i.deleted);
    const userComments = appData.comments.filter(c => c.userId === userId && !c.deleted);
    const userStats = getUserStats(userId);
    const userAchievements = user.achievements || [];
    
    // إنشاء محتوى الصفحة الشخصية
    const profileHTML = `
        <div class="profile-page animate-fade-in">
            <!-- رأس الملف الشخصي -->
            <div class="glass-card rounded-2xl p-6 mb-6">
                <div class="flex flex-col md:flex-row items-center gap-6">
                    <!-- صورة المستخدم -->
                    <div class="relative">
                        <div class="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-5xl shadow-lg">
                            ${roleIcons[user.role] || '👤'}
                        </div>
                        ${user.isBanned ? 
                            '<div class="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full">🚫 محظور</div>' : 
                            '<div class="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full">✅ نشط</div>'
                        }
                    </div>
                    
                    <!-- معلومات المستخدم -->
                    <div class="flex-1 text-center md:text-right">
                        <h2 class="text-3xl font-bold mb-2">${user.name}</h2>
                        <p class="text-gray-400 mb-4">${user.specialty || 'مستخدم'}</p>
                        
                        <!-- مستويات النقاط -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="stat-card glass-card rounded-xl p-3">
                                <div class="text-yellow-400 text-2xl font-bold">${userStats.points}</div>
                                <div class="text-sm text-gray-400">النقاط</div>
                            </div>
                            <div class="stat-card glass-card rounded-xl p-3">
                                <div class="text-blue-400 text-2xl font-bold">المستوى ${userStats.level}</div>
                                <div class="text-sm text-gray-400">المستوى</div>
                            </div>
                            <div class="stat-card glass-card rounded-xl p-3">
                                <div class="text-pink-400 text-2xl font-bold">${userStats.ideasCount}</div>
                                <div class="text-sm text-gray-400">الأفكار</div>
                            </div>
                            <div class="stat-card glass-card rounded-xl p-3">
                                <div class="text-green-400 text-2xl font-bold">${userStats.commentsCount}</div>
                                <div class="text-sm text-gray-400">التعليقات</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- الإنجازات -->
            ${userAchievements.length > 0 ? `
                <div class="mb-6">
                    <h3 class="text-xl font-bold mb-4">🏆 الإنجازات</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        ${userAchievements.map(achievementId => {
                            const achievement = ACHIEVEMENTS[achievementId.toUpperCase()];
                            return achievement ? `
                                <div class="glass-card rounded-xl p-4 text-center">
                                    <div class="text-2xl mb-2">${achievement.name.split(' ')[0]}</div>
                                    <div class="text-sm text-gray-300">${achievement.name}</div>
                                    <div class="text-xs text-gray-400 mt-1">${achievement.points} نقطة</div>
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- إحصائيات متقدمة -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- الأفكار -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">💡 إحصائيات الأفكار</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-400">عدد الأفكار</span>
                            <span class="font-bold">${userStats.ideasCount}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">إجمالي المشاهدات</span>
                            <span class="font-bold">${userStats.totalViews}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">إجمالي الإعجابات</span>
                            <span class="font-bold">${userStats.totalLikes}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">متوسط الإعجابات</span>
                            <span class="font-bold">${userStats.ideasCount > 0 ? Math.round(userStats.totalLikes / userStats.ideasCount) : 0}</span>
                        </div>
                    </div>
                </div>
                
                <!-- النشاط -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">📈 نشاط المستخدم</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-400">تاريخ الانضمام</span>
                            <span class="font-bold">${formatDate(user.createdAt)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">آخر نشاط</span>
                            <span class="font-bold">${formatDate(user.lastActivity || user.createdAt)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">عدد الأيام النشطة</span>
                            <span class="font-bold">${new Set(appData.dailyActivities?.filter(da => da.userId === userId).map(a => a.date)).size || 1}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">معدل التفاعل</span>
                            <span class="font-bold">${calculateEngagementRate(userId)}%</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- أحدث الأفكار -->
            ${userIdeas.length > 0 ? `
                <div class="mb-6">
                    <h3 class="text-xl font-bold mb-4">📝 أحدث أفكار ${user.name}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${userIdeas.slice(0, 4).map(idea => createIdeaCard(idea)).join('')}
                    </div>
                    ${userIdeas.length > 4 ? `
                        <div class="text-center mt-4">
                            <button onclick="navigateTo('userIdeas', '${userId}')" class="text-pink-400 hover:text-pink-300">
                                عرض جميع الأفكار (${userIdeas.length}) →
                            </button>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
    
    // عرض الصفحة الشخصية
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = profileHTML;
}

// حساب معدل التفاعل
function calculateEngagementRate(userId) {
    const userActivities = appData.dailyActivities?.filter(da => da.userId === userId) || [];
    const uniqueDays = new Set(userActivities.map(a => a.date)).size;
    
    // حساب عدد أيام الاشتراك
    const user = appData.users.find(u => u.id === userId);
    if (!user) return 0;
    
    const joinDate = new Date(user.createdAt);
    const today = new Date();
    const totalDays = Math.ceil((today - joinDate) / (1000 * 60 * 60 * 24));
    
    return totalDays > 0 ? Math.round((uniqueDays / totalDays) * 100) : 0;
}

// ============================================
// نظام لوحة تحكم متقدمة للمدير
// ============================================

// عرض لوحة التحكم المتقدمة
function showAdvancedDashboard() {
    if (!currentUser || currentUser.role !== 'admin') {
        navigateTo('home');
        return;
    }
    
    const totalIdeas = appData.ideas.filter(i => !i.deleted).length;
    const totalComments = appData.comments.filter(c => !c.deleted).length;
    const totalUsers = appData.users.length;
    const totalViews = appData.ideas.reduce((sum, i) => sum + (i.views || 0), 0);
    const totalInteractions = totalComments + appData.ideas.reduce((sum, i) => sum + (i.likes || 0), 0);
    
    // تحليل النشاط حسب الوقت
    const hourlyActivity = analyzeHourlyActivity();
    const categoryStats = analyzeCategoryStats();
    const userEngagement = analyzeUserEngagement();
    
    const dashboardHTML = `
        <div class="dashboard-page animate-fade-in">
            <div class="mb-8">
                <h2 class="text-3xl font-bold">📊 لوحة التحكم المتقدمة</h2>
                <p class="text-gray-400 mt-1">إحصائيات وتحليلات متقدمة</p>
            </div>
            
            <!-- الإحصائيات الرئيسية -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="stat-card glass-card rounded-2xl p-5 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">الأفكار النشطة</p>
                            <p class="text-3xl font-bold mt-1">${totalIdeas}</p>
                        </div>
                        <span class="text-4xl">💡</span>
                    </div>
                </div>
                
                <div class="stat-card glass-card rounded-2xl p-5 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">إجمالي المشاهدات</p>
                            <p class="text-3xl font-bold mt-1">${totalViews.toLocaleString()}</p>
                        </div>
                        <span class="text-4xl">👁️</span>
                    </div>
                </div>
                
                <div class="stat-card glass-card rounded-2xl p-5 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">إجمالي المستخدمين</p>
                            <p class="text-3xl font-bold mt-1">${totalUsers}</p>
                        </div>
                        <span class="text-4xl">👥</span>
                    </div>
                </div>
                
                <div class="stat-card glass-card rounded-2xl p-5 card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-400 text-sm">إجمالي التفاعلات</p>
                            <p class="text-3xl font-bold mt-1">${totalInteractions.toLocaleString()}</p>
                        </div>
                        <span class="text-4xl">💬</span>
                    </div>
                </div>
            </div>
            
            <!-- المخططات والتحليلات -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- مخطط توزيع التصنيفات -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">📊 توزيع الأفكار حسب التصنيف</h3>
                    <canvas id="categoryChart" height="250"></canvas>
                </div>
                
                <!-- مخطط نشاط المستخدمين -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">📈 نشاط المستخدمين حسب الساعة</h3>
                    <canvas id="hourlyActivityChart" height="250"></canvas>
                </div>
            </div>
            
            <!-- جداول تفصيلية -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- أكثر المستخدمين نشاطاً -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">🏆 أكثر المستخدمين نشاطاً</h3>
                    <div class="space-y-3">
                        ${getTopActiveUsers().slice(0, 5).map((user, index) => `
                            <div class="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}</span>
                                    <div>
                                        <p class="font-bold">${user.name}</p>
                                        <p class="text-sm text-gray-400">المستوى ${user.level}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-yellow-400">${user.points} نقطة</p>
                                    <p class="text-sm text-gray-400">${user.ideasCount} فكرة</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- أكثر الأفكار تفاعلاً -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">🔥 أكثر الأفكار تفاعلاً</h3>
                    <div class="space-y-3">
                        ${getTopInteractiveIdeas().slice(0, 5).map((idea, index) => `
                            <div class="p-3 hover:bg-white/5 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xl">${index === 0 ? '🔥' : index === 1 ? '⚡' : index === 2 ? '⭐' : '💡'}</span>
                                    <span class="text-sm text-gray-400">${idea.category}</span>
                                </div>
                                <p class="font-bold text-sm mb-1 line-clamp-1">${idea.title}</p>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-400">بواسطة ${idea.author}</span>
                                    <div class="flex items-center gap-3">
                                        <span class="text-red-400">❤️ ${idea.likes || 0}</span>
                                        <span class="text-blue-400">💬 ${idea.commentsCount}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- أدوات التحكم السريعة -->
            <div class="glass-card rounded-2xl p-6 mt-6">
                <h3 class="text-lg font-bold mb-4">⚡ أدوات التحكم السريعة</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onclick="generateMultipleCodes(5)" class="btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                        <span>🎫</span>
                        <span>إنشاء 5 رموز</span>
                    </button>
                    <button onclick="exportAdvancedData()" class="btn-secondary py-3 rounded-xl flex items-center justify-center gap-2">
                        <span>📥</span>
                        <span>تصدير البيانات</span>
                    </button>
                    <button onclick="sendBulkNotification()" class="btn-secondary py-3 rounded-xl flex items-center justify-center gap-2">
                        <span>📢</span>
                        <span>إرسال إشعار جماعي</span>
                    </button>
                    <button onclick="runSystemCleanup()" class="btn-secondary py-3 rounded-xl flex items-center justify-center gap-2">
                        <span>🧹</span>
                        <span>تنظيف النظام</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = dashboardHTML;
    
    // عرض المخططات بعد تحميل البيانات
    setTimeout(() => {
        renderCategoryDistributionChart();
        renderHourlyActivityChart();
    }, 500);
}

// تحليل النشاط حسب الساعة
function analyzeHourlyActivity() {
    const hourlyCount = Array(24).fill(0);
    
    appData.ideas.forEach(idea => {
        const hour = new Date(idea.createdAt).getHours();
        hourlyCount[hour]++;
    });
    
    appData.comments.forEach(comment => {
        const hour = new Date(comment.createdAt).getHours();
        hourlyCount[hour]++;
    });
    
    return hourlyCount;
}

// تحليل إحصائيات التصنيفات
function analyzeCategoryStats() {
    const stats = {};
    
    appData.ideas.filter(i => !i.deleted).forEach(idea => {
        if (!stats[idea.category]) {
            stats[idea.category] = {
                count: 0,
                totalLikes: 0,
                totalViews: 0,
                totalComments: 0
            };
        }
        
        stats[idea.category].count++;
        stats[idea.category].totalLikes += idea.likes || 0;
        stats[idea.category].totalViews += idea.views || 0;
        stats[idea.category].totalComments += appData.comments.filter(c => c.ideaId === idea.id).length;
    });
    
    return stats;
}

// تحليل تفاعل المستخدمين
function analyzeUserEngagement() {
    const users = appData.users.map(user => {
        const stats = getUserStats(user.id);
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            points: stats.points,
            level: stats.level,
            ideasCount: stats.ideasCount,
            commentsCount: stats.commentsCount,
            engagementRate: calculateEngagementRate(user.id)
        };
    });
    
    return users.sort((a, b) => b.points - a.points);
}

// الحصول على أكثر المستخدمين نشاطاً
function getTopActiveUsers() {
    return analyzeUserEngagement();
}

// الحصول على أكثر الأفكار تفاعلاً
function getTopInteractiveIdeas() {
    return appData.ideas
        .filter(i => !i.deleted)
        .map(idea => ({
            ...idea,
            commentsCount: appData.comments.filter(c => c.ideaId === idea.id).length,
            interactionScore: (idea.likes || 0) + (idea.views || 0) / 10
        }))
        .sort((a, b) => b.interactionScore - a.interactionScore);
}

// عرض مخطط النشاط حسب الساعة
function renderHourlyActivityChart() {
    const hourlyActivity = analyzeHourlyActivity();
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    const ctx = document.getElementById('hourlyActivityChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد النشاطات',
                data: hourlyActivity,
                backgroundColor: 'rgba(233, 69, 96, 0.6)',
                borderColor: '#e94560',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'عدد النشاطات'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'الساعة'
                    }
                }
            },
            plugins: {
                legend: {
                    rtl: true
                }
            }
        }
    });
}

// إنشاء عدة رموز دفعة واحدة
async function generateMultipleCodes(count) {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = 'MUF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            codes.push(code);
            
            const codeData = {
                code,
                usedBy: '',
                usedAt: '',
                batchId: `batch_${Date.now()}`,
                createdAt: new Date().toISOString()
            };
            
            await db.collection('codes').add(codeData);
        }
        
        showToast(`تم إنشاء ${count} رموز جديدة بنجاح!`, 'success');
    } catch (error) {
        console.error('Error generating multiple codes:', error);
        showToast('حدث خطأ أثناء إنشاء الرموز', 'error');
    }
}

// تصدير بيانات متقدمة
async function exportAdvancedData() {
    try {
        const advancedData = {
            systemStats: {
                totalIdeas: appData.ideas.filter(i => !i.deleted).length,
                totalUsers: appData.users.length,
                totalInteractions: appData.comments.length + appData.ideas.reduce((sum, i) => sum + (i.likes || 0), 0),
                totalViews: appData.ideas.reduce((sum, i) => sum + (i.views || 0), 0),
                activeUsers: appData.users.filter(u => !u.isBanned).length,
                bannedUsers: appData.users.filter(u => u.isBanned).length
            },
            categoryAnalysis: analyzeCategoryStats(),
            userEngagement: analyzeUserEngagement(),
            hourlyActivity: analyzeHourlyActivity(),
            exportDate: new Date().toISOString(),
            exportType: 'advanced'
        };
        
        const dataStr = JSON.stringify(advancedData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muf_advanced_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('تم تصدير البيانات المتقدمة بنجاح 📊', 'success');
    } catch (error) {
        console.error('Error exporting advanced data:', error);
        showToast('خطأ في تصدير البيانات', 'error');
    }
}

// إرسال إشعار جماعي
async function sendBulkNotification() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const title = prompt('أدخل عنوان الإشعار الجماعي:');
    if (!title) return;
    
    const message = prompt('أدخل محتوى الإشعار الجماعي:');
    if (!message) return;
    
    try {
        const activeUsers = appData.users.filter(u => !u.isBanned);
        
        // إرسال إشعار لكل مستخدم نشط
        for (const user of activeUsers) {
            await sendNotification({
                userId: user.id,
                title,
                message,
                type: 'admin_broadcast',
                data: { from: currentUser.name }
            });
        }
        
        showToast(`تم إرسال إشعار جماعي إلى ${activeUsers.length} مستخدم`, 'success');
    } catch (error) {
        console.error('Error sending bulk notification:', error);
        showToast('حدث خطأ أثناء إرسال الإشعار الجماعي', 'error');
    }
}

// تنظيف النظام
async function runSystemCleanup() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const confirmed = confirm('هل أنت متأكد من تنظيف النظام؟ هذا الإجراء سيقوم بحذف البيانات القديمة.');
    if (!confirmed) return;
    
    try {
        // حذف الإشعارات القديمة (أقدم من 30 يوم)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const oldNotifications = appData.notifications.filter(n => 
            new Date(n.createdAt) < thirtyDaysAgo
        );
        
        for (const notification of oldNotifications) {
            await db.collection('notifications').doc(notification.id).delete();
        }
        
        // حذف نقاط التاريخ القديمة
        const oldPoints = appData.pointsHistory.filter(p =>
            new Date(p.createdAt) < thirtyDaysAgo
        );
        
        for (const point of oldPoints) {
            await db.collection('pointsHistory').doc(point.id).delete();
        }
        
        showToast('تم تنظيف النظام بنجاح', 'success');
    } catch (error) {
        console.error('Error running system cleanup:', error);
        showToast('حدث خطأ أثناء تنظيف النظام', 'error');
    }
}

// ============================================
// نظام الدردشة والمساعدة
// ============================================

// بدء محادثة مساعدة
function startHelpChat() {
    const chatHTML = `
        <div id="helpChat" class="fixed bottom-4 left-4 z-50">
            <div class="glass-card rounded-2xl p-4 w-80 shadow-2xl">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold">💬 مساعدة فورية</h3>
                    <button onclick="closeHelpChat()" class="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div id="chatMessages" class="h-64 overflow-y-auto mb-4 space-y-3">
                    <div class="message-bubble received">
                        <p>مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <input type="text" id="chatInput" class="input-style flex-1 px-4 py-2 rounded-xl" placeholder="اكتب رسالتك...">
                    <button onclick="sendChatMessage()" class="btn-primary px-4 py-2 rounded-xl">إرسال</button>
                </div>
                
                <!-- اقتراحات سريعة -->
                <div class="grid grid-cols-2 gap-2 mt-4">
                    <button onclick="sendQuickQuestion('كيف أضيف فكرة جديدة؟')" class="btn-secondary py-2 rounded-xl text-sm">➕ إضافة فكرة</button>
                    <button onclick="sendQuickQuestion('كيف أصبح عضو مميز؟')" class="btn-secondary py-2 rounded-xl text-sm">🎫 ترقية</button>
                    <button onclick="sendQuickQuestion('كيف أحفظ عبارة مفضلة؟')" class="btn-secondary py-2 rounded-xl text-sm">💾 حفظ عبارة</button>
                    <button onclick="sendQuickQuestion('كيف أجد مصادر تعليمية؟')" class="btn-secondary py-2 rounded-xl text-sm">🎓 مصادر تعليمية</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatHTML);
}

// إرسال رسالة دردشة
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chatMessages');
    
    // إضافة رسالة المستخدم
    chatMessages.innerHTML += `
        <div class="message-bubble sent">
            <p>${message}</p>
        </div>
    `;
    
    input.value = '';
    
    // محاكاة رد المساعد
    setTimeout(() => {
        const responses = {
            'كيف أضيف فكرة جديدة؟': 'لإضافة فكرة جديدة، انتقل إلى صفحة الأفكار وانقر على زر "إضافة فكرة" في الأعلى. يجب أن تكون عضو مميز أو مدير لإضافة أفكار.',
            'كيف أصبح عضو مميز؟': 'للترقية إلى عضو مميز، تحتاج إلى رمز ترقية من المدير. يمكنك طلب رمز من خلال صفحة "مراسلة المدير".',
            'كيف أحفظ عبارة مفضلة؟': 'لحفظ عبارة مفضلة، انقر على أيقونة القلب بجانب العبارة في صفحة العبارات الملهمة.',
            'كيف أجد مصادر تعليمية؟': 'يمكنك تصفح المصادر التعليمية في صفحة "تطوير المهارات". يمكنك التصفية حسب النوع للعثور على ما يناسبك.'
        };
        
        const response = responses[message] || 
            'شكراً لسؤالك! سأحاول مساعدتك بأفضل طريقة ممكنة. إذا كان لديك سؤال محدد، يمكنك مراسلة المدير من خلال صفحة "مراسلة المدير".';
        
        chatMessages.innerHTML += `
            <div class="message-bubble received">
                <p>${response}</p>
            </div>
        `;
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}

// إرسال سؤال سريع
function sendQuickQuestion(question) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = question;
        sendChatMessage();
    }
}

// إغلاق الدردشة
function closeHelpChat() {
    const chat = document.getElementById('helpChat');
    if (chat) chat.remove();
}

// ============================================
// نظام المهام اليومية والتحديات
// ============================================

// الحصول على المهام اليومية
function getDailyTasks() {
    return [
        {
            id: 'add_idea',
            title: '💡 أضف فكرة جديدة',
            description: 'شارك فكرتك مع المجتمع',
            points: 50,
            completed: appData.ideas.some(i => i.authorId === currentUser?.id && 
                new Date(i.createdAt).toDateString() === new Date().toDateString())
        },
        {
            id: 'comment_three',
            title: '💬 علق على 3 أفكار',
            description: 'شارك برأيك في أفكار الآخرين',
            points: 30,
            completed: appData.comments.filter(c => c.userId === currentUser?.id &&
                new Date(c.createdAt).toDateString() === new Date().toDateString()).length >= 3
        },
        {
            id: 'like_five',
            title: '❤️ أعجب بـ 5 أفكار',
            description: 'شجع المبدعين بإعجاباتك',
            points: 20,
            completed: false // سيتم حسابها من بيانات المستخدم
        },
        {
            id: 'explore_courses',
            title: '🎓 استكشف 3 مصادر تعليمية',
            description: 'طور مهاراتك بمعرفة جديدة',
            points: 40,
            completed: false
        }
    ];
}

// تحديث المهام اليومية
async function updateDailyTask(taskId) {
    if (!currentUser) return;
    
    try {
        const task = getDailyTasks().find(t => t.id === taskId);
        if (!task) return;
        
        // التحقق من إكمال المهمة
        let completed = false;
        
        switch(taskId) {
            case 'add_idea':
                completed = appData.ideas.some(i => i.authorId === currentUser.id && 
                    new Date(i.createdAt).toDateString() === new Date().toDateString());
                break;
            case 'comment_three':
                const todayComments = appData.comments.filter(c => 
                    c.userId === currentUser.id &&
                    new Date(c.createdAt).toDateString() === new Date().toDateString()
                );
                completed = todayComments.length >= 3;
                break;
            // يمكن إضافة حالات أخرى هنا
        }
        
        if (completed && !task.completed) {
            // منح النقاط
            await addUserPoints(currentUser.id, task.points, `إكمال المهمة اليومية: ${task.title}`);
            
            // تحديث حالة المهمة
            await db.collection('userTasks').add({
                userId: currentUser.id,
                taskId,
                completed: true,
                pointsEarned: task.points,
                completedAt: new Date().toISOString()
            });
            
            showToast(`🎉 مبروك! أكملت المهمة وكسبت ${task.points} نقطة`, 'success');
        }
        
    } catch (error) {
        console.error('Error updating daily task:', error);
    }
}

// ============================================
// نظام الإعدادات المتقدمة
// ============================================

// عرض صفحة الإعدادات المتقدمة
function showAdvancedSettings() {
    const settingsHTML = `
        <div class="settings-page animate-fade-in">
            <div class="mb-8">
                <h2 class="text-3xl font-bold">⚙️ الإعدادات المتقدمة</h2>
                <p class="text-gray-400 mt-1">تخصيص تجربتك في المتحف</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- إعدادات الحساب -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">👤 إعدادات الحساب</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-300 mb-2">تفعيل الإشعارات</label>
                            <div class="flex items-center gap-3">
                                <input type="checkbox" id="notificationsToggle" class="w-5 h-5" checked 
                                    onchange="toggleNotifications(this.checked)">
                                <label for="notificationsToggle" class="text-sm">استلام إشعارات عن النشاطات</label>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm text-gray-300 mb-2">خصوصية الحساب</label>
                            <select id="privacySetting" class="input-style w-full px-4 py-3 rounded-xl" 
                                onchange="updatePrivacySetting(this.value)">
                                <option value="public">🌍 عام (الجميع يمكنهم رؤية نشاطك)</option>
                                <option value="friends">👥 الأصدقاء فقط</option>
                                <option value="private">🔒 خاص (أنت فقط)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm text-gray-300 mb-2">مظهر التطبيق</label>
                            <select id="themeSetting" class="input-style w-full px-4 py-3 rounded-xl" 
                                onchange="updateThemeSetting(this.value)">
                                <option value="dark">🌙 مظلم (افتراضي)</option>
                                <option value="light">☀️ فاتح</option>
                                <option value="auto">⚡ تلقائي</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- إعدادات التفضيلات -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">🎯 التفضيلات الشخصية</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-300 mb-2">تصنيفات الاهتمام</label>
                            <div class="flex flex-wrap gap-2">
                                ${Object.keys(CATEGORY_ICONS).map(category => `
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" value="${category}" class="w-4 h-4" 
                                            ${getUserPreferences().favoriteCategories?.includes(category) ? 'checked' : ''}>
                                        <span>${CATEGORY_ICONS[category]} ${category}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm text-gray-300 mb-2">تحديثات البريد الإلكتروني</label>
                            <div class="space-y-2">
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" class="w-4 h-4" checked>
                                    <span class="text-sm">📧 التنبيهات الأسبوعية</span>
                                </label>
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" class="w-4 h-4" checked>
                                    <span class="text-sm">🎉 إشعارات الإنجازات</span>
                                </label>
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" class="w-4 h-4">
                                    <span class="text-sm">📝 نشرة الأفكار الشهرية</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- إعدادات الأمان -->
                <div class="glass-card rounded-2xl p-6">
                    <h3 class="text-lg font-bold mb-4">🔒 الأمان والخصوصية</h3>
                    <div class="space-y-4">
                        <button onclick="showChangePassword()" class="btn-secondary w-full py-3 rounded-xl flex items-center justify-center gap-2">
                            <span>🔑</span>
                            <span>تغيير كلمة المرور</span>
                        </button>
                        
                        <button onclick="showTwoFactorAuth()" class="btn-secondary w-full py-3 rounded-xl flex items-center justify-center gap-2">
                            <span>🔐</span>
                            <span>تفعيل المصادقة الثنائية</span>
                        </button>
                        
                        <button onclick="exportPersonalData()" class="btn-secondary w-full py-3 rounded-xl flex items-center justify-center gap-2">
                            <span>📥</span>
                            <span>تصدير بياناتي الشخصية</span>
                        </button>
                        
                        <button onclick="showDeleteAccount()" class="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2">
                            <span>🗑️</span>
                            <span>حذف حسابي</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- المهام اليومية -->
            <div class="glass-card rounded-2xl p-6 mt-6">
                <h3 class="text-lg font-bold mb-4">📅 المهام اليومية</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${getDailyTasks().map(task => `
                        <div class="glass-card rounded-xl p-4 ${task.completed ? 'border-r-4 border-green-500' : ''}">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xl">${task.title.split(' ')[0]}</span>
                                <span class="text-yellow-400 text-sm">+${task.points}</span>
                            </div>
                            <p class="text-sm text-gray-400 mb-3">${task.description}</p>
                            <div class="flex items-center justify-between">
                                <span class="text-xs ${task.completed ? 'text-green-400' : 'text-gray-500'}">
                                    ${task.completed ? '✅ مكتملة' : '⏳ قيد التنفيذ'}
                                </span>
                                ${!task.completed ? `
                                    <button onclick="updateDailyTask('${task.id}')" class="text-xs text-blue-400 hover:text-blue-300">
                                        تحديث
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = settingsHTML;
}

// الحصول على تفضيلات المستخدم
function getUserPreferences() {
    const preferences = localStorage.getItem(`user_preferences_${currentUser?.id}`);
    return preferences ? JSON.parse(preferences) : {
        favoriteCategories: ['فلسفة', 'تقنية'],
        theme: 'dark',
        privacy: 'public',
        notifications: true
    };
}

// حفظ تفضيلات المستخدم
function saveUserPreferences(preferences) {
    if (currentUser) {
        localStorage.setItem(`user_preferences_${currentUser.id}`, JSON.stringify(preferences));
    }
}

// تبديل الإشعارات
function toggleNotifications(enabled) {
    const preferences = getUserPreferences();
    preferences.notifications = enabled;
    saveUserPreferences(preferences);
    
    if (enabled) {
        requestNotificationPermission();
    }
}

// تحديث إعدادات الخصوصية
function updatePrivacySetting(privacy) {
    const preferences = getUserPreferences();
    preferences.privacy = privacy;
    saveUserPreferences(preferences);
    showToast('تم تحديث إعدادات الخصوصية', 'success');
}

// تحديث إعدادات المظهر
function updateThemeSetting(theme) {
    const preferences = getUserPreferences();
    preferences.theme = theme;
    saveUserPreferences(preferences);
    
    // تطبيق المظهر
    applyTheme(theme);
    showToast('تم تحديث مظهر التطبيق', 'success');
}

// تطبيق المظهر
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light');
    
    if (theme === 'dark') {
        body.classList.add('theme-dark');
    } else if (theme === 'light') {
        body.classList.add('theme-light');
    } else {
        // تلقائي حسب إعدادات النظام
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('theme-dark');
        } else {
            body.classList.add('theme-light');
        }
    }
}

// تصدير البيانات الشخصية
async function exportPersonalData() {
    if (!currentUser) return;
    
    try {
        const userData = {
            profile: appData.users.find(u => u.id === currentUser.id),
            ideas: appData.ideas.filter(i => i.authorId === currentUser.id),
            comments: appData.comments.filter(c => c.userId === currentUser.id),
            savedQuotes: getFavoriteQuotes(),
            preferences: getUserPreferences(),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muf_personal_data_${currentUser.name}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('تم تصدير بياناتك الشخصية بنجاح', 'success');
    } catch (error) {
        console.error('Error exporting personal data:', error);
        showToast('خطأ في تصدير البيانات', 'error');
    }
}

// ============================================
// دمج الوظائف مع النظام الأساسي
// ============================================

// تعديل دالة submitNewIdea الأصلية لإضافة النقاط
const originalSubmitNewIdea = window.submitNewIdea;
window.submitNewIdea = async function() {
    await originalSubmitNewIdea();
    if (currentUser) {
        await addUserPoints(currentUser.id, 50, 'إضافة فكرة جديدة');
        await recordDailyActivity('add_idea', { points: 50 });
        await updateDailyTask('add_idea');
    }
};

// تعديل دالة submitComment الأصلية لإضافة النقاط
const originalSubmitComment = window.submitComment;
window.submitComment = async function() {
    await originalSubmitComment();
    if (currentUser) {
        await addUserPoints(currentUser.id, 10, 'إضافة تعليق');
        await recordDailyActivity('add_comment', { points: 10 });
        await updateDailyTask('comment_three');
    }
};

// تعديل دالة likeComment الأصلية لإضافة النقاط
const originalLikeComment = window.likeComment;
window.likeComment = async function(commentId, isLiked) {
    await originalLikeComment(commentId, isLiked);
    if (currentUser && !isLiked) {
        const comment = appData.comments.find(c => c.id === commentId);
        if (comment && comment.userId !== currentUser.id) {
            await addUserPoints(comment.userId, 5, 'إعجاب بتعليقك');
        }
        await recordDailyActivity('like_content', { points: 5 });
        await updateDailyTask('like_five');
    }
};

// تعديل دالة initApp لتضمين الميزات الجديدة
const originalInitApp = window.initApp;
window.initApp = async function() {
    await originalInitApp();
    
    // طلب إذن الإشعارات
    requestNotificationPermission();
    
    // تطبيق تفضيلات المستخدم
    const preferences = getUserPreferences();
    applyTheme(preferences.theme);
    
    // إضافة زر الدردشة
    addChatButton();
    
    // تحديث الإحصائيات
    updateUserStats();
};

// إضافة زر الدردشة للمساعدة
function addChatButton() {
    const chatButton = document.createElement('button');
    chatButton.innerHTML = '💬 مساعدة';
    chatButton.className = 'fixed bottom-4 right-4 bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-full shadow-lg z-40';
    chatButton.onclick = startHelpChat;
    document.body.appendChild(chatButton);
}

// ============================================
// استكمال دوال UI الأصلية بالميزات الجديدة
// ============================================

// تحديث دالة updateUI لتضمين الميزات الجديدة
const originalUpdateUI = window.updateUI;
window.updateUI = function() {
    originalUpdateUI();
    
    // تحديث إحصائيات المستخدم
    updateUserStats();
    
    // تحديث عداد الإشعارات
    updateNotificationBadge();
    
    // إذا كانت الصفحة الرئيسية وعضو مسؤول، عرض المخططات
    if (currentPage === 'home' && currentUser?.role === 'admin') {
        setTimeout(renderStatisticsCharts, 1000);
    }
    
    // إضافة زر البحث إذا كانت صفحة الأفكار
    if (currentPage === 'ideas') {
        addSearchBar();
    }
};

// إضافة شريط البحث
function addSearchBar() {
    const ideasPage = document.getElementById('ideasPage');
    if (!ideasPage || document.getElementById('searchBar')) return;
    
    const searchBar = document.createElement('div');
    searchBar.id = 'searchBar';
    searchBar.className = 'mb-6';
    searchBar.innerHTML = `
        <div class="flex gap-2">
            <input type="text" id="searchInput" placeholder="🔍 بحث في الأفكار..." 
                class="input-style flex-1 px-4 py-3 rounded-xl"
                oninput="searchIdeas()" value="${currentSearchQuery}">
            <button onclick="clearSearch()" class="btn-secondary px-4 py-3 rounded-xl">مسح</button>
        </div>
    `;
    
    ideasPage.insertBefore(searchBar, ideasPage.children[1]);
}

// مسح البحث
function clearSearch() {
    currentSearchQuery = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    updateIdeasGrid();
}

// تحديث دالة createIdeaCard لتضمين الميزات الجديدة
const originalCreateIdeaCard = window.createIdeaCard;
window.createIdeaCard = function(idea) {
    const baseCard = originalCreateIdeaCard(idea);
    
    // إضافة مؤشر فكرة اليوم إذا كانت مميزة
    if (idea.isIdeaOfDay) {
        return baseCard.replace(
            'card-hover animate-fade-in relative',
            'card-hover animate-fade-in relative border-2 border-yellow-500'
        ).replace(
            '</div>',
            `<div class="absolute top-2 left-2">
                <span class="text-yellow-400 text-sm bg-yellow-900/50 px-2 py-1 rounded-full">⭐ فكرة اليوم</span>
            </div></div>`
        );
    }
    
    // إضافة مؤشر أفضل تعليق إذا كانت الفكرة تحتوي على تعليق مميز
    const hasBestComment = appData.comments.some(c => 
        c.ideaId === idea.id && c.isBestComment
    );
    
    if (hasBestComment) {
        return baseCard.replace(
            'card-hover animate-fade-in relative',
            'card-hover animate-fade-in relative border-2 border-green-500'
        ).replace(
            '</div>',
            `<div class="absolute top-2 left-2">
                <span class="text-green-400 text-sm bg-green-900/50 px-2 py-1 rounded-full">🏆 أفضل تعليق</span>
            </div></div>`
        );
    }
    
    return baseCard;
};

// ============================================
// تهيئة التطبيق
// ============================================
document.addEventListener('DOMContentLoaded', initApp);

// ============================================
// تحميل جميع البيانات
// ============================================
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
            db.collection('comments').get(),
            db.collection('notifications').get(),
            db.collection('achievements').get(),
            db.collection('userStats').get(),
            db.collection('pointsHistory').get(),
            db.collection('savedQuotes').get(),
            db.collection('courseRatings').get(),
            db.collection('improvementSuggestions').get(),
            db.collection('dailyActivities').get(),
            db.collection('userTasks').get()
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
            comments: results[8].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            notifications: results[9].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            achievements: results[10].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            userStats: results[11].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            pointsHistory: results[12].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            savedQuotes: results[13].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            courseRatings: results[14].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            improvementSuggestions: results[15].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            dailyActivities: results[16].docs.map(doc => ({ id: doc.id, ...doc.data() })),
            userTasks: results[17].docs.map(doc => ({ id: doc.id, ...doc.data() }))
        };

        setupRealtimeListeners();
        updateUI();

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('خطأ في تحميل البيانات', 'error');
    }
}

// ============================================
// وظائف إضافية للعناصر الجديدة في الواجهة
// ============================================

// عرض صفحة الملف الشخصي
function showProfilePage() {
    if (!currentUser) {
        navigateTo('home');
        return;
    }
    showUserProfile(currentUser.id);
}

// عرض صفحة لوحة التحكم المتقدمة
function showDashboardPage() {
    if (currentUser?.role === 'admin') {
        showAdvancedDashboard();
    } else {
        navigateTo('home');
    }
}

// عرض صفحة الإعدادات المتقدمة
function showSettingsPage() {
    showAdvancedSettings();
}

// عرض صفحة الإشعارات
function showNotificationsPage() {
    const notifications = appData.notifications.filter(n => n.userId === currentUser?.id);
    
    const notificationsHTML = `
        <div class="notifications-page animate-fade-in">
            <div class="mb-8">
                <h2 class="text-3xl font-bold">🔔 الإشعارات</h2>
                <p class="text-gray-400 mt-1">آخر النشاطات والتحديثات</p>
            </div>
            
            <div class="space-y-4">
                ${notifications.length === 0 ? `
                    <div class="glass-card rounded-xl p-6 text-center text-gray-400">
                        <p class="text-5xl mb-4">🔔</p>
                        <p>لا توجد إشعارات حالياً</p>
                    </div>
                ` : notifications.map(notification => `
                    <div class="glass-card rounded-xl p-4 ${!notification.read ? 'border-r-4 border-yellow-500' : ''}">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xl">${getNotificationIcon(notification.type)}</span>
                                <div>
                                    <p class="font-bold">${notification.title}</p>
                                    <p class="text-xs text-gray-500">${formatDate(notification.createdAt)}</p>
                                </div>
                            </div>
                            ${!notification.read ? `
                                <button onclick="markNotificationAsRead('${notification.id}')" class="text-blue-400 hover:text-blue-300 text-sm">
                                    📌 وضع مقروء
                                </button>
                            ` : ''}
                        </div>
                        <p class="text-gray-300">${notification.message}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = notificationsHTML;
}

// الحصول على أيقونة الإشعار
function getNotificationIcon(type) {
    const icons = {
        'achievement': '🏆',
        'like': '❤️',
        'comment': '💬',
        'reply': '↩️',
        'system': '⚙️',
        'admin_broadcast': '📢',
        'idea_featured': '⭐'
    };
    return icons[type] || '🔔';
}

// وضع إشعار كمقروء
async function markNotificationAsRead(notificationId) {
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: new Date().toISOString()
        });
        
        updateNotificationBadge();
        showToast('تم وضع الإشعار كمقروء', 'success');
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// ============================================
// إضافة عناصر جديدة للقائمة الجانبية
// ============================================

// تعديل دالة showMainApp لتضمين عناصر جديدة
const originalShowMainApp = window.showMainApp;
window.showMainApp = function() {
    originalShowMainApp();
    
    // تحديث القائمة الجانبية بعناصر جديدة
    updateSidebarWithNewItems();
};

// تحديث القائمة الجانبية بعناصر جديدة
function updateSidebarWithNewItems() {
    const sidebarNav = document.querySelector('#sidebar nav');
    
    // إضافة عنصر الإشعارات
    if (!document.querySelector('.sidebar-item[data-page="notifications"]')) {
        const notificationsItem = `
            <button onclick="navigateTo('notifications')" class="sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right" data-page="notifications">
                <span class="text-xl">🔔</span>
                <span>الإشعارات</span>
                <span id="notificationBadge" class="badge text-xs px-2 py-0.5 rounded-full mr-auto hidden">0</span>
            </button>
        `;
        
        // إدراج بعد عنصر التعليقات
        const commentsItem = document.querySelector('.sidebar-item[data-page="comments"]');
        if (commentsItem) {
            commentsItem.insertAdjacentHTML('afterend', notificationsItem);
        }
    }
    
    // إضافة عنصر الملف الشخصي للمستخدمين العاديين
    if (currentUser && !document.querySelector('.sidebar-item[data-page="profile"]')) {
        const profileItem = `
            <button onclick="showProfilePage()" class="sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right" data-page="profile">
                <span class="text-xl">👤</span>
                <span>ملفي الشخصي</span>
            </button>
        `;
        
        sidebarNav.insertAdjacentHTML('beforeend', profileItem);
    }
    
    // تحديث عداد الإشعارات
    updateNotificationBadge();
}