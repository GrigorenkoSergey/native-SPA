import "./style.css";
import "@/components/messages-section";

console.log("Page-2. Должно быть выведено один раз при первом заходе на страницу.");

const logic = () => {
  const h1 = document.querySelector("h1");
  if (h1) h1.textContent = "Пятачок";
};

export default logic;
