# 🪙 FinTrack – Voice-Powered Personal Finance Tracker  

**Description**  
FinTrack is a personal finance management web application (similar to Splitwise + Mint) that helps users **track income, expenses, budgets, and financial goals**. It now includes **voice-enabled expense input** using the **Web Speech API**, making it faster and more natural to add transactions.  

---

## ✨ Features  
- **Income & Expense Tracking**: Add, edit, and delete transactions.  
- **Voice Commands 🎙️**: Quickly add expenses using natural voice input (e.g., *“Add a 500 dinner expense split between me and Eva”*).  
- **Budget Management**: Set and track spending limits for different categories.  
- **Financial Reports 📊**: Visualize spending trends with interactive charts.  
- **User Authentication 🔐**: Secure login & session management.  

---

## 🛠 Tech Stack  
- **Frontend**: Next.js, TypeScript, Tailwind CSS/ShadCN, Web Speech API (for voice input)  
- **Backend**: Prisma, PostgreSQL  
- **Authentication**: NextAuth  
- **Deployment**: Vercel  

---

## 🚀 How It Works  
1. User speaks an expense (e.g., *“Add a 500 dinner expense split equally between me and Eva”*).  
2. **Web Speech API** converts voice → text in the browser.  
3. The parsed text is sent to backend APIs.  
4. Backend extracts **amount, category, participants, type (income/expense)** and saves it in PostgreSQL via Prisma.  
5. Updated dashboard reflects the new transaction in real time.  

---

## 📦 Deployment  https://vercel.com/kushagras-projects-fccdcd88/fj-be-r2-kushagra-iit-roorkee/deployments

---
