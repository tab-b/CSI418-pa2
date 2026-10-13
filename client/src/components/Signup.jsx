import { useState } from "react";

const emptyForm = { f_name: "", l_name: "", username: "", password: "" };

export default function Signup() {
  const [form, setForm] = useState(emptyForm); // four input values in React state
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value })); // update matching field
  }

  async function handleSubmit(event) {
    event.preventDefault(); // prevent page reload
    setMessage("");

    if(Object.values(form).some(value => !value.trim())) {
      setError(true);
      setMessage("Please fill out every field.");
      return;
    }

    setLoading(true);
    try {
      // React -> HTTP POST -> Express on port 9000
      const response = await fetch("http://localhost:9000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form) // form object -> JSON request body
      });
      const data = await response.json(); // JSON message from Express
      setError(!response.ok); // 201 success, 400/409/500 failure
      setMessage(data.message);
      if(response.ok) setForm(emptyForm);
    } catch {
      setError(true);
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="name-row">
        <label>First name
          <input name="f_name" value={form.f_name} onChange={updateField} autoComplete="given-name" />
        </label>
        <label>Last name
          <input name="l_name" value={form.l_name} onChange={updateField} autoComplete="family-name" />
        </label>
      </div>
      <label>Username
        <input name="username" value={form.username} onChange={updateField} autoComplete="username" />
      </label>
      <label>Password
        <input name="password" type="password" value={form.password} onChange={updateField} autoComplete="new-password" />
      </label>
      <button className="primary" type="submit" disabled={loading}>{loading ? "Please wait..." : "Create account"}</button>
      {message && <p className={error ? "feedback error" : "feedback success"} role="status">{message}</p>}
    </form>
  );
}
