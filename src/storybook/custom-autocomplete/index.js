import "../../components/storybook-layout";
import "../../components/custom-autocomplete";
import "./style.css";

export default () => {
  const options1 = ["Опция-1", "Опция-2", "Опция-3", "Опция-4", "Опция-5"];
  const options2 = [
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

  let optionsIndex = 0;
  const ulPossibleOptions = [options1, options2];

  const basic = document.querySelector(".basic");
  basic.setOptions(ulPossibleOptions[optionsIndex]);

  const withCustomizedLi = document.querySelector(".customized-li");

  withCustomizedLi.renderLi = li => `\
<li data-value=${li.value}>
  ${li.value}
  <a href=${li.wiki} 
    target="_blank"
    class="hero-wiki-link">?</a>
</li>
`;

  withCustomizedLi.setOptions(ulPossibleOptions[1]);
};
