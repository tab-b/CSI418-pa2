import { useEffect, useState } from "react";

const API = "http://localhost:9000";
const emptyProject = { name: "", description: "", status: "Planning", project_lead_id: "" };

// http helper then parse express json + http status
async function request(path, options) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json();
  if(!response.ok) throw new Error(data.message || "Server error.");
  return data;
}

function userLabel(user) {
  return `${user.f_name} ${user.l_name} (@${user.username})`;
}

export default function ProjectManager() {
  const [users, setUsers] = useState([]); // registered users
  const [projects, setProjects] = useState([]); // mongodb projects
  const [form, setForm] = useState(emptyProject); // create project fields
  const [selectedProject, setSelectedProject] = useState("");
  const [members, setMembers] = useState([]); // selected project's memberships
  const [newMember, setNewMember] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  function feedback(text, failed = false) {
    setMessage(text);
    setError(failed);
  }

  async function loadUsersAndProjects() {
    // get requests then data for dropdowns + project cards
    const [allUsers, allProjects] = await Promise.all([
      request("/api/users"), request("/api/projects")
    ]);
    setUsers(allUsers);
    setProjects(allProjects);
  }

  useEffect(() => {
    loadUsersAndProjects().catch(err => feedback(err.message, true));
  }, []);

  async function loadMembers(projectId) {
    if(!projectId) { setMembers([]); return; }
    try {
      setMembers(await request(`/api/projects/${projectId}/members`));
    } catch (err) {
      feedback(err.message, true);
      setMembers([]);
    }
  }

  function selectProject(id) {
    setSelectedProject(id);
    setNewMember("");
    setMembers([]);
    loadMembers(id); // refresh from mongodb whenever selected
  }

  async function createProject(event) {
    event.preventDefault(); // no browser page reload
    feedback("");
    if(!form.name.trim() || !form.description.trim() || !form.project_lead_id) {
      feedback("All project fields are required.", true);
      return;
    }
    
    setBusy(true);
    try {
      // react form then json post then express then projects + projectmemberships
      const data = await request("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      await loadUsersAndProjects();
      setForm(emptyProject);
      selectProject(data.project_id);
      feedback(data.message);
    } catch (err) {
      feedback(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function addMember(event) {
    event.preventDefault();
    if(!selectedProject || !newMember) { feedback("Select a project and a user.", true); return; }
    setBusy(true);
    try {
      // selected user id then junction document { project_id, user_id }
      const data = await request(`/api/projects/${selectedProject}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: newMember })
      });
      await loadMembers(selectedProject); // update visible list
      feedback(data.message);
      setNewMember("");
    } catch (err) {
      feedback(err.message, true); // duplicate then 409 explanation
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId) {
    setBusy(true);
    try {
      const data = await request(`/api/projects/${selectedProject}/members/${userId}`, {
        method: "DELETE"
      });
      await loadMembers(selectedProject); // refresh after deletion
      feedback(data.message);
    } catch (err) {
      feedback(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  // ids sent from mongodb as strings then find readable username
  const getUser = id => users.find(user => user._id === id);
  const project = projects.find(item => item._id === selectedProject);

  return (
    <section className="workspace">
      <p className="eyebrow">Programming Assignment 3</p>
      <h1>Project management</h1>
      <p className="subtitle">Create projects, choose a lead, and manage members.</p>
      {message && <p className={error ? "feedback error" : "feedback success"} role="status">{message}</p>}

      <div className="project-columns">
        <section className="workspace-card">
          <h2>Create project</h2>
          <form className="auth-form" onSubmit={createProject}>
            <label>Project name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Description<textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></label>
            <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>Planning</option><option>Active</option><option>Completed</option>
            </select></label>
            <label>Project Lead<select value={form.project_lead_id} onChange={e => setForm({ ...form, project_lead_id: e.target.value })} required>
              <option value="">Select a registered user</option>
              {users.map(user => <option key={user._id} value={user._id}>{userLabel(user)}</option>)}
            </select></label>
            <button className="primary" disabled={busy || users.length === 0}>Create project</button>
          </form>
        </section>

        <section className="workspace-card">
          <h2>All projects</h2>
          {projects.length === 0 ? <p className="subtitle">No projects yet.</p> : (
            <div className="project-list">
              {projects.map(item => <button type="button" key={item._id}
                className={`project-item ${selectedProject === item._id ? "selected" : ""}`}
                onClick={() => selectProject(item._id)}>
                <strong>{item.name}</strong><span>{item.description}</span>
                <small>{item.status} · Lead: {getUser(item.project_lead_id)?.username || "Unknown"}</small>
              </button>)}
            </div>
          )}
        </section>
      </div>

      <section className="workspace-card members-card">
        <h2>Project memberships</h2>
        <label>Selected project<select value={selectedProject} onChange={e => selectProject(e.target.value)}>
          <option value="">Choose a project</option>
          {projects.map(item => <option value={item._id} key={item._id}>{item.name}</option>)}
        </select></label>
        {project && <>
          <p className="subtitle">Project Lead: {getUser(project.project_lead_id) ? userLabel(getUser(project.project_lead_id)) : "Unknown"}</p>
          <div className="member-list">
            {members.length === 0 && <p>No members found.</p>}
            {members.map(member => {
              const lead = member.user_id === project.project_lead_id;
              const user = getUser(member.user_id);
              return <div className="member-item" key={member._id}>
                <span>{user ? userLabel(user) : member.user_id} {lead && <b>(Lead)</b>}</span>
                {!lead && <button disabled={busy} type="button" onClick={() => removeMember(member.user_id)}>Remove</button>}
              </div>;
            })}
          </div>
          <form className="add-member" onSubmit={addMember}>
            <label>Add registered user<select value={newMember} onChange={e => setNewMember(e.target.value)}>
              <option value="">Select user</option>
              {users.map(user => <option key={user._id} value={user._id}>{userLabel(user)}</option>)}
            </select></label>
            <button className="primary" disabled={busy || !newMember}>Add member</button>
          </form>
        </>}
      </section>
    </section>
  );
}
