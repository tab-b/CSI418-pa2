import { useState } from "react";
import Signup from "./components/Signup.jsx";
import Login from "./components/Login.jsx";

export default function App() {
  const [mode, setMode] = useState("signup"); // switch Signup / Login GUIs

  return (
    <main className="shell">
      <div className="brand"><span className="brand-mark">✓</span> Account Portal</div>
      <section className="auth-panel">
        <p className="eyebrow">Programming Assignment 2</p>
        <h1>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="subtitle">{mode === "signup" ? "Enter your information to sign up." : "Enter your credentials to log in."}</p>
        <div className="tabs" role="tablist" aria-label="Authentication">
          <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
          <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button>
        </div>
        {mode === "signup" ? <Signup /> : <Login />}
      </section>
    </main>
  );
}
