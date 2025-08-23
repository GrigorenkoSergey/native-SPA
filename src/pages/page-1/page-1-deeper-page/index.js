import "./style.css";

const logic = () => {
  alert("Привет из глубоко вложенной страницы!");
};

logic();

window.logic = logic;
