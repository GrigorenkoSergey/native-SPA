import { applyRouting } from "../utils/applyRouting";
import "../components/storybook-layout";

applyRouting({
  relativePathToPagedDir: "./",
  defaultPage: "/custom-autocomplete",
  page404: "/custom-autocomplete",
});
