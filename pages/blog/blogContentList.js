// blogContentList.js

export const postList = [
  {
    type: "Release", // Can be "Release", "Tutorial", or "Podcast"
    title: "Introducing Blitz Wallet",
    description: "A bitcoin wallet making payments simple",
    htmlPageLink: "./template",
    time: "1736275644454", // January 8, 2025
    imageUrl: "../../src/assets/images/megaphone.svg",
    thumbnailUrl: "../../public/wordmark.png",
    isFeatured: true,
  },
];

// Helper functions
export const getPostsByCategory = (category) => {
  if (!category || category.toLowerCase() === "all") return postList;
  return postList.filter((post) =>
    category.toLowerCase().includes(post.type.toLowerCase())
  );
};

export const formatDate = (timestamp) => {
  return new Date(parseInt(timestamp)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
