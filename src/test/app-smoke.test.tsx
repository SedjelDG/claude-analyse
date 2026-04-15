import { render, screen } from "@testing-library/react";

import App from "@/App";

describe("App", () => {
  it("renders the landing screen", () => {
    render(<App />);

    expect(screen.getByText(/software/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connexion/i })).toBeInTheDocument();
  });
});
