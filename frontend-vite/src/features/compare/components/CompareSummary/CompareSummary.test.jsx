import { describe, it, expect } from "vitest";
import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";

import CompareSummary from "./CompareSummary";


const mockProperties = [
  {
    _id: "1",
    title: "Skyline Heights",

    city: "Mumbai",

    price: 10000000,

    area: {
      value: 1000,
      unit: "sqft",
    },

    amenities: [
      "Gym",
      "Swimming Pool",
    ],

    facilities: [],
    security: [],

    possessionStatus: "Ready to Move",

    reraApproved: true,
    reraNumber: "P51800012345",

    metadata: {
      analytics: {
        popularityScore: 90,
      },
    },
  },

  {
    _id: "2",
    title: "Green Valley",

    city: "Mumbai",

    price: 15000000,

    area: {
      value: 1500,
      unit: "sqft",
    },

    amenities: [
      "Gym",
    ],

    facilities: [],
    security: [],

    possessionStatus:
      "Under Construction",

    reraApproved: false,

    metadata: {
      analytics: {
        popularityScore: 50,
      },
    },
  },
];


describe("CompareSummary", () => {
  it("does not render when fewer than two properties are provided", () => {
    const { container } = render(
      <CompareSummary
        properties={[
          mockProperties[0],
        ]}
      />
    );

    expect(
      container.firstChild
    ).toBeNull();
  });


  it("renders the comparison title for two properties", () => {
    render(
      <CompareSummary
        properties={mockProperties}
      />
    );

    expect(
      screen.getByRole("heading", {
        name:
          /Skyline Heights vs Green Valley/i,
      })
    ).toBeInTheDocument();
  });


  it("renders the selected property count", () => {
    render(
      <CompareSummary
        properties={mockProperties}
      />
    );

    expect(
      screen.getByText("2 selected")
    ).toBeInTheDocument();
  });


  it("renders the city information", () => {
    render(
      <CompareSummary
        properties={mockProperties}
      />
    );

    expect(
      screen.getByText("Mumbai")
    ).toBeInTheDocument();
  });


  it("renders the comparison recommendation", () => {
    render(
      <CompareSummary
        properties={mockProperties}
      />
    );

    expect(
      screen.getByText(
        /Comparison recommendation/i
      )
    ).toBeInTheDocument();
  });


  it("expands the description when Read more is clicked", () => {
    render(
      <CompareSummary
        properties={mockProperties}
      />
    );

    const button = screen.getByRole(
      "button",
      {
        name: /Read more/i,
      }
    );

    fireEvent.click(button);

    expect(
      screen.getByRole("button", {
        name: /Show less/i,
      })
    ).toBeInTheDocument();
  });


  it("updates aria-expanded when toggled", () => {
    render(
      <CompareSummary
        properties={mockProperties}
      />
    );

    const button = screen.getByRole(
      "button",
      {
        name: /Read more/i,
      }
    );

    expect(button).toHaveAttribute(
      "aria-expanded",
      "false"
    );

    fireEvent.click(button);

    expect(button).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});