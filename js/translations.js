// Translation strings for Arabic and English
const translations = {
    en: {
        appTitle: "Blackboard Question Converter",
        multipleChoice: "Multiple Choice Questions",
        essay: "Essay Questions",
        trueFalse: "True/False Questions",
        fillBlank: "Fill in the Blank Questions",
        multipleAnswer: "Multiple Answer Questions",
        matching: "Matching Questions",
        numeric: "Numeric Response Questions",
        format: "Format",
        showExample: "Show Example",
        hideExample: "Hide Example",
        questionsIn: "Questions in",
        usageHintTitle: "Tip",
        usageHintText: "You can move between questions and edit any field at any time. Your work is saved temporarily in your browser. When everything is ready, select Convert to process all questions together.",
        privacyMessage: "Privacy Notice",
        privacyText: "This website does not store, upload, or transmit your questions. All processing happens locally in your browser.",
        convert: "Convert",
        download: "Download as .txt",
        copyClipboard: "Copy to Clipboard",
        clearAll: "Clear All",
        totalQuestions: "Total Questions",
        outputPlaceholder: "Converted Blackboard questions will appear here...",
        outputHelp: "This output is in Blackboard Ultra tab-delimited format and ready for upload.",
        developedBy: "Developed by:",
        // Format descriptions
        mcqFormat: "Numbered question with choices marked with letters. Use * to mark the correct answer. Metadata (LO1, Module, etc.) is optional and will be automatically removed.",
        essayFormat: "Numbered (1.) or lettered (a)) question format. Both are supported. Metadata (LO1, Module, etc.) is optional and will be automatically removed.",
        tfFormat: "Numbered question with True/False options. Use * to mark the correct answer. Metadata (LO1, Module, etc.) is optional and will be automatically removed.",
        fibFormat: "Numbered question with answers on subsequent lines. Metadata (LO1, Module, etc.) is optional and will be automatically removed.",
        maFormat: "Similar to MCQ but allows multiple correct answers. Mark all correct answers with *. Metadata (LO1, Module, etc.) is optional and will be automatically removed.",
        matFormat: "Numbered question with answer-matching pairs on subsequent lines. Metadata (LO1, Module, etc.) is optional and will be automatically removed.",
        numFormat: "Numbered question with numeric answer. Optional tolerance on third line. Metadata (LO1, Module, etc.) is optional and will be automatically removed.",
        // Question type names for sidebar
        mcqTab: "MCQ",
        essayTab: "Essay",
        trueFalseTab: "True/False",
        fillBlankTab: "Fill in the Blank",
        multipleAnswerTab: "Multiple Answer",
        matchingTab: "Matching",
        numericTab: "Numeric",
        // Example texts - showing both with and without metadata
        mcqExample: "With metadata:\n1. Which of these is NOT a step? (LO1) (Dr. Name) [Module 1] [Difficulty Level: Low]\na. Choice one\nb. Choice two*\nc. Choice three\n\nWithout metadata:\n2. What is the capital of France?\na. London\nb. Paris*\nc. Berlin",
        essayExample: "With metadata:\na) What is the similarity and difference between interval data and ratio data? (LO2) (Dr. Name) [Module 1] [Difficulty Level: Low]\n\nWithout metadata:\nb) Explain the concept of data analysis in your own words.",
        tfExample: "With metadata:\n1. This statement is true. (LO1) (Dr. Name) [Module 1] [Difficulty Level: Low]\nTrue*\nFalse\n\nWithout metadata:\n2. The Earth is round.\nTrue*\nFalse",
        fibExample: "With metadata:\n1. The capital of France is ____. (LO1) (Dr. Name) [Module 1] [Difficulty Level: Low]\nParis\nparis\n\nWithout metadata:\n2. The largest planet in our solar system is ____.\nJupiter",
        maExample: "With metadata:\n1. Select all that apply. (LO1) (Dr. Name) [Module 1] [Difficulty Level: Low]\na. Option one*\nb. Option two*\nc. Option three\n\nWithout metadata:\n2. Which are prime numbers?\na. 2*\nb. 4\nc. 7*",
        matExample: "With metadata:\n1. Match the following. (LO1) (Dr. Name) [Module 1] [Difficulty Level: Low]\nParis France\nLondon England\n\nWithout metadata:\n2. Match the capitals:\nParis France\nLondon England",
        numExample: "With metadata:\n1. What is 2+2? (LO1) (Dr. Name) [Module 1] [Difficulty Level: Low]\n4\n0.5\n\nWithout metadata:\n2. Calculate 5 × 3\n15",
        // Placeholders
        mcqPlaceholder: "1. Your question here (LO1) (Author) [Module 1] [Difficulty Level: Low]\na. First choice\nb. Second choice*\nc. Third choice",
        essayPlaceholder: "a) Your essay question here (LO2) (Author) [Module 1] [Difficulty Level: Low]",
        tfPlaceholder: "1. Your true/false question here (LO1) (Author) [Module 1] [Difficulty Level: Low]\nTrue*\nFalse",
        fibPlaceholder: "1. Your fill-in-the-blank question here (LO1) (Author) [Module 1] [Difficulty Level: Low]\nAnswer 1\nAnswer 2",
        maPlaceholder: "1. Your multiple answer question here (LO1) (Author) [Module 1] [Difficulty Level: Low]\na. First option*\nb. Second option*\nc. Third option",
        matPlaceholder: "1. Your matching question here (LO1) (Author) [Module 1] [Difficulty Level: Low]\nAnswer1 Matching1\nAnswer2 Matching2",
        numPlaceholder: "1. Your numeric question here (LO1) (Author) [Module 1] [Difficulty Level: Low]\n42\n0.5"
    },
    ar: {
        appTitle: "محول أسئلة بلاك بورد",
        multipleChoice: "أسئلة الاختيار من متعدد",
        essay: "أسئلة المقال",
        trueFalse: "أسئلة صح/خطأ",
        fillBlank: "أسئلة إكمال الفراغ",
        multipleAnswer: "أسئلة الإجابة المتعددة",
        matching: "أسئلة المطابقة",
        numeric: "أسئلة الإجابة الرقمية",
        format: "التنسيق",
        showExample: "عرض المثال",
        hideExample: "إخفاء المثال",
        questionsIn: "عدد الأسئلة في",
        usageHintTitle: "نصيحة",
        usageHintText: "يمكنك التنقّل بين الأسئلة وتعديل أي حقل في أي وقت. يتم حفظ عملك مؤقتًا في المتصفح. عند الانتهاء من جميع الأسئلة، اضغط على تحويل لمعالجتها دفعة واحدة.",
        privacyMessage: "إشعار الخصوصية",
        privacyText: "هذا الموقع لا يخزن أو يرفع أو ينقل أسئلتك. جميع المعالجة تتم محلياً في متصفحك.",
        convert: "تحويل",
        download: "تحميل كملف نصي",
        copyClipboard: "نسخ إلى الحافظة",
        clearAll: "مسح الكل",
        totalQuestions: "إجمالي الأسئلة",
        outputPlaceholder: "ستظهر أسئلة بلاك بورد المحولة هنا...",
        outputHelp: "هذا الإخراج بتنسيق بلاك بورد الترا المفصول بعلامات التبويب وجاهز للرفع.",
        developedBy: "تم التطوير بواسطة:",
        // Format descriptions
        mcqFormat: "سؤال مرقم مع خيارات محددة بأحرف. استخدم * لتحديد الإجابة الصحيحة. البيانات الوصفية (LO1، الوحدة، إلخ) اختيارية وسيتم إزالتها تلقائياً.",
        essayFormat: "تنسيق سؤال مرقم (1.) أو بحروف (أ)). كلا التنسيقين مدعومان. البيانات الوصفية (LO1، الوحدة، إلخ) اختيارية وسيتم إزالتها تلقائياً.",
        tfFormat: "سؤال مرقم مع خيارات صح/خطأ. استخدم * لتحديد الإجابة الصحيحة. البيانات الوصفية (LO1، الوحدة، إلخ) اختيارية وسيتم إزالتها تلقائياً.",
        fibFormat: "سؤال مرقم مع إجابات في الأسطر التالية. البيانات الوصفية (LO1، الوحدة، إلخ) اختيارية وسيتم إزالتها تلقائياً.",
        maFormat: "مشابه لأسئلة الاختيار من متعدد لكن يسمح بإجابات صحيحة متعددة. حدد جميع الإجابات الصحيحة بـ *. البيانات الوصفية (LO1، الوحدة، إلخ) اختيارية وسيتم إزالتها تلقائياً.",
        matFormat: "سؤال مرقم مع أزواج مطابقة في الأسطر التالية. البيانات الوصفية (LO1، الوحدة، إلخ) اختيارية وسيتم إزالتها تلقائياً.",
        numFormat: "سؤال مرقم مع إجابة رقمية. التسامح اختياري في السطر الثالث. البيانات الوصفية (LO1، الوحدة، إلخ) اختيارية وسيتم إزالتها تلقائياً.",
        // Question type names for sidebar
        mcqTab: "اختيار من متعدد",
        essayTab: "مقال",
        trueFalseTab: "صح/خطأ",
        fillBlankTab: "إكمال الفراغ",
        multipleAnswerTab: "إجابة متعددة",
        matchingTab: "مطابقة",
        numericTab: "رقمي",
        // Example texts - showing both with and without metadata
        mcqExample: "مع البيانات الوصفية:\n1. أي من هذه ليس خطوة؟ (LO1) (د. الاسم) [الوحدة 1] [مستوى الصعوبة: منخفض]\nأ. الخيار الأول\nب. الخيار الثاني*\nج. الخيار الثالث\n\nبدون البيانات الوصفية:\n2. ما هي عاصمة فرنسا؟\nأ. لندن\nب. باريس*\nج. برلين",
        essayExample: "مع البيانات الوصفية:\nأ) ما هي أوجه التشابه والاختلاف بين البيانات الفاصلة وبيانات النسبة؟ (LO2) (د. الاسم) [الوحدة 1] [مستوى الصعوبة: منخفض]\n\nبدون البيانات الوصفية:\nب) اشرح مفهوم تحليل البيانات بكلماتك الخاصة.",
        tfExample: "مع البيانات الوصفية:\n1. هذه العبارة صحيحة. (LO1) (د. الاسم) [الوحدة 1] [مستوى الصعوبة: منخفض]\nصحيح*\nخطأ\n\nبدون البيانات الوصفية:\n2. الأرض كروية.\nصحيح*\nخطأ",
        fibExample: "مع البيانات الوصفية:\n1. عاصمة فرنسا هي ____. (LO1) (د. الاسم) [الوحدة 1] [مستوى الصعوبة: منخفض]\nباريس\nparis\n\nبدون البيانات الوصفية:\n2. أكبر كوكب في نظامنا الشمسي هو ____.\nالمشتري",
        maExample: "مع البيانات الوصفية:\n1. اختر جميع ما ينطبق. (LO1) (د. الاسم) [الوحدة 1] [مستوى الصعوبة: منخفض]\nأ. الخيار الأول*\nب. الخيار الثاني*\nج. الخيار الثالث\n\nبدون البيانات الوصفية:\n2. أي من الأرقام التالية أولية؟\nأ. 2*\nب. 4\nج. 7*",
        matExample: "مع البيانات الوصفية:\n1. طابق التالي. (LO1) (د. الاسم) [الوحدة 1] [مستوى الصعوبة: منخفض]\nباريس فرنسا\nلندن إنجلترا\n\nبدون البيانات الوصفية:\n2. طابق العواصم:\nباريس فرنسا\nلندن إنجلترا",
        numExample: "مع البيانات الوصفية:\n1. ما هو 2+2؟ (LO1) (د. الاسم) [الوحدة 1] [مستوى الصعوبة: منخفض]\n4\n0.5\n\nبدون البيانات الوصفية:\n2. احسب 5 × 3\n15",
        // Placeholders
        mcqPlaceholder: "1. سؤالك هنا (LO1) (المؤلف) [الوحدة 1] [مستوى الصعوبة: منخفض]\nأ. الخيار الأول\nب. الخيار الثاني*\nج. الخيار الثالث",
        essayPlaceholder: "أ) سؤال المقال الخاص بك هنا (LO2) (المؤلف) [الوحدة 1] [مستوى الصعوبة: منخفض]",
        tfPlaceholder: "1. سؤال صح/خطأ الخاص بك هنا (LO1) (المؤلف) [الوحدة 1] [مستوى الصعوبة: منخفض]\nصحيح*\nخطأ",
        fibPlaceholder: "1. سؤال إكمال الفراغ الخاص بك هنا (LO1) (المؤلف) [الوحدة 1] [مستوى الصعوبة: منخفض]\nالإجابة 1\nالإجابة 2",
        maPlaceholder: "1. سؤال الإجابة المتعددة الخاص بك هنا (LO1) (المؤلف) [الوحدة 1] [مستوى الصعوبة: منخفض]\nأ. الخيار الأول*\nب. الخيار الثاني*\nج. الخيار الثالث",
        matPlaceholder: "1. سؤال المطابقة الخاص بك هنا (LO1) (المؤلف) [الوحدة 1] [مستوى الصعوبة: منخفض]\nالإجابة1 المطابقة1\nالإجابة2 المطابقة2",
        numPlaceholder: "1. سؤالك الرقمي هنا (LO1) (المؤلف) [الوحدة 1] [مستوى الصعوبة: منخفض]\n42\n0.5"
    }
};

// Language management
function getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();
    return langCode === 'ar' ? 'ar' : 'en';
}

let currentLang = localStorage.getItem('language') || getBrowserLanguage();
window.currentLang = currentLang;

function setLanguage(lang) {
    currentLang = lang;
    window.currentLang = lang;
    localStorage.setItem('language', lang);
    
    // Update document direction
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            const text = translations[lang][key];
            
            if (element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = text;
            } else if (element.tagName === 'BUTTON') {
                element.textContent = text;
            } else if (element.tagName === 'P' || element.tagName === 'SPAN' || element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'A') {
                // Handle example texts with line breaks
                if (key.includes('Example')) {
                    element.innerHTML = text.replace(/\n/g, '<br>');
                } else {
                    element.textContent = text;
                }
            } else {
                element.textContent = text;
            }
        }
    });
    
    // Update textarea placeholders
    const placeholderMap = {
        'mcqText': 'mcqPlaceholder',
        'essayText': 'essayPlaceholder',
        'tfText': 'tfPlaceholder',
        'fibText': 'fibPlaceholder',
        'maText': 'maPlaceholder',
        'matText': 'matPlaceholder',
        'numText': 'numPlaceholder',
        'outputText': 'outputPlaceholder'
    };
    
    Object.keys(placeholderMap).forEach(textareaId => {
        const textarea = document.getElementById(textareaId);
        const key = placeholderMap[textareaId];
        if (textarea && translations[lang] && translations[lang][key]) {
            textarea.placeholder = translations[lang][key];
        }
    });
    
    // Update example texts
    const exampleMap = {
        'mcq-example': 'mcqExample',
        'essay-example': 'essayExample',
        'tf-example': 'tfExample',
        'fib-example': 'fibExample',
        'ma-example': 'maExample',
        'mat-example': 'matExample',
        'num-example': 'numExample'
    };
    
    Object.keys(exampleMap).forEach(exampleId => {
        const example = document.getElementById(exampleId);
        const key = exampleMap[exampleId];
        if (example && translations[lang] && translations[lang][key]) {
            example.innerHTML = translations[lang][key].replace(/\n/g, '<br>');
        }
    });
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function t(key) {
    return translations[currentLang][key] || translations.en[key] || key;
}

// Make functions globally available
window.setLanguage = setLanguage;
window.t = t;
window.currentLang = currentLang;

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
});
