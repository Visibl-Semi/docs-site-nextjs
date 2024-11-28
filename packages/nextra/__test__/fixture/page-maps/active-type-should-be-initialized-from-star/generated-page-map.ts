import active_type_should_be_initialized_from_star_meta from "../active-type-should-be-initialized-from-star/_meta.ts";
import active_type_should_be_initialized_from_star_1_level_meta from "../active-type-should-be-initialized-from-star/1-level/_meta.ts";
export const pageMap = [{
  data: active_type_should_be_initialized_from_star_meta
}, {
  name: "1-level",
  route: "/1-level",
  children: [{
    data: active_type_should_be_initialized_from_star_1_level_meta
  }, {
    name: "foo",
    route: "/1-level/foo",
    frontMatter: {
      "sidebarTitle": "Foo"
    }
  }]
}];