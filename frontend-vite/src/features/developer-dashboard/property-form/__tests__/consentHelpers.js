// Test helpers for the end-of-form consent block and its second publish button.
import { fireEvent, screen } from "@testing-library/react";

// Ticks both boxes; boxes already ticked are left alone, so calling it twice is safe.
export const tickConsent = () => {
  for (const name of [/I agree to the/, /I confirm the details/]) {
    const box = screen.getByRole("checkbox", { name });
    if (!box.checked) fireEvent.click(box);
  }
};

// The form has two (top and end of form); both are the same submit button.
export const publishButton = (name = "Publish listing") => screen.getAllByRole("button", { name })[0];

export const clickPublish = (name = "Publish listing") => {
  tickConsent();
  fireEvent.click(publishButton(name));
};
