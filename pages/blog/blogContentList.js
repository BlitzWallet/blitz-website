// blogContentList.js

export const postList = [
  {
    type: "Release", // Can be "Release", "Learn", or "Podcast"
    title: "eCash & Point-of-sale",
    description: "eCash Expansion, POS Tip Optimization & More!",
    htmlPageLink: "./eCash-pos",
    searchName: "eCash-pos",
    pageMetaDescription:
      "Blitz Wallet is a fully open-source Bitcoin Lightning, Liquid, and eCash wallet that merges the fast capabilities of the Lightning Network with the security of self-custodial management at a price unmatched by competitors.",
    readingLengthEST: 4, //In minutes
    time: "1743933891282",
    author: "Blitz Team",
    authorImage: "/favicon.png", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/megaphone.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Learn and Microphone is for podcast
    thumbnailUrl: "./eCash-pos/assets/eCashSettings.webp", //Scoped to blog index.html
    isVertical: true,
    isFeatured: false, // usualy will be set to false
  },
  {
    type: "Release", // Can be "Release", "Learn", or "Podcast"
    title: "The Power Up",
    description: "Ecash overhall, POS Tip Tracking & More!",
    htmlPageLink: "./power-up",
    searchName: "power-up",
    pageMetaDescription:
      "Blitz Wallet is a fully open-source Bitcoin Lightning, Liquid, and eCash wallet that merges the fast capabilities of the Lightning Network with the security of self-custodial management at a price unmatched by competitors.",
    readingLengthEST: 4, //In minutes
    time: "1742057210850",
    author: "Blitz Team",
    authorImage: "/favicon.png", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/megaphone.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Learn and Microphone is for podcast
    thumbnailUrl: "./power-up/assets/posTransactions.webp", //Scoped to blog index.html
    isVertical: true,
    isFeatured: false, // usualy will be set to false
  },
  {
    type: "Learn", // Can be "Release", "Learn", or "Podcast"
    title: "What Is a Self-Custodial Wallet?",
    description: "Your Guide to Financial Freedom with Blitz Wallet.",
    htmlPageLink: "./self-custodial-wallet",
    searchName: "self-custodial-wallet",
    pageMetaDescription:
      "Blitz Wallet is a fully open-source Bitcoin Lightning, Liquid, and eCash wallet that merges the fast capabilities of the Lightning Network with the security of self-custodial management at a price unmatched by competitors.",
    readingLengthEST: 7, //In minutes
    time: "1741611775672",
    author: "Destiny Smart",
    authorImage: "/public/authorImages/destiny_smart.webp", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/info.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Learn and Microphone is for podcast
    thumbnailUrl: "./self-custodial-wallet/assets/self_custody.png", //Scoped to blog index.html
    isVertical: true,
    isFeatured: false, // usualy will be set to false
    customAuthor: true,
  },
  {
    type: "Release", // Can be "Release", "Learn", or "Podcast"
    title: "The Efficiency Update",
    description: "Saying goodbye to long load times.",
    htmlPageLink: "./efficiency-update",
    searchName: "efficiency-update",
    pageMetaDescription:
      "Blitz Wallet is a fully open-source Bitcoin Lightning, Liquid, and eCash wallet that merges the fast capabilities of the Lightning Network with the security of self-custodial management at a price unmatched by competitors.",
    readingLengthEST: 2, //In minutes
    time: "1740237953923",
    author: "Blitz Team",
    authorImage: "/favicon.png", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/megaphone.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Learn and Microphone is for podcast
    thumbnailUrl: "./efficiency-update/assets/homepage.png", //Scoped to blog index.html
    isVertical: true,
    isFeatured: false, // usualy will be set to false
  },
  {
    type: "Release", // Can be "Release", "Learn", or "Podcast"
    title: "The Bridge Update",
    description: "We've rebuilt how you pay your contacts.",
    htmlPageLink: "./bridge-update",
    searchName: "bridge-update",
    pageMetaDescription:
      "Blitz Wallet is a fully open-source Bitcoin Lightning, Liquid, and eCash wallet that merges the fast capabilities of the Lightning Network with the security of self-custodial management at a price unmatched by competitors.",
    readingLengthEST: 2, //In minutes
    time: "1737590535347",
    author: "Blitz Team",
    authorImage: "/favicon.png", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/megaphone.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Learn and Microphone is for podcast
    thumbnailUrl: "./bridge-update/assets/contactsImages.png", //Scoped to blog index.html
    isVertical: true,
    isFeatured: false, // usualy will be set to false
  },
  {
    type: "Release", // Can be "Release", "Learn", or "Podcast"
    title: "Introducing Blitz Wallet",
    description: "A bitcoin wallet making payments simple",
    htmlPageLink: "./introducing-blitz-wallet",
    searchName: "introducing-blitz-wallet",
    pageMetaDescription:
      "Blitz Wallet is a fully open-source Bitcoin Lightning, Liquid, and eCash wallet that merges the fast capabilities of the Lightning Network with the security of self-custodial management at a price unmatched by competitors.",
    readingLengthEST: 5, //In minutes
    time: "1736994574819", // January 8, 2025
    author: "Blitz Team",
    authorImage: "/favicon.png", //Scoped to blog post page or public depending on image
    imageUrl: "../../src/assets/images/megaphone.svg", //Scoped to blog index.html| Megaphone is for Release, Info is for Learn and Microphone is for podcast
    thumbnailUrl: "./introducing-blitz-wallet/assets/thumbnailUrlWhite.png", //Scoped to blog index.html
    isFeatured: true, // usualy will be set to false
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
