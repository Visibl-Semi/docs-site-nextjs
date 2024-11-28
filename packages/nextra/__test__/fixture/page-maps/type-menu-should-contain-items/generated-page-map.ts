import type_menu_should_contain_items_meta from "../type-menu-should-contain-items/_meta.ts";
export const pageMap = [{
  data: type_menu_should_contain_items_meta
}, {
  name: "mix",
  route: "/mix",
  children: [{
    name: "not-specified",
    route: "/mix/not-specified",
    frontMatter: {
      "sidebarTitle": "Not Specified"
    }
  }, {
    name: "qux",
    route: "/mix/qux",
    frontMatter: {
      "sidebarTitle": "Qux"
    }
  }]
}, {
  name: "pagesOnly",
  route: "/pagesOnly",
  children: [{
    name: "one",
    route: "/pagesOnly/one",
    frontMatter: {
      "sidebarTitle": "One"
    }
  }, {
    name: "two",
    route: "/pagesOnly/two",
    frontMatter: {
      "sidebarTitle": "Two"
    }
  }]
}];