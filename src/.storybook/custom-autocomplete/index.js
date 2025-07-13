import "../../components/custom-autocomplete";

export default () => {
  const basic = document.querySelector(".basic");
  const basicOptions = ["Опция-1", "Опция-2", "Опция-3", "Опция-4", "Опция-5"];
  basic.setOptions(basicOptions);

  const withCustomizedLi = document.querySelector(".customized-li");
  const customizedOptions = [
    {
      value: "Винни-Пух",
      wiki: "https://en.wikipedia.org/wiki/Winnie-the-Pooh",
    },
    {
      value: "Пятачок",
      wiki: "https://en.wikipedia.org/wiki/Piglet_(Winnie-the-Pooh)",
    },
    {
      value: "Иа",
      wiki: "https://en.wikipedia.org/wiki/Eeyore",
    },
    {
      value: "Сова",
      wiki: "https://en.wikipedia.org/wiki/Owl_(Winnie-the-Pooh)",
    },
    {
      value: "Кролик",
      wiki: "https://en.wikipedia.org/wiki/Rabbit_(Winnie-the-Pooh)",
    },
  ];

  withCustomizedLi.renderLi = li => `\
<li data-value=${li.value}>
  ${li.value}
  <a href=${li.wiki} 
    target="_blank"
    class="hero-wiki-link">?</a>
</li>
`;

  withCustomizedLi.setOptions(customizedOptions);
};
