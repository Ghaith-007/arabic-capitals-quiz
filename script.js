let allCountries = [];
let availableCountries = []; // قائمة الدول المتاحة التي لم تُسأل بعد
let currentQuestion = null;
let score = 0;
let questionCount = 0;
const totalQuestions = 10;

// Arab League ISO codes for filtering
const arabLeagueCodes = [
    'DZA', 'BHR', 'COM', 'DJI', 'EGY', 'IRQ', 'JOR', 'KWT', 
    'LBN', 'LBY', 'MRT', 'MAR', 'OMN', 'PSE', 'QAT', 'SAU', 
    'SOM', 'SDN', 'SYR', 'TUN', 'ARE', 'YEM'
];

// Arabic translations for capital cities
const capitalTranslations = {
    "Algiers": "الجزائر",
    "Manama": "المنامة",
    "Moroni": "موروني",
    "Djibouti": "جيبوتي",
    "Cairo": "القاهرة",
    "Baghdad": "بغداد",
    "Amman": "عمان",
    "Kuwait City": "الكويت",
    "Beirut": "بيروت",
    "Tripoli": "طرابلس",
    "Nouakchott": "نواكشوط",
    "Rabat": "الرباط",
    "Muscat": "مسقط",
    "Jerusalem": "القدس",
    "Ramallah": "رام الله",
    "Doha": "الدوحة",
    "Riyadh": "الرياض",
    "Mogadishu": "مقديشو",
    "Khartoum": "الخرطوم",
    "Damascus": "دمشق",
    "Tunis": "تونس",
    "Abu Dhabi": "أبوظبي",
    "Sana'a": "صنعاء"
};

// Fetch data from API
async function fetchGameData() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,flags,translations,cca3');
        const data = await response.json();
        
        // Filter for Arab countries only
        allCountries = data.filter(c => 
            arabLeagueCodes.includes(c.cca3) && 
            c.capital && 
            c.capital.length > 0
        );

        if (allCountries.length === 0) throw new Error("No data found");
        
        startNewGame();
    } catch (error) {
        document.getElementById('feedback-message').innerHTML = "<p class='text-red-500'>فشل في جلب بيانات الدول العربية!</p>";
    }
}

function startNewGame() {
    score = 0;
    questionCount = 0;
    availableCountries = [...allCountries];
    updateScore();
    nextQuestion();
}

function updateScore() {
    document.getElementById('score-display').innerText = `النقاط: ${score}`;
}

// Get Arabic name for capital
function getArabicCapital(countryObj) {
    const engCap = countryObj.capital[0];
    return capitalTranslations[engCap] || engCap; 
}

function nextQuestion() {
    // التحقق من انتهاء عدد الأسئلة أو نفاذ الدول المتاحة
    if (questionCount >= totalQuestions || availableCountries.length === 0) {
        showFinalResults();
        return;
    }

    questionCount++;
    document.getElementById('progress-display').innerText = `السؤال ${questionCount} / ${totalQuestions}`;
    document.getElementById('feedback-message').innerHTML = "<p class='text-gray-400 font-medium text-center'>اختر العاصمة العربية الصحيحة! 🕌</p>";

    const flagImg = document.getElementById('flag-image');
    const loader = document.getElementById('loader');
    flagImg.classList.add('hidden');
    loader.classList.remove('hidden');

    // اختيار مؤشر عشوائي من قائمة الدول المتاحة فقط لضمان عدم التكرار
    const randomIndex = Math.floor(Math.random() * availableCountries.length);
    currentQuestion = availableCountries[randomIndex];
    
    // إزالة الدولة المختارة من القائمة المتاحة حتى لا تظهر مرة أخرى
    availableCountries.splice(randomIndex, 1);
    
    document.getElementById('country-name').innerText = currentQuestion.translations.ara.common;
    flagImg.src = currentQuestion.flags.png;
    
    flagImg.onload = () => {
        flagImg.classList.remove('hidden');
        loader.classList.add('hidden');
    };

    generateOptions();
}

function generateOptions() {
    let options = [currentQuestion];
    
    // إضافة 3 خيارات خاطئة من القائمة الكاملة للدول العربية (لضمان وجود خيارات دائماً)
    while (options.length < 4) {
        let randomCountry = allCountries[Math.floor(Math.random() * allCountries.length)];
        if (!options.find(o => o.cca3 === randomCountry.cca3)) {
            options.push(randomCountry);
        }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    const grid = document.getElementById('options-grid');
    grid.innerHTML = ''; 

    options.forEach(countryOpt => {
        const btn = document.createElement('button');
        btn.className = "w-full py-3 px-2 bg-indigo-50 text-indigo-700 font-bold rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 transition-all duration-200 text-sm md:text-lg shadow-sm overflow-hidden text-center";
        
        const capName = getArabicCapital(countryOpt);
        btn.innerText = capName;
        
        btn.onclick = () => checkAnswer(countryOpt, btn);
        grid.appendChild(btn);
    });
}

function checkAnswer(selectedCountry, btn) {
    const isCorrect = selectedCountry.cca3 === currentQuestion.cca3;
    const allBtns = document.querySelectorAll('#options-grid button');
    
    // تعطيل جميع الأزرار لمنع الضغط المتكرر
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
        // --- حالة الإجابة الصحيحة ---
        score += 10;
        updateScore();
        btn.classList.add('correct'); // اللون الأخضر وتأثير النبض
        document.getElementById('feedback-message').innerHTML = "<p class='text-green-600 font-bold text-center'>🎉 بطل! إجابة صحيحة!</p>";

        // إطلاق النجوم والقصاصات
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
        });

    } else {
        // --- حالة الإجابة الخاطئة (عادت الآن) ---
        btn.classList.add('wrong'); // اللون الأحمر وتأثير الاهتزاز (Shake)
        const correctArCap = getArabicCapital(currentQuestion);
        document.getElementById('feedback-message').innerHTML = `<p class='text-red-500 font-bold text-center'>العاصمة الصحيحة هي ${correctArCap} ✨</p>`;
        
        // إظهار اللون الأخضر على الزر الصحيح ليعرف الطفل الإجابة
        allBtns.forEach(b => {
            if (getArabicCapital(currentQuestion) === b.innerText) {
                b.classList.add('correct');
            }
        });
    }

    // الانتقال للسؤال التالي بعد ثانيتين
    setTimeout(nextQuestion, 2000);
}

function showFinalResults() {
    const gameBody = document.getElementById('game-body');
    gameBody.innerHTML = `
        <div class="text-center py-10">
            <span class="text-6xl text-center block">🎈</span>
            <h2 class="text-3xl font-black text-indigo-900 mt-4 text-center">أحسنت يا ذكي!</h2>
            <p class="text-xl text-gray-600 mt-2 text-center">أنت تعرف عواصم وطنك العربي جيداً!</p>
            <p class="text-2xl font-bold text-indigo-600 mt-4 text-center">نقاطك: ${score}</p>
            <button onclick="location.reload()" class="mt-8 w-full py-4 bg-yellow-400 text-yellow-900 font-bold rounded-2xl shadow-lg hover:bg-yellow-300 transition-all">
                إعادة التحدي 🔄
            </button>
        </div>
    `;
}

// Start fetching data on window load
window.onload = fetchGameData;