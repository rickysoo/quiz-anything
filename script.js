class QuizGenerator {
    constructor() {
        try {
            console.log('QuizGenerator constructor called');
            this.questions = [];
            this.currentQuestionIndex = 0;
            this.userAnswers = [];
            this.questionCount = 10;
            this.difficulty = 'medium';
            this.currentTopic = null;
            this.currentInputType = null;
            this.currentFileContent = null;
            this.openaiApiKey = null;
            this.init();
        } catch (error) {
            console.error('Error in QuizGenerator constructor:', error);
        }
    }

    async initApiKey() {
        this.openaiApiKey = await this.getApiKey();
    }

    async getApiKey() {
        // For Vercel deployment - API key will be injected during build
        if (window.VERCEL_ENV_API_KEY) {
            return window.VERCEL_ENV_API_KEY;
        }
        
        // Local development fallback - check for config.local.js
        if (window.LOCAL_CONFIG && window.LOCAL_CONFIG.VITE_OPENAI_API_KEY) {
            return window.LOCAL_CONFIG.VITE_OPENAI_API_KEY;
        }
        
        // Fallback to localStorage for manual testing
        const localKey = localStorage.getItem('dev_api_key');
        if (localKey) {
            return localKey;
        }
        
        this.showNotification('OpenAI API key is required. Please set up local config or environment variable.', 'error');
        return null;
    }

    async init() {
        try {
            console.log('Initializing QuizGenerator...');
            await this.initApiKey();
            console.log('API key initialized');
            
            this.bindEvents();
            console.log('Events bound');
            
            this.setupInputToggle();
            console.log('Input toggle setup');
            
            this.setupQuestionCountSelector();
            console.log('Question count selector setup');
            
            this.setupDifficultySelector();
            console.log('Difficulty selector setup');
            
            this.registerServiceWorker();
            console.log('Service worker registered');
            
            console.log('QuizGenerator initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    bindEvents() {
        try {
            // Main quiz button
            const generateBtn = document.getElementById('generate-quiz');
            if (generateBtn) {
                generateBtn.addEventListener('click', () => this.generateQuiz());
            } else {
                console.error('Generate quiz button not found!');
            }
            
            // Navigation buttons
            const nextBtn = document.getElementById('next-btn');
            const prevBtn = document.getElementById('prev-btn');
            const submitBtn = document.getElementById('submit-quiz');
            const exitBtn = document.getElementById('exit-quiz');
            
            if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion());
            if (prevBtn) prevBtn.addEventListener('click', () => this.prevQuestion());
            if (submitBtn) submitBtn.addEventListener('click', () => this.submitQuiz());
            if (exitBtn) exitBtn.addEventListener('click', () => this.exitQuiz());
            
            // Results buttons
            const restartBtn = document.getElementById('restart-quiz');
            const sameTopicBtn = document.getElementById('same-topic-quiz');
            if (restartBtn) restartBtn.addEventListener('click', () => this.restart());
            if (sameTopicBtn) sameTopicBtn.addEventListener('click', () => this.retakeQuiz());
            
            // File upload
            const fileUpload = document.getElementById('file-upload');
            if (fileUpload) fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));
            
            // App title
            const appTitle = document.getElementById('app-title');
            if (appTitle) appTitle.addEventListener('click', () => this.goHome());
            
            // Clarification dialog events
            const backBtn = document.getElementById('back-to-topic');
            const confirmBtn = document.getElementById('confirm-clarification');
            if (backBtn) backBtn.addEventListener('click', () => this.hideClarificationDialog());
            if (confirmBtn) confirmBtn.addEventListener('click', () => this.handleClarificationConfirm());
            
            console.log('All event listeners bound successfully');
        } catch (error) {
            console.error('Error binding events:', error);
        }
    }

    setupInputToggle() {
        const radioButtons = document.querySelectorAll('input[name="inputType"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                const topicInput = document.getElementById('topic-input');
                const documentInput = document.getElementById('document-input');
                
                if (radio.value === 'topic') {
                    topicInput.classList.remove('hidden');
                    documentInput.classList.add('hidden');
                } else {
                    topicInput.classList.add('hidden');
                    documentInput.classList.remove('hidden');
                }
            });
        });
    }

    setupQuestionCountSelector() {
        const countButtons = document.querySelectorAll('.count-btn');
        countButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                countButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                // Update question count
                this.questionCount = parseInt(button.dataset.count);
                // Update button text with null checks
                const btnText = document.querySelector('.btn-text');
                const btnSubtitle = document.querySelector('.btn-subtitle');
                const totalQuestions = document.getElementById('total-questions');
                
                if (btnText) btnText.textContent = `Start the Quiz`;
                if (btnSubtitle) btnSubtitle.textContent = `${this.questionCount} questions`;
                if (totalQuestions) totalQuestions.textContent = this.questionCount;
            });
        });
    }

    setupDifficultySelector() {
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                difficultyButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                // Update difficulty
                this.difficulty = button.dataset.difficulty;
            });
        });
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('SW registered: ', registration);
            } catch (registrationError) {
                console.log('SW registration failed: ', registrationError);
            }
        }
    }

    detectLanguage(content) {
        
        // Standard content-based language detection
        const languagePatterns = {
            'es': /\b(el|la|los|las|de|en|un|una|con|por|para|que|se|es|son|está|están|tiene|tienen|muy|más|pero|como|cuando|donde|porque|si|no|sí|también|hasta|desde)\b/gi,
            'fr': /\b(le|la|les|de|du|des|un|une|et|ou|est|sont|avec|pour|dans|sur|par|ce|cette|ces|que|qui|se|ne|pas|très|plus|mais|comme|quand|où|parce|si|oui|non|aussi|jusqu|depuis)\b/gi,
            'de': /\b(der|die|das|den|dem|des|ein|eine|und|oder|ist|sind|mit|für|in|auf|von|zu|bei|nach|über|unter|zwischen|dass|wie|wenn|wo|weil|ob|ja|nein|auch|bis|seit)\b/gi,
            'it': /\b(il|la|lo|gli|le|di|da|in|con|su|per|tra|fra|che|se|è|sono|ha|hanno|molto|più|ma|come|quando|dove|perché|se|no|sì|anche|fino|da)\b/gi,
            'pt': /\b(o|a|os|as|de|em|um|uma|com|por|para|que|se|é|são|tem|têm|muito|mais|mas|como|quando|onde|porque|se|não|sim|também|até|desde)\b/gi,
            'ru': /\b(в|на|и|с|по|для|от|до|за|при|над|под|из|к|о|об|про|через|между|что|как|когда|где|почему|если|да|нет|также|уже|еще)\b/gi,
            'zh': /[\u4e00-\u9fff]/g,
            'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g,
            'ar': /[\u0600-\u06ff]/g,
            'nl': /\b(de|het|een|van|in|op|met|voor|door|naar|over|onder|tussen|dat|die|dit|deze|en|of|is|zijn|heeft|hebben|zeer|meer|maar|als|wanneer|waar|omdat|ja|nee|ook|tot|sinds)\b/gi,
            'ko': /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/g
        };

        let maxMatches = 0;
        let detectedLanguage = 'en';

        for (const [lang, pattern] of Object.entries(languagePatterns)) {
            const matches = content.match(pattern);
            const matchCount = matches ? matches.length : 0;
            if (matchCount > maxMatches) {
                maxMatches = matchCount;
                detectedLanguage = lang;
            }
        }

        // If no pattern matches significantly, default to English
        return maxMatches > 5 ? detectedLanguage : 'en';
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['.txt', '.md', '.csv', '.json', '.pdf', '.doc', '.docx', '.rtf', '.odt'];
            const fileName = file.name.toLowerCase();
            const isValidType = allowedTypes.some(type => fileName.endsWith(type));
            
            if (!isValidType) {
                this.showNotification('Please upload a text file, PDF, or Word document', 'error');
                event.target.value = '';
                return;
            }
            
            try {
                // Show loading state
                const fileContentDiv = document.getElementById('file-content');
                fileContentDiv.textContent = 'Processing file...';
                fileContentDiv.classList.remove('hidden');
                
                const text = await this.readFile(file);
                if (!text.trim()) {
                    this.showNotification('This file appears to be empty. Please try uploading a different file.', 'error');
                    fileContentDiv.classList.add('hidden');
                    return;
                }
                
                fileContentDiv.textContent = text.substring(0, 500) + (text.length > 500 ? '...' : '');
            } catch (error) {
                this.showNotification('Sorry, we couldn\'t read your file. Please try a different one.', 'error');
                document.getElementById('file-content').classList.add('hidden');
            }
        }
    }

    readFile(file) {
        return new Promise(async (resolve, reject) => {
            const fileName = file.name.toLowerCase();
            
            try {
                if (fileName.endsWith('.pdf')) {
                    // Handle PDF files
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    let text = '';
                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const pageText = content.items.map(item => item.str).join(' ');
                        text += pageText + '\n';
                    }
                    resolve(text);
                    
                } else if (fileName.endsWith('.docx')) {
                    // Handle DOCX files
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
                    resolve(result.value);
                    
                } else if (fileName.endsWith('.doc')) {
                    // DOC files are not fully supported by mammoth.js in browser
                    // Attempt to read as text, but warn user
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        // This is a fallback that may not work well for binary DOC files
                        const text = e.target.result;
                        if (text && text.length > 100) {
                            resolve(text);
                        } else {
                            reject(new Error('DOC files may not be fully supported. Please convert to DOCX or PDF for better results.'));
                        }
                    };
                    reader.onerror = () => reject(new Error('Error reading DOC file'));
                    reader.readAsText(file, 'UTF-8');
                    
                } else {
                    // Handle text-based files (.txt, .md, .csv, .json, .rtf, .odt)
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = () => reject(new Error('Error reading file'));
                    reader.readAsText(file, 'UTF-8');
                }
                
            } catch (error) {
                reject(new Error(`Error processing ${fileName}: ${error.message}`));
            }
        });
    }

    detectTopicAmbiguity(content) {
        const cleanContent = content.toLowerCase().trim();
        
        // Pattern-based ambiguity detection for broader coverage
        const ambiguityPatterns = [
            // Programming languages and technologies
            {
                pattern: /^(python|javascript|java|c\+\+|c#|ruby|php|go|rust|swift|kotlin|typescript|html|css|sql|react|angular|vue|node\.?js|express|django|flask|spring|laravel)$/i,
                createOptions: (topic) => [
                    { type: 'knowledge', label: `Knowledge about ${topic} (history, features, facts)`, description: `Learn about the ${topic} technology, its history, and characteristics` },
                    { type: 'skills', label: `${topic} programming/technical skills`, description: `Test practical coding abilities and technical implementation in ${topic}` }
                ]
            },
            // Human languages (supports many languages including non-Latin scripts)
            {
                pattern: /^(english|french|spanish|german|italian|portuguese|russian|chinese|japanese|korean|arabic|hindi|dutch|swedish|norwegian|danish|finnish|greek|turkish|hebrew|thai|vietnamese|indonesian|malay|filipino|tagalog|français|español|deutsch|italiano|português|русский|中文|日本語|한국어|العربية|हिन्दी|ελληνικά|türkçe|עברית|ไทย|tiếng việt|bahasa indonesia|bahasa melayu)$/i,
                createOptions: (topic) => [
                    { type: 'knowledge', label: `Knowledge about ${topic} (culture, history, countries)`, description: `Learn about the culture, history, and countries where ${topic} is spoken` },
                    { type: 'skills', label: `${topic} language skills (grammar, vocabulary, comprehension)`, description: `Test practical language abilities and fluency in ${topic}` }
                ]
            },
            // Countries and regions
            {
                pattern: /^(china|japan|korea|france|germany|spain|italy|russia|brazil|mexico|india|canada|australia|england|britain|uk|usa|america|中国|日本|韩国|한국|フランス|ドイツ|スペイン|イタリア|ロシア|ブラジル|メキシコ|インド|カナダ|オーストラリア|イギリス|アメリカ)$/i,
                createOptions: (topic) => [
                    { type: 'knowledge', label: `General knowledge about ${topic}`, description: `Test knowledge about geography, politics, current events, and general facts` },
                    { type: 'culture', label: `${topic} culture and history`, description: `Focus on cultural traditions, historical events, and social aspects` },
                    { type: 'language', label: `${topic} language proficiency`, description: `Test language skills if you want to practice the local language` }
                ]
            },
            // Academic subjects that could be theoretical or practical
            {
                pattern: /^(mathematics|math|physics|chemistry|biology|economics|psychology|philosophy|statistics|calculus|algebra|geometry|organic chemistry|biochemistry|molecular biology|microeconomics|macroeconomics|cognitive psychology|social psychology|logic|ethics|data science|machine learning|artificial intelligence|ai|ml)$/i,
                createOptions: (topic) => [
                    { type: 'theory', label: `${topic} theory and concepts`, description: `Test theoretical knowledge, definitions, and conceptual understanding` },
                    { type: 'application', label: `${topic} practical application`, description: `Focus on problem-solving, real-world applications, and hands-on skills` }
                ]
            },
            // Business and professional topics
            {
                pattern: /^(marketing|finance|accounting|management|business|economics|law|medicine|engineering|design|architecture|project management|digital marketing|financial planning|corporate law|medical practice|software engineering|graphic design)$/i,
                createOptions: (topic) => [
                    { type: 'theory', label: `${topic} theory and principles`, description: `Test theoretical knowledge and fundamental concepts` },
                    { type: 'practice', label: `${topic} practical skills`, description: `Focus on real-world application and professional practice` }
                ]
            },
            // Arts and creative fields
            {
                pattern: /^(music|art|painting|drawing|photography|writing|literature|poetry|dance|theater|film|cinema|sculpture|design)$/i,
                createOptions: (topic) => [
                    { type: 'history', label: `${topic} history and theory`, description: `Learn about the history, movements, and theoretical aspects` },
                    { type: 'technique', label: `${topic} techniques and practice`, description: `Focus on practical skills, methods, and creative techniques` }
                ]
            },
            // Sports and activities
            {
                pattern: /^(football|soccer|basketball|tennis|baseball|golf|swimming|running|cycling|yoga|fitness|boxing|martial arts|chess|poker)$/i,
                createOptions: (topic) => [
                    { type: 'knowledge', label: `${topic} rules and history`, description: `Test knowledge about rules, history, famous players/events` },
                    { type: 'technique', label: `${topic} techniques and strategy`, description: `Focus on practical skills, techniques, and strategic knowledge` }
                ]
            }
        ];
        
        // Check each pattern to see if it matches
        for (const ambiguityPattern of ambiguityPatterns) {
            const match = cleanContent.match(ambiguityPattern.pattern);
            if (match) {
                const topic = match[1]; // Get the captured topic name
                return ambiguityPattern.createOptions(topic);
            }
        }
        
        // Generic fallback for any single-word topic that might be ambiguous
        if (cleanContent.split(' ').length === 1 && cleanContent.length > 2) {
            return [
                { type: 'general', label: `General knowledge about ${cleanContent}`, description: `Test broad factual knowledge and current information` },
                { type: 'deep', label: `In-depth ${cleanContent} expertise`, description: `Focus on detailed, specialized knowledge for experts` },
                { type: 'practical', label: `Practical ${cleanContent} skills`, description: `Test hands-on abilities and real-world application` }
            ];
        }
        
        return null; // No ambiguity detected
    }

    detectDocumentAmbiguity(content) {
        // For documents, analyze content to suggest different quiz approaches
        const contentLength = content.length;
        const hasCodeSnippets = /```|function\s+\w+|class\s+\w+|import\s+|from\s+\w+|<\w+>|{[\s\S]*}/.test(content);
        const hasFormulas = /\$.*\$|\\[a-zA-Z]+|∫|∑|√|≤|≥|∞|α|β|γ|δ|θ|λ|μ|π|σ|φ|ψ|ω/.test(content);
        const hasBusinessTerms = /revenue|profit|budget|strategy|management|marketing|sales|customer|client|stakeholder|ROI|KPI|B2B|B2C/.test(content.toLowerCase());
        const hasScientificTerms = /hypothesis|experiment|data|analysis|research|study|methodology|results|conclusion|correlation|variable/.test(content.toLowerCase());
        
        // Only show clarification for longer documents that could benefit from different approaches
        if (contentLength > 500) {
            const options = [
                { type: 'general', label: 'General comprehension quiz', description: 'Test overall understanding of the main concepts and facts' }
            ];
            
            if (hasCodeSnippets) {
                options.push({ type: 'code', label: 'Code-focused quiz', description: 'Focus on programming concepts, syntax, and technical implementation' });
            }
            
            if (hasFormulas) {
                options.push({ type: 'technical', label: 'Technical/mathematical quiz', description: 'Focus on formulas, calculations, and technical concepts' });
            }
            
            if (hasBusinessTerms) {
                options.push({ type: 'business', label: 'Business application quiz', description: 'Focus on practical business applications and strategic thinking' });
            }
            
            if (hasScientificTerms) {
                options.push({ type: 'analytical', label: 'Research and analysis quiz', description: 'Focus on methodology, data interpretation, and critical thinking' });
            }
            
            // Add detailed vs. broad option for any substantial document
            options.push({ type: 'detailed', label: 'Detailed knowledge quiz', description: 'Test specific details, facts, and precise information from the document' });
            
            // Only show clarification if we have multiple meaningful options
            if (options.length > 2) {
                return options;
            }
        }
        
        return null;
    }

    async validateContent(content, inputType) {
        // Basic validation checks first
        if (!content || content.trim().length < 2) {
            return {
                isValid: false,
                message: 'Please write a bit more so we can create good questions for you.'
            };
        }

        // Check for mostly gibberish or random characters
        const meaningfulWordRatio = this.calculateMeaningfulWordRatio(content);
        if (meaningfulWordRatio < 0.2) {
            return {
                isValid: false,
                message: 'This doesn\'t look like a real topic. Please try writing something we can create questions about.'
            };
        }

        // Use OpenAI to validate content suitability
        try {
            const validationPrompt = `Analyze the following content and determine if it's suitable for creating educational quiz questions. 

Content: "${content.substring(0, 1000)}"

Respond with only a JSON object in this format:
{
  "suitable": true/false,
  "reason": "brief explanation",
  "suggestions": "suggestions if not suitable"
}

Content is suitable if it contains educational, factual, or informational material, including:
- Academic topics and subjects
- Technical terms, acronyms, and professional frameworks (e.g., "EPF RIA framework", "API development", "GDPR compliance")
- Business and financial concepts
- Scientific and medical terminology
- Technology and programming topics
- Current events and policy discussions
- Professional certifications and standards

Content is NOT suitable if it's:
- Just random text, symbols, or truly meaningless gibberish (not legitimate technical terms)
- Personal information like contact lists or addresses
- Code/data dumps without any educational context
- Pure creative writing without factual content
- Simple lists without educational value

IMPORTANT: Be accepting of technical terms, acronyms, and specialized vocabulary that may appear unusual but are legitimate educational topics.`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a content validator for educational quiz generation. Respond only with valid JSON.'
                        },
                        {
                            role: 'user',
                            content: validationPrompt
                        }
                    ],
                    max_tokens: 300
                })
            });

            if (response.ok) {
                const data = await response.json();
                let responseText = data.choices[0].message.content.trim();
                
                // Clean response
                responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    responseText = jsonMatch[0];
                }

                const validation = JSON.parse(responseText);
                
                if (!validation.suitable) {
                    let message = `This content is not suitable for creating quiz questions.\n\nReason: ${validation.reason}`;
                    if (validation.suggestions) {
                        message += `\n\nSuggestions: ${validation.suggestions}`;
                    }
                    return {
                        isValid: false,
                        message: message
                    };
                }
            }
        } catch (error) {
            console.warn('Content validation API call failed, proceeding with basic validation:', error);
        }

        return { isValid: true };
    }

    isLegitimateAcronymOrTechnicalTerm(word) {
        // Common legitimate acronyms and technical terms
        const legitimateTerms = [
            // Financial/Investment
            'EPF', 'RIA', 'ETF', 'IPO', 'ROI', 'P2P', 'KYC', 'AML', 'ESG', 'REIT',
            // Technology
            'API', 'SDK', 'JSON', 'HTML', 'CSS', 'SQL', 'REST', 'HTTP', 'TCP', 'IP', 'DNS', 'VPN',
            'AI', 'ML', 'IoT', 'AR', 'VR', 'GPU', 'CPU', 'RAM', 'SSD', 'HDD', 'USB', 'HDMI',
            'AWS', 'GCP', 'CI', 'CD', 'DevOps', 'UI', 'UX', 'SaaS', 'PaaS', 'IaaS',
            // Business
            'B2B', 'B2C', 'CRM', 'ERP', 'HR', 'PR', 'SEO', 'SEM', 'KPI', 'ROI', 'CTA', 'MVP',
            // Science/Medical
            'DNA', 'RNA', 'PCR', 'MRI', 'CT', 'HIV', 'COVID', 'WHO', 'FDA', 'CDC',
            // Education
            'STEM', 'MBA', 'PhD', 'GPA', 'SAT', 'ACT', 'MOOC', 'LMS',
            // Legal/Regulatory
            'GDPR', 'HIPAA', 'SEC', 'FTC', 'USPTO', 'DMCA', 'SOX', 'PCI', 'DSS',
            // Organizations
            'NATO', 'UN', 'EU', 'ASEAN', 'IMF', 'WTO', 'WHO', 'UNESCO'
        ];
        
        const upperWord = word.toUpperCase();
        return legitimateTerms.includes(upperWord);
    }

    calculateMeaningfulWordRatio(content) {
        // For non-Latin scripts (Chinese, Arabic, etc.), treat the entire content as meaningful
        // if it contains Unicode characters from major writing systems
        const hasUnicodeText = /[\u4e00-\u9fff\u3400-\u4dbf\u0600-\u06ff\u0750-\u077f\uac00-\ud7af\u3040-\u309f\u30a0-\u30ff]/.test(content);
        if (hasUnicodeText) {
            // Content contains Chinese, Arabic, Korean, or Japanese characters - treat as meaningful
            return 1.0;
        }
        
        const words = content.split(/\s+/).filter(word => word.length > 0);
        if (words.length === 0) return 0;

        const meaningfulWords = words.filter(word => {
            // Check if it's a legitimate acronym or technical term first
            if (this.isLegitimateAcronymOrTechnicalTerm(word)) {
                return true;
            }
            
            // Remove punctuation and check if word contains mostly letters or Unicode characters
            const cleanWord = word.replace(/[^\w]/g, '');
            const latinLetterCount = (cleanWord.match(/[a-zA-Z]/g) || []).length;
            const numberCount = (cleanWord.match(/[0-9]/g) || []).length;
            const unicodeCharCount = (cleanWord.match(/[\u0080-\uffff]/g) || []).length;
            
            // Allow words with letters, numbers, Unicode characters, or mixed
            if (cleanWord.length > 1) {
                // Pure Latin letters (traditional English words)
                if (latinLetterCount / cleanWord.length > 0.6) return true;
                // Mixed alphanumeric (technical terms, version numbers, etc.)
                if ((latinLetterCount + numberCount) / cleanWord.length > 0.8) return true;
                // Pure numbers (years, quantities, etc.) if reasonably sized
                if (numberCount === cleanWord.length && cleanWord.length >= 2 && cleanWord.length <= 6) return true;
                // Unicode characters (non-Latin scripts)
                if (unicodeCharCount > 0) return true;
            }
            
            return false;
        });

        return meaningfulWords.length / words.length;
    }

    async generateQuiz() {
        const inputType = document.querySelector('input[name="inputType"]:checked').value;
        let content = '';

        if (inputType === 'topic') {
            content = document.getElementById('topic-text').value.trim();
            if (!content) {
                this.showNotification('Please tell us what you\'d like to be quizzed on', 'warning');
                return;
            }
            
            // Check for topic ambiguity only for topic input
            const ambiguityOptions = this.detectTopicAmbiguity(content);
            if (ambiguityOptions) {
                this.showClarificationDialog(content, ambiguityOptions);
                return;
            }
        } else {
            const fileInput = document.getElementById('file-upload');
            if (!fileInput.files[0]) {
                this.showNotification('Please upload a file first', 'warning');
                return;
            }
            content = await this.readFile(fileInput.files[0]);
            
            // Check for document ambiguity
            const ambiguityOptions = this.detectDocumentAmbiguity(content);
            if (ambiguityOptions) {
                this.showClarificationDialog('Document Content', ambiguityOptions);
                return;
            }
        }

        // Continue with quiz generation
        this.proceedWithQuizGeneration(content, inputType);
    }

    showClarificationDialog(topic, options) {
        // Hide input section and show clarification
        document.getElementById('topic-input').classList.add('hidden');
        document.getElementById('generate-quiz').classList.add('hidden');
        document.getElementById('topic-clarification').classList.remove('hidden');
        
        // Populate clarification options
        const optionsContainer = document.getElementById('clarification-options');
        optionsContainer.innerHTML = options.map((option, index) => `
            <label class="clarification-option">
                <input type="radio" name="clarificationType" value="${option.type}" data-topic="${topic}">
                <div class="clarification-option-content">
                    <div class="clarification-option-label">${option.label}</div>
                    <div class="clarification-option-description">${option.description}</div>
                </div>
            </label>
        `).join('');
        
        // Add event listeners for newly created radio buttons
        document.querySelectorAll('input[name="clarificationType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Update visual selection
                document.querySelectorAll('.clarification-option').forEach(option => {
                    option.classList.remove('selected');
                });
                radio.closest('.clarification-option').classList.add('selected');
                
                // Enable continue button
                document.getElementById('confirm-clarification').disabled = false;
            });
        });
    }

    handleClarificationConfirm() {
        const selectedOption = document.querySelector('input[name="clarificationType"]:checked');
        if (selectedOption) {
            const topic = selectedOption.dataset.topic;
            const type = selectedOption.value;
            this.hideClarificationDialog();
            this.proceedWithQuizGeneration(topic, 'topic', type);
        }
    }

    hideClarificationDialog() {
        document.getElementById('topic-clarification').classList.add('hidden');
        document.getElementById('topic-input').classList.remove('hidden');
        document.getElementById('generate-quiz').classList.remove('hidden');
        document.getElementById('confirm-clarification').disabled = true;
    }

    async proceedWithQuizGeneration(content, inputType, clarificationType = null) {
        // Store current quiz parameters for retaking
        this.currentTopic = content;
        this.currentInputType = inputType;
        this.currentClarificationType = clarificationType;

        const generateBtn = document.getElementById('generate-quiz');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Checking your topic...';

        try {
            // Validate content first
            const validationResult = await this.validateContent(content, inputType);
            if (!validationResult.isValid) {
                this.showNotification(validationResult.message, 'error');
                return;
            }

            if (!this.openaiApiKey) {
                this.showNotification('Please enter your OpenAI API key to continue.', 'error');
                return;
            }
            
            generateBtn.textContent = 'Creating your quiz...';
            // Detect language of content
            const detectedLanguage = this.detectLanguage(content);
            this.questions = await this.generateMCQsWithOpenAI(content, inputType, detectedLanguage, this.difficulty, clarificationType);
            this.userAnswers = new Array(this.questionCount).fill(null);
            this.currentQuestionIndex = 0;
            
            // Show success notification
            if (inputType === 'topic') {
                this.showNotification(`🎉 Your quiz is ready! ${this.questionCount} questions based on the latest information.`, 'success');
            } else {
                this.showNotification(`🎉 Quiz created from your document! ${this.questionCount} questions ready.`, 'success');
            }
            
            this.showQuizSection();
            this.displayCurrentQuestion();
        } catch (error) {
            this.showNotification('Sorry, there was a problem creating your quiz. Please try again.', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <span class="btn-icon">🚀</span>
                <span class="btn-text">Start the Quiz</span>
                <span class="btn-subtitle">${this.questionCount} questions</span>
            `;
        }
    }

    async generateMCQsWithOpenAI(content, inputType, language = 'en', difficulty = 'medium', clarificationType = null) {
        const languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ar': 'Arabic',
            'nl': 'Dutch',
            'ko': 'Korean'
        };

        const languageName = languageNames[language] || 'English';
        const languageInstruction = language === 'en' ? '' : `Generate all questions and answers in ${languageName}. `;

        const difficultyDescriptions = {
            'easy': 'Easy difficulty: Generate BASIC introductory questions suitable for beginners. Focus ONLY on: simple definitions, basic facts, fundamental concepts, who/what/when questions. Avoid analysis, application, or complex reasoning. Use simple vocabulary and straightforward questions.',
            'medium': 'Medium difficulty: Generate questions that require APPLICATION and moderate analysis. Focus on: practical scenarios, how/why questions, comparing concepts, problem-solving, cause-and-effect relationships. Require some thinking beyond basic recall.',
            'hard': 'Hard difficulty: Generate ADVANCED questions requiring EXPERT knowledge. Focus on: complex case studies, multi-step reasoning, synthesis of multiple concepts, evaluation and critique, latest cutting-edge developments, expert-level analysis, hypothetical scenarios requiring deep understanding.'
        };

        const difficultyInstruction = difficultyDescriptions[difficulty] || difficultyDescriptions['medium'];

        const currentYear = new Date().getFullYear();
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Generate appropriate prompt based on clarification type
        let topicPrompt = '';
        if (clarificationType === 'skills') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions to test PRACTICAL SKILLS in "${content}". 

SKILL-BASED FOCUS:
- For programming languages: Test syntax, code reading/writing, debugging, problem-solving, algorithm implementation
- For human languages: Test grammar, vocabulary, comprehension, proper usage, sentence structure
- Show actual code snippets, sentences, or practical examples
- Focus on what users can DO with the knowledge, not facts ABOUT the subject
- Include questions about functionality, output, errors, best practices, and real-world application
- Avoid historical facts, creator information, or theoretical background`;
        } else if (clarificationType === 'theory' || clarificationType === 'knowledge') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions about THEORETICAL KNOWLEDGE and CONCEPTS in "${content}".

THEORY-FOCUSED APPROACH:
- Focus on fundamental principles, definitions, and conceptual understanding
- Test knowledge of theories, models, frameworks, and academic concepts
- Include questions about historical development, key figures, and foundational ideas
- Emphasize understanding of why things work the way they do
- Cover theoretical frameworks and academic perspectives`;
        } else if (clarificationType === 'application' || clarificationType === 'practice' || clarificationType === 'practical') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions about PRACTICAL APPLICATION in "${content}".

APPLICATION-FOCUSED APPROACH:
- Focus on real-world scenarios and practical problem-solving
- Test ability to apply concepts to actual situations
- Include case studies, examples, and hands-on applications
- Emphasize practical skills and implementation
- Cover best practices and real-world challenges`;
        } else if (clarificationType === 'culture') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions about CULTURE AND SOCIETY in "${content}".

CULTURAL FOCUS:
- Focus on traditions, customs, social practices, and cultural norms
- Test knowledge of art, music, literature, food, and celebrations
- Include questions about social structure, values, and beliefs
- Cover cultural history and contemporary cultural trends
- Emphasize cultural diversity and unique characteristics`;
        } else if (clarificationType === 'language') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions to test LANGUAGE PROFICIENCY related to "${content}".

LANGUAGE PROFICIENCY FOCUS:
- Test grammar, vocabulary, sentence structure, and comprehension
- Include questions in the target language when appropriate
- Focus on practical communication skills
- Test understanding of language rules and proper usage
- Avoid cultural or historical questions about the language`;
        } else if (clarificationType === 'technique') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions about TECHNIQUES AND METHODS in "${content}".

TECHNIQUE-FOCUSED APPROACH:
- Focus on specific methods, strategies, and technical approaches
- Test knowledge of how to perform specific actions or procedures
- Include questions about best practices and optimal techniques
- Cover step-by-step processes and methodologies
- Emphasize practical implementation of techniques`;
        } else if (clarificationType === 'deep' || clarificationType === 'detailed') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions requiring DEEP, EXPERT-LEVEL knowledge about "${content}".

EXPERT-LEVEL FOCUS:
- Focus on advanced, specialized knowledge and intricate details
- Test understanding of complex relationships and nuanced concepts
- Include questions that require synthesis of multiple ideas
- Cover cutting-edge developments and latest research
- Emphasize depth over breadth of knowledge`;
        } else if (clarificationType === 'code') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions focusing on CODE AND PROGRAMMING CONCEPTS from the document.

CODE-FOCUSED APPROACH:
- Focus on programming concepts, syntax, and technical implementation
- Test understanding of code structure, logic, and functionality
- Include questions about debugging, optimization, and best practices
- Cover programming patterns and technical architecture
- Emphasize code analysis and problem-solving skills`;
        } else if (clarificationType === 'technical') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions focusing on TECHNICAL AND MATHEMATICAL CONCEPTS from the document.

TECHNICAL FOCUS:
- Focus on formulas, calculations, and technical specifications
- Test understanding of mathematical relationships and technical principles
- Include questions about problem-solving and analytical thinking
- Cover technical methodologies and systematic approaches
- Emphasize precision and technical accuracy`;
        } else if (clarificationType === 'business') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions focusing on BUSINESS APPLICATIONS AND STRATEGY from the document.

BUSINESS-FOCUSED APPROACH:
- Focus on practical business applications and strategic thinking
- Test understanding of business implications and commercial value
- Include questions about implementation, ROI, and business outcomes
- Cover management decisions and strategic considerations
- Emphasize real-world business scenarios`;
        } else if (clarificationType === 'analytical') {
            topicPrompt = `Generate exactly ${this.questionCount} multiple choice questions focusing on RESEARCH METHODOLOGY AND ANALYSIS from the document.

ANALYTICAL FOCUS:
- Focus on research methods, data interpretation, and critical thinking
- Test understanding of analytical frameworks and evaluation criteria
- Include questions about hypothesis testing and evidence analysis
- Cover methodology validation and research design
- Emphasize critical evaluation and analytical reasoning`;
        } else {
            // Default general approach
            topicPrompt = `Search for the latest information about "${content}" and generate exactly ${this.questionCount} multiple choice questions based on current, up-to-date information as of ${currentDate}. 

GENERAL KNOWLEDGE FOCUS:
- Look up recent developments, current statistics, latest research, and up-to-date facts about "${content}"
- Include questions about recent events, current leaders, latest discoveries, or recent changes in this field
- Test factual knowledge, historical information, features, and characteristics
- Ensure all factual information is accurate as of ${currentYear}
- Prioritize information from the last 2-3 years when relevant`;
        }

        const prompt = inputType === 'topic' 
            ? `${topicPrompt}

DIFFICULTY LEVEL: ${difficultyInstruction}

QUESTION DIVERSITY & UNIQUENESS REQUIREMENTS:
- Ensure all ${this.questionCount} questions are completely unique and cover different aspects of "${content}"
- Avoid creating questions that test the same fact, concept, or information in different ways
- Make sure no two questions have overlapping, similar, or related correct answers
- Distribute questions across different subtopics, time periods, or aspects when possible
- Vary question types appropriate to difficulty level: for Easy (factual recall, simple definitions), for Medium (application, comparison, moderate reasoning), for Hard (analysis, synthesis, evaluation)
- Avoid repetitive question patterns, structures, or phrasings
- Each question should focus on a distinctly different piece of information or concept

${languageInstruction}IMPORTANT: Respond ONLY with a valid JSON array. No other text before or after. Each question object must have exactly these fields:
- question: string (the question text in ${languageName}, incorporating latest information)
- options: array of exactly 4 strings (the answer choices in ${languageName})
- correct: number (index 0-3 of the correct option)
- explanation: string (brief explanation of why the correct answer is right and why other options are incorrect)

Focus on creating questions that test knowledge of:
1. Recent developments and current state
2. Latest statistics or data
3. Current key figures or leaders
4. Recent discoveries or innovations
5. Current best practices or methods

Example format:
[
  {
    "question": "What is the latest development in artificial intelligence as of ${currentYear}?",
    "options": ["GPT-3 release", "ChatGPT launch", "GPT-4 improvements", "Current AI advancement"],
    "correct": 3,
    "explanation": "Current AI advancement is correct as it represents the most recent developments. GPT-3 and ChatGPT are from earlier years, while GPT-4 improvements, though recent, are not the absolute latest advancement in the field."
  }
]`
            : `Generate exactly ${this.questionCount} multiple choice questions based on this document content: "${content.substring(0, 2000)}". 

If the document contains topics that would benefit from current information, search for recent updates and developments related to the document's subject matter to enhance the questions.

DIFFICULTY LEVEL: ${difficultyInstruction}

QUESTION DIVERSITY & UNIQUENESS REQUIREMENTS:
- Ensure all ${this.questionCount} questions are completely unique and cover different sections, concepts, or aspects of the document
- Avoid creating questions that test the same information, fact, or concept from the document in different ways
- Make sure no two questions have overlapping, similar, or related correct answers
- Distribute questions across different parts of the document when possible
- Vary question types: include factual recall, conceptual understanding, application, interpretation, and analysis questions
- Avoid repetitive question patterns, structures, or phrasings
- Each question should focus on a distinctly different piece of information or concept from the document

${languageInstruction}IMPORTANT: Respond ONLY with a valid JSON array. No other text before or after. Each question object must have exactly these fields:
- question: string (the question text in ${languageName}, incorporating document content and relevant current information)
- options: array of exactly 4 strings (the answer choices in ${languageName})  
- correct: number (index 0-3 of the correct option)
- explanation: string (brief explanation of why the correct answer is right and why other options are incorrect)

Example format:
[
  {
    "question": "Based on the document and current information, what is the main topic discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1,
    "explanation": "Option B is correct because the document primarily focuses on this topic as evidenced by the main sections and key points discussed. The other options are either tangential topics or not covered in the document."
  }
]`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini-search-preview',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an advanced quiz generator with search capabilities. Search for the latest information when creating questions to ensure accuracy and currentness. You must respond ONLY with valid JSON arrays containing question objects. No explanations, no markdown formatting, no additional text.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        let content_text = data.choices[0].message.content.trim();
        
        // Remove any markdown code block formatting
        content_text = content_text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find JSON array in the response
        const jsonMatch = content_text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            content_text = jsonMatch[0];
        }
        
        try {
            const questions = JSON.parse(content_text);
            
            // Validate the structure
            if (!Array.isArray(questions)) {
                throw new Error('Response is not an array');
            }
            
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correct !== 'number') {
                    throw new Error(`Invalid question structure at index ${i}`);
                }
                if (q.correct < 0 || q.correct > 3) {
                    throw new Error(`Invalid correct answer index at question ${i}`);
                }
            }
            
            return questions.slice(0, this.questionCount);
        } catch (parseError) {
            console.error('Parse error:', parseError);
            console.error('Raw response:', content_text);
            throw new Error(`Failed to parse questions from OpenAI response: ${parseError.message}`);
        }
    }

    generateTopicBasedQuestions(topic) {
        const questionTemplates = {
            'javascript': [
                {
                    question: "What is the correct way to declare a variable in JavaScript?",
                    options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
                    correct: 0
                },
                {
                    question: "Which method is used to add an element to the end of an array?",
                    options: ["push()", "add()", "append()", "insert()"],
                    correct: 0
                },
                {
                    question: "What does '===' operator do in JavaScript?",
                    options: ["Assigns value", "Compares value only", "Compares value and type", "Declares variable"],
                    correct: 2
                }
            ],
            'history': [
                {
                    question: "In which year did World War II end?",
                    options: ["1944", "1945", "1946", "1947"],
                    correct: 1
                },
                {
                    question: "Who was the first President of the United States?",
                    options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
                    correct: 2
                }
            ],
            'science': [
                {
                    question: "What is the chemical symbol for water?",
                    options: ["H2O", "HO2", "H3O", "OH2"],
                    correct: 0
                },
                {
                    question: "What is the powerhouse of the cell?",
                    options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic reticulum"],
                    correct: 1
                }
            ]
        };

        const topicLower = topic.toLowerCase();
        let selectedQuestions = [];

        if (topicLower.includes('javascript') || topicLower.includes('js')) {
            selectedQuestions = questionTemplates.javascript;
        } else if (topicLower.includes('history') || topicLower.includes('war')) {
            selectedQuestions = questionTemplates.history;
        } else if (topicLower.includes('science') || topicLower.includes('biology') || topicLower.includes('chemistry')) {
            selectedQuestions = questionTemplates.science;
        }

        const generatedQuestions = [];
        
        for (let i = 0; i < 20; i++) {
            if (selectedQuestions.length > 0) {
                const baseQuestion = selectedQuestions[i % selectedQuestions.length];
                generatedQuestions.push({
                    question: `${baseQuestion.question} (Question ${i + 1})`,
                    options: [...baseQuestion.options],
                    correct: baseQuestion.correct
                });
            } else {
                generatedQuestions.push({
                    question: `Sample question about ${topic} - Question ${i + 1}?`,
                    options: [`Option A for ${topic}`, `Option B for ${topic}`, `Option C for ${topic}`, `Option D for ${topic}`],
                    correct: Math.floor(Math.random() * 4)
                });
            }
        }

        return generatedQuestions;
    }

    generateDocumentBasedQuestions(content) {
        const words = content.split(/\s+/).filter(word => word.length > 3);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const questions = [];

        for (let i = 0; i < 20; i++) {
            if (sentences.length > i) {
                const sentence = sentences[i].trim();
                const words_in_sentence = sentence.split(/\s+/);
                
                if (words_in_sentence.length > 5) {
                    const keyWord = words_in_sentence[Math.floor(words_in_sentence.length / 2)];
                    const options = [
                        keyWord,
                        words[Math.floor(Math.random() * words.length)],
                        words[Math.floor(Math.random() * words.length)],
                        words[Math.floor(Math.random() * words.length)]
                    ].filter((v, i, a) => a.indexOf(v) === i);
                    
                    while (options.length < 4) {
                        options.push(`Option ${options.length + 1}`);
                    }
                    
                    questions.push({
                        question: `Based on the document, what word best fits in this context: "${sentence.replace(keyWord, '____')}"?`,
                        options: this.shuffleArray([...options]),
                        correct: 0
                    });
                }
            } else {
                questions.push({
                    question: `Question ${i + 1} based on the document content?`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    correct: Math.floor(Math.random() * 4)
                });
            }
        }

        return questions;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showQuizSection() {
        document.getElementById('input-section').classList.add('hidden');
        document.getElementById('quiz-section').classList.remove('hidden');
        document.getElementById('results-section').classList.add('hidden');
    }

    displayCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const container = document.getElementById('quiz-container');
        
        container.innerHTML = `
            <div class="question">
                <h3>Question ${this.currentQuestionIndex + 1}</h3>
                <p>${question.question}</p>
                <div class="options">
                    ${question.options.map((option, index) => `
                        <label class="option">
                            <input type="radio" name="answer" value="${index}" 
                                   ${this.userAnswers[this.currentQuestionIndex] === index ? 'checked' : ''}>
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = this.questionCount;
        
        const answerInputs = container.querySelectorAll('input[name="answer"]');
        answerInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.userAnswers[this.currentQuestionIndex] = parseInt(e.target.value);
            });
        });

        this.updateNavigationButtons();
        this.updateProgressBar();
    }

    updateProgressBar() {
        const progressPercentage = ((this.currentQuestionIndex + 1) / this.questionCount) * 100;
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
    }

    updateNavigationButtons() {
        document.getElementById('prev-btn').disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.questionCount - 1) {
            document.getElementById('next-btn').classList.add('hidden');
            document.getElementById('submit-quiz').classList.remove('hidden');
        } else {
            document.getElementById('next-btn').classList.remove('hidden');
            document.getElementById('submit-quiz').classList.add('hidden');
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questionCount - 1) {
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
        }
    }

    submitQuiz() {
        const unanswered = this.userAnswers.filter(answer => answer === null).length;
        
        if (unanswered > 0) {
            if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
                return;
            }
        }

        this.calculateResults();
    }

    calculateResults() {
        let correctAnswers = 0;
        const results = [];

        this.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.correct;
            
            if (isCorrect) correctAnswers++;
            
            results.push({
                questionNumber: index + 1,
                question: question.question,
                userAnswer: userAnswer !== null ? question.options[userAnswer] : 'Not answered',
                correctAnswer: question.options[question.correct],
                isCorrect: isCorrect,
                explanation: question.explanation || ''
            });
        });

        this.displayResults(correctAnswers, results);
    }

    displayResults(correctAnswers, results) {
        const percentage = Math.round((correctAnswers / this.questionCount) * 100);
        
        document.getElementById('quiz-section').classList.add('hidden');
        document.getElementById('results-section').classList.remove('hidden');
        
        // Show the "Quiz Same Topic Again" button if we have a topic to retake
        const sameTopicBtn = document.getElementById('same-topic-quiz');
        if (this.currentTopic) {
            sameTopicBtn.classList.remove('hidden');
        } else {
            sameTopicBtn.classList.add('hidden');
        }
        
        document.getElementById('score-display').innerHTML = `
            <div class="score-summary">
                <h3>Your Score: ${correctAnswers}/${this.questionCount} (${percentage}%)</h3>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        
        // Generate performance report
        this.generatePerformanceReport(correctAnswers, results, percentage);
        
        const detailedResults = document.getElementById('detailed-results');
        
        // Hide detailed results if running in iframe
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
            detailedResults.classList.add('hidden');
        } else {
            detailedResults.classList.remove('hidden');
            detailedResults.innerHTML = `
                <h4>Detailed Results</h4>
                <div class="results-list">
                    ${results.map(result => `
                        <div class="result-item ${result.isCorrect ? 'correct' : 'incorrect'}">
                            <div class="result-header">
                                <span class="question-number">Q${result.questionNumber}</span>
                                <span class="result-status">${result.isCorrect ? '✓' : '✗'}</span>
                            </div>
                            <div class="result-details">
                                <p><strong>Question:</strong> ${result.question}</p>
                                <p><strong>Your Answer:</strong> ${result.userAnswer}</p>
                                ${!result.isCorrect ? `<p><strong>Correct Answer:</strong> ${result.correctAnswer}</p>` : ''}
                                ${result.explanation ? `<p class="explanation"><strong>Explanation:</strong> ${result.explanation}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    generatePerformanceReport(correctAnswers, results, percentage) {
        const reportContainer = document.getElementById('performance-report');
        
        // Calculate performance metrics
        const performanceLevel = this.getPerformanceLevel(percentage);
        const averageTime = "N/A"; // Could be calculated if we track time
        const strongAreas = this.identifyStrongAreas(results);
        const improvementAreas = this.identifyImprovementAreas(results);
        const insights = this.generateInsights(percentage, results);
        
        reportContainer.innerHTML = `
            <div class="performance-report">
                <div class="performance-header">
                    <h3>📈 Performance Analysis</h3>
                </div>
                
                <div class="performance-stats">
                    <div class="stat-card">
                        <div class="stat-number ${performanceLevel.class}">${percentage}%</div>
                        <div class="stat-label">Accuracy</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number ${performanceLevel.class}">${correctAnswers}/${this.questionCount}</div>
                        <div class="stat-label">Correct Answers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.questionCount - correctAnswers}</div>
                        <div class="stat-label">Missed Questions</div>
                    </div>
                </div>
                
                <div class="performance-insights">
                    <h4>🎯 Performance Insights</h4>
                    <ul class="insight-list">
                        ${insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                </div>
                
                ${strongAreas.length > 0 ? `
                    <div class="performance-insights" style="border-left-color: var(--success-color); margin-top: 15px;">
                        <h4>💪 Strong Areas</h4>
                        <ul class="insight-list">
                            ${strongAreas.map(area => `<li>${area}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${improvementAreas.length > 0 ? `
                    <div class="performance-insights" style="border-left-color: var(--warning-color); margin-top: 15px;">
                        <h4>📚 Areas for Improvement</h4>
                        <ul class="insight-list">
                            ${improvementAreas.map(area => `<li>${area}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getPerformanceLevel(percentage) {
        if (percentage >= 90) return { class: 'excellent', level: 'Excellent' };
        if (percentage >= 75) return { class: 'good', level: 'Good' };
        if (percentage >= 60) return { class: 'fair', level: 'Fair' };
        return { class: 'poor', level: 'Needs Improvement' };
    }

    identifyStrongAreas(results) {
        const strongAreas = [];
        const correctResults = results.filter(r => r.isCorrect);
        
        if (correctResults.length > 0) {
            strongAreas.push(`Successfully answered ${correctResults.length} question${correctResults.length > 1 ? 's' : ''} correctly`);
        }
        
        if (correctResults.length === results.length) {
            strongAreas.push("Perfect score! Excellent mastery of the subject matter");
        } else if (correctResults.length >= results.length * 0.8) {
            strongAreas.push("Strong understanding demonstrated across most topics");
        }
        
        return strongAreas;
    }

    identifyImprovementAreas(results) {
        const improvementAreas = [];
        const incorrectResults = results.filter(r => !r.isCorrect);
        
        if (incorrectResults.length > 0) {
            improvementAreas.push(`Review questions ${incorrectResults.map(r => r.questionNumber).join(', ')} for better understanding`);
        }
        
        if (incorrectResults.length >= results.length * 0.5) {
            improvementAreas.push("Consider reviewing the material more thoroughly before retaking");
        }
        
        return improvementAreas;
    }

    generateInsights(percentage, results) {
        const insights = [];
        
        if (percentage === 100) {
            insights.push("Outstanding performance! You've mastered this topic completely.");
        } else if (percentage >= 90) {
            insights.push("Excellent work! You have a strong grasp of the material.");
        } else if (percentage >= 75) {
            insights.push("Good performance! A few areas could use some review.");
        } else if (percentage >= 60) {
            insights.push("Fair performance. Consider spending more time studying this topic.");
        } else {
            insights.push("This topic needs more attention. Don't worry - practice makes perfect!");
        }
        
        const incorrectCount = results.filter(r => !r.isCorrect).length;
        if (incorrectCount > 0) {
            insights.push(`Focus on understanding the ${incorrectCount} missed question${incorrectCount > 1 ? 's' : ''} to improve your knowledge.`);
        }
        
        if (this.questionCount === 3) {
            insights.push("Try the full 20-question version for a more comprehensive assessment!");
        }
        
        return insights;
    }

    exitQuiz() {
        const confirmed = confirm('Are you sure you want to exit the quiz? Your progress will be lost.');
        if (confirmed) {
            this.goHome();
        }
    }

    goHome() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.currentTopic = null;
        this.currentInputType = null;
        this.currentFileContent = null;
        
        document.getElementById('input-section').classList.remove('hidden');
        document.getElementById('quiz-section').classList.add('hidden');
        document.getElementById('results-section').classList.add('hidden');
        
        document.getElementById('topic-text').value = '';
        document.getElementById('file-upload').value = '';
        document.getElementById('file-content').classList.add('hidden');
        
        this.showNotification('Returned to home screen', 'info');
    }

    restart() {
        this.goHome();
    }

    async retakeQuiz() {
        if (!this.currentTopic) {
            this.showNotification('No previous quiz topic found', 'error');
            return;
        }

        // Reset quiz state and return to home with topic filled
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        // Show home screen sections
        document.getElementById('input-section').classList.remove('hidden');
        document.getElementById('quiz-section').classList.add('hidden');
        document.getElementById('results-section').classList.add('hidden');
        
        // Pre-fill the topic field
        if (this.currentInputType === 'topic') {
            document.getElementById('topic-text').value = this.currentTopic;
            document.getElementById('file-upload').value = '';
            document.getElementById('file-content').classList.add('hidden');
        } else {
            // For file uploads, show the file content again
            document.getElementById('topic-text').value = '';
            document.getElementById('file-content').classList.remove('hidden');
            document.getElementById('file-content').textContent = this.currentTopic.substring(0, 500) + '...';
        }
        
        this.showNotification('Choose difficulty level for the same topic', 'info');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuizGenerator();
    
    // Show install prompt for PWA
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or notification
        const installBtn = document.createElement('button');
        installBtn.textContent = '📱 Install App';
        installBtn.className = 'install-btn';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--secondary-gradient);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: var(--shadow-colorful);
            z-index: 1000;
            font-size: 14px;
        `;
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
                installBtn.remove();
            }
        });
        
        document.body.appendChild(installBtn);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.remove();
            }
        }, 10000);
    });
});