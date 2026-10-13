import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState(""); // username field
  const [password, setPassword] = useState(""); // password field
  // all 3 work the same as signup
  const [message, setMessage] = useState(""); 
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault(); // no browser refresh
    setMessage("");

    if(!username.trim() || !password.trim()) {
      setError(true);
      setMessage("Username and password are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:9000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json(); // wait for server's http response
      setError(!response.ok); // read only boolean checking whether it was ok, set error to opposite of that (if ok, setError will be false, etc.)
      setMessage(data.message);
      // Successful login -> message stays on this page
    } catch {
      setError(true);
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>Username
        <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" />
      </label>
      <label>Password
        <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" />
      </label>
      <button className="primary" type="submit" disabled={loading}>{loading ? "Please wait..." : "Log in"}</button>
      {message && <p className={error ? "feedback error" : "feedback success"} role="status">{message}</p>}
    </form>
  );
}
