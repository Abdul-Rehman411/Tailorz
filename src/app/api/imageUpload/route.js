import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // Explicitly set the runtime environment

export async function POST(req) {
  try {
    // Parse the JSON body
    const body = await req.json();
    const { imageData, fileName, targetPath } = body;

    if (!imageData || !fileName || !targetPath) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Decode the base64 image data
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Dynamically construct the directory path
    const directoryPath = path.join(process.cwd(), "public", targetPath);

    // Ensure the directory exists
    fs.mkdirSync(directoryPath, { recursive: true });

    // Create the full file path
    const filePath = path.join(directoryPath, fileName);

    // Write the file to the target location
    fs.writeFileSync(filePath, buffer);

    // Construct the public URL
    const publicUrl = `${targetPath}/${fileName}`;

    return new Response(JSON.stringify({ url: publicUrl }), { status: 200 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return new Response(JSON.stringify({ error: "Failed to upload image" }), {
      status: 500,
    });
  }
}
