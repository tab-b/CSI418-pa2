import { useState } from "react";
import Signup from "./components/Signup.jsx";
import Login from "./components/Login.jsx";
import ProjectManager from "./components/ProjectManager.jsx";
import ProjectErrorBoundary from "./components/ProjectErrorBoundary.jsx";

export default function App() {
  const [mode, setMode] = useState("signup"); // current screen
  const [loggedIn, setLoggedIn] = useState(false); // login confirmed by backend

  function handleLogin() {
    setLoggedIn(true); // successful login then projects
    setMode("projects");
  }

  function handleLogout() {
    setLoggedIn(false); // clear frontend login state
    setMode("login");
  }

  return (
    <main className="shell">
      <div className="brand"><span className="brand-mark">✓</span> Project Portal</div>
      <nav className="tabs main-tabs" aria-label="Main navigation">
        {!loggedIn ? (
          <>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button>
          </>
        ) : (
          <>
            <button className="active" onClick={() => setMode("projects")}>Projects</button>
            <button onClick={handleLogout}>Log out</button>
          </>
        )}
      </nav>
      {loggedIn ? (
        <ProjectErrorBoundary><ProjectManager /></ProjectErrorBoundary>
      ) : (
        <section className="auth-panel">
          <p className="eyebrow">Programming Assignments 2 &amp; 3</p>
          <h1>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="subtitle">{mode === "signup" ? "Enter your information to sign up." : "Enter your credentials to log in."}</p>
          {mode === "signup" ? <Signup /> : <Login onLoginSuccess={handleLogin} />}
        </section>
      )}
    </main>
  );
}
