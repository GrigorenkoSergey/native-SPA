import { createStore } from "../state-management/createStore";
console.log("init common store");

let diff = 10000;
const getExampleDate = () => {
  diff -= 1000;
  return Number(new Date()) - diff;
};

const messagesStore = createStore({
  messages: [
    {
      from: "winnie",
      content: "Доброе утро, Пятачок. Интересно, нет ли у тебя случайно воздушного шара?",
      timestamp: getExampleDate(),
      read: true,
    },
    {
      from: "piglet",
      content: "Воздушного шара?",
      timestamp: getExampleDate(),
      read: false,
    },
    {
      from: "winnie",
      content: "Да... Я как раз шел мимо и думал: 'Нет ли у Пятачка случайно воздушного шара?'",
      timestamp: getExampleDate(),
      read: true,
    },
    {
      from: "piglet",
      content: "А зачем тебе воздушный шар?",
      timestamp: getExampleDate(),
      read: false,
    },
    {
      from: "winnie",
      content: "Мёд...",
      timestamp: getExampleDate(),
      read: true,
    },
    {
      from: "piglet",
      content: "Что?",
      timestamp: getExampleDate(),
      read: false,
    },
    {
      from: "winnie",
      content: "МЁд",
      timestamp: getExampleDate(),
      read: true,
    },
    {
      from: "piglet",
      content: "Кто же это ходит за медом с воздушными шариками?",
      timestamp: getExampleDate(),
      read: false,
    },
  ],
});

export default messagesStore;
