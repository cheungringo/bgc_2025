# bgc_2025

A React + Vite application built for BGC 2025.

## Getting Started

### Prerequisites

Before you can run this application, you need to install two tools on your computer:

#### 1. Install Node.js v22.21.1

Node.js is what runs the application. Here's how to install it:

**For Windows:**
1. Go to [nodejs.org](https://nodejs.org)
2. Download the "LTS" version (should be v22.21.1)
3. Run the downloaded file and follow the installation steps
4. Restart your computer when done

**For Mac:**
1. Go to [nodejs.org](https://nodejs.org)
2. Download the "LTS" version (should be v22.21.1)
3. Run the downloaded `.pkg` file and follow the installation steps
4. Open Terminal (found in Applications > Utilities) to test

**To check if Node.js installed correctly:**
Open your command prompt (Windows) or Terminal (Mac) and type:
```bash
node --version
```
You should see `v22.21.1` (or similar).

#### 2. Install Git

Git helps you download and manage code. Here's how to install it:

**For Windows:**
1. Go to [git-scm.com](https://git-scm.com)
2. Download Git for Windows
3. Run the installer and click "Next" through all the options (the defaults are fine)

**For Mac:**
Git is usually already installed. To check, open Terminal and type:
```bash
git --version
```
If you see a version number, you're good! If not, install it by typing:
```bash
xcode-select --install
```

**To check if Git installed correctly:**
Open your command prompt or Terminal and type:
```bash
git --version
```
You should see a version number.

### Clone and Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/cheungringo/bgc_2025.git
   cd bgc_2025
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` to see the application.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

## Technology Stack

- **React 19** - Frontend framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
