// // frontend-vite/src/contexts/__tests__/CompareContext.test.jsx
// import { describe, it, expect } from "vitest";
// import { render, screen, fireEvent } from "@testing-library/react";
// import { CompareProvider, useCompare } from "../CompareContext";
//import {} useCompare from " ../../../contexts/contextInstances/CompareContextInstance"

// function Probe() {
//   const { compareList, addToCompare, removeFromCompare } = useCompare();
//   return (
//     <div>
//       <span data-testid="count">{compareList.length}</span>
//       <button onClick={() => addToCompare({ _id: "p1" })}>add</button>
//       <button onClick={() => removeFromCompare("p1")}>remove</button>
//     </div>
//   );
// }

// describe("CompareContext", () => {
//   it("provides live compare state to consumers", () => {
//     render(
//       <CompareProvider>
//         <Probe />
//       </CompareProvider>
//     );

//     expect(screen.getByTestId("count")).toHaveTextContent("0");

//     fireEvent.click(screen.getByText("add"));
//     expect(screen.getByTestId("count")).toHaveTextContent("1");

//     fireEvent.click(screen.getByText("remove"));
//     expect(screen.getByTestId("count")).toHaveTextContent("0");
//   });

//   it("shares one compare state across multiple consumers", () => {
//     function ProbeB() {
//       const { compareList } = useCompare();
//       return <span data-testid="count-b">{compareList.length}</span>;
//     }

//     render(
//       <CompareProvider>
//         <Probe />
//         <ProbeB />
//       </CompareProvider>
//     );

//     fireEvent.click(screen.getByText("add"));

//     expect(screen.getByTestId("count")).toHaveTextContent("1");
//     expect(screen.getByTestId("count-b")).toHaveTextContent("1");
//   });

//   // --- Documents a real gap, expected to currently FAIL ---
//   //
//   // createContext() is called with no default value, so any component
//   // that calls useCompare() outside a <CompareProvider> gets `undefined`
//   // back and crashes with "Cannot destructure property 'compareList' of
//   // undefined" — a confusing error far from its actual cause (a missing
//   // provider, e.g. after a routing refactor drops the wrapper). Recommend
//   // either a sane default object, or throwing a clear error from
//   // useCompare() itself: `if (!ctx) throw new Error("useCompare must be
//   // used within a CompareProvider")`.
//   it.fails(
//     "useCompare() outside a CompareProvider throws a clear, actionable error (KNOWN GAP)",
//     () => {
//       function Orphan() {
//         useCompare().compareList; 
//         return null;
//       }
//       expect(() => render(<Orphan />)).toThrow(/CompareProvider/);
//     }
//   );
// });