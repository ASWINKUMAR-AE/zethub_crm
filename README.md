# ZETHUB CRM - Enterprise Milestone & Project Management System

A cross-platform (Mobile & Web) Client Relationship Management (CRM) and Milestone Tracking system tailored for digital agencies, freelance teams, and enterprise clients.

---

## 🌟 Key Features

- 👥 **Multi-Role Portal**: Dedicated, secure interfaces for **Admins**, **Team Members**, and **Clients**.
- 🚀 **Milestone & Project Workflow**:
  - Track project timelines, progress percentages, and due dates.
  - Work submission panel with file uploads (Multer).
  - Client milestone approval & sign-off workflow.
- 💳 **Integrated Payments (Razorpay)**:
  - Milestone-based payment generation and tracking.
  - Razorpay order creation and payment verification.
- 📱 **Cross-Platform Mobile & Web Client (Expo / React Native)**:
  - Responsive layouts with modern monochromatic dark/light themes.
  - Custom drawers, tab navigation, and animated widgets.
- 🛡️ **Robust REST API Backend**:
  - Express.js with Sequelize ORM and MySQL.
  - JWT authentication and bcrypt password encryption.
  - Automatic database verification and table provisioning.
- 🎨 **Complete Design Assets**: Includes modular screen designs and UI references in `design_zethub_crm/`.

---

## 🛠️ Architecture & Tech Stack

### Client App (`/app`)
- **Framework**: [Expo](https://expo.dev/) (SDK 52+ / React Native 0.76+)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: TypeScript
- **Styling & UI**: Custom component library with Lucide / Vector Icons, Dot Grid Backgrounds, and responsive layouts.

### Server Backend (`/server`)
- **Runtime**: Node.js
- **Server Framework**: Express.js
- **Database & ORM**: MySQL & [Sequelize ORM](https://sequelize.org/)
- **Authentication**: JSON Web Tokens (JWT) & bcrypt
- **Payments**: Razorpay Node SDK
- **File Uploads**: Multer

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL Server](https://www.mysql.com/) (running locally or remotely)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli` or via `npx expo`)

---

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ASWINKUMAR-AE/zethub_crm.git
   cd zethub_crm
   ```

2. **Setup the Backend Server**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server/` directory based on `.env.example`:
   ```env
   PORT=5000
   DB_HOST=127.0.0.1
   DB_NAME=zethub_crm
   DB_USER=root
   DB_PASS=your_mysql_password
   JWT_SECRET=your_secret_jwt_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
   Start the backend server:
   ```bash
   npm start
   # or with live reload:
   npm run dev
   ```
   The server will run on `http://localhost:5000` and automatically create the database if it doesn't exist.

3. **Setup the Frontend App**
   ```bash
   cd ../app
   npm install
   ```
   Start the Expo dev server:
   ```bash
   npx expo start
   ```
   - Press `w` to run in the web browser.
   - Press `a` for Android emulator or scan the QR code with Expo Go on your mobile device.

---

## 📁 Repository Structure

```text
zethub_crm/
├── app/                      # Expo / React Native application
│   ├── app/                  # File-based routes ((auth), (tabs), user, etc.)
│   ├── assets/               # Branding, logos, and images
│   ├── components/           # Reusable UI widgets (Badges, Cards, Backgrounds)
│   ├── hooks/                # Custom React hooks
│   ├── src/                  # App state, context & API services
│   ├── app.json              # Expo application configuration
│   └── package.json          # Frontend dependencies
├── server/                   # Express.js REST API
│   ├── config/               # Database connection (Sequelize)
│   ├── controllers/          # Business logic handlers (Auth, Projects, Milestones, Payments)
│   ├── middlewares/          # JWT auth & upload middlewares
│   ├── models/               # Sequelize database models
│   ├── routes/               # API route definitions
│   ├── uploads/              # Attached files & project submissions
│   ├── .env.example          # Server environment variable template
│   ├── server.js             # Express entry point
│   └── package.json          # Backend dependencies
├── design_zethub_crm/        # UI/UX design mockups and screens
├── backend_prompts.md        # API specifications & schema documentation
└── README.md                 # Project documentation
```

---

## 📄 License

Proprietary software maintained by [ASWINKUMAR-AE](https://github.com/ASWINKUMAR-AE).
