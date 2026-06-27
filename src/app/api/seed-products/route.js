import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const existingProducts = await db.collection("products").countDocuments();

    if (existingProducts > 0) {
      return Response.json({
        success: true,
        message: "Products already exist.",
      });
    }

    const products = [
      {
        id: "artifact-001",
        name: "Artifact 001",
        series: "Artifact Series",
        color: "Obsidian Black",
        price: 799,
        image: "/images/featured-artifact.jpeg",
        description:
          "Inspired by ancient strength and refined purpose.",
        stock: 100,
        createdAt: new Date(),
      },
      {
        id: "essential-001",
        name: "Essential 001",
        series: "Essential Series",
        color: "White",
        price: 699,
        image: "/images/hero1.jpeg",
        description:
          "Minimal design for everyday confidence.",
        stock: 100,
        createdAt: new Date(),
      },
      {
        id: "blueprint-001",
        name: "Blueprint 001",
        series: "Blueprint Series",
        color: "Black",
        price: 899,
        image: "/images/collection-artifact.jpeg",
        description:
          "Designed with engineering precision.",
        stock: 100,
        createdAt: new Date(),
      },
    ];

    await db.collection("products").insertMany(products);

    return Response.json({
      success: true,
      message: "Products seeded successfully.",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Failed to seed products.",
      },
      { status: 500 }
    );
  }
}