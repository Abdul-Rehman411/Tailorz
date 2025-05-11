import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { imagePath } = body;

    if (!imagePath) {
      return new Response(JSON.stringify({ error: "Missing imagePath" }), {
        status: 400,
      });
    }

    // Build absolute path to the file
    const filePath = path.join(process.cwd(), "public", imagePath);

    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
      });
    }

    fs.unlinkSync(filePath);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error deleting file:", error);
    return new Response(JSON.stringify({ error: "Failed to delete image" }), {
      status: 500,
    });
  }
}
