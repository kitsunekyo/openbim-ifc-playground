import * as ifc from "./ifc";
import "./style.css";

(function main() {
  const formEl = document.getElementById("ifcForm") as HTMLFormElement;
  if (!formEl) {
    throw new Error('Element with id "ifcForm" not found');
  }
  const inputEl = document.getElementById("fileInput") as HTMLInputElement;
  if (!inputEl) {
    throw new Error('Element with id "fileInput" not found');
  }

  formEl.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();
    const file = inputEl.files?.[0];
    if (!file) {
      throw new Error("No file selected");
    }
    ifc.convertToStreamable(file);
  });
})();
