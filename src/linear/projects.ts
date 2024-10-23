import { linearClient } from "./linear-client";

export async function viewProjects() {
  const projects = await linearClient.projects();
  console.log(
    projects.nodes.map((project) => ({ name: project.name, id: project.id }))
  );
}
