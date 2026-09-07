// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { render, screen } from "@testing-library/react";
// import { MemoryRouter } from "react-router-dom";

// import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
// import { useProperty } from "../../hooks/useProperty";

// // Mock the property hook.
// // We test Breadcrumbs here, not the internal implementation of useProperty.
// vi.mock("../../../hooks/useProperty", () => ({
//   useProperty: vi.fn(),
// }));

// const renderBreadcrumbs = (
//   initialPath = "/",
//   props = {}
// ) => {
//   return render(
//     <MemoryRouter initialEntries={[initialPath]}>
//       <Breadcrumbs {...props} />
//     </MemoryRouter>
//   );
// };

// describe("Breadcrumbs", () => {
//   beforeEach(() => {
//     vi.clearAllMocks();

//     useProperty.mockReturnValue({
//       property: null,
//       loading: false,
//     });
//   });

//   describe("root route", () => {
//     it("renders nothing on the home page", () => {
//       const { container } = renderBreadcrumbs("/");

//       expect(container.firstChild).toBeNull();
//     });
//   });

//   describe("basic breadcrumbs", () => {
//     it("renders the navigation landmark", () => {
//       renderBreadcrumbs("/properties");

//       expect(
//         screen.getByRole("navigation", {
//           name: "Breadcrumb",
//         })
//       ).toBeInTheDocument();
//     });

//     it("always renders the Home link", () => {
//       renderBreadcrumbs("/properties");

//       const homeLink = screen.getByRole("link", {
//         name: "Home",
//       });

//       expect(homeLink).toBeInTheDocument();
//       expect(homeLink).toHaveAttribute("href", "/");
//     });

//     it("renders a known route label", () => {
//       renderBreadcrumbs("/properties");

//       expect(
//         screen.getByText("Properties")
//       ).toBeInTheDocument();
//     });

//     it("marks the final breadcrumb as the current page", () => {
//       renderBreadcrumbs("/properties");

//       const currentPage = screen.getByText("Properties");

//       expect(currentPage).toHaveAttribute(
//         "aria-current",
//         "page"
//       );
//     });

//     it("does not render the final breadcrumb as a link", () => {
//       renderBreadcrumbs("/properties");

//       expect(
//         screen.queryByRole("link", {
//           name: "Properties",
//         })
//       ).not.toBeInTheDocument();
//     });
//   });

//   describe("nested routes", () => {
//     it("renders nested breadcrumb links correctly", () => {
//       renderBreadcrumbs("/dashboard/settings");

//       const dashboardLink = screen.getByRole("link", {
//         name: "Developer Dashboard",
//       });

//       expect(dashboardLink).toHaveAttribute(
//         "href",
//         "/dashboard"
//       );

//       const currentPage = screen.getByText("Settings");

//       expect(currentPage).toHaveAttribute(
//         "aria-current",
//         "page"
//       );
//     });

//     it("creates the correct URLs for multiple nested segments", () => {
//       renderBreadcrumbs(
//         "/dashboard/settings/profile"
//       );

//       expect(
//         screen.getByRole("link", {
//           name: "Developer Dashboard",
//         })
//       ).toHaveAttribute(
//         "href",
//         "/dashboard"
//       );

//       expect(
//         screen.getByRole("link", {
//           name: "Settings",
//         })
//       ).toHaveAttribute(
//         "href",
//         "/dashboard/settings"
//       );

//       expect(
//         screen.getByText("Profile")
//       ).toHaveAttribute(
//         "aria-current",
//         "page"
//       );
//     });
//   });

//   describe("known route names", () => {
//     it.each([
//       ["/compare", "Compare"],
//       ["/property-guide", "Property Guide"],
//       ["/supportHelp", "Support"],
//       ["/interior", "Home Interiors"],
//       ["/apnaloan", "ApnaLoans"],
//       ["/dashboard", "Developer Dashboard"],
//       ["/admin", "Admin"],
//       ["/customer-profile", "Profile"],
//       ["/privacy-policy", "Privacy Policy"],
//       ["/terms", "Terms & Conditions"],
//     ])(
//       "renders %s as %s",
//       (path, expectedLabel) => {
//         renderBreadcrumbs(path);

//         expect(
//           screen.getByText(expectedLabel)
//         ).toBeInTheDocument();
//       }
//     );
//   });

//   describe("unknown routes", () => {
//     it("converts kebab-case routes into readable labels", () => {
//       renderBreadcrumbs("/some-new-page");

//       expect(
//         screen.getByText("Some New Page")
//       ).toBeInTheDocument();
//     });

//     it("capitalizes a simple unknown route", () => {
//       renderBreadcrumbs("/contact");

//       expect(
//         screen.getByText("Contact")
//       ).toBeInTheDocument();
//     });

//     it("decodes URL-encoded route segments", () => {
//       renderBreadcrumbs(
//         "/mumbai%20real-estate"
//       );

//       expect(
//         screen.getByText("Mumbai Real Estate")
//       ).toBeInTheDocument();
//     });

//     it("does not crash on malformed URL encoding", () => {
//       renderBreadcrumbs("/invalid%ZZ-route");

//       expect(
//         screen.getByText("Invalid%ZZ Route")
//       ).toBeInTheDocument();
//     });
//   });

//   describe("property detail pages", () => {
//     it("calls useProperty with the property ID", () => {
//       useProperty.mockReturnValue({
//         property: null,
//         loading: false,
//       });

//       renderBreadcrumbs("/property/12345");

//       expect(useProperty).toHaveBeenCalledWith(
//         "12345"
//       );
//     });

//     it("does not display the hidden property route segment", () => {
//       renderBreadcrumbs("/property/12345");

//       expect(
//         screen.queryByText("Property")
//       ).not.toBeInTheDocument();
//     });

//     it("displays the property title when the property is loaded", () => {
//       useProperty.mockReturnValue({
//         property: {
//           title: "Luxury Apartments in Bandra",
//         },
//         loading: false,
//       });

//       renderBreadcrumbs("/property/abc123");

//       expect(
//         screen.getByText(
//           "Luxury Apartments in Bandra"
//         )
//       ).toBeInTheDocument();
//     });

//     it("shows a loading label while the property is loading", () => {
//       useProperty.mockReturnValue({
//         property: null,
//         loading: true,
//       });

//       renderBreadcrumbs("/property/abc123");

//       expect(
//         screen.getByText("Loading property...")
//       ).toBeInTheDocument();
//     });

//     it("falls back to Property when loading has finished without a property title", () => {
//       useProperty.mockReturnValue({
//         property: null,
//         loading: false,
//       });

//       renderBreadcrumbs("/property/abc123");

//       expect(
//         screen.getByText("Property")
//       ).toBeInTheDocument();
//     });

//     it("uses the property title as the current page", () => {
//       useProperty.mockReturnValue({
//         property: {
//           title: "Bandra Heights",
//         },
//         loading: false,
//       });

//       renderBreadcrumbs("/property/abc123");

//       const currentPage = screen.getByText(
//         "Bandra Heights"
//       );

//       expect(currentPage).toHaveAttribute(
//         "aria-current",
//         "page"
//       );
//     });
//   });

//   describe("navigation structure", () => {
//     it("renders intermediate breadcrumbs as links", () => {
//       renderBreadcrumbs(
//         "/dashboard/settings"
//       );

//       const dashboardLink =
//         screen.getByRole("link", {
//           name: "Developer Dashboard",
//         });

//       expect(dashboardLink).toHaveAttribute(
//         "href",
//         "/dashboard"
//       );
//     });

//     it("renders the final breadcrumb as text instead of a link", () => {
//       renderBreadcrumbs(
//         "/dashboard/settings"
//       );

//       expect(
//         screen.queryByRole("link", {
//           name: "Settings",
//         })
//       ).not.toBeInTheDocument();

//       expect(
//         screen.getByText("Settings")
//       ).toHaveAttribute(
//         "aria-current",
//         "page"
//       );
//     });
//   });

//   describe("navbar styling", () => {
//     it("applies the no-navbar class by default", () => {
//       renderBreadcrumbs("/properties");

//       const nav = screen.getByRole("navigation", {
//         name: "Breadcrumb",
//       });

//       expect(nav).toHaveClass(
//         "breadcrumbs--no-nav"
//       );
//     });

//     it("applies the with-navbar class when hasNavbar is true", () => {
//       renderBreadcrumbs(
//         "/properties",
//         { hasNavbar: true }
//       );

//       const nav = screen.getByRole("navigation", {
//         name: "Breadcrumb",
//       });

//       expect(nav).toHaveClass(
//         "breadcrumbs--with-nav"
//       );
//     });
//   });

//   describe("structured data", () => {
//     it("renders BreadcrumbList JSON-LD", () => {
//       const { container } = renderBreadcrumbs(
//         "/properties"
//       );

//       const script = container.querySelector(
//         'script[type="application/ld+json"]'
//       );

//       expect(script).toBeInTheDocument();

//       const jsonLd = JSON.parse(
//         script.textContent
//       );

//       expect(jsonLd["@context"]).toBe(
//         "https://schema.org"
//       );

//       expect(jsonLd["@type"]).toBe(
//         "BreadcrumbList"
//       );
//     });

//     it("includes Home as the first JSON-LD breadcrumb", () => {
//       const { container } = renderBreadcrumbs(
//         "/properties"
//       );

//       const script = container.querySelector(
//         'script[type="application/ld+json"]'
//       );

//       const jsonLd = JSON.parse(
//         script.textContent
//       );

//       expect(
//         jsonLd.itemListElement[0]
//       ).toMatchObject({
//         "@type": "ListItem",
//         position: 1,
//         name: "Home",
//       });
//     });

//     it("includes the current route in JSON-LD", () => {
//       const { container } = renderBreadcrumbs(
//         "/properties"
//       );

//       const script = container.querySelector(
//         'script[type="application/ld+json"]'
//       );

//       const jsonLd = JSON.parse(
//         script.textContent
//       );

//       expect(
//         jsonLd.itemListElement
//       ).toContainEqual(
//         expect.objectContaining({
//           name: "Properties",
//           position: 2,
//         })
//       );
//     });

//     it("uses the property title in JSON-LD when available", () => {
//       useProperty.mockReturnValue({
//         property: {
//           title: "Bandra Heights",
//         },
//         loading: false,
//       });

//       const { container } = renderBreadcrumbs(
//         "/property/abc123"
//       );

//       const script = container.querySelector(
//         'script[type="application/ld+json"]'
//       );

//       const jsonLd = JSON.parse(
//         script.textContent
//       );

//       expect(
//         jsonLd.itemListElement
//       ).toContainEqual(
//         expect.objectContaining({
//           name: "Bandra Heights",
//         })
//       );
//     });
//   });
// });