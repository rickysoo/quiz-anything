# Quiz Anything 🧠

Quiz yourself on anything! An AI-powered quiz application that generates interactive quizzes from any topic or document using real-time search capabilities.

## ✨ Features

### 🎯 **Flexible Input Methods**
- **Topic-Based**: Enter any subject and get questions with latest information
- **Document Upload**: Upload PDFs, Word docs, or text files for custom quizzes

### 🔍 **AI-Powered Question Generation**
- **Real-time Search**: Uses GPT-4o-mini-search-preview for current information
- **Multi-language Support**: Automatically detects language and generates questions accordingly
- **Smart Validation**: Recognizes technical terms, acronyms, and specialized vocabulary

### 🌈 **Engaging User Experience**
- **Colorful Design**: Modern, vibrant interface with smooth animations
- **Progressive Web App**: Install on any device for native app experience
- **Customizable**: Choose 5, 10, 15, or 20 questions
- **Progress Tracking**: Visual progress bar and detailed performance analytics

### 📊 **Comprehensive Results**
- **Performance Analysis**: Detailed breakdown of strengths and areas for improvement
- **Smart Insights**: AI-generated feedback based on performance
- **Question Review**: See correct answers and explanations for missed questions

## 🚀 **Quick Start**

### **Setup**
1. **Get OpenAI API Key**: 
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-proj-...`)

2. **Configure API Key**:
   - The app will prompt you for the API key on first use
   - It's stored securely in your browser's local storage
   - Alternatively, set `OPENAI_API_KEY` environment variable

### **Using the App**
1. **Choose Your Input Method**:
   - Select "Choose a topic" and enter any subject
   - Or select "Upload a document" and upload a file

2. **Select Question Count**: Pick 5, 10, 15, or 20 questions

3. **Start the Quiz**: Click "Start the Quiz" to generate questions

4. **Take the Quiz**: Answer questions with visual progress tracking

5. **Review Results**: Get detailed performance analysis and insights

## 📱 **Progressive Web App**

Quiz Anything works as a PWA:
- **Install**: Add to home screen on mobile or desktop
- **Offline Ready**: Core functionality works without internet
- **Native Feel**: Full-screen experience without browser UI

## 🔧 **Technical Features**

### **Supported File Types**
- Text files (.txt, .md, .csv, .json)
- PDF documents (.pdf)
- Word documents (.doc, .docx)
- Rich text (.rtf)
- OpenDocument (.odt)

### **AI Capabilities**
- **Search-Enhanced**: Uses latest information for current topics
- **Language Detection**: Automatically detects content language
- **Smart Validation**: Accepts technical terms and specialized vocabulary
- **Context-Aware**: Generates relevant questions based on content type

### **User-Friendly Design**
- **Inline Notifications**: No popup dialogs, all feedback appears in-page
- **Layman Language**: Simple, conversational interface
- **Accessibility**: Responsive design works on all devices
- **Performance**: Fast loading with efficient caching

## 🌍 **Multi-Language Support**

Supports content and questions in:
- English, Spanish, French, German, Italian
- Portuguese, Russian, Chinese, Japanese, Arabic
- Auto-detects language and generates appropriate questions

## 🔐 **Privacy & Security**

### **API Key Security**
- **Never hardcoded**: API keys are not stored in the source code
- **Local storage**: Keys stored securely in browser's local storage
- **Environment variables**: Supports `.env` files for development
- **No server storage**: No API keys are sent to any external servers

### **Data Privacy**
- **Client-side processing**: Most processing happens in your browser
- **Secure API communication**: All API calls use HTTPS
- **No data persistence**: Quiz data is not stored beyond the session
- **Privacy-focused design**: Minimal data collection

### **For Developers**
- Never commit API keys to version control
- Use `.env.example` as a template for your `.env` file
- The `.gitignore` prevents accidental key exposure

## 📄 **License**

This project is open source and available under the MIT License.

---

**Made with ❤️ using AI-powered question generation**

*Quiz yourself on anything - from basic topics to specialized technical subjects!*