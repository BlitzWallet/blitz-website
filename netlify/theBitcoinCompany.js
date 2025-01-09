"use strict";
import "dotenv/config";
import { JWTAuth } from "../middleware/JWTAuth";
import { decryptMessage, encryptMessage } from "../middleware/newEncription";
import { getTBCaccessCode } from "../middleware/getTBCaccessCode";
import { verifyAppCheckToken } from "../middleware/verifyAppCheckToken";

const serverURL =
  process.env.ENVIRONMENT === "liquid"
    ? "https://api.thebitcoincompany.com"
    : "https://api.dev.thebitcoincompany.com";
export async function handler(event, context) {
  if (event.httpMethod === "POST") {
    try {
      const appCheckToken = event.headers["x-firebase-appcheck"];

      if (appCheckToken) await verifyAppCheckToken(appCheckToken);
      const postData = event.body ? JSON.parse(event.body) : null; //sanitation
      const token = event.headers.authorization;
      //   const decryptedContent = JSON.parse(
      //     await decryptMessage(
      //       process.env.DB_PRIVKEY,
      //       postData.pubKey,
      //       postData.content
      //     )
      //   );

      const access_token = await getTBCaccessCode();
      if (postData.type === "listGiftCards") {
        try {
          const response = await fetch(`${serverURL}/giftcards`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await response.json();

          return {
            statusCode: 200,
            body: JSON.stringify({
              giftCards: data.result.svs,
            }),
          };
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: "Error getting options",
            }),
          };
        }
      } else if (postData.type === "listGiftCardsWhenSignedIn") {
        try {
          const response = await fetch(`${serverURL}/svs/offers-for-user`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
          });

          const data = await response.json();

          return {
            statusCode: 200,
            body: JSON.stringify({
              giftCards: data.result.svs,
            }),
          };
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: "Error getting options",
            }),
          };
        }
      }
      //    else if (postData.type === "signUp") {
      //     try {
      //       const response = await fetch(`${serverURL}/auth/sign-up`, {
      //         method: "POST",
      //         body: JSON.stringify({
      //           email: postData.email,
      //           password: postData.password,
      //           referralCode: "TJNCEX",
      //         }),
      //         headers: {
      //           "Content-Type": "application/json",
      //         },
      //       });
      //       const data = await response.json();
      //       if (data.statusCode === 400)
      //         return {
      //           statusCode: 400,
      //           body: JSON.stringify({
      //             error: data.error,
      //           }),
      //         };
      //       //   const encriptedContact = encryptMessage(
      //       //     process.env.DB_PRIVKEY,
      //       //     userPubKey,
      //       //     JSON.stringify(data)
      //       //   );
      //       return {
      //         statusCode: 200,
      //         body: JSON.stringify({
      //           response: data,
      //         }),
      //       };
      //     } catch (err) {
      //       console.log(err, "TESt");
      //       return {
      //         statusCode: 400,
      //         body: JSON.stringify(err),
      //       };
      //     }
      //   } else if (postData.type === "login") {
      //     try {
      //       const response = await fetch(`${serverURL}/auth/login`, {
      //         method: "POST",
      //         body: JSON.stringify({
      //           email: postData.email,
      //           password: postData.password,
      //         }),
      //         headers: {
      //           "Content-Type": "application/json",
      //         },
      //       });
      //       const data = await response.json();
      //       if (data.statusCode === 400)
      //         return {
      //           statusCode: 400,
      //           body: JSON.stringify({
      //             error: data.error,
      //           }),
      //         };
      //       //   const encriptedContact = encryptMessage(
      //       //     process.env.DB_PRIVKEY,
      //       //     userPubKey,
      //       //     JSON.stringify(data)
      //       //   );
      //       console.log(data);
      //       return {
      //         statusCode: 200,
      //         body: JSON.stringify({
      //           response: data,
      //         }),
      //       };
      //     } catch (err) {
      //       console.log(err, "TESt");
      //       return {
      //         statusCode: 400,
      //         body: JSON.stringify(err),
      //       };
      //     }
      //   } else if (postData.type === "getNewAccessToken") {
      //     try {
      //       const response = await fetch(`${serverURL}/auth/refresh-token`, {
      //         method: "GET",
      //         headers: {
      //           "Content-Type": "application/json",
      //           Authorization: `Bearer ${postData.refreshToken}`,
      //         },
      //       });
      //       const data = await response.json();
      //       if (data.statusCode === 400)
      //         return {
      //           statusCode: 400,
      //           body: JSON.stringify({
      //             error: data.error,
      //           }),
      //         };
      //       //   const encriptedContact = encryptMessage(
      //       //     process.env.DB_PRIVKEY,
      //       //     userPubKey,
      //       //     JSON.stringify(data)
      //       //   );
      //       return {
      //         statusCode: 200,
      //         body: JSON.stringify({
      //           response: data,
      //         }),
      //       };
      //     } catch (err) {
      //       console.log(err, "TESt");
      //       return {
      //         statusCode: 400,
      //         body: JSON.stringify(err),
      //       };
      //     }
      //   } else if (postData.type === "lookupUser") {
      //     try {
      //       const response = await fetch(`${serverURL}/users/find`, {
      //         method: "GET",
      //         headers: {
      //           "Content-Type": "application/json",
      //           Authorization: `Bearer ${access_token}`,
      //         },
      //       });
      //       const data = await response.json();
      //       if (data.statusCode === 400)
      //         return {
      //           statusCode: 400,
      //           body: JSON.stringify({
      //             error: data.error,
      //           }),
      //         };
      //       //   const encriptedContact = encryptMessage(
      //       //     process.env.DB_PRIVKEY,
      //       //     userPubKey,
      //       //     JSON.stringify(data)
      //       //   );
      //       console.log(data);
      //       return {
      //         statusCode: 200,
      //         body: JSON.stringify({
      //           response: data,
      //         }),
      //       };
      //     } catch (err) {
      //       console.log(err, "TESt");
      //       return {
      //         statusCode: 400,
      //         body: JSON.stringify(err),
      //       };
      //     }
      //   } else if (postData.type === "requestResetPassword") {
      //     try {
      //       const response = await fetch(
      //         `${serverURL}/auth/request-password-reset`,
      //         {
      //           method: "POST",
      //           headers: {
      //             "Content-Type": "application/json",
      //           },
      //           body: JSON.stringify({
      //             email: postData.email,
      //           }),
      //         }
      //       );
      //       const data = await response.json();
      //       if (data.statusCode === 400)
      //         return {
      //           statusCode: 400,
      //           body: JSON.stringify({
      //             error: data.error,
      //           }),
      //         };

      //       return {
      //         statusCode: 200,
      //         body: JSON.stringify({
      //           response: data,
      //         }),
      //       };
      //     } catch (err) {
      //       console.log(err, "TESt");
      //       return {
      //         statusCode: 400,
      //         body: JSON.stringify(err),
      //       };
      //     }
      //   } else if (postData.type === "resetAccountPassword") {
      //     try {
      //       const response = await fetch(`${serverURL}/auth/reset-password`, {
      //         method: "POST",
      //         headers: {
      //           "Content-Type": "application/json",
      //         },
      //         body: JSON.stringify({
      //           password: postData.password,
      //           resetToken: postData.resetToken,
      //         }),
      //       });
      //       const data = await response.json();
      //       if (data.statusCode === 400)
      //         return {
      //           statusCode: 400,
      //           body: JSON.stringify({
      //             error: data.error,
      //           }),
      //         };

      //       return {
      //         statusCode: 200,
      //         body: JSON.stringify({
      //           response: data,
      //         }),
      //       };
      //     } catch (err) {
      //       console.log(err, "TESt");
      //       return {
      //         statusCode: 400,
      //         body: JSON.stringify(err),
      //       };
      //     }
      //   }
      else if (postData.type == "quoteGiftCard") {
        try {
          const response = await fetch(`${serverURL}/svs/quote-card`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({
              productId: postData.productId, //string
              cardValue: postData.cardValue, //number
              quantity: postData.quantity, //number
              purchaseType: "Lightning",
            }),
          });
          const data = await response.json();

          if (data.statusCode === 400)
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: data.error,
              }),
            };
          return {
            statusCode: 200,
            body: JSON.stringify({
              response: data,
            }),
          };
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: "Error getting options",
            }),
          };
        }
      } else if (postData.type === "buyGiftCard") {
        try {
          const response = await fetch(
            `${serverURL}/giftcards/purchase/bitcoin`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
              },
              body: JSON.stringify({
                productId: postData.productId, //string
                cardValue: postData.cardValue, //number
                quantity: postData.quantity, //number
                label: "Purchase from Blitz Wallet",
                giftPersonalization: {
                  email: postData.email,
                  to: postData.blitzUsername,
                  from: "Blitz Wallet",
                  message: "Thanks for using Blitz!",
                },
              }),
            }
          );
          const data = await response.json();

          if (data.statusCode === 400)
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: data.error,
              }),
            };
          return {
            statusCode: 200,
            body: JSON.stringify({
              response: data,
            }),
          };
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: "Error getting options",
            }),
          };
        }
      } else if (postData.type === "giftCardStatus") {
        try {
          const response = await fetch(
            `${serverURL}/giftcards/invoice-status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
              },
              body: JSON.stringify({
                invoice: postData.invoice,
              }),
            }
          );
          const data = await response.json();

          if (data.statusCode === 400)
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: data.error,
              }),
            };
          //   const encriptedContact = encryptMessage(
          //     process.env.DB_PRIVKEY,
          //     userPubKey,
          //     JSON.stringify(data)
          //   );
          return {
            statusCode: 200,
            body: JSON.stringify({
              response: data,
            }),
          };
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: "Error getting options",
            }),
          };
        }
      } else if (postData.type === "getUserPurchases") {
        try {
          const response = await fetch(`${serverURL}/user/giftcards`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
          });
          const data = await response.json();

          if (data.statusCode === 400)
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: data.error,
              }),
            };
          //   const encriptedContact = encryptMessage(
          //     process.env.DB_PRIVKEY,
          //     userPubKey,
          //     JSON.stringify(data)
          //   );
          return {
            statusCode: 200,
            body: JSON.stringify({
              response: data,
            }),
          };
        } catch (err) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: "Error getting options",
            }),
          };
        }
      }
      // if (!token)
      //   return {
      //     statusCode: 400,
      //     body: JSON.stringify({
      //       error: "Error no authentication token provided",
      //     }),
      //   };

      // if (!isAuthenticated)
      //   return {
      //     statusCode: 400,
      //     body: JSON.stringify({
      //       error: "Incorrect authenticatoin token",
      //     }),
      //   };

      return {
        statusCode: 200,
        body: JSON.stringify("WORKIGN"),
      };
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Error getting options",
        }),
      };
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Error getting options",
      }),
    };
  }
}
