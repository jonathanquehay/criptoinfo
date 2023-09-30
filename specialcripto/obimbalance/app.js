const MIN_ORDER_SIZE = 10;

const getOrderBlockInfo = async (symbol) => {
  const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=300`);
  const data = await response.json();

  const bids = data.bids.map((bid) => [parseFloat(bid[0]), parseFloat(bid[1])]);
  const asks = data.asks.map((ask) => [parseFloat(ask[0]), parseFloat(ask[1])]);

  const totalBidSize = bids.reduce((total, bid) => total + bid[1], 0);
  const totalAskSize = asks.reduce((total, ask) => total + ask[1], 0);

  const weightedBidPrice = bids.reduce((total, bid) => total + (bid[0] * bid[1]), 0) / totalBidSize;
  const weightedAskPrice = asks.reduce((total, ask) => total + (ask[0] * ask[1]), 0) / totalAskSize;

  const [minBidSize, maxBidPrice] = bids.reduce(([minSize, maxPrice], bid) => {
    if (minSize >= MIN_ORDER_SIZE) {
      return [minSize, maxPrice];
    }

    const [price, size] = bid;
    const newSize = minSize + size;

    if (newSize >= MIN_ORDER_SIZE) {
      const weightedPrice = ((minSize * maxPrice) + (size * price)) / newSize;
      return [newSize, weightedPrice];
    }

    return [newSize, price];
  }, [0, 0]);

  const [minAskSize, minAskPrice] = asks.reduce(([minSize, minPrice], ask) => {
    if (minSize >= MIN_ORDER_SIZE) {
      return [minSize, minPrice];
    }

    const [price, size] = ask;
    const newSize = minSize + size;

    if (newSize >= MIN_ORDER_SIZE) {
      const weightedPrice = ((minSize * minPrice) + (size * price)) / newSize;
      return [newSize, weightedPrice];
    }

    return [newSize, price];
  }, [0, Infinity]);

  const bidSizeFormatted = `${totalBidSize.toFixed(2)} ${symbol.substring(0, 3)}`;
  const askSizeFormatted = `${totalAskSize.toFixed(2)} ${symbol.substring(3, 6)}`;

  const bidPriceFormatted = `$${weightedBidPrice.toFixed(2)}`;
  const askPriceFormatted = `$${weightedAskPrice.toFixed(2)}`;

  let message = '';

  if (minBidSize >= MIN_ORDER_SIZE) {
    message += `<p>OB DE COMPRA:</p>`;
    message += `<ul>`;
    message += `<li>Total: ${bidSizeFormatted}</li>`;
    message += `<li>CANTIDAD: ${minBidSize.toFixed(2)} ${symbol.substring(0, 3)}</li>`;
    message += `<li style="color: green; font-weight: bold;">PRECIO: ${bidPriceFormatted}</li>`;
    message += `</ul>`;
  }

  if (minAskSize >= MIN_ORDER_SIZE) {
    message += `<p>OB DE VENTA:</p>`;
    message += `<ul>`;
    message += `<li>Total: ${askSizeFormatted}</li>`;
    message += `<li>CANTIDAD: ${minAskSize.toFixed(2)} ${symbol.substring(3,6)}</li>`; 
    message += `<li style="color: red; font-weight: bold;">PRECIO: ${askPriceFormatted}</li>`;
     message += `</ul>`;
}

if (message === '') {
message = `<p>SIN OB EN ${symbol}.</p>`;
}

document.getElementById('order-block-info').innerHTML = message;
};

const input = document.getElementById('symbol-input');
input.focus();
input.addEventListener('change', () => {
  const symbol = input.value.toUpperCase();
  getOrderBlockInfo(symbol);
});
