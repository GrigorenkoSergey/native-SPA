import "./style.css";

const logic = () => {
  const h1 = document.querySelector("h1");
  const pattern = /pages\/dynamic\/(\d+)/;
  const pageId = window.location.href.match(pattern)?.[1];
  if (h1) h1.textContent = `Hello, dynamic page ${pageId}!`;
};

export default logic;
