import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import API from "../../../api/api";
import DeveloperPopup from "../DeveloperPopup";

vi.mock("../../../api/api", () => ({
  default: { post: vi.fn() },
}));

const fill = () => {
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Asha Rao" } });
  fireEvent.change(screen.getByLabelText("Company name"), { target: { value: "Rao Builders" } });
  fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "asha@rao.in" } });
  fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "98765 43210" } });
  fireEvent.click(screen.getByRole("checkbox"));
};

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Send request" }));

describe("DeveloperPopup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing when closed", () => {
    const { container } = render(<DeveloperPopup isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("asks for all fields before sending", () => {
    render(<DeveloperPopup isOpen onClose={vi.fn()} />);
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent("Please fill in all fields.");
    expect(API.post).not.toHaveBeenCalled();
  });

  it("requires consent", () => {
    render(<DeveloperPopup isOpen onClose={vi.fn()} />);
    fill();
    fireEvent.click(screen.getByRole("checkbox")); // untick
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent(/agree to be contacted/);
    expect(API.post).not.toHaveBeenCalled();
  });

  it("strips non-digits from the phone number", () => {
    render(<DeveloperPopup isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "+91-98765" } });
    expect(screen.getByLabelText("Mobile number")).toHaveValue("9198765");
  });

  it("sends the lead and shows the success screen", async () => {
    API.post.mockResolvedValue({ status: 201, data: { success: true } });
    render(<DeveloperPopup isOpen onClose={vi.fn()} />);
    fill();
    submit();

    expect(await screen.findByText("Request received")).toBeInTheDocument();
    expect(API.post).toHaveBeenCalledWith("/api/leads/developer", {
      developerFullName: "Asha Rao",
      companyName: "Rao Builders",
      developerEmail: "asha@rao.in",
      developerPhone: "9876543210",
      developerContactConsent: true,
      source: "developer_popup",
    });
    expect(screen.getByText(/\+91 9876543210/)).toBeInTheDocument();
  });

  it("tells a repeat sender their earlier request is in", async () => {
    API.post.mockResolvedValue({ status: 200, data: { success: true } });
    render(<DeveloperPopup isOpen onClose={vi.fn()} />);
    fill();
    submit();
    expect(await screen.findByText("We already have your request")).toBeInTheDocument();
  });

  it("shows an error and keeps the form when sending fails", async () => {
    API.post.mockRejectedValue(new Error("network"));
    render(<DeveloperPopup isOpen onClose={vi.fn()} />);
    fill();
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByLabelText("Your name")).toHaveValue("Asha Rao");
  });

  it("does not close on an outside click once the user has typed", () => {
    const onClose = vi.fn();
    render(<DeveloperPopup isOpen onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "A" } });
    fireEvent.mouseDown(document.body);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on an outside click when the form is empty", () => {
    const onClose = vi.fn();
    render(<DeveloperPopup isOpen onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes from the Done button after success", async () => {
    API.post.mockResolvedValue({ status: 201, data: { success: true } });
    const onClose = vi.fn();
    render(<DeveloperPopup isOpen onClose={onClose} />);
    fill();
    submit();
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalled();
  });
});
