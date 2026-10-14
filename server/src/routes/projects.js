import { Router } from "express";
import { ObjectId } from "mongodb";
import { missingFields } from "../validation.js";

const statuses = new Set(["Planning", "Active", "Completed"]);

// convert user input then mongodb objectid, or null if invalid
function objectId(value) {
  if(typeof value !== "string" || !/^[0-9a-fA-F]{24}$/.test(value)) return null;
  return new ObjectId(value);
}

export default function projectRoutes(users, projects, memberships) {
  const router = Router();

  // get users then populate lead/member dropdowns; never return passwords
  router.get("/api/users", async (req, res) => {
    try {
      const list = await users.find({}, { projection: { password: 0 } }).toArray();
      return res.json(list);
    } catch (error) {
      console.error("Get users failed:", error);
      return res.status(500).json({ message: "Could not load users." });
    }
  });

  // post project then validate lead then create project + automatic lead membership
  router.post("/api/projects", async (req, res) => {
    if(missingFields(req.body, ["name", "description", "status", "project_lead_id"])) {
      return res.status(400).json({ message: "All project fields are required." });
    }
    const { name, description, status, project_lead_id } = req.body;
    if([name, description, status, project_lead_id].some(value => typeof value !== "string" || !value.trim())) {
      return res.status(400).json({ message: "All project fields must be nonempty text." });
    }
    if(!statuses.has(status)) return res.status(400).json({ message: "Invalid project status." });
    const leadId = objectId(project_lead_id);
    if(!leadId) return res.status(400).json({ message: "Invalid Project Lead ID." });

    try {
      // objectid query then user must already exist
      if(!await users.findOne({ _id: leadId })) {
        return res.status(404).json({ message: "Selected Project Lead does not exist." }); // 404 not found
      }
      const project = {
        name: name.trim(), description: description.trim(), status,
        project_lead_id: leadId // reference, not username
      };
      const result = await projects.insertOne(project); // new _id from mongodb
      try {
        // junction collection then lead belongs to their own project
        await memberships.insertOne({ project_id: result.insertedId, user_id: leadId });
      } catch (error) {
        // undo project if lead membership insertion fails
        await projects.deleteOne({ _id: result.insertedId });
        throw error;
      }
      return res.status(201).json({ message: "Project created! Lead added as a member.", project_id: result.insertedId });
    } catch (error) {
      console.error("Create project failed:", error);
      return res.status(500).json({ message: "Could not create project." });
    }
  });

  // get projects then frontend looks up each lead's readable name
  router.get("/api/projects", async (req, res) => {
    try {
      return res.json(await projects.find({}).toArray());
    } catch (error) {
      console.error("Get projects failed:", error);
      return res.status(500).json({ message: "Could not load projects." });
    }
  });

  // get members then membership documents contain user_id objectids
  router.get("/api/projects/:projectId/members", async (req, res) => {
    const projectId = objectId(req.params.projectId);
    if(!projectId) return res.status(400).json({ message: "Invalid project ID." });
    try {
      if(!await projects.findOne({ _id: projectId })) return res.status(404).json({ message: "Project does not exist." });
      return res.json(await memberships.find({ project_id: projectId }).toArray());
    } catch (error) {
      console.error("Get members failed:", error);
      return res.status(500).json({ message: "Could not load members." });
    }
  });

  // post/adding member then check both references, prevent duplicate membership
  router.post("/api/projects/:projectId/members", async (req, res) => {
    const projectId = objectId(req.params.projectId);
    const userId = objectId(req.body?.user_id);
    if(!projectId || !userId) return res.status(400).json({ message: "Valid project and user IDs are required." });
    try {
      if(!await projects.findOne({ _id: projectId })) return res.status(404).json({ message: "Project does not exist." });
      if(!await users.findOne({ _id: userId })) return res.status(404).json({ message: "User does not exist." });
      const key = { project_id: projectId, user_id: userId }; // create key for query in proj membership table/collection: proj_id and userId
      if(await memberships.findOne(key)) return res.status(409).json({ message: "User is already a member of this project." });
      await memberships.insertOne(key);
      return res.status(201).json({ message: "Member added successfully." });
    } catch (error) {
      // database side error catching
      // protects against simultaneous requests
      // 11000 == duplicate key error
      if(error.code === 11000) return res.status(409).json({ message: "User is already a member of this project." });
      console.error("Add member failed:", error);
      return res.status(500).json({ message: "Could not add member." });
    }
  });

  // delete member, lead protected; other members removable
  router.delete("/api/projects/:projectId/members/:userId", async (req, res) => {
    const projectId = objectId(req.params.projectId); // grab project id
    const userId = objectId(req.params.userId); // grab user id
    if(!projectId || !userId) return res.status(400).json({ message: "Invalid project or user ID." });
    try {
      const project = await projects.findOne({ _id: projectId }); // get the project from database
      if(!project) return res.status(404).json({ message: "Project does not exist." });
      if(!await users.findOne({ _id: userId })) return res.status(404).json({ message: "User does not exist." });
      if(project.project_lead_id.equals(userId)) { // if project's proj lead matches userID in request params
        // that means attempting to remove proj lead
        return res.status(409).json({ message: "The Project Lead cannot be removed." }); // send 409 bad request
      }
      const result = await memberships.deleteOne({ project_id: projectId, user_id: userId });
      if(!result.deletedCount) return res.status(404).json({ message: "User is not a member of this project." });
      return res.json({ message: "Member removed successfully." });
    } catch (error) {
      console.error("Remove member failed:", error);
      return res.status(500).json({ message: "Could not remove member." });
    }
  });

  return router;
}
