import "./style.css";

const logic = () => {
  const span = document.createElement("span");
  span.dataset.testid = "created-span";
  span.textContent = "Hello from script!";

  document.body.append(span);
};

window.logic = logic;
