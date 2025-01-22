// blogContentList.js

export const postList = [
  {
    type: "Release", // Can be "Release", "Tutorial", or "Podcast"
    title: "Introducing Blitz Wallet",
    description: "A bitcoin wallet making payments simple",
    htmlPageLink: "./introducing-blitz-wallet",
    searchName: "introducing-blitz-wallet",
    pageMetaDescription:
      "Learn how Blitz Wallet simplifies self-custodial Bitcoin Lightning transactions. This guide dives into its innovative features, and seamless integration with the Bitcoin Lightning Network. Explore why Blitz Wallet is the ultimate self-custodial Bitcoin Lightning wallet!",
    readingLengthEST: 5, //In minutes
    time: "1736994574819", // January 8, 2025
    author: "Blitz Team",
    authorImage: "../../../public/favicon.png", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/megaphone.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Tutorial and Microphone is for podcast
    thumbnailUrl: "./introducing-blitz-wallet/assets/thumbnailUrlWhite.png", //Scoped to blog index.html
    isFeatured: true, // usualy will be set to false
  },
  {
    type: "Release", // Can be "Release", "Tutorial", or "Podcast"
    title: "The Bridge Update",
    description: "We've rebuilt how you pay your contacts.",
    htmlPageLink: "./bridge-update",
    searchName: "bridge-update",
    pageMetaDescription:
      "Learn how Blitz Wallet simplifies self-custodial Bitcoin Lightning transactions. This guide dives into its innovative features, and seamless integration with the Bitcoin Lightning Network. Explore why Blitz Wallet is the ultimate self-custodial Bitcoin Lightning wallet!",
    readingLengthEST: 2, //In minutes
    time: "1737590535347",
    author: "Blitz Team",
    authorImage: "../../../public/favicon.png", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/megaphone.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Tutorial and Microphone is for podcast
    thumbnailUrl: "./bridge-update/assets/contactsImages.png", //Scoped to blog index.html
    isVertical: true,
    isFeatured: false, // usualy will be set to false
  },
];

// Helper functions
export const getPostsByCategory = (category) => {
  if (!category || category.toLowerCase() === "all") return postList;
  return postList.filter((post) =>
    category.toLowerCase().includes(post.type.toLowerCase())
  );
};
export const getPostByName = (postTitle) => {
  return postList.filter(
    (post) => postTitle.toLowerCase() === post.searchName.toLowerCase()
  );
};

export const formatDate = (timestamp) => {
  return new Date(parseInt(timestamp)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
