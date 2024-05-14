import { initializeViewer } from "./viewer";

let components: any = null;

(async function main() {
  const modelListEl = document.getElementById("modelList") as HTMLUListElement;
  const models = (await fetch("http://localhost:3000/api/models").then((res) =>
    res.json()
  )) as {
    id: string;
    geometries_progress: number;
    properties_progress: number;
    createdAt: string;
    name: string;
  }[];

  modelListEl.innerHTML = models
    .map((model) => `<li>${model.name} - ${model.id}</li>`)
    .join("");

  const formEl = document.getElementById("modelForm");
  if (!formEl) {
    throw new Error('Element with id "modelForm" not found');
  }
  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const id = formData.get("id");
    if (typeof id !== "string") {
      throw new Error("id is required");
    }
    if (components !== null) {
      components.dispose();
    }
    components = await initializeViewer(id);
  });
})();
