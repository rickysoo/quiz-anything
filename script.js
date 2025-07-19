class QuizGenerator {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.questionCount = 10;
        this.openaiApiKey = null;
        this.init();
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
        await this.initApiKey();
        this.bindEvents();
        this.setupInputToggle();
        this.setupQuestionCountSelector();
        this.registerServiceWorker();
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
        document.getElementById('generate-quiz').addEventListener('click', () => this.generateQuiz());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prev-btn').addEventListener('click', () => this.prevQuestion());
        document.getElementById('submit-quiz').addEventListener('click', () => this.submitQuiz());
        document.getElementById('restart-quiz').addEventListener('click', () => this.restart());
        document.getElementById('file-upload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('exit-quiz').addEventListener('click', () => this.exitQuiz());
        document.getElementById('app-title').addEventListener('click', () => this.goHome());
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
                // Update button text
                document.querySelector('.btn-text').textContent = `Start the Quiz`;
                document.querySelector('.btn-subtitle').textContent = `${this.questionCount} questions`;
                // Update total questions display
                document.getElementById('total-questions').textContent = this.questionCount;
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
        // Simple language detection based on common words/patterns
        const languagePatterns = {
            'es': /\b(el|la|los|las|de|en|un|una|con|por|para|que|se|es|son|está|están|tiene|tienen|muy|más|pero|como|cuando|donde|porque|si|no|sí|también|hasta|desde)\b/gi,
            'fr': /\b(le|la|les|de|du|des|un|une|et|ou|est|sont|avec|pour|dans|sur|par|ce|cette|ces|que|qui|se|ne|pas|très|plus|mais|comme|quand|où|parce|si|oui|non|aussi|jusqu|depuis)\b/gi,
            'de': /\b(der|die|das|den|dem|des|ein|eine|und|oder|ist|sind|mit|für|in|auf|von|zu|bei|nach|über|unter|zwischen|dass|wie|wenn|wo|weil|ob|ja|nein|auch|bis|seit)\b/gi,
            'it': /\b(il|la|lo|gli|le|di|da|in|con|su|per|tra|fra|che|se|è|sono|ha|hanno|molto|più|ma|come|quando|dove|perché|se|no|sì|anche|fino|da)\b/gi,
            'pt': /\b(o|a|os|as|de|em|um|uma|com|por|para|que|se|é|são|tem|têm|muito|mais|mas|como|quando|onde|porque|se|não|sim|também|até|desde)\b/gi,
            'ru': /\b(в|на|и|с|по|для|от|до|за|при|над|под|из|к|о|об|про|через|между|что|как|когда|где|почему|если|да|нет|также|уже|еще)\b/gi,
            'zh': /[\u4e00-\u9fff]/g,
            'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g,
            'ar': /[\u0600-\u06ff]/g
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

    async validateContent(content, inputType) {
        // Basic validation checks first
        if (!content || content.trim().length < 3) {
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
        const words = content.split(/\s+/).filter(word => word.length > 0);
        if (words.length === 0) return 0;

        const meaningfulWords = words.filter(word => {
            // Check if it's a legitimate acronym or technical term first
            if (this.isLegitimateAcronymOrTechnicalTerm(word)) {
                return true;
            }
            
            // Remove punctuation and check if word contains mostly letters
            const cleanWord = word.replace(/[^\w]/g, '');
            const letterCount = (cleanWord.match(/[a-zA-Z]/g) || []).length;
            const numberCount = (cleanWord.match(/[0-9]/g) || []).length;
            
            // Allow words with letters, numbers, or mixed (for technical terms)
            if (cleanWord.length > 1) {
                // Pure letters (traditional words)
                if (letterCount / cleanWord.length > 0.6) return true;
                // Mixed alphanumeric (technical terms, version numbers, etc.)
                if ((letterCount + numberCount) / cleanWord.length > 0.8) return true;
                // Pure numbers (years, quantities, etc.) if reasonably sized
                if (numberCount === cleanWord.length && cleanWord.length >= 2 && cleanWord.length <= 6) return true;
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
        } else {
            const fileInput = document.getElementById('file-upload');
            if (!fileInput.files[0]) {
                this.showNotification('Please upload a file first', 'warning');
                return;
            }
            content = await this.readFile(fileInput.files[0]);
        }

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
            this.questions = await this.generateMCQsWithOpenAI(content, inputType, detectedLanguage);
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

    async generateMCQsWithOpenAI(content, inputType, language = 'en') {
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
            'ar': 'Arabic'
        };

        const languageName = languageNames[language] || 'English';
        const languageInstruction = language === 'en' ? '' : `Generate all questions and answers in ${languageName}. `;

        const currentYear = new Date().getFullYear();
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const prompt = inputType === 'topic' 
            ? `Search for the latest information about "${content}" and generate exactly ${this.questionCount} multiple choice questions based on current, up-to-date information as of ${currentDate}. 

SEARCH INSTRUCTIONS:
- Look up recent developments, current statistics, latest research, and up-to-date facts about "${content}"
- Include questions about recent events, current leaders, latest discoveries, or recent changes in this field
- Ensure all factual information is accurate as of ${currentYear}
- Prioritize information from the last 2-3 years when relevant

QUESTION DIVERSITY & UNIQUENESS REQUIREMENTS:
- Ensure all ${this.questionCount} questions are completely unique and cover different aspects of "${content}"
- Avoid creating questions that test the same fact, concept, or information in different ways
- Make sure no two questions have overlapping, similar, or related correct answers
- Distribute questions across different subtopics, time periods, or aspects when possible
- Vary question types: include factual recall, conceptual understanding, application, comparison, and analysis questions
- Avoid repetitive question patterns, structures, or phrasings
- Each question should focus on a distinctly different piece of information or concept

${languageInstruction}IMPORTANT: Respond ONLY with a valid JSON array. No other text before or after. Each question object must have exactly these fields:
- question: string (the question text in ${languageName}, incorporating latest information)
- options: array of exactly 4 strings (the answer choices in ${languageName})
- correct: number (index 0-3 of the correct option)

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
    "correct": 3
  }
]`
            : `Generate exactly ${this.questionCount} multiple choice questions based on this document content: "${content.substring(0, 2000)}". 

If the document contains topics that would benefit from current information, search for recent updates and developments related to the document's subject matter to enhance the questions.

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

Example format:
[
  {
    "question": "Based on the document and current information, what is the main topic discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1
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
                isCorrect: isCorrect
            });
        });

        this.displayResults(correctAnswers, results);
    }

    displayResults(correctAnswers, results) {
        const percentage = Math.round((correctAnswers / this.questionCount) * 100);
        
        document.getElementById('quiz-section').classList.add('hidden');
        document.getElementById('results-section').classList.remove('hidden');
        
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
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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