import { NextResponse } from "next/server";
import { route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";

export async function POST(req: Request): Promise<Response> {
  try {
    const { s3 } = await import("@/lib/supabase/s3client");
    const { createClient } = await import("@/lib/supabase/server");

    const router: Router = {
      client: s3,
      bucketName: "dashboard_media",
      routes: {
        images: route({
          fileTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "video/mp4",
            "video/mov",
            "video/quicktime",
          ],
          multipleFiles: true,
          maxFiles: 4,
          onBeforeUpload: async () => {
            const supabase = await createClient();
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            if (error || !user) {
              throw new Error("Unauthorized");
            }

            return {
              // TODO: adding a subfolder with a timestamp so its easier to visualized the file connected to a specific request.
              generateObjectInfo: ({ file }) => ({
                key: `${user.id}/${file.name}`,
                metadata: {
                  author: user.id,
                },
              }),
            };
          },
        }),
      },
    };

    const res = await toRouteHandler(router).POST(req);

    if (
      res.status >= 400 &&
      res.headers.get("content-type")?.includes("text/html")
    ) {
      const text = await res.text();
      return NextResponse.json(
        {
          error: {
            type: "upload_failed",
            message: "Upload failed",
            details: text.slice(0, 200),
          },
        },
        { status: res.status }
      );
    }

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json(
      { error: { type: "upload_failed", message } },
      { status: 500 }
    );
  }
}
