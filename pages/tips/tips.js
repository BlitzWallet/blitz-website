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

// State
let selectedCurrency = "USD";
let currentInvoice = "";
let verifyURL = "";

let verifyInterval = null;
let verifyTimeout = null;
let resizeTimeout = null;

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
  console.log(currencyList);
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

// Handle tip button click
tipButton.addEventListener("click", async () => {
  const amount = parseFloat(amountInput.value);
  currentInvoice = "";

  console.log(amount);
  if (amount <= 0 || !amount || tipButton.textContent === "Error - Try Again")
    return;

  tipButton.textContent = "Generating invoice";
  tipButton.disabled = true;

  try {
    const response = await fetch("/getInvoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Set the content type to JSON
      },
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
  }
});

function showInvoiceScreen(amount) {
  const formattedAmount = formatCurrency({
    amount: amount.toFixed(2),
    code: selectedCurrency,
  });

  document.getElementById("input-screen").classList.add("hidden");
  document.getElementById("invoice-screen").classList.add("active");
  document.getElementById("display-amount").textContent = formattedAmount[0];

  // Generate QR code with dynamic sizing
  generateQRCode();

  startInvoiceVerification();
}

function generateQRCode() {
  const container = document.getElementById("qr-wrapper");
  const containerWidth = container.getBoundingClientRect().width;

  // Calculate QR size: 85% of container width, but max 250px
  const qrSize = Math.min(containerWidth * 0.82, 250);

  console.log(qrSize, "qr size", containerWidth);

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
  const maxTime = document.getElementById("amount-badge");
  const maxDuration = 5 * 60; // 5 minutes in seconds
  const startTime = Date.now();
  let nextCheckTime = Date.now() + 10000; // First check in 10s

  clearRunningItems();

  async function verifyInvoice() {
    if (document.hidden) return;

    try {
      const response = await fetch(verifyURL);
      const data = await response.json();
      console.log(data);

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
    maxTime.textContent = formatTime(remaining);

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
  const qrContainer = document.getElementById("qr-wrapper");
  const verifyText = document.getElementById("verify-text");
  const cancelBTN = document.getElementById("cancel-button");

  document.querySelector(".info-section").style.display = "none";
  document.getElementById("copy-button").style.display = "none";
  document.getElementById("cancel-button").textContent = "Pay again";
  verifyText.textContent = message;
  verifyText.classList.add("invoice-paid");
  cancelBTN.classList.remove("secondary");
  qrContainer.style.display = "none";
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

document.getElementById("copy-button").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentInvoice);
    const btn = document.getElementById("copy-button");
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
});

document.getElementById("cancel-button").addEventListener("click", () => {
  clearRunningItems();
  document.getElementById("input-screen").classList.remove("hidden");
  document.getElementById("invoice-screen").classList.remove("active");
  tipButton.textContent = "Pay";
  tipButton.disabled = false;
  amountInput.value = "";
  tipButton.classList.remove("active");
  scaleFontSize();
});

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
