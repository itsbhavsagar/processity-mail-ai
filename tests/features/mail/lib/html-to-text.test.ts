import { htmlToPlainText } from "@/features/mail/lib/html-to-text";

describe("htmlToPlainText", () => {
  it("strips tags and keeps readable text with line breaks", () => {
    const html =
      "<div><p>Hi Bhav,</p><p>Thank you for your interest in <a href='#'>SDE-1</a>.</p><br><p>Best regards,<br>Amazon</p></div>";

    const text = htmlToPlainText(html);

    expect(text).toContain("Hi Bhav,");
    expect(text).toContain("Thank you for your interest in SDE-1.");
    expect(text).toContain("Best regards,\nAmazon");
    expect(text).not.toContain("<");
    expect(text).not.toContain("href");
  });

  it("drops script/style content and decodes entities", () => {
    const html =
      "<style>.x{color:red}</style><p>Team &amp; you&#39;re &lt;done&gt;</p><script>alert(1)</script>";

    const text = htmlToPlainText(html);

    expect(text).toBe("Team & you're <done>");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("color:red");
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
  });
});
