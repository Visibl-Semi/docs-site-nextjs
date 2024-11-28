import pages_order_without_type_page_meta from "../pages-order-without-type-page/_meta.ts";
import pages_order_without_type_page_docs_meta from "../pages-order-without-type-page/docs/_meta.ts";
export const pageMap = [{
  data: pages_order_without_type_page_meta
}, {
  name: "docs",
  route: "/docs",
  children: [{
    data: pages_order_without_type_page_docs_meta
  }, {
    name: "bar",
    route: "/docs/bar",
    frontMatter: {
      "sidebarTitle": "Bar"
    }
  }]
}, {
  name: "foo",
  route: "/foo",
  frontMatter: {
    "sidebarTitle": "Foo"
  }
}];