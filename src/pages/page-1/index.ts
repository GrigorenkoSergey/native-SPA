import "@/components/messages-section/index";
import "./style.css";

console.log("Page-1. Должно быть выведено один раз при первом заходе на страницу.");

const logic = () => {
  const h1 = document.querySelector("h1");
  if (h1) h1.textContent = "Винни Пух";

  return () => {
    // ...some cleanup logic
  };
};

export default logic;
