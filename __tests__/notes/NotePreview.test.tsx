import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotePreview from "@/components/notes/NotePreview";

describe("NotePreview", () => {
  it("renders placeholder for empty content", () => {
    render(<NotePreview content="" />);
    expect(screen.getByText(/Nothing to preview/i)).toBeInTheDocument();
  });

  it("renders headings and paragraphs", () => {
    render(<NotePreview content={`# Title\n\nBody text.`} />);
    expect(
      screen.getByRole("heading", { level: 1 })
    ).toHaveTextContent("Title");
    expect(screen.getByText("Body text.")).toBeInTheDocument();
  });

  it("renders GFM tables", () => {
    render(
      <NotePreview
        content={`| a | b |\n|---|---|\n| 1 | 2 |`}
      />
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders GFM task-list checkboxes", () => {
    render(<NotePreview content={`- [ ] todo\n- [x] done`} />);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes.length).toBeGreaterThanOrEqual(1);
  });

  it("renders fenced code blocks", () => {
    render(<NotePreview content={"```js\nconst x = 1;\n```"} />);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("renders links with target=_blank and rel=noopener", () => {
    render(<NotePreview content="[click](https://example.com)" />);
    const a = screen.getByRole("link", { name: "click" }) as HTMLAnchorElement;
    expect(a.target).toBe("_blank");
    expect(a.rel).toContain("noopener");
  });

  it("renders blockquotes and lists", () => {
    render(<NotePreview content={`> a quote\n\n- one\n- two`} />);
    expect(screen.getByText("a quote")).toBeInTheDocument();
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
  });
});
