// Stablecoin network constants
const NETWORK_LABELS = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  base: "Base",
  solana: "Solana",
  tron: "Tron",
};

const CURRENCY_NETWORKS = {
  USDC: ["ethereum", "arbitrum", "optimism", "polygon", "base", "solana"],
  USDT: ["ethereum", "arbitrum", "optimism", "tron"],
};

const NETWORK_MAP = {
  ethereum: {
    chainId: 1,
    usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
  polygon: {
    chainId: 137,
    usdc: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    usdt: null,
  },
  arbitrum: {
    chainId: 42161,
    usdc: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    usdt: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  },
  optimism: {
    chainId: 10,
    usdc: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    usdt: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
  },
  base: {
    chainId: 8453,
    usdc: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    usdt: null,
  },
  solana: { chainId: null, usdc: null, usdt: null },
  tron: { chainId: null, usdc: null, usdt: null },
};

// Currency data
const fiatCurrencies = [
  { info: { spacing: null, name: "Australian Dollar" }, id: "AUD" },
  { info: { spacing: null, name: "Baht" }, id: "THB" },
  { info: { spacing: null, name: "Balboa" }, id: "PAB" },
  { info: { spacing: null, name: "Bolivar Soberano" }, id: "VES" },
  { info: { spacing: null, name: "Boliviano" }, id: "BOB" },
  { info: { spacing: null, name: "Bulgarian Lev" }, id: "BGN" },
  { info: { spacing: null, name: "CFA Franc BCEAO" }, id: "XOF" },
  { info: { spacing: null, name: "Canadian Dollar" }, id: "CAD" },
  { info: { spacing: null, name: "Cost Rican Colon" }, id: "CRC" },
  { info: { spacing: null, name: "Czech Koruna" }, id: "CZK" },
  { info: { spacing: null, name: "Danish Krone" }, id: "DKK" },
  { info: { spacing: null, name: "Dong" }, id: "VND" },
  { info: { spacing: null, name: "Euro" }, id: "EUR" },
  { info: { spacing: null, name: "Forint" }, id: "HUF" },
  { info: { spacing: null, name: "Guaraní" }, id: "PYG" },
  { info: { spacing: null, name: "Hong Kong Dollar" }, id: "HKD" },
  { info: { spacing: null, name: "Indian Rupee" }, id: "INR" },
  { info: { spacing: null, name: "Jamaican Dollar" }, id: "JMD" },
  { info: { spacing: null, name: "Kenyan Shilling" }, id: "KES" },
  { info: { spacing: null, name: "Lebanese Pound" }, id: "LBP" },
  { info: { spacing: null, name: "Lempira" }, id: "HNL" },
  { info: { spacing: null, name: "Malaysian Ringgit" }, id: "MYR" },
  { info: { spacing: null, name: "Naira" }, id: "NGN" },
  { info: { spacing: null, name: "Namibia Dollar" }, id: "NAD" },
  { info: { spacing: null, name: "Netherlands Antillean Guilder" }, id: "ANG" },
  { info: { spacing: null, name: "New Israeli Shekel" }, id: "ILS" },
  { info: { spacing: null, name: "New Taiwan Dollar" }, id: "TWD" },
  { info: { spacing: null, name: "New Zealand Dollar" }, id: "NZD" },
  { info: { spacing: null, name: "Norwegian Krone" }, id: "NOK" },
  { info: { spacing: null, name: "Pakistan Rupee" }, id: "PKR" },
  { info: { spacing: null, name: "Peso Argentino" }, id: "ARS" },
  { info: { spacing: null, name: "Peso Chileno" }, id: "CLP" },
  { info: { spacing: null, name: "Peso Colombiano" }, id: "COP" },
  { info: { spacing: null, name: "Peso Dominicano" }, id: "DOP" },
  { info: { spacing: null, name: "Peso Mexicano" }, id: "MXN" },
  { info: { spacing: null, name: "Peso Uruguayo" }, id: "UYU" },
  { info: { spacing: null, name: "Piso" }, id: "PHP" },
  { info: { spacing: null, name: "Pound Sterling" }, id: "GBP" },
  { info: { spacing: null, name: "Quetzal" }, id: "GTQ" },
  { info: { spacing: null, name: "Rand" }, id: "ZAR" },
  { info: { spacing: null, name: "Real" }, id: "BRL" },
  { info: { spacing: null, name: "Romanian Leu" }, id: "RON" },
  { info: { spacing: null, name: "Rupiah" }, id: "IDR" },
  { info: { spacing: null, name: "Russian Ruble" }, id: "RUB" },
  { info: { spacing: null, name: "Singapore Dollar" }, id: "SGD" },
  { info: { spacing: null, name: "Sol" }, id: "PEN" },
  { info: { spacing: null, name: "Swedish Krona" }, id: "SEK" },
  { info: { spacing: null, name: "Swiss Franc" }, id: "CHF" },
  { info: { spacing: null, name: "Trinidad and Tobago Dollar" }, id: "TTD" },
  { info: { spacing: null, name: "Turkish Lira" }, id: "TRY" },
  { info: { spacing: null, name: "UAE Dirham" }, id: "AED" },
  { info: { spacing: null, name: "US Dollar" }, id: "USD" },
  { info: { spacing: null, name: "Yuan Renminbi" }, id: "CNY" },
  { info: { spacing: null, name: "Zambian Kwacha" }, id: "ZMW" },
  { info: { spacing: null, name: "Zloty" }, id: "PLN" },
  { info: { spacing: null, name: "円" }, id: "JPY" },
  { info: { spacing: null, name: "원" }, id: "KRW" },
];

// Currency symbols mapping
const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  INR: "₹",
  RUB: "₽",
  BRL: "R$",
  AUD: "A$",
  CAD: "C$",
  CHF: "Fr",
  MXN: "$",
  ARS: "$",
  CLP: "$",
  COP: "$",
  PEN: "S/",
  TRY: "₺",
  ZAR: "R",
  ILS: "₪",
  PHP: "₱",
  THB: "฿",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  BGN: "лв",
  AED: "د.إ",
  MYR: "RM",
  IDR: "Rp",
  VND: "₫",
  PKR: "₨",
  NGN: "₦",
  KES: "KSh",
  GTQ: "Q",
  HNL: "L",
  CRC: "₡",
  DOP: "RD$",
  JMD: "J$",
  TTD: "TT$",
  BOB: "Bs",
  PYG: "₲",
  UYU: "$U",
  VES: "Bs.S",
  PAB: "B/.",
  ANG: "ƒ",
  XOF: "CFA",
  NAD: "N$",
  ZMW: "ZK",
  LBP: "ل.ل",
  TWD: "NT$",
};

const formatCurrency = ({ amount, code }) => {
  const commaFormatted = String(amount).replace(
    /(\d)(?=(\d{3})+(?!\d))/g,
    "$1 ",
  );
  const periodFormatted = String(amount)
    .replace(".", ",")
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");

  const switchOptions = {
    // united arab emirates dirham (ex: AED 1,234.56)
    AED: [`د.إ ${commaFormatted}`, `${commaFormatted}`, "د.إ", true],

    // Afghanistan Afghani (using comma formatting)
    AFN: [`؋ ${commaFormatted}`, `${commaFormatted}`, "؋", true],

    // Albania Lek (using comma formatting)
    ALL: [`Lek ${commaFormatted}`, `${commaFormatted}`, "Lek", true],

    // Armenia Dram (using comma formatting)
    AMD: [`֏${commaFormatted}`, `${commaFormatted}`, "֏", true],

    // Netherlands Antilles Guilder (ex: ANG 1,234.56)
    ANG: [`ƒ ${commaFormatted}`, `${commaFormatted}`, "ƒ", true],

    // Angola Kwanza (using comma formatting)
    AOA: [`Kz ${commaFormatted}`, `${commaFormatted}`, "Kz", true],

    // argentine peso (ex: $ 1.234,56)
    ARS: [`$ ${periodFormatted}`, `${periodFormatted}`, "$", true],

    // australian dollar (ex: $ 1,234.56)
    AUD: [`$ ${commaFormatted}`, `${commaFormatted}`, "$", true],

    // Aruba Guilder (using comma formatting)
    AWG: [`ƒ${commaFormatted}`, `${commaFormatted}`, "ƒ", true],

    // Azerbaijan Manat (using comma formatting)
    AZN: [`₼${commaFormatted}`, `${commaFormatted}`, "₼", true],

    // bosnia and herzegovina convertible mark (ex: KM 1.234,56)
    BAM: [`KM ${commaFormatted}`, `${commaFormatted}`, "KM", true],

    // barbadian Dollar (ex: $1.234,56)
    BBD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],

    // Bangladesh Taka (using comma formatting)
    BDT: [`৳${commaFormatted}`, `${commaFormatted}`, "৳", true],

    // Bahrain Dinar (using comma formatting)
    BHD: [`BD ${commaFormatted}`, `${commaFormatted}`, "BD", true],

    // Burundi Franc (using comma formatting)
    BIF: [`FBu ${commaFormatted}`, `${commaFormatted}`, "FBu", true],

    // Bermuda Dollar (using comma formatting)
    BMD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],

    // Brunei Darussalam Dollar (using comma formatting)
    BND: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],

    // bolivian Boliviano (ex: $b 1.234,56)
    BOB: [`$b ${commaFormatted}`, `${commaFormatted}`, "$b", true],

    // Brazilian Real (ex: R$ 1.234,56)
    BRL: [`R$ ${periodFormatted}`, `${periodFormatted}`, "R$", true],

    // Bhutan Ngultrum (using comma formatting)
    BTN: [`Nu.${commaFormatted}`, `${commaFormatted}`, "Nu.", true],

    // Botswana Pula (using comma formatting)
    BWP: [`P${commaFormatted}`, `${commaFormatted}`, "P", true],

    // Belarus Ruble (using comma formatting)
    BYN: [`Br${commaFormatted}`, `${commaFormatted}`, "Br", true],

    // Belize Dollar (using comma formatting)
    BZD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],

    // bulgarian lev (ex: лв1,234.56)
    BGN: [`лв${commaFormatted}`, `${commaFormatted}`, "лв", true],

    // bahamian Dollar (ex: $1,234,56)
    BSD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],

    // canadian dollar (ex: $ 1,234.56)
    CAD: [`$ ${commaFormatted}`, `${commaFormatted}`, "$", true],

    // swiss franc (ex: fr. 1.234,56)
    CHF: [`fr. ${periodFormatted}`, `${periodFormatted}`, "fr.", true],

    // chilean peso (ex: $ 1,234.56)
    CLP: [`$ ${commaFormatted}`, `${commaFormatted}`, "$", true],

    // yuan renminbi (ex: ¥ 1,234.56)
    CNY: [`¥ ${commaFormatted}`, `${commaFormatted}`, "¥", true],

    // colombian peso (ex: $ 1,234.56)
    COP: [`$ ${commaFormatted}`, `${commaFormatted}`, "$", true],

    // costa rican colón (ex: ₡1.234,56)
    CRC: [`₡${periodFormatted}`, `${periodFormatted}`, "₡", true],

    // czech koruna (ex: 1.234,56 Kč)
    CZK: [`${periodFormatted} Kč`, `${periodFormatted}`, "Kč", false],

    // danish krone (ex: kr. 1.234,56)
    DKK: [`kr. ${periodFormatted}`, `${periodFormatted}`, "kr.", true],

    // dominican Peso (ex: RD$ 1,234.56)
    DOP: [`RD$ ${commaFormatted}`, `${commaFormatted}`, "RD$", true],

    // european union (ex: €1.234,56)
    EUR: [`€${periodFormatted}`, `${periodFormatted}`, "€", true],

    // uk/great britain pound sterling (ex: £1,234.56)
    GBP: [`£${commaFormatted}`, `${commaFormatted}`, "£", true],

    // georgian lari (ex: ₾1,234.56)
    GEL: [`₾${commaFormatted}`, `${commaFormatted}`, "₾", true],

    // guatemalan quetzal (ex: Q1,234.56)
    GTQ: [`Q${commaFormatted}`, `${commaFormatted}`, "Q", true],

    // hong kong dollar (ex: HK$ 1,234.56)
    HKD: [`HK$ ${commaFormatted}`, `${commaFormatted}`, "HK$", true],

    // honduran lempira (ex: L 1,234.56)
    HNL: [`L ${commaFormatted}`, `${commaFormatted}`, "L", true],

    // croatian kuna (ex: 1,234.56 kn)
    HRK: [`${commaFormatted} kn`, `${commaFormatted}`, "kn", false],

    // hungarian forint (ex: 1.234,56 Ft)
    HUF: [`${periodFormatted} Ft`, `${periodFormatted}`, "Ft", false],

    // indonesian rupiah (ex: Rp 1,234.56)
    IDR: [`Rp ${commaFormatted}`, `${commaFormatted}`, "Rp", true],

    // new israeli shekel (ex: ₪ 1.234,56)
    ILS: [`₪ ${periodFormatted}`, `${periodFormatted}`, "₪", true],

    // indian rupee (ex: ₹ 1,234.56)
    INR: [`₹ ${commaFormatted}`, `${commaFormatted}`, "₹", true],

    // icelandic krona (ex: kr. 1.234,56)
    ISK: [`kr. ${periodFormatted}`, `${periodFormatted}`, "kr.", true],

    // jamaican dollar (ex: J$ 1,234.56)
    JMD: [`J$ ${commaFormatted}`, `${commaFormatted}`, "J$", true],

    // yen (ex: ¥ 1,234.56)
    JPY: [`¥ ${commaFormatted}`, `${commaFormatted}`, "¥", true],

    KES: [`KSh ${commaFormatted}`, `${commaFormatted}`, "KSh", true],

    LBP: [`L£ ${commaFormatted}`, `${commaFormatted}`, "L£", true],

    // won (ex: ₩ 1,234.56)
    KRW: [`₩ ${commaFormatted}`, `${commaFormatted}`, "₩", true],

    // moroccan dirham (ex: 1,234.56 .د.م.)
    MAD: [`${commaFormatted} .د.م.`, `${commaFormatted}`, ".د.م.", false],

    // moldovan leu (ex: 1.234,56 L)
    MDL: [`${commaFormatted} L`, `${commaFormatted}`, "L", false],

    // mexican peso (ex: $ 1,234.56)
    MXN: [`$ ${commaFormatted}`, `${commaFormatted}`, "$", true],

    // malaysian ringgit (ex: RM 1,234.56)
    MYR: [`RM ${commaFormatted}`, `${commaFormatted}`, "RM", true],

    NAD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],

    // nigerian naira (ex: ₦1,234.56)
    NGN: [`₦${commaFormatted}`, `${commaFormatted}`, "₦", true],

    // nicaraguan Córdoba (ex: C$ 1,234.56)
    NIO: [`C$ ${commaFormatted}`, `${commaFormatted}`, "C$", true],

    // norwegian krone (ex: kr 1,234.56)
    NOK: [`kr ${commaFormatted}`, `${commaFormatted}`, "kr", true],

    // new zealand dollar (ex: $ 1,234.56)
    NZD: [`$ ${commaFormatted}`, `${commaFormatted}`, "$", true],

    // panamanian balboa (ex: B/. 1,234.56)
    PAB: [`B/. ${commaFormatted}`, `${commaFormatted}`, "B/.", true],

    PEN: [`S/. ${commaFormatted}`, `${commaFormatted}`, "S/.", true],
    PGK: [`K ${commaFormatted}`, `${commaFormatted}`, "K", true],
    PHP: [`₱ ${commaFormatted}`, `${commaFormatted}`, "₱", true],
    PKR: [`Rs ${commaFormatted}`, `${commaFormatted}`, "Rs", true],
    PLN: [`${periodFormatted} zł`, `${periodFormatted}`, "zł", false],
    PYG: [`₲${commaFormatted}`, `${commaFormatted}`, "₲", true],
    QAR: [`QR ${commaFormatted}`, `${commaFormatted}`, "QR", true],
    RON: [`${commaFormatted}L`, `${commaFormatted}`, "L", false],
    RSD: [`${commaFormatted} Дин.`, `${commaFormatted}`, "Дин.", false],
    RUB: [`${periodFormatted} ₽`, `${periodFormatted}`, "₽", false],
    RWF: [`RF ${commaFormatted}`, `${commaFormatted}`, "RF", true],
    SAR: [`${commaFormatted} ﷼`, `${commaFormatted}`, "﷼", false],
    SBD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],
    SCR: [`Rs ${commaFormatted}`, `${commaFormatted}`, "Rs", true],
    SDG: [`£ ${commaFormatted}`, `${commaFormatted}`, "£", true],
    SEK: [`${periodFormatted} kr`, `${periodFormatted}`, "kr", false],
    SGD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],
    SHP: [`£${commaFormatted}`, `${commaFormatted}`, "£", true],
    SLL: [`Le ${commaFormatted}`, `${commaFormatted}`, "Le", true],
    SOS: [`Sh ${commaFormatted}`, `${commaFormatted}`, "Sh", true],
    SPL: [`${commaFormatted} SPL`, `${commaFormatted}`, "SPL", false],
    SRD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],
    STN: [`Db ${commaFormatted}`, `${commaFormatted}`, "Db", true],
    SVC: [`₡${commaFormatted}`, `${commaFormatted}`, "₡", true],
    SYP: [`£S ${commaFormatted}`, `${commaFormatted}`, "£S", true],
    SZL: [`L ${commaFormatted}`, `${commaFormatted}`, "L", true],
    THB: [`${commaFormatted} ฿`, `${commaFormatted}`, "฿", false],
    TJS: [`SM ${commaFormatted}`, `${commaFormatted}`, "SM", true],
    TMT: [`m ${commaFormatted}`, `${commaFormatted}`, "m", true],
    TND: [`DT ${commaFormatted}`, `${commaFormatted}`, "DT", true],
    TOP: [`T$ ${commaFormatted}`, `${commaFormatted}`, "T$", true],
    TRY: [`${commaFormatted} ₺`, `${commaFormatted}`, "₺", false],
    TTD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],
    TVD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],
    TWD: [`元 ${commaFormatted}`, `${commaFormatted}`, "元", true],
    TZS: [`Sh ${commaFormatted}`, `${commaFormatted}`, "Sh", true],
    UAH: [`₴${commaFormatted}`, `${commaFormatted}`, "₴", true],
    UGX: [`Sh ${commaFormatted}`, `${commaFormatted}`, "Sh", true],
    USD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],
    UYU: [`$U${periodFormatted}`, `${periodFormatted}`, "$U", true],
    UZS: [`so'm ${commaFormatted}`, `${commaFormatted}`, `so'm`, true],
    VEF: [`Bs ${commaFormatted}`, `${commaFormatted}`, "Bs", true],
    VES: [`Bs ${commaFormatted}`, `${commaFormatted}`, "Bs", true],
    VND: [`${periodFormatted} ₫`, `${periodFormatted}`, "₫", false],
    VUV: [`VT ${commaFormatted}`, `${commaFormatted}`, "VT", true],
    WST: [`WS$ ${commaFormatted}`, `${commaFormatted}`, "WS$", true],
    XAF: [`FCFA ${commaFormatted}`, `${commaFormatted}`, "FCFA", true],
    XCD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],
    XDR: [`SDR ${commaFormatted}`, `${commaFormatted}`, "SDR", true],
    XOF: [`CFA ${commaFormatted}`, `${commaFormatted}`, "CFA", true],
    XPF: [`F ${commaFormatted}`, `${commaFormatted}`, "F", true],
    YER: [`﷼ ${commaFormatted}`, `${commaFormatted}`, "﷼", true],
    ZAR: [`R ${commaFormatted}`, `${commaFormatted}`, "R", true],
    ZMW: [`K ${commaFormatted}`, `${commaFormatted}`, "K", true],
    ZWD: [`$${commaFormatted}`, `${commaFormatted}`, "$", true],

    // Existing code remains the same, adding these to the switchOptions object:
    // default
    DEFAULT: [amount.toString(), amount.toString(), "", true],
  };
  const upperCode = code?.toUpperCase();
  return switchOptions[upperCode] || switchOptions.DEFAULT;
};

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const SWAP_HISTORY_KEY = "blitz_tip_swap_history";
const generatePayLinkId = () =>
  Array.from(
    { length: 9 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)],
  ).join("");

// State
let selectedCurrency = "USD";
let currentInvoice = "";
let verifyURL = "";

let verifyInterval = null;
let verifyTimeout = null;
let resizeTimeout = null;

// Stablecoin state
let selectedCryptoToken = "USDC";
let selectedStableNetwork = null;
let depositAddress = "";
let amountInRaw = 0n;
let currentQuoteId = null;
let currentChainId = null;
let currentTokenAddress = null;
let swapWatcher = null;
let balanceWatcher = null;
let stableRefundAddress = null;
let txHashSubmitted = false;
let pollTimer = null;
let pollCount = 0;
let shouldPoll = false;
let currentPaylinkId = null;
const MAX_POLLS = 60;

// Extract username from URL
const username = window.location.pathname.split("/").filter(Boolean)[0];

// Update page elements
document.title = `Tip ${username} - Blitz Wallet`;

document
  .querySelectorAll(".username-display")
  .forEach((item) => (item.textContent = username));

document
  .querySelectorAll(".avatar")
  .forEach((item) => (item.textContent = username.charAt(0).toUpperCase()));

// Amount input handling
const amountInput = document.getElementById("amount-input");
const tipButton = document.getElementById("tip-button");
const currencySymbol = document.querySelector(".dollar-sign");

// Create currency selector UI
function createCurrencySelector() {
  // Populate currency list
  const currencyList = document.getElementById("currency-list");

  fiatCurrencies.forEach((currency) => {
    const item = document.createElement("div");
    item.className = "currency-item";
    item.dataset.currency = currency.id;
    item.innerHTML = `
      <span class="currency-code">${currency.id}</span>
      <span class="currency-name">${currency.info.name}</span>
    `;
    item.addEventListener("click", () => selectCurrency(currency.id));
    currencyList.appendChild(item);
  });

  // Setup event listeners
  const currencyButton = document.getElementById("currency-button");
  const currencyDropdown = document.getElementById("currency-dropdown");
  const currencySearch = document.getElementById("currency-search");

  currencyButton.addEventListener("click", (e) => {
    e.stopPropagation();
    currencyDropdown.classList.toggle("active");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    currencyDropdown.classList.remove("active");
  });

  currencyDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Search functionality
  currencySearch.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const items = currencyList.querySelectorAll(".currency-item");

    items.forEach((item) => {
      const code = item
        .querySelector(".currency-code")
        .textContent.toLowerCase();
      const name = item
        .querySelector(".currency-name")
        .textContent.toLowerCase();

      if (code.includes(searchTerm) || name.includes(searchTerm)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  });
}

function selectCurrency(currencyId) {
  selectedCurrency = currencyId;
  document.getElementById("currency-dropdown").classList.remove("active");
  document.getElementById("currency-search").value = "";

  // Reset search filter
  const items = document.querySelectorAll(".currency-item");
  items.forEach((item) => (item.style.display = "flex"));

  // // Update currency symbol
  // const symbol = currencySymbols[currencyId] || currencyId;
  // currencySymbol.textContent = symbol;

  setTimeout(scaleFontSize, 0);
}

function scaleFontSize() {
  const [fullString, amount, symbol, isBehind] = formatCurrency({
    amount: 0,
    code: selectedCurrency,
  });

  const container = document.querySelector(".amount-display");
  const oldSymbol = container.querySelector(".dollar-sign");
  const amountInput = document.querySelector("#amount-input");

  if (oldSymbol) {
    container.removeChild(oldSymbol);
  }

  // Create a new symbol element
  const newSymbol = document.createElement("span");
  newSymbol.className = "dollar-sign";
  newSymbol.id = "currency-symbol";
  newSymbol.textContent = symbol;

  // Insert before or after input depending on isBehind
  if (!isBehind) {
    container.appendChild(newSymbol);
  } else {
    container.insertBefore(newSymbol, amountInput);
  }

  const containerWidth = container.offsetWidth;
  const value = amountInput.value || "";
  let fontSize = 80;

  const tempSpan = document.createElement("span");
  tempSpan.style.fontSize = fontSize + "px";
  tempSpan.style.fontFamily = getComputedStyle(amountInput).fontFamily;
  tempSpan.style.visibility = "hidden";
  tempSpan.style.position = "absolute";
  tempSpan.textContent = value;
  document.body.appendChild(tempSpan);

  let textWidth = tempSpan.offsetWidth;
  let contentWidth = newSymbol.offsetWidth + textWidth;

  if (contentWidth > containerWidth - 40) {
    const ratio = (containerWidth - 40) / contentWidth;
    fontSize = Math.max(32, Math.floor(80 * ratio));
    tempSpan.style.fontSize = fontSize + "px";
    textWidth = tempSpan.offsetWidth;
  }

  document.body.removeChild(tempSpan);

  newSymbol.style.fontSize = fontSize + "px";
  amountInput.style.fontSize = fontSize + "px";
  amountInput.style.width = textWidth + "px";
}

amountInput.addEventListener("input", (e) => {
  let value = e.target.value.replace(/[^\d.]/g, "");

  // Only allow one decimal point
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts.slice(1).join("");
  }

  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + "." + parts[1].substring(0, 2);
  }

  if (parts[0]?.length > 4) {
    value =
      parts[0].substring(0, 4) + `${parts[1]?.length ? "." + parts[1] : ""}`;
  }

  e.target.value = value || "";

  setTimeout(scaleFontSize, 0);

  // Update button state
  const amount = parseFloat(value);
  if (amount > 0) {
    tipButton.classList.add("active");
  } else {
    tipButton.classList.remove("active");
  }
});

amountInput.addEventListener("focus", (e) => {
  if (e.target.value === "0") {
    e.target.value = "";
  }
});

amountInput.addEventListener("blur", (e) => {
  if (e.target.value === "") {
    e.target.value = "0";
    tipButton.classList.remove("active");
  }
});

// Handle tip button click — show payment type selection
tipButton.addEventListener("click", () => {
  const amount = parseFloat(amountInput.value);
  if (amount <= 0 || !amount) return;
  showPaymentTypeScreen();
});

async function fetchLightningInvoice() {
  const amount = parseFloat(amountInput.value);
  currentInvoice = "";

  tipButton.textContent = "Generating invoice";
  tipButton.disabled = true;
  showScreen("creating-invoice-screen");
  try {
    const response = await fetch("/getInvoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestUsername: username,
        fiatAmount: amount,
        fiatCode: selectedCurrency,
      }),
    });

    const data = await response.json();

    if (data.status === "OK") {
      currentInvoice = data.pr;
      verifyURL = data.verify;
      showInvoiceScreen(amount);
    } else {
      throw new Error(data.reason);
    }
  } catch (error) {
    console.error("Error:", error);
    amountInput.value = "";
    tipButton.textContent = "Error - Try Again";
    tipButton.disabled = false;
    setTimeout(() => {
      tipButton.textContent = "Pay";
    }, 4000);
    showScreen("input-screen");
  }
}

// ── Screen management ────────────────────────────────────────────────────────

function showScreen(id) {
  // Hide existing named screens
  document.getElementById("input-screen").classList.add("hidden");
  document.getElementById("invoice-screen").classList.remove("active");

  // Hide all tips-screen divs
  document.querySelectorAll(".tips-screen").forEach((el) => {
    el.classList.remove("active");
  });

  if (id === "input-screen") {
    document.getElementById("input-screen").classList.remove("hidden");
  } else if (id === "invoice-screen") {
    document.getElementById("invoice-screen").classList.add("active");
  } else {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }
}

// ── Payment type selection ───────────────────────────────────────────────────

function showPaymentTypeScreen() {
  showScreen("payment-type-screen");
}

function selectPaymentMethod(method) {
  if (method === "lightning") {
    fetchLightningInvoice();
  } else {
    selectedCryptoToken = method.toUpperCase();
    showNetworkScreen();
  }
}

// ── Network / currency selection ─────────────────────────────────────────────

function showNetworkScreen() {
  selectedStableNetwork = null;
  const toggleUsdc = document.getElementById("toggle-usdc");
  const toggleUsdt = document.getElementById("toggle-usdt");
  if (toggleUsdc)
    toggleUsdc.classList.toggle("active", selectedCryptoToken === "USDC");
  if (toggleUsdt)
    toggleUsdt.classList.toggle("active", selectedCryptoToken === "USDT");
  updateCurrencyGrid();
  showScreen("network-screen");
}

function updateCurrencyGrid() {
  const grid = document.getElementById("network-grid");
  if (!grid) return;
  const networks = CURRENCY_NETWORKS[selectedCryptoToken] || [];
  grid.innerHTML = networks
    .map(
      (n) =>
        `<div class="network-card" id="card-${n}" onclick="selectStableNetwork('${n}')">${NETWORK_LABELS[n]}</div>`,
    )
    .join("");
}

function selectCryptoToken(token) {
  selectedCryptoToken = token;
  selectedStableNetwork = null;
  const toggleUsdc = document.getElementById("toggle-usdc");
  const toggleUsdt = document.getElementById("toggle-usdt");
  if (toggleUsdc) toggleUsdc.classList.toggle("active", token === "USDC");
  if (toggleUsdt) toggleUsdt.classList.toggle("active", token === "USDT");
  updateCurrencyGrid();
}

function selectStableNetwork(network) {
  selectedStableNetwork = network;
  document
    .querySelectorAll(".network-card")
    .forEach((c) => c.classList.remove("selected"));
  const card = document.getElementById("card-" + network);
  if (card) card.classList.add("selected");
}

// ── Refund address ───────────────────────────────────────────────────────────

function showRefundAddressScreen() {
  if (!selectedStableNetwork) {
    alert("Please select a network first.");
    return;
  }
  const input = document.getElementById("refund-address-input");
  if (input) {
    input.value = "";
    input.placeholder = `Your ${NETWORK_LABELS[selectedStableNetwork] || selectedStableNetwork} address (optional)`;
  }
  stableRefundAddress = null;
  showScreen("refund-address-screen");
}

// ── Create swap ───────────────────────────────────────────────────────────────

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

async function confirmStablecoin() {
  const input = document.getElementById("refund-address-input");
  stableRefundAddress = input?.value.trim() || null;

  const spinnerEl = document.getElementById("creating-spinner");
  const statusEl = document.getElementById("creating-status");
  const errorEl = document.getElementById("creating-error");
  const backBtn = document.getElementById("creating-back-btn");
  if (spinnerEl) spinnerEl.style.display = "inline-block";
  if (statusEl) {
    statusEl.textContent = "Creating swap…";
    statusEl.style.display = "block";
  }
  if (errorEl) errorEl.style.display = "none";
  if (backBtn) backBtn.style.display = "none";
  showScreen("creating-swap-screen");

  const amount = parseFloat(amountInput.value);

  try {
    currentPaylinkId = generatePayLinkId();
    const res = await fetch("/createPayLinkInvoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paylinkId: currentPaylinkId,
        tipUsername: username,
        network: selectedStableNetwork,
        currency: selectedCryptoToken,
        fiatAmount: amount,
        fiatCode: selectedCurrency,
        ...(stableRefundAddress ? { refundAddress: stableRefundAddress } : {}),
      }),
    });
    const json = await res.json();

    if (!json || json.status !== "SUCCESS" || !json.depositAddress) {
      throw new Error(json.reason);
    }

    depositAddress = json.depositAddress;
    amountInRaw = BigInt(String(json.amountIn));
    currentQuoteId = json.quoteId;

    saveToSwapHistory({
      paylinkId: currentPaylinkId,
      quoteId: currentQuoteId,
      network: selectedStableNetwork,
      currency: selectedCryptoToken,
      username,
      timestamp: Date.now(),
    });

    const networkEntry = NETWORK_MAP[selectedStableNetwork] || {};

    currentChainId = networkEntry.chainId || null;
    currentTokenAddress = currentChainId
      ? networkEntry[selectedCryptoToken.toLowerCase()] || null
      : null;

    const stablePrimaryBtn = document.getElementById("stable-primary-btn");
    if (stablePrimaryBtn) {
      if (isMobileDevice()) {
        // Mobile: always show "Open Wallet" — openStableWallet() handles all chains
        stablePrimaryBtn.textContent = "Open Wallet";
        stablePrimaryBtn.style.display = "";
        stablePrimaryBtn.onclick = () => openStableWallet();
      } else {
        // Web: "Connect and Pay" only for EVM chains; hide for non-EVM (Solana/Tron)
        const hasEVMSupport = !!(currentTokenAddress && currentChainId);
        stablePrimaryBtn.textContent = "Connect and Pay";
        stablePrimaryBtn.style.display = hasEVMSupport ? "" : "none";
        stablePrimaryBtn.onclick = () => connectAndPay();
      }
    }

    // Render QR
    const qrEl = document.getElementById("qr-stable-address");
    if (qrEl) {
      qrEl.innerHTML = "";
      new QRCode(qrEl, {
        text: depositAddress,
        width: 220,
        height: 220,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    }

    // Set labels
    const titleEl = document.getElementById("stable-screen-title");
    if (titleEl) {
      titleEl.textContent =
        "Send " +
        selectedCryptoToken +
        " on " +
        (NETWORK_LABELS[selectedStableNetwork] || selectedStableNetwork);
    }

    const stableAmountEl = document.getElementById("stable-amount");
    if (stableAmountEl) {
      stableAmountEl.textContent =
        formatTokenAmount(amountInRaw, 6) + " " + selectedCryptoToken;
    }

    const addrEl = document.getElementById("stable-address-text");
    if (addrEl) {
      // Show first 12 chars … last 6 chars for readability
      addrEl.textContent = depositAddress;
    }

    const quoteValueEl = document.getElementById("stable-quote-id-value");
    if (quoteValueEl) quoteValueEl.textContent = currentQuoteId || "";

    // Reset tx hash state
    txHashSubmitted = false;
    const txErrEl = document.getElementById("txhash-error");
    if (txErrEl) txErrEl.style.display = "none";

    // Start blockchain watcher for EVM chains
    const detectEl = document.getElementById("txhash-detect-status");
    if (currentChainId && typeof PaylinkSwap !== "undefined") {
      swapWatcher = PaylinkSwap.watchForTransfer({
        depositAddress,
        tokenAddress: currentTokenAddress,
        chainId: currentChainId,
        onFound: (txHash, from) => handleTxHash(txHash, from),
      });
      balanceWatcher = PaylinkSwap.pollForBalance({
        tokenAddress: currentTokenAddress,
        depositAddress,
        chainId: currentChainId,
        expectedAmount: amountInRaw,
        onFound: (txHash, from) => handleTxHash(txHash, from),
      });
      if (detectEl) detectEl.textContent = "Monitoring for transaction…";
    } else {
      if (detectEl)
        detectEl.textContent = "Send the exact amount to the address above.";
    }

    // Wire copy handlers
    const stableQrWrapper = document.getElementById("stable-qr-wrapper");
    if (stableQrWrapper) {
      stableQrWrapper.onclick = async () => {
        try {
          await navigator.clipboard.writeText(depositAddress);
          showAlert("Copied!");
        } catch (err) {
          console.error("Failed to copy address:", err);
        }
      };
    }

    const copyAddrBtn = document.getElementById("copy-stable-addr-btn");
    if (copyAddrBtn) {
      copyAddrBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(depositAddress);
          showAlert("Copied!");
        } catch (err) {
          console.error("Failed to copy address:", err);
        }
      };
    }

    const copyQuoteBtn = document.getElementById("copy-quote-id-btn");
    if (copyQuoteBtn) {
      copyQuoteBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(currentQuoteId || "");
          showAlert("Copied!");
        } catch (err) {
          console.error("Failed to copy quote ID:", err);
        }
      };
    }

    showScreen("stable-pay-screen");
  } catch (err) {
    console.error("Swap creation failed:", err);
    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
    if (statusEl) statusEl.style.display = "none";
    if (spinnerEl) spinnerEl.style.display = "none";
    if (backBtn) backBtn.style.display = "block";
  }
}

// ── Handle detected transaction ───────────────────────────────────────────────

async function handleTxHash(txHash, sourceAddress) {
  if (txHashSubmitted) return;
  txHashSubmitted = true;
  stopAllStableWatchers();

  const isEVM = /^0x[0-9a-fA-F]{64}$/.test(txHash);
  if (!isEVM) {
    txHashSubmitted = false;
    const txErrEl = document.getElementById("txhash-error");
    if (txErrEl) {
      txErrEl.textContent = "Invalid transaction hash format.";
      txErrEl.style.display = "block";
    }
    return;
  }

  const procQEl = document.getElementById("processing-quote-id");
  if (procQEl)
    procQEl.textContent = currentQuoteId ? "Quote ID: " + currentQuoteId : "";
  showScreen("stable-processing-screen");

  try {
    const res = await fetch("/submitPaylinkSwap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paylinkId: currentPaylinkId,
        txHash,
        sourceAddress: sourceAddress || null,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    if (!json || json.status !== "SUCCESS") throw new Error("submit-failed");
    startIsPaidPolling();
  } catch (err) {
    console.error("Swap submission failed:", err);
    txHashSubmitted = false;
    showScreen("stable-pay-screen");
    const txErrEl = document.getElementById("txhash-error");
    if (txErrEl) {
      txErrEl.textContent = "Submission failed. Please try again.";
      txErrEl.style.display = "block";
    }
  }
}

// ── Open Wallet (EIP-681) ─────────────────────────────────────────────────────

function buildEip681Uri() {
  if (
    !currentTokenAddress ||
    !depositAddress ||
    !currentChainId ||
    !amountInRaw
  )
    return null;

  return `ethereum:${currentTokenAddress}@${currentChainId}/transfer?address=${depositAddress}&uint256=${amountInRaw.toString()}`;
}

function openStableWallet() {
  const uri = buildEip681Uri();
  if (!uri) return;
  window.location.href = uri;
}

async function connectAndPay() {
  if (
    !window.ethereum ||
    !currentTokenAddress ||
    !depositAddress ||
    !currentChainId ||
    !amountInRaw
  )
    return;
  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + currentChainId.toString(16) }],
    });
    const addrPadded = depositAddress
      .replace("0x", "")
      .toLowerCase()
      .padStart(64, "0");
    const amtPadded = amountInRaw.toString(16).padStart(64, "0");
    const data = "0xa9059cbb" + addrPadded + amtPadded;
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from: accounts[0], to: currentTokenAddress, data }],
    });
    handleTxHash(txHash, accounts[0]);
  } catch (err) {
    // All wallet errors treated identically (rejection, chain switch failure, etc.)
    // wallet_addEthereumChain fallback is out of scope for v1.
    // txHashSubmitted not set (handleTxHash not called), so no reset needed.
    showTxHashError("Wallet error: " + (err.message || "Request rejected."));
  }
}

// ── isPaid polling ────────────────────────────────────────────────────────────

function startIsPaidPolling() {
  pollCount = 0;
  shouldPoll = true;
  schedulePoll();
}

function schedulePoll() {
  pollTimer = setTimeout(doPoll, 5000);
}

async function doPoll() {
  pollTimer = null;
  if (!shouldPoll) return;
  pollCount++;
  try {
    const res = await fetch("/getPaylinkData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paylinkId: currentPaylinkId, checkInvoice: true }),
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    if (json?.data?.isPaid) {
      shouldPoll = false;
      showScreen("stable-success-screen");
      return;
    }
  } catch (e) {
    /* network error — continue */
  }
  if (pollCount >= MAX_POLLS) {
    shouldPoll = false;
    showScreen("stable-pay-screen");
    const txErrEl = document.getElementById("txhash-error");
    if (txErrEl) {
      txErrEl.textContent =
        "Payment verification timed out. Contact support with your Quote ID.";
      txErrEl.style.display = "block";
    }
    return;
  }
  schedulePoll();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stopAllStableWatchers() {
  if (swapWatcher) {
    swapWatcher.stop();
    swapWatcher = null;
  }
  if (balanceWatcher) {
    balanceWatcher.stop();
    balanceWatcher = null;
  }
}

function showAlert(message) {
  document.getElementById("alert-message").textContent = message;
  document.getElementById("alert-overlay").classList.add("active");
}

function closeAlert() {
  document.getElementById("alert-overlay").classList.remove("active");
}

function resetToInputScreen() {
  stopAllStableWatchers();
  shouldPoll = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  txHashSubmitted = false;
  selectedStableNetwork = null;
  depositAddress = "";
  currentQuoteId = null;
  currentChainId = null;
  currentTokenAddress = null;
  stableRefundAddress = null;
  currentPaylinkId = null;

  // Reset Lightning invoice state too
  clearRunningItems();
  tipButton.textContent = "Continue";
  tipButton.disabled = false;
  amountInput.value = "";
  tipButton.classList.remove("active");

  // Reset invoice screen paid state
  const primaryBtn = document.getElementById("invoice-primary-btn");
  if (primaryBtn) primaryBtn.style.display = "";
  const cancelBtn = document.getElementById("invoice-cancel-btn");
  if (cancelBtn) cancelBtn.textContent = "Cancel";
  const verifyTxt = document.getElementById("verify-text");
  if (verifyTxt) {
    verifyTxt.textContent = "Checking payment status...";
    verifyTxt.classList.remove("success");
  }
  const qrWrap = document.getElementById("invoice-qr-wrapper");
  if (qrWrap) qrWrap.style.display = "";

  setTimeout(scaleFontSize, 10);
  showScreen("input-screen");
}

function formatTokenAmount(raw, decimals) {
  if (!raw) return "";
  if (!decimals) return raw.toString();
  return (Number(raw) / Math.pow(10, decimals)).toFixed(2);
}

// - historical swaps
function getSwapHistory() {
  const raw = localStorage.getItem(SWAP_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveToSwapHistory(entry) {
  const history = getSwapHistory();
  history.unshift(entry);
  localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function showSwapHistory() {
  renderSwapHistory();
  document.getElementById("tip-swap-history-overlay").style.display = "flex";
}

function hideSwapHistory() {
  document.getElementById("tip-swap-history-overlay").style.display = "none";
}

function renderSwapHistory() {
  const listEl = document.getElementById("tip-swap-history-list");
  if (!listEl) return;
  const history = getSwapHistory();
  if (!history.length) {
    listEl.innerHTML =
      '<p style="opacity:0.5;font-size:0.85rem;">No swaps yet.</p>';
    return;
  }
  listEl.innerHTML = history
    .map((entry) => {
      const time = new Date(entry.timestamp).toLocaleString();
      const chain = (entry.network || "").toLowerCase();
      const currency = (entry.currency || "").toLowerCase();
      const chainImage =
        chain === "polygon"
          ? `/src/assets/images/chain-${chain}.png`
          : `/src/assets/images/chain-${chain}.svg`;
      const tokenImage =
        currency === "usdc"
          ? `/src/assets/images/usdc.svg`
          : `/src/assets/images/usdt.svg`;
      return `
      <div class="swap-history-item">
        <div class="swap-quote">
          <div class="chain-icon-wrapper">
            <img src="${chainImage}" class="chain-icon" />
            <img src="${tokenImage}" class="token-overlay" />
          </div>
          <div class="quote-middle">
            <div class="quote-id">${entry.quoteId || ""}</div>
            <div class="quote-time">${time}</div>
          </div>
          <button class="copy-btn" data-qid="${entry.quoteId}">Copy</button>
        </div>
      </div>
    `;
    })
    .join("");

  listEl.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.qid);
    });
  });
}

// ── Copy address button ───────────────────────────────────────────────────────

function showInvoiceScreen(amount) {
  const formattedAmount = formatCurrency({
    amount: amount.toFixed(2),
    code: selectedCurrency,
  });

  // Populate display fields
  const amountEl = document.getElementById("invoice-amount");
  if (amountEl) amountEl.textContent = formattedAmount[0];

  const addrTextEl = document.getElementById("invoice-address-text");
  if (addrTextEl) addrTextEl.textContent = currentInvoice;

  // Device-responsive primary button
  const primaryBtn = document.getElementById("invoice-primary-btn");
  if (primaryBtn) {
    if (isMobileDevice()) {
      primaryBtn.textContent = "Open Wallet";
      primaryBtn.onclick = () => {
        window.location.href = "lightning:" + currentInvoice;
      };
    } else {
      primaryBtn.textContent = "Copy Invoice";
      primaryBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(currentInvoice);
          showAlert("Copied!");
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      };
    }
  }

  // Wire cancel button
  const cancelBtn = document.getElementById("invoice-cancel-btn");
  if (cancelBtn) cancelBtn.onclick = () => resetToInputScreen();

  // Wire QR wrapper click
  const qrWrapper = document.getElementById("invoice-qr-wrapper");
  if (qrWrapper) {
    qrWrapper.onclick = async () => {
      try {
        await navigator.clipboard.writeText(currentInvoice);
        showAlert("Copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };
  }

  // Wire clipboard icon button
  const addrBtn = document.getElementById("copy-invoice-addr-btn");
  if (addrBtn) {
    addrBtn.onclick = async (e) => {
      e.stopPropagation(); // prevent QR wrapper click from double-firing
      try {
        await navigator.clipboard.writeText(currentInvoice);
        showAlert("Copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };
  }

  showScreen("invoice-screen");
  generateQRCode();
  startInvoiceVerification();
}

function generateQRCode() {
  const container = document.getElementById("invoice-qr-wrapper");
  const containerWidth = container.getBoundingClientRect().width;

  // Calculate QR size: 85% of container width, but max 250px
  const qrSize = Math.min(containerWidth * 0.82, 250);

  // Clear existing QR code
  document.getElementById("invoice-qr-code").innerHTML = "";

  // Generate new QR code
  new QRCode(document.getElementById("invoice-qr-code"), {
    text: currentInvoice,
    width: qrSize,
    height: qrSize,
    colorDark: "#000000",
    colorLight: "#ffffff",
  });
}

function clearRunningItems() {
  if (verifyInterval) {
    clearInterval(verifyInterval);
    verifyInterval = null;
  }
  if (verifyTimeout) {
    clearTimeout(verifyTimeout);
    verifyTimeout = null;
  }
}

function startInvoiceVerification() {
  const reverifyText = document.getElementById("verify-text");
  const maxDuration = 5 * 60; // 5 minutes in seconds
  const startTime = Date.now();
  let nextCheckTime = Date.now() + 10000; // First check in 10s

  clearRunningItems();

  async function verifyInvoice() {
    if (document.hidden) return;

    try {
      const response = await fetch(verifyURL);
      const data = await response.json();

      if (data?.preimage && data.settled) {
        stopVerification("Invoice Paid");
        return true;
      }
    } catch (err) {
      console.warn("Verification failed:", err);
    }
    return false;
  }

  function updateDisplay() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, maxDuration - elapsed);
    const countdown = Math.max(
      0,
      Math.ceil((nextCheckTime - Date.now()) / 1000),
    );

    reverifyText.textContent = `Reverifying if invoice is paid (${countdown}s)`;

    if (remaining <= 0) {
      stopVerification("Stopped verifying (time limit reached)");
    }
  }

  function stopVerification(message) {
    clearRunningItems();
    showPaidScreen(message);
  }

  verifyInterval = setInterval(updateDisplay, 1000);
  updateDisplay();

  verifyTimeout = setTimeout(() => {
    stopVerification("Stopped verifying (time limit reached)");
  }, maxDuration * 1000);

  // Main verification loop
  async function checkLoop() {
    while (true) {
      const now = Date.now();

      if (now >= nextCheckTime) {
        const isPaid = await verifyInvoice();
        if (isPaid) return;
        nextCheckTime = Date.now() + 10000;
      }

      await new Promise((res) => setTimeout(res, 1000));

      if (!verifyInterval) return;
    }
  }

  checkLoop();
}

function showPaidScreen(message) {
  showScreen("bitcoin-success-screen");
  // const qrContainer = document.getElementById("qr-wrapper");
  // const verifyText = document.getElementById("verify-text");
  // const cancelBTN = document.getElementById("cancel-button");

  // document.querySelector(".info-section").style.display = "none";
  // document.getElementById("copy-button").style.display = "none";
  // document.getElementById("cancel-button").textContent = "Pay again";
  // verifyText.textContent = message;
  // verifyText.classList.add("invoice-paid");
  // cancelBTN.classList.remove("secondary");
  // qrContainer.style.display = "none";
  // cancel-button click will call resetToInputScreen via existing listener
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Window resize handler for QR code
window.addEventListener("resize", () => {
  // Debounce the resize event to avoid excessive regeneration
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = setTimeout(() => {
    // Only regenerate if invoice screen is active and we have an invoice
    const invoiceScreen = document.getElementById("invoice-screen");
    if (invoiceScreen.classList.contains("active") && currentInvoice) {
      generateQRCode();
    }
  }, 250); // Wait 250ms after resize stops before regenerating
});

// Initialize
createCurrencySelector();
scaleFontSize();
