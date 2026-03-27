# DST Tools — Professional Trading Suite

A comprehensive trading journal and calculator application.

## Features

- **Trading Calculator:** Calculate position sizes and risk/reward ratios.
- **Trading Journal:** Log your trades and track performance.
- **Analytics:** Visualize your trading data with charts and metrics.
- **Reflections:** Document your trading journey, lessons learned, and daily intentions.

## Local Setup

To run this project locally, follow these steps:

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### 2. Installation

1.  Download or clone the project files.
2.  Open your terminal and navigate to the project directory.
3.  Install the dependencies:

    ```bash
    npm install
    ```

### 3. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

### 4. Running the Development Server

You can start the app in two ways:

#### Option A: One-Click Launch (Recommended)
- **Windows:** Double-click the `run.bat` file.
- **macOS/Linux:** Run the `run.sh` script (you may need to run `chmod +x run.sh` first).

These scripts will automatically install dependencies (if missing), open your browser, and start the app.

#### Option B: Using the Terminal
Start the local development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### 5. Building for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist` folder.

## Technologies Used

- **React:** Frontend library.
- **Vite:** Build tool and dev server.
- **TypeScript:** Static typing.
- **Tailwind CSS:** Utility-first CSS framework.
- **Lucide React:** Icon library.
- **Chart.js:** Data visualization.
- **react-chartjs-2:** React wrapper for Chart.js.
- **date-fns:** Date formatting and manipulation.
- **Framer Motion:** Smooth animations.
