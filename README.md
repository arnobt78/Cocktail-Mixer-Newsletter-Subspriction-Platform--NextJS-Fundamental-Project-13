# Cocktail Mixer & Newsletter Platform – Next.js, React, TypeScript, CocktailDB API, Tailwind CSS, Framer Motion Fundamental Project 13 (including Admin Control Room)

A modern, educational Cocktail Recipe Adviser built with React, React Router, React Query, Vite, Styled-Components, and TheCocktailDB API.

- **Live Demo:** []()

---

## Table of Contents

- [Project Summary](#project-summary)
- [Features](#features)
- [Demo](#demo)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [How It Works](#how-it-works)
  - [Routing](#routing)
  - [API Integration](#api-integration)
  - [Components Overview](#components-overview)
  - [Styling](#styling)
- [Code Walkthrough](#code-walkthrough)
- [Keywords](#keywords)
- [Contributions](#contributions)
- [Conclusion](#conclusion)
- [References](#references)

---

## Project Summary

**MixMaster** is a Single Page Application (SPA) that helps users discover, search, and learn about a variety of cocktail recipes. It fetches data from [TheCocktailDB](https://www.thecocktaildb.com/) API in real-time, offering details about each drink, including images, ingredients, and preparation instructions. The project is designed for educational purposes, showcasing best practices in modern React development: client-side routing, data fetching, reusable components, and styled-components for CSS-in-JS.

---

## Features

- 🔎 **Search Cocktails:** Search by name and view matching cocktails.
- 🥃 **Cocktail Details:** View ingredient lists, images, glass type, and instructions.
- 🎨 **Responsive UI:** Styled with styled-components for a consistent, modern look.
- 🚦 **Error Handling:** Custom error and not-found pages.
- 📚 **Educational Walkthrough:** Well-structured code and documentation to help others learn.
- ⚡ **Fast & Modern:** Built with Vite for rapid development and optimized builds.
- 📦 **Newsletter Form:** Simulated newsletter signup component.
- 🌐 **Live Demo:** [mixmaster-arnob.netlify.app](https://mixmaster-arnob.netlify.app/)

---

## Demo

Try it online: [https://mixmaster-arnob.netlify.app/](https://mixmaster-arnob.netlify.app/)

---

## Technology Stack

- **React** (SPA, functional components)
- **Vite** (build tool, fast dev server)
- **React Router v6** (client-side routing)
- **React Query** (data fetching and caching)
- **Styled-Components** (CSS-in-JS)
- **Axios** (HTTP requests)
- **React Toastify** (optional: toast notifications)
- **TheCocktailDB API** (external data source)

---

## Project Structure

```bash
MixMaster-Cocktail-Recipes-Adviser--React-Query/
├── public/
│   └── ... (static assets)
├── src/
│   ├── assets/
│   │   └── wrappers/        # Styled-component wrappers
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── SearchForm.jsx
│   │   ├── CocktailList.jsx
│   │   └── CocktailCard.jsx
│   ├── pages/
│   │   ├── About.jsx
│   │   ├── Cocktail.jsx
│   │   ├── Error.jsx
│   │   ├── HomeLayout.jsx
│   │   ├── Landing.jsx
│   │   ├── Newsletter.jsx
│   │   └── SinglePageError.jsx
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── package.json
├── vite.config.js
└── README.md
```

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/arnobt78/MixMaster-Cocktail-Recipes-Adviser--React-Query.git

# 2. Navigate to the project directory
cd MixMaster-Cocktail-Recipes-Adviser--React-Query

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev

# The app will run at http://localhost:5173/ (or as shown in your terminal).
```

---

## How It Works

### Routing

- Uses **React Router v6** with a nested routing structure.
- Main routes:
  - `/` : Home/Landing page with cocktail search.
  - `/about` : About the application.
  - `/cocktail/:id` : Details for a selected cocktail.
  - `/newsletter` : Newsletter signup form.
  - `*` : Error/Not Found page.

Example route config (App.jsx):

```jsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    errorElement: <Error />,
    children: [
      { index: true, loader: landingLoader, element: <Landing /> },
      { path: "about", element: <About /> },
      { path: "newsletter", element: <Newsletter /> },
      {
        path: "cocktail/:id",
        loader: singleCocktailLoader,
        element: <Cocktail />,
        errorElement: <SinglePageError />,
      },
      // ...other routes
    ],
  },
]);
```

### API Integration

- Fetches cocktail data from [TheCocktailDB](https://www.thecocktaildb.com/api.php).
- Example endpoints:
  - Search by name: `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita`
  - Lookup by ID: `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=11007`
- Uses **axios** for HTTP requests.
- Data fetching is handled by route loaders and **React Query** for caching and updates.

### Components Overview

- **Navbar:** Navigation links.
- **SearchForm:** User input for searching cocktails.
- **CocktailList:** Displays list of search results.
- **CocktailCard:** Shows individual cocktail info.
- **Landing:** Home page, search logic, and displays search results.
- **About:** Project info.
- **Error/SinglePageError:** Handles route and data errors.
- **Newsletter:** Simulated form for user signup.

### Styling

- All styles use **styled-components** for scoped, modular CSS.
- Example usage:

```jsx
import styled from "styled-components";
const Wrapper = styled.div`
  // CSS here
`;
```

- Layout is responsive and adapts to mobile and desktop.

---

## Code Walkthrough

### Searching for Cocktails

Users search for cocktails by name. The Landing page loader fetches data from the API:

```js
export const loader = async () => {
  const searchTerm = "margarita";
  const response = await axios.get(`${cocktailSearchUrl}${searchTerm}`);
  return { drinks: response.data.drinks, searchTerm };
};
```

### Viewing Cocktail Details

Clicking a cocktail opens the details page, which displays all available information, including dynamically extracted ingredients:

```js
const validIngredients = Object.keys(singleDrink)
  .filter((key) => key.startsWith("strIngredient") && singleDrink[key])
  .map((key) => singleDrink[key]);
```

### Error Handling

If a route or data fetch fails, a friendly error page is shown.

### Example: Adding a New Page

1. Create a new file in `src/pages/YourPage.jsx`.
2. Export your component.
3. Add it to `src/pages/index.js` for easy imports.
4. Add a route in App.jsx.

---

## Keywords

- React
- Vite
- SPA
- React Router
- React Query
- Axios
- Styled-components
- TheCocktailDB
- Educational
- Cocktail Recipes
- Error Handling
- Responsive Design

---

## Contributions

Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features.

---

## Conclusion

MixMaster is both a handy cocktail adviser and a practical reference for building robust, modern React applications with real-world best practices. Explore the code, experiment with the features, and use this project as a template or teaching tool for your own apps!

---

## References

- [React Documentation](https://react.dev/)
- [React Router Docs](https://reactrouter.com/en/main)
- [Styled-Components](https://styled-components.com/)
- [TheCocktailDB API](https://www.thecocktaildb.com/api.php)
- [React Query](https://tanstack.com/query/latest)
