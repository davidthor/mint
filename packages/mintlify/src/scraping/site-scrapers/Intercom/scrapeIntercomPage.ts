import cheerio from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";
import downloadAllImages from "../../downloadAllImages.js";
import replaceImagePaths from "../../replaceImagePaths.js";

export async function scrapeIntercomPage(
  html: string,
  origin: string,
  cliDir: string,
  imageBaseDir: string,
  overwrite: boolean,
  _: string | undefined // version
) {
  const $ = cheerio.load(html);

  const titleComponent = $(".t__h1").first();
  const title = titleComponent.text().trim();
  let description = $(".article__desc", titleComponent.parent()).text().trim();

  let content = $("article").first();
  const contentHtml = $.html(content);

  const origToWritePath = await downloadAllImages(
    $,
    content,
    origin,
    imageBaseDir,
    overwrite,
    undefined,
    true
  );

  const nhm = new NodeHtmlMarkdown({ useInlineLinks: false });
  let markdown = nhm.translate(contentHtml);

  // Keep headers on one line
  markdown = markdown.replace(/# \n\n/g, "# ");

  // Remove unnecessary nonwidth blank space characters
  markdown = markdown.replace(/\u200b/g, "");

  // Reduce unnecessary blank lines
  markdown = markdown.replace(/\n\n\n/g, "\n\n");

  // Mintlify doesn't support bolded headers, remove the asterisks
  markdown = markdown.replace(/(\n#+) \*\*(.*)\*\*\n/g, "$1 $2\n");

  markdown = replaceImagePaths(origToWritePath, cliDir, markdown);

  return { title, description, markdown };
}
